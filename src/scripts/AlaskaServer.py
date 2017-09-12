"""
AlaskaServer.py

Author: Joseph Min (kmin@caltech.edu)

This script is to be persistently running on the server.
AlaskaServer handles all requests, manages the job queue and projects/samples.
"""
# TODO: Implement all methods
# TODO: how to implement workers (so that Server is never blocked)
    # Use multiprocessing workers with lambda as the work
    # + dedicated projectworker

# TODO: find out what project & sample metadata must be collected
# TODO: implement logging
# TODO: how to show results?

import os
import zmq
import time
import json
import queue
import docker
import warnings as w
import datetime as dt
from Alaska import Alaska
from AlaskaProject import AlaskaProject
from BashWriter import BashWriter
from multiprocessing import Process
from threading import Thread

class AlaskaServer(Alaska):
    """
    AlaskaServer
    """

    # messeging codes
            # CODES = {
            #     'new_project':          b'\x01',
            #     'load_project':         b'\x02',
            #     'save_project':         b'\x03',
            #     'get_raw_reads':        b'\x04',
            #     'set_proj_metadata':    b'\x05',
            #     'set_sample_metadata':  b'\x06',
            #     'read_quant':           b'\x07',
            #     'diff_exp':             b'\x08'
            # }

    def __init__(self, port=8888):
        """
        AlaskaServer constructor. Starts the server at the given port.
        """
        self.date = dt.datetime.now().strftime('%Y-%m-%d')
        self.time = dt.datetime.now().strftime('%H:%M:%S')

        self.transcripts = []
        self.indices = []
        self.projects = {}
        self.samples = {}
        # temps are used to prevent generation of existing (but not yet finalized)
        # project/sample ids
        self.projects_temp = {} # temporary projects
        self.samples_temp = {} # temporary samples

        self.workers_n = 1 # number of workers
        self.workers = []
        self.queue = queue.Queue()
        self.current_proj = None # project undergoing analysis

        self.idx_interval = 600 # index update interval (in seconds)

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
            b'\x05': self.set_proj,
            b'\x06': self.finalize_proj,
            b'\x07': self.read_quant,
            b'\x08': self.diff_exp,
            b'\x98': self.start,
            b'\x99': self.stop,
        }

        self.DOCKER = docker.from_env()

        # switch working directory to root
        os.chdir(self.ROOT_DIR)

    def start(self, _id=None):
        """
        Starts the server.
        """
        # make log file
        # self.log = open('{}-{}.log'.format(self.date, self.time))

        self.out('INFO: Starting AlaskaServer {}'.format(self.VERSION))
        self.RUNNING = True

        self.out('INFO: checking admin privilages')
        try:
            if not os.getuid() == 0:
                raise Exception('ERROR: AlaskaServer requires admin rights')
        except Exception as e:
            self.out(str(e))
            self.stop()
        self.out('INFO: AlaskaServer running as root')

        with w.catch_warnings() as caught:
            w.simplefilter('always')

            self.out('INFO: starting index update worker')
            p = Process(target=self.update_idx_loop, args=(self.idx_interval,))
            p.daemon = True
            p.start()

            self.out('INFO: starting {} workers'.format(self.workers_n))
            for i in range(self.workers_n):
                p = Thread(target=self.worker)
                p.daemon = True
                p.start()


            while self.RUNNING:
                request = self.SOCKET.recv_multipart()

                # TODO: error & exception handling
                try:
                    self.decode(request)
                except Exception as e:
                    _id = request[0]
                    self.broadcast(_id, 'ERROR: {}'.format(request))
                    self.broadcast(_id, str(e))
                    self.close(_id)

    def stop(self, _id=None):
        """
        Stops the server.
        """
        # TODO: implement
        # self.log.close()
        self.out('INFO: terminating ZeroMQ')
        self.SOCKET.close()
        self.CONTEXT.term()

        self.RUNNING = False

        # stop all containers
        for cont in self.DOCKER.containers.list():
            self.out('INFO: terminating container {}'.format(cont.short_id))
            cont.remove(force=True)

        quit()

    def worker(self):
        """
        Worker function
        """
        while True:
            work = self.queue.get()
            work()

    def decode(self, request):
        """
        Method to decode messages received from AlaskaRequest.
        """
        # TODO: remove return statements from functions
        # TODO: instead, send messages directly
        self.out('{}: received {}'.format(request[0], request[1]))
        # must be valid codet
        if request[1] in self.CODES:
            t = Thread(target=self.CODES[request[1]], args=(request[0].decode(self.ENCODING),))
            t.start()
            # self.CODES[request[1]](request[0].decode(self.ENCODING))
        else:
            raise Exception('ERROR: code {} was not recognized')

        # self.respond(request[0], response)

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
        # self.out('RESPONSE: {}'.format(response))
        self.SOCKET.send_multipart(response)

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
        self.respond(to, 'END')

    def check(self, to):
        """
        Responds to check request.
        Check request is sent to check if server is up and running.
        """
        self.respond(to, to)

    def update_idx(self):
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


            src_scrpt = os.path.abspath(self.SCRIPT_DIR)
            tgt_scrpt = '/{}'.format(self.SCRIPT_DIR)
            src_trans = os.path.abspath(self.TRANS_DIR)
            tgt_trans = '/{}'.format(self.TRANS_DIR)
            src_idx = os.path.abspath(self.IDX_DIR)
            tgt_idx = '/{}'.format(self.IDX_DIR)
            # volumes to mount to container
            volumes = {
                src_scrpt: {'bind': tgt_scrpt, 'mode': 'ro'},
                src_trans: {'bind': tgt_trans, 'mode': 'ro'},
                src_idx: {'bind': tgt_idx, 'mode': 'rw'}
            }

            self.out('INFO: starting docker container with {} core allocation'.format(self.CPUS))
            cont = self.DOCKER.containers.run('kallisto:latest',
                                    'bash {}/update_idx.sh'.format(self.SCRIPT_DIR),
                                    volumes=volumes,
                                    cpuset_cpus=self.CPUS,
                                    detach=True)
            self.out('INFO: container started with id {}'.format(cont.short_id))

            # TODO: use worker to fetch output

            for l in cont.attach(stream=True):
                l = l.decode(self.ENCODING).strip()

                # since kallisto output can be multiple lines
                if '\n' in l:
                    outs = l.split('\n')
                else:
                    outs = [l]

                for out in outs:
                    self.out('INFO: Kallisto: {}'.format(out))

            self.out('INFO: index build successful')
            self.update_idx()
        else:
            self.out('INFO: indices up to date. no update required')

    def update_idx_loop(self, t=600):
        """
        Index update loop
        """
        while self.RUNNING:
            self.update_idx()
            time.sleep(t)


    def new_proj(self, _id):
        """
        Creates a new project.
        """
        # TODO: check if _id starts with underscore

        self.broadcast(_id, '{}: creating new AlaskaProject'.format(_id))
        ids = list(self.projects.keys()) + list(self.projects_temp.keys())
        __id = self.rand_str_except(self.PROJECT_L, ids)
        __id = 'AP{}'.format(__id)
        # 9/12/2017: hold new projects in projects_temp
        # self.projects[__id] = AlaskaProject(__id)
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

    def load_proj(self, _id):
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

        if ap.progress >= 2:
            self.projects[_id] = ap
        else:
            self.projects_temp[_id] = ap

        msg = '{}: successfully loaded'.format(_id)

        self.broadcast(_id, msg)
        self.close(_id)

    def save_proj(self, _id):
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
        self.close(_id)

    def get_raw_reads(self, _id):
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

        self.broadcast(_id, '{}: successfully retrieved raw reads'.format(_id))

        self.respond(_id, json.dumps(self.projects_temp[_id].raw_reads, default=self.encode_json, indent=4))
        self.close(_id)

    def infer_samples(self, _id):
        """
        Infers samples from raw reads.
        """
        self.get_raw_reads(_id) # make sure raw reads have been extracted

        # TODO: check data with exception catching
        # TODO: have to check: project exists, have non-empty raw_reads
        self.broadcast(_id, '{}: infering samples from raw reads'.format(_id))

        # function to get new sample ids
        ids = lambda : list(self.samples.keys()) + list(self.samples_temp.keys())
        f = lambda : self.rand_str_except(self.PROJECT_L, ids())

        self.projects_temp[_id].infer_samples(f, temp=self.samples_temp)
        self.broadcast(_id, '{}: samples successfully inferred'.format(_id))

        # output project JSON to temp folder
        self.projects_temp[_id].save(self.TEMP_DIR)
        self.broadcast(_id, '{}: saved to temp folder'.format(_id))

        self.projects_temp[_id].progress = 1

        self.respond(_id, json.dumps(self.projects_temp[_id].samples, default=self.encode_json, indent=4))
        self.close(_id)

    def set_proj(self, _id):
        """
        Sets project params.
        Only to be called after the project has been created.
        """
        if self.projects_temp[_id].progress < 1:
            raise Exception('{}: raw reads have to be retrieved and samples inferred'
                            .format(_id))

        self.broadcast(_id, '{}: setting project data')

        # TODO: what if sample id exists?
        self.projects_temp[_id].load(self.TEMP_DIR)
        self.broadcast(_id, '{}: validating data'.format(_id))
        self.projects_temp[_id].check()

        self.projects_temp[_id].progress = 2

        msg = '{}: project data successfully set'.format(_id)
        self.broadcast(_id, msg)
        self.close(_id)


    def finalize_proj(self, _id):
        """
        Finalizes project and samples by creating appropriate json and
        sample directories
        """
        if self.projects_temp[_id].progress < 2:
            raise Exception('{}: project data must be set and validated at least once'
                            .format(_id))

        self.broadcast(_id, '{}: finalizing'.format(_id))

        # make directories
        self.broadcast(_id, '{}: making directories for read alignment'.format(_id))
        for sample in self.projects_temp[_id].samples:
            f = './{}/{}/{}/{}'.format(self.PROJECTS_DIR, _id, self.ALIGN_DIR, sample)
            os.makedirs(f, exist_ok=True)
            self.broadcast(_id, '{}: {} created'.format(_id, f))

        # remove temporary files
        f = './{}/{}/{}/{}.json'.format(self.PROJECTS_DIR, _id, self.TEMP_DIR, _id)
        if os.path.isfile(f):
            os.remove(f)
            self.broadcast(_id, '{}: {} removed'.format(_id, f))

        # convert temporary project to permanent project
        self.projects[_id] = AlaskaProject(_id)
        self.projects[_id].load()
        del self.projects_temp[_id]

        # add samples to dictionary
        # IMPORTANT: ASSUMING THERE IS NO OVERLAP
        self.samples = {**self.samples, **self.projects[_id].samples}

        self.projects[_id].progress = 3
        self.projects[_id].save()

        msg = '{}: successfully finalized'.format(_id)
        self.broadcast(_id, msg)
        self.close(_id)

    def read_quant(self, _id):
        """
        Checks if another analysis is running,
        then performs read quantification.
        """
        if self.projects[_id].progress < 3:
            raise Exception('{}: project must be finalized before alignment'
                            .format(_id))

        # check if another analysis is running
        # TODO: make separate function to add/run queue process?
        read_quant = lambda : self.read_quant_thread(_id)
        self.queue.put(read_quant)
        self.broadcast(_id, '{}: added to queue (size: {})'.format(_id, self.queue.qsize()))

    def read_quant_thread(self, _id):
        """
        Read quantification process
        """
        self.broadcast(_id, '{}: beginning alignment sequence'.format(_id))
        self.projects[_id].progress = 4 # alignment in progress


        self.projects[_id].write_kallisto()
        self.broadcast(_id, '{}: wrote alignment script'.format(_id))

        self.out('{}: {}'.format(_id, self.DOCKER.images.list()))

        # TODO: error when docker image doesn't exist

        # source and target mounting points
        src_proj = os.path.abspath(self.projects[_id].dir)
        tgt_proj = '/projects/{}'.format(_id)
        src_idx = os.path.abspath(self.IDX_DIR)
        tgt_idx = '/{}'.format(self.IDX_DIR)
        # volumes to mount to container
        volumes = {
            src_proj: {'bind': tgt_proj, 'mode': 'rw'},
            src_idx: {'bind': tgt_idx, 'mode': 'ro'}
        }

        self.broadcast(_id, '{}: starting docker container with {} core allocation'.format(_id, self.CPUS))
        cont = self.DOCKER.containers.run('kallisto:latest',
                                'bash {}/kallisto.sh'.format(tgt_proj),
                                volumes=volumes,
                                cpuset_cpus=self.CPUS,
                                detach=True)
        self.broadcast(_id, '{}: container started with id {}'.format(_id, cont.short_id))

        # TODO: use worker to fetch output

        for l in cont.attach(stream=True):
            l = l.decode(self.ENCODING).strip()

            # since kallisto output can be multiple lines
            if '\n' in l:
                outs = l.split('\n')
            else:
                outs = [l]

            for out in outs:
                self.broadcast(_id, '{}: Kallisto: {}'.format(_id, out))

        self.projects[_id].progress = 5 # alignment finished
        self.broadcast(_id, '{}: alignment successful'.format(_id))
        self.close(_id)

    def diff_exp(self, _id):
        """
        Perform differential expression analysis.
        """
        if self.projects[_id].progress < 5:
            raise Exception('{}: project must be aligned before differential expression analysis'
                            .format(_id))

        diff_exp = lambda : self.diff_exp_thread(_id)
        self.queue.put(diff_exp)
        self.broadcast(_id, '{}: added to queue (size: {})'.format(_id, self.queue.qsize()))


    def diff_exp_thread(self, _id):
        """
        Diff. exp. process
        """
        self.broadcast(_id, '{}: beginning diff. exp. sequence'.format(_id))
        self.projects[_id].write_matrix()
        self.broadcast(_id, '{}: wrote sleuth design matrix'.format(_id))
        self.projects[_id].write_sleuth()
        self.broadcast(_id, '{}: wrote sleuth script'.format(_id))

        self.out('{}: {}'.format(_id, self.DOCKER.images.list()))

        # TODO: error when docker image doesn't exist

        # source and target mouting points
        src_proj = os.path.abspath(self.projects[_id].dir)
        tgt_proj = '/projects/{}'.format(_id)
        # volumes to mount to container
        volumes = {
            src_proj: {'bind': tgt_proj, 'mode': 'rw'},
        }

        self.broadcast(_id, '{}: starting docker container with {} core allocation'.format(_id, self.CPUS))
        cont = self.DOCKER.containers.run('sleuth:latest',
                                'bash {}/sleuth.sh'.format(tgt_proj),
                                volumes=volumes,
                                cpuset_cpus=self.CPUS,
                                detach=True)
        self.broadcast(_id, '{}: container started with id {}'.format(_id, cont.short_id))

        for l in cont.attach(stream=True):
            l = l.decode(self.ENCODING).strip()

            # since kallisto output can be multiple lines
            if '\n' in l:
                outs = l.split('\n')
            else:
                outs = [l]

            for out in outs:
                self.broadcast(_id, '{}: Sleuth: {}'.format(_id, out))

        self.close(_id)


    def save(self):
        """
        Saves its current state.
        """
        datetime = dt.datetime.now().strftime('%Y-%m-%d %H:%M:%S')

        with open('{}.json'.format(datetime), 'w') as f:
            json.dump(self.__dict__, f, indent=4)

    def load(self):
        """
        Loads state from JSON.
        """
        # TODO: get list of jsons and load most recent
        with open('{}{}.json'.format(self.path, self.id), 'r') as f:
            loaded = json.load(f)
        self.__dict__ = loaded

if __name__ == '__main__':
    try:
        server = AlaskaServer()
        server.start()
    except KeyboardInterrupt:
        print('\nINFO: interrupt received, stopping...')
    finally:
        server.stop()
