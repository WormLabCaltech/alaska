"""Contains the AlaskaServer class.

The AlaskaServer class is the backbone of Alaska, the automatic, complete
RNA-seq analysis platform. The server integrates various quality control
software, along with Kallisto for read alignment/quantification and Sleuth
for differential expression analysis. The AlaskaServer packages these into
one simple pipeline. Each major analysis step is packaged into separate
Docker containers for portability and future extensibility.
"""

__author__ = 'Kyung Hoi (Joseph) Min'
__copyright__ = 'Copyright 2017 WormLabCaltech'
__credits__ = ['David Angeles', 'Raymond Lee', 'Juancarlos Chan']
__license__ = "MIT"
__version__ = "alpha"
__maintainer__ = "Kyung Hoi (Joseph) Min"
__email__ = "kmin@caltech.edu"
__status__ = "alpha"

import os
import io
import sys
import zmq
import time
import json
import queue
import docker
import shutil
import random
import traceback
import warnings as w
import datetime as dt
import hashlib as hl
from Alaska import Alaska
from AlaskaDocker import AlaskaDocker
from AlaskaReference import AlaskaReference
from AlaskaOrganism import AlaskaOrganism
from AlaskaJob import AlaskaJob
from AlaskaProject import AlaskaProject
from BashWriter import BashWriter
import threading
from threading import Thread

class AlaskaServer(Alaska):
    """AlaskaServer class.

    Member variables:

    Member functions:
    """

    def __init__(self, port=8888):
        """
        AlaskaServer constructor. Starts the server at the given port.
        """
        # date and time server was initialized
        self.datetime = dt.datetime.now().strftime('%Y-%m-%d %H:%M:%S')

        self.organisms = {}

        self.projects = {}  # dictionary of projects. keys are project ids
                            # items are AlaskaProject objects
        self.samples = {}   # dictionary of samples. keys are sample ids
                            # items are AlaskaSample objects

        # Projects/samples are put in the temporary dictionary when they
        # have not been finalized yet.
        self.projects_temp = {} # temporary projects
        self.samples_temp = {} # temporary samples

        self.workers_n = 1 # number of workers
        self.queue = queue.Queue()  # job queue
        self.jobs = {} # dictionary of all jobs
        self.stale_jobs = [] # list of stale jobs (these are skipped)
        self.current_job = None # job currently undergoing analysis
        self.org_update_id = None # container ID for organism update

        self.available_ports = Alaska.SHI_PORTS
        self.sleuth_servers = {} # dict of port:container_id pairs

        self.idx_conts = []
        self.idx_interval = 600 # index update interval (in seconds)
        self.log_pool = [] # pool of logs to be flushed
        self.log_interval = 3600 # log interval (in seconds)

        # set up server
        self.PORT = port
        self.CONTEXT = zmq.Context()
        self.SOCKET = self.CONTEXT.socket(zmq.ROUTER)
        self.SOCKET.bind('tcp://*:{}'.format(port))

        # Parse messaging codes.
        temp = {}
        for op, code in Alaska.CODES.items():
            temp[code] = getattr(self, op)
        self.CODES = temp

        self.DOCKER = docker.from_env() # docker client

        os.chdir('../') # go to parent of script directory

        self.out('INFO: AlaskaServer initialized')

    def start(self, _id=None, force=False):
        """
        Starts the server.
        """
        # make log file
        # self.log = open('{}-{}.log'.format(self.date, self.time))

        self.out('INFO: starting AlaskaServer {}'.format(self.VERSION))
        self.RUNNING = True

        try:
            self.out('INFO: checking admin privilages')
            if not os.getuid() == 0:
                raise Exception('ERROR: AlaskaServer requires admin rights')
                self.out('INFO: AlaskaServer running as root')

            if force:
                self.out('INFO: --force flag detected...bypassing instance check')
            else:
                self.out('INFO: checking if another instance is running')
                if os.path.isfile('_running'):
                    raise Exception('ERROR: another instance was detected. If there '
                    'is no other instance, this error may be because of an incorrect '
                    'termination of a previous instance. In this case, please '
                    'manually delete the \'_running\' file from the root directory.')
            open('_running', 'w').close()

            # self.out('INFO: acquiring absolute path')
            # if not os.path.exists('PATH_TO_HERE'):
            #     raise Exception('ERROR: absolute path file doesn\'t exist')
            #
            # with open('PATH_TO_HERE', 'r') as pathf:
            #     path = pathf.readlines()[0].strip()
            #     Alaska.HOST_DIR = path
            #     Alaska.ROOT_PATH = '{}/{}'.format(path, self.ROOT_DIR)

            # check if all necessary folders are there
            folders = [Alaska.SAVE_DIR,
                        Alaska.SCRIPT_DIR,
                        Alaska.JOBS_DIR,
                        Alaska.ORGS_DIR,
                        Alaska.LOG_DIR,
                        Alaska.PROJECTS_DIR]

            for folder in folders:
                # this path is the path on the alaska container...not host!
                path = '{}/{}'.format(Alaska.ROOT_DIR, folder)
                if not os.path.exists(path):
                    self.out('INFO: creating folder {}'.format(path))
                    os.makedirs(path)

            # switch working directory to root
            os.chdir(Alaska.ROOT_DIR)


        except Exception as e:
            self.out(str(e), override=True)
            self.stop(code=1)
            sys.exit(1)

        with w.catch_warnings() as caught:
            w.simplefilter('always')

            self.out('INFO: starting logger')
            p = Thread(target=self.log_loop, args=(self.log_interval,))
            p.daemon = True
            p.start()

            # self.out('INFO: starting organism update worker')
            # p = Thread(target=self.update_orgs_loop, args=(self.idx_interval,))
            # p.daemon = True
            # p.start()
            self.out('INFO: updating organisms')
            self.update_orgs()

            self.out('INFO: starting {} workers'.format(self.workers_n))
            for i in range(self.workers_n):
                p = Thread(target=self.worker)
                p.daemon = True
                p.start()

            while self.RUNNING:
                request = self.SOCKET.recv_multipart()

                # if save/load, don't use thread
                if request[1] == b'\x94' or request[1] == b'\x95':
                    self.decode(request)
                else:
                    t = Thread(target=self.decode, args=(request,))
                    t.daemon = True
                    t.start()

            self.stop(code=1)

    def stop(self, _id=None, code=0):
        """
        Stops the server.
        """
        # if stop is called with request
        if _id is not None:
            self.close(_id)

        try:
            self.RUNNING = False
            self.out('INFO: terminating ZeroMQ')
            lock = threading.Lock()
            lock.acquire()
            self.SOCKET.close()
            self.CONTEXT.term()

            # stop all containers
            # for cont in self.DOCKER.containers.list():
            #     self.out('INFO: terminating container {}'.format(cont.short_id))
            #     cont.remove(force=True)

            for port, item in self.sleuth_servers.items():
                self.out('INFO: sleuth shiny app container {} is running...terminating'.format(item[1]))
                self.DOCKER.containers.get(item[1]).remove(force=True)
                self.out('INFO: termination successful')

            # stop running jobs
            if self.current_job is not None:
                cont_id = self.current_job.docker.id
                self.out('INFO: job {} is running...terminating container {}'
                            .format(self.current_job.id, cont_id))
                self.DOCKER.containers.get(cont_id).remove(force=True)
                self.out('INFO: termination successful')

            if self.org_update_id is not None:
                self.out('INFO: organism update running...terminating container {}'
                            .format(self.org_update_id))
                self.DOCKER.containers.get(self.org_update_id).remove(force=True)
                self.out('INFO: termination successful')

            self.save()

            if not code == 0:
                self.out('TERMINATED WITH EXIT CODE {}'.format(code))

            self.log() # write all remaining logs

            os.remove('../_running')

            sys.exit(code)
        except Exception as e:
            print('An error occured while stopping the server!')
            print(e)

    def worker(self):
        """
        Worker function.
        """
        try:
            while self.RUNNING:
                # get non-stale job
                while True:
                    job = self.queue.get() # receive job from queue
                                            # block if there is no job

                    # skip if stale job
                    if job.id in self.stale_jobs:
                        self.out('INFO: skipping and removing stale job {}'.format(job.id))
                        # remove job because it is stale
                        path = '{}/{}/{}.json'.format(Alaska.ROOT_PATH, Alaska.JOBS_DIR, job.id)
                        if os.path.isfile(path):
                            os.remove(path)
                        del self.jobs[job.id]
                        self.stale_jobs.remove(job.id)
                        # indicate the job is "done"
                        self.queue.task_done()
                        continue
                    else:
                        break

                self.current_job = job
                job_name = job.name
                proj_id = job.proj_id
                proj = self.projects[proj_id]

                try:
                    self.out('INFO: starting job {}'.format(job.id))
                    job.run()

                    # change progress
                    if job.name == 'qc':
                        proj.progress = 6
                        out_dir = proj.qc_dir
                    elif job.name == 'kallisto':
                        proj.progress = 9
                        out_dir = proj.align_dir
                    elif job.name == 'sleuth':
                        proj.progress = 12
                        out_dir = proj.diff_dir
                    else:
                        self.out('ERROR: job {} has unrecognized name'.format(job.id))

                    self.out('INFO: container started with id {}'.format(job.docker.id))
                    hook = self.DOCKER.containers.get(job.docker.id).logs(stdout=True, stderr=True, stream=True)

                    out_path = '{}/{}_out.txt'.format(out_dir, job.name)
                    with open(out_path, 'w') as out:
                        out.write('# this is the output from job {} / container {}, running {}\n'.format(job.id, job.docker.id, job.name))

                    # hook to container output
                    for l in hook:
                        l = l.decode(Alaska.ENCODING).strip()

                        if '\n' in l:
                            outs = l.split('\n')
                        else:
                            outs = [l]

                        for out in outs:
                            job.docker.output.append(out) # append output
                            with open(out_path, 'a') as f:
                                f.write('{}\n'.format(out))
                            self.out('{}: {}: {}'.format(proj_id, job_name, out))
                except Exception as e:
                    self.out('ERROR: error occured while starting container {}'.format(job.docker.id))
                finally:
                    # check correct termination
                    try:
                        exitcode = self.DOCKER.containers.get(job.docker.id).wait()['StatusCode']
                    except:
                        self.out('ERROR: container {} exited incorrectly'
                                        .format(job.docker.id))
                    finally:
                        job.finished()
                        self.current_job = None
                        self.queue.task_done()

                    if exitcode == 0:
                        if job.name in ['qc', 'kallisto', 'sleuth']:
                            proj.progress += 1
                        else:
                            self.out('ERROR: job {} has unrecognized name'.format(job.id))
                        self.out('INFO: finished job {}'.format(job.id))
                    else:
                        self.out('ERROR: job {} / container {} terminated with non-zero exit code!'.format(job.id, job.docker.id))
                        proj.progress -= 2
                        # Add the job to stale list
                        self.stale_jobs.append(job.id)

                        # if error occurred during qc
                        if job.name == 'qc':
                            # find any other queued analyses and make them stale
                            for ele in list(self.queue.queue):
                                if ele.proj_id == proj_id and ele.name in ['kallisto', 'sleuth']:
                                    self.stale_jobs.append(ele.id)

                        # if error occurred during kallisto
                        elif job.name == 'kallisto':
                            # find any other queued analyses and make them stale
                            for ele in list(self.queue.queue):
                                if ele.proj_id == proj_id and ele.name in ['sleuth']:
                                    self.stale_jobs.append(ele.id)

        except KeyboardInterrupt:
            self.out('INFO: stopping workers')
        except Exception as e:
            raise e

    def decode(self, request):
        """
        Method to decode messages received from AlaskaRequest.
        """
        self.out('{}: received {}'.format(request[0], request[1]))
        try:
            if request[1] not in self.CODES:
                raise Exception('ERROR: code {} was not recognized'.format(request[1]))
            _id = request[0].decode(Alaska.ENCODING)

            # Deal with 'check' first.
            if request[1] == Alaska.CODES['check']:
                self.CODES[request[1]](_id)
            elif not _id.startswith('_'):
                # check if it exists
                if not self.exists(_id):
                    raise Exception('{}: does not exist'.format(_id))

            # distribute message to appropriate method
            self.CODES[request[1]](_id)
        except Exception as e:
            _id = request[0]
            self.broadcast(_id, 'ERROR: {}'.format(request))
            self.respond(_id, str(e))
            self.out(''.join(traceback.format_exception(None, e, e.__traceback__)),
                        override=True)
            self.close(_id)

    def respond(self, to, msg):
        """
        Respond to given REQ with message.
        """
        # make sure id and message are byte literals
        if isinstance(msg, str):
            msg = msg.encode()
        if isinstance(to, str):
            to = to.encode()

        response = [to, msg]
        self.SOCKET.send_multipart(response)

    def log(self, _id=None, close=True):
        """
        Writes contents of log_pool to log file.
        """
        self.out('INFO: writing log')
        datetime = dt.datetime.now().strftime('%Y-%m-%d %H-%M-%S')

        with open('{}/{}.log'.format(Alaska.LOG_DIR, datetime), 'w') as f:
            for line in self.log_pool:
                f.write(line + '\n')

        # empty log pool
        self.log_pool = []

        self.out('INFO: wrote log')

        if close:
            self.close(_id)

    def log_loop(self, t=600):
        """
        Log loop.
        Runs log in intervals.
        """
        try:
            while self.RUNNING:
                time.sleep(t)
                self.log()
        except KeyboardInterrupt:
            self.out('INFO: terminating log loop')

    def out(self, out, override=False):
        """
        Overrides parent's out().
        """
        line = super().out(out, override)
        self.log_pool.append(line)

    def broadcast(self, to, msg):
        """
        Print to console, save to log, and respond.
        """
        self.out(msg)
        self.respond(to, msg)

    def close(self, to):
        """
        Closes connection to AlaskaRequest.
        """
        if to is not None:
            self.respond(to, 'END')

    def check(self, to, close=False):
        """
        Responds to check request.
        Check request is sent to check if server is up and running.
        """
        self.respond(to, to)

    def update_orgs(self, _id=None):
        """
        Updates organisms.
        """
        # find deepest directory
        for root, dirs, files in os.walk(Alaska.ORGS_DIR):
            # first, check if indices are already there.
            # if they are, there is no need to check the reference
            # files nor remake the indices.
            if Alaska.IDX_DIR in dirs or Alaska.REF_DIR in dirs:
                # make sure index folder is present
                ref_dir = '{}/{}'.format(root, Alaska.REF_DIR)
                idx_dir = '{}/{}'.format(root, Alaska.IDX_DIR)
                if not os.path.isdir(idx_dir):
                    os.mkdir(idx_dir)

                # First, parse variables.
                split = root.split('/')
                genus = split[-3]
                species = split[-2]
                ver = split[-1]
                folder = '{}/{}/{}/{}'.format(Alaska.ORGS_DIR, genus, species, ver)

                # Check if this is a new organism.
                if genus not in self.organisms \
                    or species not in self.organisms[genus] \
                    or ver not in self.organisms[genus][species]:

                    self.out('INFO: detected new organism - {}_{}_{}'.format(
                        genus, species, ver
                    ))

                    # parse reference variables
                    # reference folder MUST contain only three files
                    if len(os.listdir(ref_dir)) is not 3:
                        self.out('INFO: {}/{}/{} does not have only two files...skipping'.format(genus, species, ver))
                        continue

                    # make sure all the files we need exists
                    # those are: dna, cdna, and bed
                    # dna must be named: <genus>_<species>_<version>_dna ...
                    # cdna must be named: <genus>_<species>_<version>_cdna ...
                    # bed must be named: <genus>_<species>_<version>.bed
                    dna = None
                    cdna = None
                    bed = None
                    prefix = '{}_{}_{}'.format(genus[0], species, ver)
                    for fname in os.listdir(ref_dir):
                        if fname.startswith('{}_dna'.format(prefix)):
                            dna = fname
                        elif fname.startswith('{}_cdna'.format(prefix)):
                            cdna = fname
                        elif fname.startswith('{}.bed'.format(prefix)):
                            bed = fname
                    if dna is None or cdna is None or bed is None:
                        self.out('INFO: {}/{}/{} does not have correct files'.format(genus, species, ver))
                        continue

                    # genus exists?
                    if genus not in self.organisms:
                        # make genus
                        self.organisms[genus] = {}

                    # species exists?
                    if species not in self.organisms[genus]:
                        # make new organism
                        org = AlaskaOrganism(genus, species)
                        self.organisms[genus][species] = org

                    if ver not in self.organisms[genus][species].refs:
                        # make new version
                        ref = AlaskaReference(ver, dna, cdna, bed)
                        self.organisms[genus][species].refs[ver] = ref

                # now, we check which index needs to be made
                need_bt2 = True
                need_kal = True
                bt2_log = '{}/bowtie2_log.txt'.format(root)
                kal_log = '{}/kallisto_log.txt'.format(root)

                if os.path.isfile(bt2_log):
                    with open(bt2_log, 'r') as bt2:
                        lines = bt2.readlines()
                        if len(lines) > 0:
                            lastline = lines[-1]
                            if '# success' in lastline:
                                need_bt2 = False

                if os.path.isfile(kal_log):
                    with open(kal_log, 'r') as kal:
                        lines = kal.readlines()
                        if len(lines) > 0:
                            lastline = lines[-1]
                            if '# success' in lastline:
                                need_kal = False

                # we need to make one or more indices
                if need_bt2 or need_kal:
                    self.make_idx(genus, species, ver, bt2=need_bt2, kal=need_kal)

                # once made, populate AlaskaReference object appropriately
                for f in os.listdir('{}/{}'.format(folder, self.IDX_DIR)):
                    if f.endswith('.idx'):
                        ref.kallisto_idx = f
                    elif f.endswith('.bt2'):
                        ref.bowtie_idx.append(f)


    def make_idx(self, genus, species, ver, bt2=True, kal=True):
        """
        Runs docker containers to make indices (both for kallisto and bowtie2)
        of the specified genus, species, and version.
        """
        # copy index build script to target
        script_src = '{}/{}'.format(Alaska.SCRIPT_DIR, Alaska.IDX_SCRIPT)
        script_tgt = '{}/{}'.format(self.organisms[genus][species].path, ver)
        shutil.copy2(script_src, script_tgt)

        ### begin container variables
        src = Alaska.DOCKER_DATA_VOLUME
        tgt = Alaska.ROOT_PATH
        volumes = {
            src: {'bind': tgt, 'mode': 'rw'}
        }
        wdir = '{}/{}'.format(tgt, script_tgt)
        args = {
            'volumes': volumes,
            'cpuset_cpus': Alaska.CPUS
        }
        ### end variables

        self.out('INFO: making indices for {}_{}_{}'.format(genus, species, ver))
        cmd = 'python3 {} --threads {} '.format(Alaska.IDX_SCRIPT, Alaska.NTHREADS)
        if bt2 and kal:
            cmd += 'all'
        elif bt2:
            cmd += 'bowtie2'
        elif kal:
            cmd += 'kallisto'

        self.out('INFO: starting docker container with {} core allocation'.format(self.CPUS))
        cont = AlaskaDocker(Alaska.DOCKER_QC_TAG)
        cont.run(cmd, working_dir=wdir,
                          volumes=volumes,
                          cpuset_cpus=self.CPUS,
                          )
        self.out('INFO: container started with id {}'.format(cont.id))
        self.org_update_id = cont.id

        for l in cont.hook():
            l = l.decode(self.ENCODING).strip()

            # since kallisto output can be multiple lines
            if '\n' in l:
                outs = l.split('\n')
            else:
                outs = [l]

            for out in outs:
                pass
                # self.out('INFO: {}: {}'.format(cont.id, out))

        ################### 4/2/2018 FIXED UNTIL HERE #####################

        self.org_update_id = None
        self.out('INFO: index build for {}_{}_{} successful'.format(
            genus, species, ver
        ))

    # def update_orgs_loop(self, t=600):
    #     """
    #     Organism update loop.
    #     Runs update_idx in intervals.
    #     """
    #     try:
    #         while self.RUNNING:
    #             self.update_orgs()
    #             time.sleep(t)
    #     except KeyboardInterrupt:
    #         self.out('INFO: terminating organism update loop')


    # def update_idx(self, _id=None):
    #     """
    #     Writes bash script to update indices.
    #     """
    #     self.out('INFO: starting index update')
    #
    #
    #
    #
    #
    #
    #
    #
    #
    #     self.transcripts = os.listdir(self.TRANS_DIR)
    #     self.indices = os.listdir(self.IDX_DIR)
    #     sh = BashWriter('update_idx', folder=self.SCRIPT_DIR)
    #
    #     for trans in self.transcripts:
    #         name = trans.split('.')[:-2] # remove extension
    #         name = '.'.join(name)
    #         if all(not idx.startswith(name) for idx in self.indices):
    #             self.out('INFO: index must be built for {}'.format(trans))
    #             sh.add('kallisto index -i {}/{}.idx {}/{}'.format(self.IDX_DIR,
    #                                             name, self.TRANS_DIR, trans))
    #
    #     if not len(sh.commands) == 0:
    #         self.out('INFO: writing update script')
    #         sh.write() # write script
    #
    #         ### begin variables
    #         __id = self.rand_str_except(self.PROJECT_L, self.jobs.keys())
    #         # source and target mounting points
    #         src_scrpt = '/{}/{}'.format(self.ROOT_PATH, self.SCRIPT_DIR)
    #         tgt_scrpt = '/{}'.format(self.SCRIPT_DIR)
    #         src_trans = '/{}/{}'.format(self.ROOT_PATH, self.TRANS_DIR)
    #         tgt_trans = '/{}'.format(self.TRANS_DIR)
    #         src_idx = '/{}/{}'.format(self.ROOT_PATH, self.IDX_DIR)
    #         tgt_idx = '/{}'.format(self.IDX_DIR)
    #         # volumes to mount to container
    #         volumes = {
    #             src_scrpt: {'bind': tgt_scrpt, 'mode': 'ro'},
    #             src_trans: {'bind': tgt_trans, 'mode': 'ro'},
    #             src_idx: {'bind': tgt_idx, 'mode': 'rw'}
    #         }
    #         cmd = 'bash {}/update_idx.sh'.format(self.SCRIPT_DIR)
    #         args = {
    #             'volumes': volumes,
    #             'cpuset_cpus': self.CPUS,
    #         }
    #         ### end variables
    #
    #         self.out('INFO: starting docker container with {} core allocation'.format(self.CPUS))
    #         cont = self.DOCKER.containers.run(self.KAL_VERSION,
    #                                 'bash {}/update_idx.sh'.format(self.SCRIPT_DIR),
    #                                 volumes=volumes,
    #                                 cpuset_cpus=self.CPUS,
    #                                 detach=True)
    #         self.out('INFO: container started with id {}'.format(cont.short_id))
    #
    #         for l in cont.attach(stream=True):
    #             l = l.decode(self.ENCODING).strip()
    #
    #             # since kallisto output can be multiple lines
    #             if '\n' in l:
    #                 outs = l.split('\n')
    #             else:
    #                 outs = [l]
    #
    #             for out in outs:
    #                 self.out('INFO: index: {}'.format(out))
    #
    #         self.out('INFO: index build successful')
    #         self.update_idx()
    #     else:
    #         self.out('INFO: indices up to date. no update required')
    #
    # def update_idx_loop(self, t=600):
    #     """
    #     Index update loop.
    #     Runs update_idx in intervals.
    #     """
    #     try:
    #         while self.RUNNING:
    #             self.update_idx()
    #             time.sleep(t)
    #     except KeyboardInterrupt:
    #         self.out('INFO: terminating update loop')

    def new_proj(self, _id, close=True):
        """
        Creates a new project.
        """
        ids = list(self.projects.keys()) + list(self.projects_temp.keys())
        __id = self.rand_str_except(Alaska.PROJECT_L, ids)
        __id = 'AP{}'.format(__id)
        self.projects_temp[__id] = AlaskaProject(__id)

        # make directories
        f = './{}/{}/{}'.format(Alaska.PROJECTS_DIR, __id, Alaska.TEMP_DIR)
        os.makedirs(f)
        self.out('{}: {} created'.format(__id, f))
        f = './{}/{}/{}'.format(Alaska.PROJECTS_DIR, __id, Alaska.RAW_DIR)
        os.makedirs(f)
        self.out('{}: {} created'.format(__id, f))
        f = './{}/{}/{}'.format(Alaska.PROJECTS_DIR, __id, Alaska.QC_DIR)
        os.makedirs(f)
        self.out('{}: {} created'.format(__id, f))
        f = './{}/{}/{}'.format(Alaska.PROJECTS_DIR, __id, Alaska.ALIGN_DIR)
        os.makedirs(f)
        self.out('{}: {} created'.format(__id, f))
        f = './{}/{}/{}'.format(Alaska.PROJECTS_DIR, __id, Alaska.DIFF_DIR)
        os.makedirs(f)
        self.broadcast(_id, '{}: new project created'.format(__id))

        if close:
            self.close(_id)


    def exists(self, _id):
        """
        Checks if project with id exists.
        """
        if (_id in self.projects) or (_id in self.projects_temp):
            return True
        else:
            return False

    def exists_var(self, _id):
        """
        Checks if project with id exists in project.
        """
        if _id in self.projects:
            return True
        else:
            return False

    def exists_temp(self, _id):
        """
        Checks if project with id exists in project_temp.
        """
        if _id in self.projects_temp:
            return True
        else:
            return False

    def load_proj(self, _id, close=True):
        """
        Loads project.
        """
        # TODO: change checking to catching exceptions
        self.out('{}: loading'.format(_id))

        # check if given project id is already loaded
        if self.exists(_id):
            raise Exception('{}: already exists and is loaded'.format(_id))

        # check if directory exists
        path = './{}/{}/'.format(Alaska.PROJECTS_DIR, _id)
        if not os.path.exists(path) and os.path.isdir(path):
            raise Exception('{}: could not be found'.format(_id))

        # if project is not loaded but exists, load it
        # TODO: what if project id or sample id exists?
        ap = AlaskaProject(_id)
        ap.load()

        # add project and samples to dictionary
        if ap.progress > 2:
            self.projects[_id] = ap
            self.samples = {**self.samples, **ap.samples}
        else:
            self.projects_temp[_id] = ap
            self.samples_temp = {**self.samples_temp, **ap.samples}

        msg = '{}: successfully loaded'.format(_id)

        self.broadcast(_id, msg)

        if close:
            self.close(_id)

    def save_proj(self, _id, close=True):
        """
        Saves project to JSON.
        """
        # TODO: change checking to catching exceptions
        self.broadcast(_id, '{}: saving'.format(_id))

        # check if it exists
        if not self.exists(_id):
            raise Exception('{}: does not exist'.format(_id))

        # if project exists, save it
        if _id in self.projects:
            self.projects[_id].save()
        else:
            self.projects_temp[_id].save()

        msg = '{}: saved'.format(_id)
        self.broadcast(_id, msg)

        if close:
            self.close(_id)

    def get_raw_reads(self, _id, close=True, md5=True):
        """
        Retrieves list of uploaded sample files.
        """
        if _id in self.projects:
            raise Exception('This project is already finalized!')
        # Project we are concerned about.
        proj = self.projects_temp[_id]

        self.broadcast(_id, '{}: getting raw reads'.format(_id))

        # if project exists, check if raw reads have already been calculated
        if len(proj.raw_reads) == 0:
            proj.get_raw_reads()

        # if md5 checksums are empty
        if md5:
            self.broadcast(_id, '{}: calculating MD5 checksums'.format(_id))
            for folder, reads in proj.raw_reads.items():
                proj.chk_md5[folder] = []
                for read in reads:
                    md5 = self.md5_chksum('{}/{}'.format(proj.dir, read))
                    proj.chk_md5[folder].append(md5)

        self.broadcast(_id, '{}: successfully retrieved raw reads'.format(_id))

        if proj.progress < 1:
            proj.progress = 1

        # 11/27/2017
        # self.respond(_id, json.dumps(self.projects_temp[_id].raw_reads, default=self.encode_json, indent=4))
        # self.respond(_id, json.dumps(self.projects_temp[_id].chk_md5, default=self.encode_json, indent=4))

        if close:
            self.close(_id)

    def md5_chksum(self, fname):
        """
        Calculates the md5 checksum of the given file at location.
        """
        md5 = hl.md5()

        # open file and read in blocks
        with open(fname, 'rb') as f:
            for chunk in iter(lambda: f.read(4096), b''):
                md5.update(chunk)

        return md5.hexdigest()

    def infer_samples(self, _id, close=True, md5=True):
        """
        Infers samples from raw reads.
        """
        if _id in self.projects:
            raise Exception('This project is already finalized!')
        # Project we are concerned about.
        proj = self.projects_temp[_id]

        self.get_raw_reads(_id, close=close, md5=md5) # make sure raw reads have been extracted

        self.broadcast(_id, '{}: inferring samples from raw reads'.format(_id))

        # function to get new sample ids
        ids = lambda : list(self.samples.keys()) + list(self.samples_temp.keys())
        f = lambda : self.rand_str_except(self.PROJECT_L, ids())

        proj.infer_samples(f, temp=self.samples_temp, md5=md5)
        self.broadcast(_id, '{}: samples successfully inferred'.format(_id))

        if proj.progress < 2:
            proj.progress = 2

        # output project JSON to temp folder
        self.projects_temp[_id].save(Alaska.TEMP_DIR)
        self.broadcast(_id, '{}: saved to temp folder'.format(_id))

        # 11/27/2017
        # self.respond(_id, json.dumps(self.projects_temp[_id].samples, default=self.encode_json, indent=4))

        if close:
            self.close(_id)

    # def get_idx(self, _id, close=True):
    #     """
    #     Responds with the list of available indices.
    #     """
    #     self.out('INFO: available indices {}'.format(self.indices))
    #     self.respond(_id, self.indices)
    #
    #     if close:
    #         self.close(_id)

    def set_proj(self, _id, close=True):
        """
        Sets project params.
        Only to be called after the project has been created.
        """
        if _id in self.projects:
            raise Exception('This project is already finalized!')
        # Project we are concerned about.
        proj = self.projects_temp[_id]

        if proj.progress < 2:
            raise Exception('{}: Samples have not yet been inferred!'
                            .format(_id))

        self.broadcast(_id, '{}: setting project data'.format(_id))

        # TODO: what if sample id exists?
        proj.load(Alaska.TEMP_DIR)
        self.broadcast(_id, '{}: validating data'.format(_id))
        proj.check()

        proj.progress = 3

        msg = '{}: project data successfully set'.format(_id)
        self.broadcast(_id, msg)

        if close:
            self.close(_id)

    # def new_sample(self, _id, close=True):
    #     """
    #     Creates new sample.
    #     """
    #     self.broadcast(_id, '{}: creating new sample'.format(_id))
    #
    #     ids = list(self.samples.keys()) + list(self.samples_temp.keys())
    #     __id = self.rand_str_except(self.PROJECT_L, ids) # get unique id
    #     self.projects_temp[_id].new_sample(__id)
    #
    #     self.samples_temp[__id] = self.projects_temp[_id].samples[__id]
    #     self.broadcast(_id, '{}: new sample created with id {}'.format(_id, __id))
    #
    #     if close:
    #         self.close(_id)

    def finalize_proj(self, _id, close=True):
        """
        Finalizes project and samples by creating appropriate json and
        sample directories
        """
        if _id in self.projects:
            raise Exception('This project is already finalized!')
        # Project we are concerned about.
        proj = self.projects_temp[_id]

        if proj.progress < 3:
            raise Exception('Project data has not been set yet!')

        self.broadcast(_id, '{}: finalizing'.format(_id))

        # convert temporary project to permanent project
        new_proj = AlaskaProject(_id)
        self.projects[_id] = new_proj
        new_proj.load(Alaska.TEMP_DIR)

        # remove temporary files
        f = '{}/{}.json'.format(proj.temp_dir, _id)
        if os.path.isfile(f):
            os.remove(f)
            self.broadcast(_id, '{}: {} removed'.format(_id, f))

        # convert temporary samples to permanent samples
        self.samples = {**self.samples, **new_proj.samples}

        # delete temps
        for __id in proj.samples:
            del self.samples_temp[__id]
        del self.projects_temp[_id]

        new_proj.progress = 4
        new_proj.save()

        # copy analysis script to project folder.
        self.copy_script(_id, Alaska.ANL_SCRIPT)

        msg = '{}: successfully finalized'.format(_id)
        self.broadcast(_id, msg)

        if close:
            self.close(_id)

    def qc(self, _id, close=True, check=True):
        """
        Performs quality control on the given raw reads.
        """
        if check and _id not in self.projects:
            raise Exception('This project has not been finalized.')
        # Project we are interested in.
        proj = self.projects[_id]
        # copy analysis script to project folder.
        self.copy_script(_id, Alaska.ANL_SCRIPT)

        self.broadcast(_id, '{}: starting quality control'.format(_id))

        # check if qc is already queued
        qu = list(self.queue.queue)
        for job in qu:
            if job.proj_id == _id and job.name == 'qc':
                raise Exception('{}: already in queue'.format(_id))

        # check if qc is currently running
        if self.current_job is not None\
            and self.current_job.proj_id == _id\
            and self.current_job.name == 'qc':
            raise Exception('{}: currently running'.format(_id))

        # make directories
        self.broadcast(_id, '{}: making directories for quality control'.format(_id))
        for __id, sample in proj.samples.items():
            f = '{}/{}'.format(proj.qc_dir, sample.name)
            os.makedirs(f, exist_ok=True)
            self.broadcast(_id, '{}: {} created'.format(_id, f))

        self.broadcast(_id, '{}: creating new job'.format(_id))

        ### begin job variables
        __id = self.rand_str_except(Alaska.PROJECT_L, self.jobs.keys())
        self.jobs[__id] = None # initialize empty job to prevent duplicate ids
        # source and target mounting points
        # src_proj = os.path.abspath(self.projects[_id].dir)
        src = Alaska.DOCKER_DATA_VOLUME
        tgt = Alaska.ROOT_PATH
        wdir = '{}/{}'.format(Alaska.ROOT_PATH, proj.dir)
        # volumes to mount to container
        volumes = {
            src: {'bind': tgt, 'mode': 'rw'},
        }

        cmd = 'python3 run_analysis.py qc --threads {}'.format(Alaska.NTHREADS)
        args = {
            'working_dir': wdir,
            'volumes': volumes,
            'cpuset_cpus': Alaska.CPUS,
        }
        ### end job variables

        job = AlaskaJob(__id, 'qc', _id,
                         Alaska.DOCKER_QC_TAG, cmd, **args)
        job.save()
        self.jobs[__id] = job
        proj.jobs.append(__id)
        self.broadcast(_id, '{}: new job created with id {}'.format(_id, __id))

        self.broadcast(_id, '{}: checking queue'.format(_id, __id))
        if self.current_job is None and self.queue.qsize() == 0: # no other job running
            self.broadcast(_id, '{}: queue is empty...immediately starting'.format(_id))
        else:
            self.broadcast(_id, '{}: job {} added to queue (size: {})'
                            .format(_id, __id, self.queue.qsize()))
        self.queue.put(job) # put job into queue
                            # job must be put into queue
                            # regardless of it being empty
        proj.progress = 5 # added to queue

        if close:
            self.close(_id)


    def read_quant(self, _id, close=True, check=True):
        """
        Checks if another analysis is running,
        then performs read quantification.
        """
        if check and self.projects[_id].progress < 7:
            raise Exception('{}: Quality control has not been performed.'
                            .format(_id))
        # The project we are interested in.
        proj = self.projects[_id]
        # copy analysis script to project folder.
        self.copy_script(_id, Alaska.ANL_SCRIPT)

        # check if alignment is already queued
        qu = list(self.queue.queue)
        for job in qu:
            if job.proj_id == _id and job.name == 'kallisto':
                raise Exception('{}: already in queue'.format(_id))

        # check if alignment is currently running
        if self.current_job is not None\
            and self.current_job.proj_id == _id\
            and self.current_job.name == 'kallisto':
            raise Exception('{}: currently running'.format(_id))

        # make directories
        self.broadcast(_id, '{}: making directories for read alignment'.format(_id))
        for __id, sample in proj.samples.items():
            f = '{}/{}'.format(proj.align_dir, sample.name)
            os.makedirs(f, exist_ok=True)
            self.broadcast(_id, '{}: {} created'.format(_id, f))

        self.broadcast(_id, '{}: creating new job'.format(_id))

        ### begin job variables
        __id = self.rand_str_except(Alaska.PROJECT_L, self.jobs.keys())
        self.jobs[__id] = None # initialize empty job to prevent duplicate ids
        # source and target mounting points
        # src_proj = os.path.abspath(self.projects[_id].dir)
        src = Alaska.DOCKER_DATA_VOLUME
        tgt = Alaska.ROOT_PATH
        wdir = '{}/{}'.format(Alaska.ROOT_PATH, proj.dir)
        # volumes to mount to container
        volumes = {
            src: {'bind': tgt, 'mode': 'rw'},
        }

        cmd = 'python3 run_analysis.py kallisto --threads {}'.format(Alaska.NTHREADS)
        args = {
            'working_dir': wdir,
            'volumes': volumes,
            'cpuset_cpus': Alaska.CPUS,
        }
        ### end job variables

        job = AlaskaJob(__id, 'kallisto', _id,
                         Alaska.DOCKER_KALLISTO_TAG, cmd, **args)
        job.save()
        self.jobs[__id] = job
        proj.jobs.append(__id)
        self.broadcast(_id, '{}: new job created with id {}'.format(_id, __id))

        self.broadcast(_id, '{}: checking queue'.format(_id, __id))
        if self.current_job is None and self.queue.qsize() == 0: # no other job running
            self.broadcast(_id, '{}: queue is empty...immediately starting'.format(_id))
        else:
            self.broadcast(_id, '{}: job {} added to queue (size: {})'
                            .format(_id, __id, self.queue.qsize()))
        self.queue.put(job) # put job into queue
                            # job must be put into queue
                            # regardless of it being empty
        proj.progress = 8 # added to queue

        if close:
            self.close(_id)

    def diff_exp(self, _id, close=True, check=True):
        """
        Perform differential expression analysis.
        """
        if check and self.projects[_id].progress < 10:
            raise Exception('{}: project must be aligned before differential expression analysis'
                            .format(_id))
        # The project we are interested in.
        proj = self.projects[_id]

        # copy scripts
        self.copy_script(_id, Alaska.ANL_SCRIPT)
        self.copy_script(_id, Alaska.SLE_SCRIPT)

        # check if diff. exp. is already queued
        qu = list(self.queue.queue)
        for job in qu:
            if job.proj_id == _id and job.name == 'sleuth':
                raise Exception('{}: already in queue'.format(_id))

        # check if diff. exp. is currently running
        if self.current_job is not None\
            and self.current_job.proj_id == _id\
            and self.current_job.name == 'sleuth':
            raise Exception('{}: currently running'.format(_id))

        # write sleuth matrix and bash script
        proj.write_matrix()
        self.broadcast(_id, '{}: wrote sleuth design matrix'.format(_id))

        self.broadcast(_id, '{}: creating new job'.format(_id))

        ### begin job variables
        __id = self.rand_str_except(Alaska.PROJECT_L, self.jobs.keys())
        self.jobs[__id] = None # initialize empty job to prevent duplicate ids
        # source and target mouting points
        src = Alaska.DOCKER_DATA_VOLUME
        tgt = Alaska.ROOT_PATH
        wdir = '{}/{}'.format(Alaska.ROOT_PATH, proj.dir)
        # volumes to mount to container
        volumes = {
            src: {'bind': tgt, 'mode': 'rw'},
        }
        cmd = 'python3 run_analysis.py sleuth --threads {}'.format(Alaska.NTHREADS)
        args = {
            'working_dir': wdir,
            'volumes': volumes,
            'cpuset_cpus': self.CPUS,
        }
        ### end job variables

        job = AlaskaJob(__id, 'sleuth', _id,
                        self.DOCKER_SLEUTH_TAG, cmd, **args)
        job.save()
        self.jobs[__id] = job
        proj.jobs.append(__id)
        self.broadcast(_id, '{}: new job created with id {}'.format(_id, __id))

        self.broadcast(_id, '{}: checking queue'.format(_id, __id))
        if self.current_job is None and self.queue.qsize() == 0: # no other job running
            self.broadcast(_id, '{}: queue is empty...immediately starting'.format(_id))
        else:
            self.broadcast(_id, '{}: job {} added to queue (size: {})'
                            .format(_id, __id, self.queue.qsize()))
        self.queue.put(job) # put job into queue
                            # job must be put into queue
                            # regardless of it being empty
        proj.progress = 11 # added to queue

        if close:
            self.close(_id)

    def do_all(self, _id, close=True):
        """
        Perform all three analyses.
        """
        self.broadcast(_id, '{}: performing all analyses'.format(_id))
        if close:
            self.close(_id)

        self.qc(_id, close=False)
        self.read_quant(_id, close=False, check=False)
        self.diff_exp(_id, close=False, check=False)

    def open_sleuth_server(self, _id, close=True):
        """
        Open sleuth shiny app.
        """
        proj = self.projects[_id]

        if proj.progress < 13:
            raise Exception('{}: Sleuth not yet run'.format(_id))

        # If the server for this project is already open, just return the
        # port.
        for port, item in self.sleuth_servers.items():
            if item[0] == _id:
                self.broadcast(_id, '{}: server already open on port {}'.format(_id, port))
                # refresh open time
                item[2] = dt.datetime.now()
                if close:
                    self.close(_id)
                return

        self.broadcast(_id, '{}: starting Sleuth shiny app'.format(_id))

        # First, copy the script that opens the server.
        self.copy_script(_id, Alaska.SHI_SCRIPT, dst=proj.diff_dir)

        # source and target mouting points
        src = Alaska.DOCKER_DATA_VOLUME
        tgt = Alaska.ROOT_PATH
        wdir = '{}/{}'.format(Alaska.ROOT_PATH, proj.diff_dir)
        # volumes to mount to container
        volumes = {
            src: {'bind': tgt, 'mode': 'rw'},
        }

        # Randomly choose port.
        port = random.choice(self.available_ports)

        # Make sure port isn't taken.
        if port in self.sleuth_servers:
            raise Exception('{}: port {} is already taken!'.format(_id, port))

        self.sleuth_servers[port] = None
        ports = {
            42427: port
        }
        cmd = 'Rscript {}'.format(Alaska.SHI_SCRIPT)
        ###############################

        cont = AlaskaDocker(Alaska.DOCKER_SLEUTH_TAG)
        cont.run(cmd, working_dir=wdir,
                          volumes=volumes,
                          ports=ports)
        cont_id = cont.id
        self.out('INFO: shiny app container started with id {}'.format(cont_id))
        self.sleuth_servers[port] = (_id, cont_id, dt.datetime.now())

        self.broadcast(_id, '{}: server opened on port {}'.format(_id, port))

        if close:
            self.close(_id)

    def copy_script(self, _id, script, dst=None):
        """
        Copies specified script (and overwrites if it already exists) to
        project.
        """
        # retrieve project
        proj = self.projects[_id]

        if dst is None:
            path = '{}/{}'.format(proj.dir, script)
        else:
            path = '{}/{}'.format(dst, script)
        # check if the file already exists
        # if it does, remove
        if os.path.isfile(path):
            os.remove(path)

        # then, copy
        shutil.copy2('{}/{}'.format(Alaska.SCRIPT_DIR, script), path)

    def proj_status(self, _id, close=True):
        """
        Checks project status.
        """
        if self.exists_temp(_id):
            progress = self.projects_temp[_id].progress
        elif self.exists_var(_id):
            progress = self.projects[_id].progress
        else:
            raise Exception('{}: does not exist'.format(_id))

        self.broadcast(_id, '{}: {}'.format(_id, progress))

        if close:
            self.close(_id)

    def test_copy_reads(self, _id, close=True):
        """
        Copy test reads for testing.
        """
        # project to test
        proj = self.projects_temp[_id]

        for read in Alaska.TEST_RAW_READS_FULL:
            tgt = '{}/{}'.format(proj.raw_dir, read.split('/')[-1])
            if os.path.isdir(tgt):
                self.out('{}: {} already exists, skipping'.format(_id, tgt))
            else:
                self.out('{}: copying {}'.format(_id, read))
                shutil.copytree(read, tgt)

        if close:
            self.close(_id)

    def test_set_vars(self, _id, close=True):
        """
        Set project variables for testing.
        """
        # project to test
        proj = self.projects_temp[_id]

        self.broadcast(_id, '{}: beginning set vars test'.format(_id))
        self.respond(_id, '{}: check server console for more details'.format(_id))

        if close:
            self.close(_id)

        # copy test samples
        self.test_copy_reads(_id, close=False)
        # infer samples and set project
        self.infer_samples(_id, close=False, md5=False)

        # manually change project sample variables
        for sid, sample in proj.samples.items():
            sample.length = 200
            sample.stdev = 60
            sample.bootstrap_n = 10
            sample.organism = 'caenorhabditis_elegans'
            sample.ref_ver = '235'

            if all('wt' in read for read in sample.reads):
                sample.meta['chars']['genotype'] = 'wt'
                proj.ctrls[sid] = 'genotype'
            elif all('mt' in read for read in sample.reads):
                sample.meta['chars']['genotype'] = 'mt'

        # finalize project
        proj.save(Alaska.TEMP_DIR)
        self.set_proj(_id, close=False)
        self.finalize_proj(_id, close=False)


    def test_qc(self, _id, close=True):
        """
        For testing quality control.
        """
        self.broadcast(_id, '{}: beginning quality control test'.format(_id))
        self.respond(_id, '{}: check server console for more details'.format(_id))

        if close:
            self.close(_id)

        self.test_set_vars(_id, close=False)
        self.qc(_id, close=False)


    def test_read_quant(self, _id, close=True):
        """
        For testing read quantification.
        """
        if not self.exists(_id):
            raise Exception('{}: does not exist'.format(_id))

        self.broadcast(_id, '{}: beginning read quantification test'.format(_id))
        self.respond(_id, '{}: check server console for more details'.format(_id))

        if close:
            self.close(_id)

        # run read quantification
        self.test_qc(_id, close=False)
        self.read_quant(_id, close=False)


    def test_diff_exp(self, _id, close=True):
        """
        For testing differential expresion analysis.
        """
        if not self.exists(_id):
            raise Exception('{}: does not exist'.format(_id))

        self.broadcast(_id, '{}: beginning diff. expression test'.format(_id))
        self.respond(_id, '{}: check server console for more details'.format(_id))

        if close:
            self.close(_id)

        self.test_read_quant(_id, close=False)
        self.diff_exp(_id, close=False)


    def test_all(self, _id):
        """
        For testing both read quant and differential expression.
        """
        self.broadcast(_id, '{}: beginnning test everything'.format(_id))
        self.respond(_id, '{}: check server console for more details'.format(_id))
        self.close(_id)

        self.test_set_vars(_id, close=False)
        self.do_all(_id, close=False)

    def get_status(self, _id):
        """
        Get the status of the server.
        """
        pass

    def save(self, _id=None):
        """
        Saves its current state.
        """
        path = self.SAVE_DIR
        datetime = dt.datetime.now().strftime('%Y-%m-%d %H-%M-%S')

        self.out('INFO: locking all threads to save server state')
        lock = threading.Lock()
        lock.acquire()

        # save all projects, jobs and organisms first
        for __id, project in self.projects.items():
            project.save()
        for __id, project_temp in self.projects_temp.items():
            project_temp.save(Alaska.TEMP_DIR)
        for __id, job in self.jobs.items():
            job.save()
        for genus, obj_1 in self.organisms.items():
            for species, obj_2 in obj_1.items():
                obj_2.save()
        ### hide variables that should not be written to JSON
        _projects = self.projects
        _samples = self.samples
        _projects_temp = self.projects_temp
        _samples_temp = self.samples_temp
        _queue = self.queue
        _jobs = self.jobs
        _organisms = self.organisms
        _current_job = self.current_job
        _sleuth_servers = self.sleuth_servers
        _idx_interval = self.idx_interval
        _PORT = self.PORT
        _CONTEXT = self.CONTEXT
        _SOCKET = self.SOCKET
        _CODES = self.CODES
        _DOCKER = self.DOCKER
        _RUNNING = self.RUNNING
        # delete / replace
        self.projects = list(self.projects.keys())
        self.samples = list(self.samples.keys())
        self.projects_temp = list(self.projects_temp.keys())
        self.samples_temp = list(self.samples_temp.keys())
        self.queue = [job.id for job in list(self.queue.queue)]
        self.jobs = list(self.jobs.keys())
        # replace AlaskaOrganism object with list of versions
        for genus, obj_1 in self.organisms.items():
            for species, obj_2 in obj_1.items():
                self.organisms[genus][species] = list(obj_2.refs.keys())
        if self.current_job is not None:
            self.current_job = self.current_job.id
        del self.sleuth_servers
        del self.idx_interval
        del self.PORT
        del self.CONTEXT
        del self.SOCKET
        del self.CODES
        del self.DOCKER
        del self.RUNNING

        with open('{}/{}.json'.format(path, datetime), 'w') as f:
            # dump to json
            json.dump(self.__dict__, f, default=self.encode_json, indent=4)

        # once dump is finished, restore variables
        self.projects = _projects
        self.samples = _samples
        self.projects_temp = _projects_temp
        self.samples_temp = _samples_temp
        self.queue = _queue
        self.jobs = _jobs
        self.organisms = _organisms
        self.current_job = _current_job
        self.sleuth_servers = _sleuth_servers
        self.idx_interval = _idx_interval
        self.PORT = _PORT
        self.CONTEXT = _CONTEXT
        self.SOCKET = _SOCKET
        self.CODES = _CODES
        self.DOCKER = _DOCKER
        self.RUNNING = _RUNNING

        self.out('INFO: saved, unlocking threads')
        lock.release()

        self.close(_id)

    def load(self, _id=None):
        """
        Loads state from JSON.
        """
        path = Alaska.SAVE_DIR
        files = os.listdir(path)

        self.out('INFO: locking all threads to load server state')
        lock = threading.Lock()
        lock.acquire()

        jsons = []
        for fname in files:
            if fname.endswith('.json'):
                jsons.append(fname)

        jsons = sorted(jsons)
        fname = jsons[-1]

        self.out('INFO: loading {}'.format(fname))
        with open('{}/{}'.format(path, fname), 'r') as f:
            loaded = json.load(f)

        # IMPORTANT: must load entire json first
        # because projects must be loaded before jobs are
        for key, item in loaded.items():
            if key == 'queue':
                # the queue needs to be dealt specially
                _queue = item
                with self.queue.mutex:
                    self.queue.queue.clear()
            else:
                setattr(self, key, item)

        #### create necessary objects & assign
        for genus, dict_1 in self.organisms.items():
            for species, dict_2 in dict_1.items():
                self.out('INFO: loading organism {}_{}'.format(genus, species))
                # make new species
                org = AlaskaOrganism(genus, species)
                org.load()
                self.organisms[genus][species] = org

        _projects = {}
        self.samples = {}
        for __id in self.projects:
            self.out('INFO: loading project {}'.format(__id))
            ap = AlaskaProject(__id)
            ap.load()
            _projects[__id] = ap
            self.samples = {**self.samples, **ap.samples}
        self.projects = _projects

        _projects_temp = {}
        self.samples_temp = {}
        for __id in self.projects_temp:
            self.out('INFO: loading temporary project {}'.format(__id))
            ap = AlaskaProject(__id)
            ap.load(self.TEMP_DIR)
            _projects_temp[__id] = ap
            self.samples_temp = {**self.samples_temp, **ap.samples}
        self.projects_temp = _projects_temp

        _jobs = {}
        for __id in self.jobs:
            self.out('INFO: loading job {}'.format(__id))
            job = AlaskaJob(__id)
            job.load()
            _jobs[__id] = job
        self.jobs = _jobs

        if self.current_job is not None:
            self.out('INFO: unfinished job {} was detected'.format(self.current_job))
            self.current_job = self.jobs[self.current_job]
            self.queue.put(self.current_job)
            self.out('INFO: {} added to first in queue'.format(self.current_job.id))
        for __id in _queue:
            self.out('INFO: adding {} to queue'.format(__id))
            self.queue.put(self.jobs[__id])

        self.out('INFO: loaded, unlocking threads')
        lock.release()

        self.close(_id)

if __name__ == '__main__':
    import argparse

    parser = argparse.ArgumentParser(description='Start server with given arguments.')
    parser.add_argument('--force',
                        action='store_true')
    args = parser.parse_args()

    try:
        server = AlaskaServer()
        server.start(force=True)
    except KeyboardInterrupt:
        print('\nINFO: interrupt received, stopping...')
    finally:
        server.stop()
