"""
AlaskaServer.py

Author: Joseph Min (kmin@caltech.edu)

This script is to be persistently running on the server.
AlaskaServer handles all requests, manages the job queue and projects/samples.
"""
# TODO: Implement all methods

# TODO: find out what project & sample metadata must be collected
# TODO: implement logging
# TODO: how to show results?

import os
import io
import sys
import zmq
import time
import json
import queue
import docker
import traceback
import warnings as w
import datetime as dt
import hashlib as hl
from Alaska import Alaska
from AlaskaJob import AlaskaJob
from AlaskaProject import AlaskaProject
from BashWriter import BashWriter
import threading
from threading import Thread

class AlaskaServer(Alaska):
    """
    AlaskaServer
    """

    def __init__(self, port=8888):
        """
        AlaskaServer constructor. Starts the server at the given port.
        """
        self.datetime = dt.datetime.now().strftime('%Y-%m-%d %H:%M:%S')

        self.transcripts = []
        self.indices = []
        self.projects = {}
        self.samples = {}

        # temps are used to prevent generation of existing (but not yet finalized)
        # project/sample ids
        self.projects_temp = {} # temporary projects
        self.samples_temp = {} # temporary samples

        self.workers_n = 1 # number of workers
        self.queue = queue.Queue()
        self.jobs = {} # dictionary of all jobs
        self.current_job = None # job undergoing analysis

        self.idx_interval = 600 # index update interval (in seconds)

        self.log_pool = [] # pool of logs to be flushed
        self.log_interval = 3600 # log interval (in seconds)

        # set up server
        self.PORT = port
        self.CONTEXT = zmq.Context()
        self.SOCKET = self.CONTEXT.socket(zmq.ROUTER)
        self.SOCKET.bind('tcp://*:{}'.format(port))

        self.CODES = {
            b'\x00': self.check,
            b'\x01': self.new_proj,
            b'\x02': self.load_proj,
            b'\x03': self.save_proj,
            b'\x04': self.infer_samples,
            b'\x05': self.get_idx,
            # b'\x06': self.new_sample,
            b'\x07': self.set_proj,
            b'\x08': self.finalize_proj,
            b'\x09': self.read_quant,
            b'\x10': self.diff_exp,
            b'\x11': self.proj_status,
            b'\x50': self.test_read_quant,
            b'\x51': self.test_diff_exp,
            b'\x52': self.test_all,
            b'\x94': self.save,
            b'\x95': self.load,
            b'\x96': self.log,
            b'\x97': self.update_idx,
            b'\x98': self.start,
            b'\x99': self.stop,
        }

        self.DOCKER = docker.from_env() # docker client

        os.chdir('../') # go to parent of script directory

        self.out('INFO: AlaskaServer initialized')

    def start(self, _id=None):
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

            self.out('INFO: acquiring absolute path')
            if not os.path.exists('PATH_TO_HERE'):
                raise Exception('ERROR: absolute path file doesn\'t exist')

            with open('PATH_TO_HERE', 'r') as pathf:
                path = pathf.readlines()[0].strip()
                Alaska.HOST_DIR = path
                Alaska.ROOT_PATH = '{}/{}'.format(path, self.ROOT_DIR)

            # check if all necessary folders are there
            folders = [self.SAVE_DIR,
                        self.SCRIPT_DIR,
                        self.JOBS_DIR,
                        self.TRANS_DIR,
                        self.IDX_DIR,
                        self.LOG_DIR,
                        self.PROJECTS_DIR]

            for folder in folders:
                # this path is the path on the alaska container...not host!
                path = './{}/{}'.format(self.ROOT_DIR, folder)
                if not os.path.exists(path):
                    self.out('INFO: creating folder {}'.format(path))
                    os.makedirs(path)

            # switch working directory to root
            os.chdir(self.ROOT_DIR)


        except Exception as e:
            self.out(str(e))
            self.stop(code=1)

        with w.catch_warnings() as caught:
            w.simplefilter('always')

            self.out('INFO: starting logger')
            p = Thread(target=self.log_loop, args=(self.log_interval,))
            p.daemon = True
            p.start()

            self.out('INFO: starting index update worker')
            p = Thread(target=self.update_idx_loop, args=(self.idx_interval,))
            p.daemon = True
            p.start()

            self.out('INFO: starting {} workers'.format(self.workers_n))
            for i in range(self.workers_n):
                p = Thread(target=self.worker)
                p.daemon = True
                p.start()

            # self.out('INFO: loading docker images')
            # with open('{}/kallisto'.format(self.IMG_DIR), 'br') as img:
            #     self.DOCKER.images.load(img)
            # with open('{}/sleuth'.format(self.IMG_DIR), 'br') as img:
            #     self.DOCKER.images.load(img)
            # self.out(self.DOCKER.images.list())

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

        self.out('INFO: terminating ZeroMQ')
        lock = threading.Lock()
        lock.acquire()
        self.SOCKET.close()
        self.CONTEXT.term()

        self.RUNNING = False

        # stop all containers
        # for cont in self.DOCKER.containers.list():
        #     self.out('INFO: terminating container {}'.format(cont.short_id))
        #     cont.remove(force=True)

        # stop running jobs
        if self.current_job is not None:
            cont_id = self.current_job.docker.id
            self.out('INFO: job {} is running...terminating container {}'
                        .format(self.current_job.id, cont_id))
            self.DOCKER.containers.get(cont_id).remove(force=True)
            self.out('INFO: termination successful')

        self.save()

        if not code == 0:
            self.out('TERMINATED WITH EXIT CODE {}'.format(code))

        self.log() # write all remaining logs

        sys.exit(code)

    def worker(self):
        """
        Worker function
        """
        try:
            while self.RUNNING:
                job = self.queue.get() # receive job from queue
                                        # block if there is no job
                self.current_job = job
                job_name = job.name
                proj_id = job.proj_id
                self.out('INFO: starting job {}'.format(job.id))
                job.run()

                # change progress
                if job.name == 'kallisto':
                    self.projects[proj_id].progress = 6
                elif job.name == 'sleuth':
                    self.projects[proj_id].progress = 9
                else:
                    raise Exception('ERROR: job {} has unrecognized name'.format(job.id))

                self.out('INFO: container started with id {}'.format(job.docker.id))
                hook = self.DOCKER.containers.get(job.docker.id).logs(stdout=True, stderr=True, stream=True)

                for l in hook:
                    l = l.decode(self.ENCODING).strip()

                    if '\n' in l:
                        outs = l.split('\n')
                    else:
                        outs = [l]

                    for out in outs:
                        job.docker.output.append(out) # append output
                        self.out('{}: {}: {}'.format(proj_id, job_name, out))

                # TODO: better way to check correct termnation?
                try:
                    exitcode = self.DOCKER.containers.get(job.docker.id).wait()
                except:
                    raise Exception('ERROR: container {} exited incorrectly'
                                    .format(job.docker.id))
                if exitcode == 0:
                    if job.name == 'kallisto':
                        self.projects[proj_id].progress = 7
                    elif job.name == 'sleuth':
                        self.projects[proj_id].progress = 10
                    else:
                        raise Exception('ERROR: job {} has unrecognized name'.format(job.id))
                    job.finished()
                    self.current_job = None
                    self.queue.task_done()
                    self.out('INFO: finished job {}'.format(job.id))
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
                raise Exception('ERROR: code {} was not recognized')
            # distribute message to appropriate method
            self.CODES[request[1]](request[0].decode(self.ENCODING))
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

        with open('{}/{}.log'.format(self.LOG_DIR, datetime), 'w') as f:
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

    def check(self, to):
        """
        Responds to check request.
        Check request is sent to check if server is up and running.
        """
        self.respond(to, to)

    def update_idx(self, _id=None):
        """
        Writes bash script to update indices.
        """
        self.out('INFO: starting index update')
        self.transcripts = os.listdir(self.TRANS_DIR)
        self.indices = os.listdir(self.IDX_DIR)
        sh = BashWriter('update_idx', folder=self.SCRIPT_DIR)

        for trans in self.transcripts:
            name = trans.split('.')[:-2] # remove extension
            name = '.'.join(name)
            if all(not idx.startswith(name) for idx in self.indices):
                self.out('INFO: index must be built for {}'.format(trans))
                sh.add('kallisto index -i {}/{}.idx {}/{}'.format(self.IDX_DIR,
                                                name, self.TRANS_DIR, trans))

        if not len(sh.commands) == 0:
            self.out('INFO: writing update script')
            sh.write() # write script

            ### begin variables
            __id = self.rand_str_except(self.PROJECT_L, self.jobs.keys())
            # source and target mounting points
            src_scrpt = '/{}/{}'.format(self.ROOT_PATH, self.SCRIPT_DIR)
            tgt_scrpt = '/{}'.format(self.SCRIPT_DIR)
            src_trans = '/{}/{}'.format(self.ROOT_PATH, self.TRANS_DIR)
            tgt_trans = '/{}'.format(self.TRANS_DIR)
            src_idx = '/{}/{}'.format(self.ROOT_PATH, self.IDX_DIR)
            tgt_idx = '/{}'.format(self.IDX_DIR)
            # volumes to mount to container
            volumes = {
                src_scrpt: {'bind': tgt_scrpt, 'mode': 'ro'},
                src_trans: {'bind': tgt_trans, 'mode': 'ro'},
                src_idx: {'bind': tgt_idx, 'mode': 'rw'}
            }
            cmd = 'bash {}/update_idx.sh'.format(self.SCRIPT_DIR)
            args = {
                'volumes': volumes,
                'cpuset_cpus': self.CPUS,
            }
            ### end variables

            self.out('INFO: starting docker container with {} core allocation'.format(self.CPUS))
            cont = self.DOCKER.containers.run(self.KAL_VERSION,
                                    'bash {}/update_idx.sh'.format(self.SCRIPT_DIR),
                                    volumes=volumes,
                                    cpuset_cpus=self.CPUS,
                                    detach=True)
            self.out('INFO: container started with id {}'.format(cont.short_id))

            for l in cont.attach(stream=True):
                l = l.decode(self.ENCODING).strip()

                # since kallisto output can be multiple lines
                if '\n' in l:
                    outs = l.split('\n')
                else:
                    outs = [l]

                for out in outs:
                    self.out('INFO: index: {}'.format(out))

            self.out('INFO: index build successful')
            self.update_idx()
        else:
            self.out('INFO: indices up to date. no update required')

    def update_idx_loop(self, t=600):
        """
        Index update loop.
        Runs update_idx in intervals.
        """
        try:
            while self.RUNNING:
                self.update_idx()
                time.sleep(t)
        except KeyboardInterrupt:
            self.out('INFO: terminating update loop')

    def new_proj(self, _id, close=True):
        """
        Creates a new project.
        """
        ids = list(self.projects.keys()) + list(self.projects_temp.keys())
        __id = self.rand_str_except(self.PROJECT_L, ids)
        __id = 'AP{}'.format(__id)
        self.projects_temp[__id] = AlaskaProject(__id)
        self.broadcast(_id, '{}: creating'.format(__id))

        # make directories
        f = './{}/{}/{}'.format(self.PROJECTS_DIR, __id, self.TEMP_DIR)
        os.makedirs(f)
        self.broadcast(_id, '{}: {} created'.format(__id, f))
        f = './{}/{}/{}'.format(self.PROJECTS_DIR, __id, self.RAW_DIR)
        os.makedirs(f)
        self.broadcast(_id, '{}: {} created'.format(__id, f))
        f = './{}/{}/{}'.format(self.PROJECTS_DIR, __id, self.ALIGN_DIR)
        os.makedirs(f)
        self.broadcast(_id, '{}: {} created'.format(__id, f))
        f = './{}/{}/{}'.format(self.PROJECTS_DIR, __id, self.DIFF_DIR)
        os.makedirs(f)
        self.broadcast(_id, '{}: {} created'.format(__id, f))

        self.broadcast(_id, '{}: created successfully'.format(__id))

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
        path = './{}/{}/'.format(self.PROJECTS_DIR, _id)
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

    def get_raw_reads(self, _id, close=True):
        """
        Retrieves list of uploaded sample files.
        """
        # TODO: change checking to catching exceptions
        self.broadcast(_id, '{}: getting raw reads'.format(_id))

        # check if it exists
        if not self.exists(_id):
            raise Exception('{}: does not exist'.format(_id))

        # if project exists, check if raw reads have already been calculated
        if len(self.projects_temp[_id].raw_reads) == 0:
            self.projects_temp[_id].get_raw_reads()

        # if md5 checksums are empty
        if len(self.projects_temp[_id].chk_md5) == 0:
            self.broadcast(_id, '{}: calculating MD5 checksums'.format(_id))
            for folder, reads in self.projects_temp[_id].raw_reads.items():
                self.projects_temp[_id].chk_md5[folder] = []
                for read in reads:
                    md5 = self.md5_chksum('{}/{}/{}/{}/{}'.format(
                            self.PROJECTS_DIR, _id, self.RAW_DIR, folder, read))
                    self.projects_temp[_id].chk_md5[folder].append(md5)

        self.broadcast(_id, '{}: successfully retrieved raw reads'.format(_id))

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

    def infer_samples(self, _id, close=True):
        """
        Infers samples from raw reads.
        """
        self.projects_temp[_id].progress = 1
        self.get_raw_reads(_id) # make sure raw reads have been extracted

        # TODO: check data with exception catching
        # TODO: have to check: project exists, have non-empty raw_reads
        self.broadcast(_id, '{}: infering samples from raw reads'.format(_id))

        # function to get new sample ids
        ids = lambda : list(self.samples.keys()) + list(self.samples_temp.keys())
        f = lambda : self.rand_str_except(self.PROJECT_L, ids())

        self.projects_temp[_id].infer_samples(f, temp=self.samples_temp)
        self.broadcast(_id, '{}: samples successfully inferred'.format(_id))

        self.projects_temp[_id].progress = 2

        # output project JSON to temp folder
        self.projects_temp[_id].save(self.TEMP_DIR)
        self.broadcast(_id, '{}: saved to temp folder'.format(_id))

        # 11/27/2017
        # self.respond(_id, json.dumps(self.projects_temp[_id].samples, default=self.encode_json, indent=4))

        if close:
            self.close(_id)

    def get_idx(self, _id, close=True):
        """
        Responds with the list of available indices.
        """
        self.out('INFO: available indices {}'.format(self.indices))
        self.respond(_id, self.indices)

        if close:
            self.close(_id)

    def set_proj(self, _id, close=True):
        """
        Sets project params.
        Only to be called after the project has been created.
        """
        if self.projects_temp[_id].progress < 2:
            raise Exception('{}: raw reads have to be retrieved and samples inferred'
                            .format(_id))

        self.broadcast(_id, '{}: setting project data'.format(_id))

        # TODO: what if sample id exists?
        self.projects_temp[_id].load(self.TEMP_DIR)
        self.broadcast(_id, '{}: validating data'.format(_id))
        self.projects_temp[_id].check()

        self.projects_temp[_id].progress = 3

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
        if self.projects_temp[_id].progress < 3:
            raise Exception('{}: project data must be set and validated at least once'
                            .format(_id))

        self.broadcast(_id, '{}: finalizing'.format(_id))

        # make directories
        self.broadcast(_id, '{}: making directories for read alignment'.format(_id))
        for sample in self.projects_temp[_id].samples:
            f = './{}/{}/{}/{}'.format(self.PROJECTS_DIR, _id, self.ALIGN_DIR, sample)
            os.makedirs(f, exist_ok=True)
            self.broadcast(_id, '{}: {} created'.format(_id, f))

        # convert temporary project to permanent project
        self.projects[_id] = AlaskaProject(_id)
        self.projects[_id].load(self.TEMP_DIR)

        # remove temporary files
        f = './{}/{}/{}/{}.json'.format(self.PROJECTS_DIR, _id, self.TEMP_DIR, _id)
        if os.path.isfile(f):
            os.remove(f)
            self.broadcast(_id, '{}: {} removed'.format(_id, f))

        # convert temporary samples to permanent samples
        self.samples = {**self.samples, **self.projects[_id].samples}

        # delete temps
        for __id in self.projects_temp[_id].samples:
            del self.samples_temp[__id]
        del self.projects_temp[_id]

        self.projects[_id].progress = 4
        self.projects[_id].save()

        msg = '{}: successfully finalized'.format(_id)
        self.broadcast(_id, msg)

        if close:
            self.close(_id)

    def read_quant(self, _id, close=True, force=False):
        """
        Checks if another analysis is running,
        then performs read quantification.
        """
        if self.projects[_id].progress < 4 and not force:
            raise Exception('{}: project must be finalized before alignment'
                            .format(_id))

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

        self.projects[_id].write_kallisto()
        self.broadcast(_id, '{}: wrote alignment script'.format(_id))

        self.broadcast(_id, '{}: creating new job'.format(_id))

        ### begin job variables
        __id = self.rand_str_except(self.PROJECT_L, self.jobs.keys())
        self.jobs[__id] = None # initialize empty job to prevent duplicate ids
        # source and target mounting points
        # src_proj = os.path.abspath(self.projects[_id].dir)
        src_proj = '{}/{}/{}'.format(self.ROOT_PATH, self.PROJECTS_DIR, _id)
        tgt_proj = '/projects/{}'.format(_id)
        src_idx = '{}/{}'.format(self.ROOT_PATH, self.IDX_DIR)
        tgt_idx = '/idx'
        # volumes to mount to container
        volumes = {
            src_proj: {'bind': tgt_proj, 'mode': 'rw'},
            src_idx: {'bind': tgt_idx, 'mode': 'ro'}
        }

        cmd = 'bash {}/kallisto.sh'.format(tgt_proj)
        args = {
            'volumes': volumes,
            'cpuset_cpus': self.CPUS,
        }
        ### end job variables

        job = AlaskaJob(__id, 'kallisto', _id,
                         self.KAL_VERSION, cmd, **args)
        job.save()
        self.jobs[__id] = job
        self.projects[_id].jobs.append(__id)
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
        self.projects[_id].progress = 5 # added to queue

        if close:
            self.close(_id)

    def diff_exp(self, _id, close=True, force=True):
        """
        Perform differential expression analysis.
        """
        if self.projects[_id].progress < 7 and not force:
            raise Exception('{}: project must be aligned before differential expression analysis'
                            .format(_id))

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
        self.projects[_id].write_matrix()
        self.broadcast(_id, '{}: wrote sleuth design matrix'.format(_id))
        self.projects[_id].write_sleuth()
        self.broadcast(_id, '{}: wrote sleuth script'.format(_id))

        self.broadcast(_id, '{}: creating new job'.format(_id))

        ### begin job variables
        __id = self.rand_str_except(self.PROJECT_L, self.jobs.keys())
        self.jobs[__id] = None # initialize empty job to prevent duplicate ids
        # source and target mouting points
        src_proj = '{}/{}/{}'.format(self.ROOT_PATH, self.PROJECTS_DIR, _id)
        tgt_proj = '/projects/{}'.format(_id)
        # volumes to mount to container
        volumes = {
            src_proj: {'bind': tgt_proj, 'mode': 'rw'},
        }
        cmd = 'bash {}/sleuth.sh'.format(tgt_proj)
        args = {
            'volumes': volumes,
            'cpuset_cpus': self.CPUS,
        }
        ### end job variables

        job = AlaskaJob(__id, 'sleuth', _id,
                        self.SLE_VERSION, cmd, **args)
        job.save()
        self.jobs[__id] = job
        self.projects[_id].jobs.append(__id)
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
        self.projects[_id].progress = 8 # added to queue

        if close:
            self.close(_id)

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

        if progress == 0:
            msg = 'project was created (and nothing else)'
        elif progress == 1:
            msg = 'raw reads are being unpacked and samples being inferred'
        elif progress == 2:
            msg = 'raw reads have been successfully loaded'
        elif progress == 3:
            msg = 'project data have been set and validated'
        elif progress == 4:
            msg = 'project has been finalized'
        elif progress == 5:
            msg = 'alignment has been added to queue'
        elif progress == 6:
            msg = 'alignment is being performed'
        elif progress == 7:
            msg = 'completed alignment'
        elif progress == 8:
            msg = 'differential expression analysis has been added to queue'
        elif progress == 9:
            msg = 'differential expression analysis is being performed'
        elif progress == 10:
            msg = 'completed differential expression analysis'
        elif progress == 11:
            msg = 'analysis completed'

        self.broadcast(_id, '{}: {}'.format(_id, msg))

        if close:
            self.close(_id)

    def test_read_quant(self, _id, close=True):
        """
        For testing read quantification.
        """
        if not self.exists(_id):
            raise Exception('{}: does not exist'.format(_id))

        self.broadcast(_id, '{}: beginning read quantification test'.format(_id))
        self.respond(_id, '{}: check server console for more details'.format(_id))

        # project to test
        proj = self.projects_temp[_id]

        # infer samples and set project
        self.infer_samples(_id, close=False)

        # manually change project sample variables
        for sid, sample in proj.samples.items():
            sample.length = 200
            sample.stdev = 60
            sample.bootstrap_n = 10
            sample.idx = 'c_elegans.PRJNA13758.WS261.CDS_transcripts.idx'

            if all('wt' in read for read in sample.reads):
                sample.meta['title'] = 'wt'
                proj.ctrl_ids.append(sid)
            elif all('mt' in read for read in sample.reads):
                sample.meta['title'] = 'mt'

        proj.ctrl_ftrs['title'] = 'wt'

        # finalize project
        proj.save(self.TEMP_DIR)
        self.set_proj(_id, close=False)
        self.finalize_proj(_id, close=False)

        if close:
            self.close(_id)

        # run read quantification
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

        self.diff_exp(_id, close=False)


    def test_all(self, _id):
        """
        For testing both read quant and differential expression.
        """
        self.broadcast(_id, '{}: beginnning test everything'.format(_id))
        self.respond(_id, '{}: check server console for more details'.format(_id))
        self.close(_id)

        self.test_read_quant(_id, close=False)
        self.test_diff_exp(_id, close=False)


    def save(self, _id=None):
        """
        Saves its current state.
        """
        path = self.SAVE_DIR
        datetime = dt.datetime.now().strftime('%Y-%m-%d %H-%M-%S')

        self.out('INFO: locking all threads to save server state')
        lock = threading.Lock()
        lock.acquire()

        # save all projects and jobs first
        for __id, project in self.projects.items():
            project.save()
        for __id, project_temp in self.projects_temp.items():
            project_temp.save(self.TEMP_DIR)
        for __id, job in self.jobs.items():
            job.save()

        ### hide variables that should not be written to JSON
        _projects = self.projects
        _samples = self.samples
        _projects_temp = self.projects_temp
        _samples_temp = self.samples_temp
        _queue = self.queue
        _jobs = self.jobs
        _current_job = self.current_job
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
        if self.current_job is not None:
            self.current_job = self.current_job.id
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
        self.current_job = _current_job
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
        path = self.SAVE_DIR
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
    try:
        server = AlaskaServer()
        server.start()
    except KeyboardInterrupt:
        print('\nINFO: interrupt received, stopping...')
    finally:
        server.stop()
