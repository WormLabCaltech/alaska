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
        # must be valid code
        if request[2] in self.CODES:
            self.CODES[request[2]](request[0])
        else:
            self.out('ERROR: code {} was not recognized'.format(request[2]))

    def respond(self, to, msg):
        """
        Respond to given REQ with message.
        """
        response = [to, b'', msg.encode()]
        self.out('RESPONSE: {}'.format(response))
        self.SOCKET.send_multipart(response)

    def new_project(self, to):
        """
        Creates a new project.
        """
        if not to.startswith(b'_'): # ensure id starts with underscore
            self.out('ERROR: first frame in new_project request does not start with _')

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

        # send response with new id
        self.respond(to, 'AlaskaProject created with ID {}'.format(_id))


    def load_project(self, id):
        """
        Loads project.
        """
        # TODO: implement

    def save_project(self, id):
        """
        Saves project to JSON.
        """
        # TODO: implement

    def get_raw_reads(self, id):
        """
        Retrieves list of uploaded sample files.
        """
        # TODO: implmement on 8/21

    def set_proj_metadata(self, id, data):
        """
        Sets project metadata.
        """
        # TODO: implement
        # TODO: pass as argument from AlaskaRequest or read a JSON??

    def set_sample_metadata(self, id, data):
        """
        Sets sample metadata.
        """
        # TODO: implement
        # TODO: pass as argument from AlaskaRequest or read a JSON??

    def read_quant(self, id):
        """
        Checks if another analysis is running,
        then performs read quantification.
        """
        # TODO: implement

    def diff_exp(self, id):
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

if __name__ == '__main__':
    server = AlaskaServer()
    server.start()
