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
import datetime as dt
from Alaska import Alaska
from AlaskaProject import AlaskaProject
from BashWriter import BashWriter

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
        self.queue = queue.Queue()
        self.current_proj = None # project undergoing analysis

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

        # switch working directory to root
        os.chdir(self.ROOT_DIR)

    def start(self, _id=None):
        """
        Starts the server.
        """
        # make log file
        # self.log = open('{}-{}.log'.format(self.date, self.time))

        self.out('Starting AlaskaServer {}'.format(self.VERSION))
        self.RUNNING = True
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
        self.log.close()
        self.CONTEXT.term()
        self.RUNNING = False

    def decode(self, request):
        """
        Method to decode messages received from AlaskaRequest.
        """
        # TODO: remove return statements from functions
        # TODO: instead, send messages directly
        self.out('{}: received {}'.format(request[0], request[1]))
        # must be valid codet
        if request[1] in self.CODES:
            self.CODES[request[1]](request[0].decode(self.ENCODING))
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
        else:
            self.out('INFO: indices up to date. no update required')


    def new_proj(self, _id):
        """
        Creates a new project.
        """
        # TODO: check if _id starts with underscore

        self.broadcast(_id, '{}: creating new AlaskaProject'.format(_id))
        __id = self.rand_str_except(self.PROJECT_L, self.projects.keys())
        __id = 'AP{}'.format(__id)
        self.projects[__id] = AlaskaProject(__id)
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
        if _id in self.projects:
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
        self.projects[_id] = AlaskaProject(_id)
        self.projects[_id].load()

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
        self.projects[_id].save()

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
        if len(self.projects[_id].raw_reads) == 0:
            self.projects[_id].get_raw_reads()

        self.broadcast(_id, '{}: successfully retrieved raw reads'.format(_id))

        self.respond(_id, json.dumps(self.projects[_id].raw_reads, default=self.encode_json, indent=4))
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
        f = lambda : self.rand_str_except(self.PROJECT_L, self.samples.keys())

        self.projects[_id].infer_samples(f)
        self.broadcast(_id, '{}: samples successfully inferred'.format(_id))

        # output project JSON to temp folder
        self.projects[_id].save(self.TEMP_DIR)
        self.broadcast(_id, '{}: saved to temp folder'.format(_id))

        self.respond(_id, json.dumps(self.projects[_id].samples, default=self.encode_json, indent=4))
        self.close(_id)

    def set_proj(self, _id):
        """
        Sets project params.
        Only to be called after the project has been created.
        """
        self.broadcast(_id, '{}: setting project data')

        # TODO: what if sample id exists?
        self.projects[_id].load(self.TEMP_DIR)
        # add samples to dictionary
        # IMPORTANT: ASSUMING THERE IS NO OVERLAP
        self.samples = {**self.samples, **self.projects[_id].samples}

        msg = '{}: project data successfully set'.format(_id)
        self.broadcast(_id, msg)
        self.close(_id)


    def finalize_proj(self, _id):
        """
        Finalizes project and samples by creating appropriate json and
        sample directories
        """
        self.broadcast(_id, '{}: finalizing'.format(_id))
        self.broadcast(_id, '{}: checking samples'.format(_id))
        self.projects[_id].check()

        self.broadcast(_id, '{}: saving'.format(_id))
        self.projects[_id].save()

        # make directories
        self.broadcast(_id, '{}: making directories for read alignment'.format(_id))
        for sample in self.projects[_id].samples:
            f = './{}/{}/{}/{}'.format(self.PROJECTS_DIR, _id, self.ALIGN_DIR, sample)
            os.makedirs(f, exist_ok=True)
            self.broadcast(_id, '{}: {} created'.format(_id, f))

        # remove temporary files
        f = './{}/{}/{}/{}.json'.format(self.PROJECTS_DIR, _id, self.TEMP_DIR, _id)
        if os.path.isfile(f):
            os.remove(f)
            self.broadcast(_id, '{}: {} removed'.format(_id, f))

        msg = '{}: successfully finalized'.format(_id)
        self.broadcast(_id, msg)
        self.close(_id)

    def read_quant(self, _id):
        """
        Checks if another analysis is running,
        then performs read quantification.
        """
        # TODO: implement
        self.broadcast(_id, '{}: beginning alignment sequence'.format(_id))

        self.projects[_id].read_quant()
        self.broadcast(_id, '{}: wrote alignment script'.format(_id))

        self.close(_id)

    def diff_exp(self, _id):
        """
        Perform differential expression analysis.
        """
        # TODO: implement

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
    server = AlaskaServer()
    server.update_idx()
    server.start()
