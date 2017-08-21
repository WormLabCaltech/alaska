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

        self.indices = []
        self.projects = {}
        self.samples = []
        self.queue = queue.Queue()
        self.current_proj = None

        # set up server
        self.PORT = port
        self.CONTEXT = zmq.Context()
        self.SOCKET = self.CONTEXT.socket(zmq.ROUTER)
        self.SOCKET.bind('tcp://*:{}'.format(port))

        self.CODES = {
            b'\x01': self.new_project,
            b'\x02': self.load_project,
            b'\x03': self.save_project,
            b'\x04': self.get_raw_reads,
            b'\x05': self.set_proj_metadata,
            b'\x06': self.set_sample_metadata,
            b'\x07': self.read_quant,
            b'\x08': self.diff_exp
        }

        # switch working directory to root
        os.chdir(self.ROOT_DIR)

    def start(self):
        """
        Starts the server.
        """
        # make log file
        # self.log = open('{}-{}.log'.format(self.date, self.time))

        self.out('Starting AlaskaServer {}'.format(self.VERSION))
        self.RUNNING = True
        while self.RUNNING:
            request = self.SOCKET.recv_multipart()

            self.decode(request)

        self.stop()

    def stop(self):
        """
        Stops the server.
        """
        # TODO: implement

        self.log.close()

    def decode(self, request):
        """
        Method to decode messages received from AlaskaRequest.
        """
        self.out('RECEIVED: {}'.format(request))
        # must be valid codet
        if request[2] in self.CODES:
            response = self.CODES[request[2]](request[0].decode(self.ENCODING))
        else:
            self.out('ERROR: code {} was not recognized'.format(request[2]))

        self.respond(request[0], response)

    def respond(self, to, msg):
        """
        Respond to given REQ with message.
        """
        if isinstance(msg, str):
            msg = msg.encode()

        response = [to, b'', msg]
        self.out('RESPONSE: {}'.format(response))
        self.SOCKET.send_multipart(response)

    def new_project(self, _id):
        """
        Creates a new project.
        """
        # TODO: check if _id starts with underscore

        self.out('ACTION: creating new AlaskaProject')
        _id = self.rand_str_except(self.PROJECT_L, self.projects.keys())
        self.projects[_id] = AlaskaProject(_id)
        self.out('ACTION: AlaskaProject {} created'.format(_id))

        # make directories
        f = './{}/{}/{}'.format(self.PROJECTS_DIR, _id, self.RAW_DIR)
        os.makedirs(f)
        self.out('ACTION: {} created'.format(f))
        f = './{}/{}/{}'.format(self.PROJECTS_DIR, _id, self.ALIGN_DIR)
        os.makedirs(f)
        self.out('ACTION: {} created'.format(f))
        f = './{}/{}/{}'.format(self.PROJECTS_DIR, _id, self.DIFF_DIR)
        os.makedirs(f)
        self.out('ACTION: {} created'.format(f))

        return 'AlaskaProject created with ID {}'.format(_id)


    def load_project(self, _id):
        """
        Loads project.
        """
        # TODO: change checking to catching exceptions
        self.out('ACTION: loading Alaskaproject {}'.format(_id))

        # check if given project id is already loaded
        if _id in self.projects:
            msg = 'Alaskaproject {} already exists and is loaded'.format(_id)
            self.out('ERROR: {}'.format(msg))
            return msg

        # check if directory exists
        path = './{}/{}/'.format(self.PROJECTS_DIR, _id)
        if not os.path.exists(path) and os.path.isdir(path):
            msg = 'Alaskaproject {} could not be found'.format(_id)
            self.out('ERROR: {}'.format(msg))
            return msg

        # if project is not loaded but exists, load it
        self.projects[_id] = AlaskaProject(_id)
        self.projects[_id].load()

        msg = 'AlaskaProject {} successfully loaded'.format(_id)
        self.out('ACTION: {}'.format(msg))

        return msg


    def save_project(self, _id):
        """
        Saves project to JSON.
        """
        # TODO: change checking to catching exceptions
        self.out('ACTION: saving AlaskaProject {}'.format(_id))

        # check if it exists
        if _id not in self.projects:
            msg = 'AlaskaProject {} does not exist'.format(_id)
            self.out('ERROR: {}'.format(msg))
            return msg

        # if project exists, save it
        self.projects[_id].save()

        msg = 'AlaskaProject {} saved'.format(_id)
        self.out('ACTION: {}'.format(msg))

        return msg

    def get_raw_reads(self, _id):
        """
        Retrieves list of uploaded sample files.
        """
        # TODO: change checking to catching exceptions
        self.out('ACTION: getting raw reads for AlaskaProject {}'.format(_id))

        # check if it exists
        if _id not in self.projects:
            msg = 'AlaskaProject {} does not exist'.format(_id)
            self.out('ERROR: {}'.format(msg))
            return msg

        # TODO: figure out way to output meaningful error when no read file is
        #       uploaded
        # if project exists, check if raw reads have already been calculated
        if len(self.projects[_id].raw_reads) == 0:
            self.out('ACTION: extracting raw reads for AlaskaProject {}'.format(_id))
            self.projects[_id].get_raw_reads()
        self.out('ACTION: retrieved raw reads for AlaskaProject {}'.format(_id))

        return json.dumps(self.projects[_id].raw_reads)


    def set_proj_metadata(self, _id, data):
        """
        Sets project metadata.
        """
        # TODO: implement
        # TODO: pass as argument from AlaskaRequest or read a JSON??

    def set_sample_metadata(self, _id, data):
        """
        Sets sample metadata.
        """
        # TODO: implement
        # TODO: pass as argument from AlaskaRequest or read a JSON??

    def read_quant(self, _id):
        """
        Checks if another analysis is running,
        then performs read quantification.
        """
        # TODO: implement

    def diff_exp(self, _id):
        """
        Perform differential expression analysis.
        """
        # TODO: implement

    def out(self, out):
        """
        Prints message to terminal and log with appropriate prefix.
        """
        datetime = dt.datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        prefix = '[{}]'.format(datetime)
        # TODO: implement
        line = '{} {}'.format(prefix, out)
        print(line)
        # self.log.write(line + '\n')

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
    server.start()
