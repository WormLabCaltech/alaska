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

import zmq
import time
import queue
import datetime as dt

class AlaskaServer():
    """
    AlaskaServer
    """
    VERSION = 'dev'

    def __init__(self, port=8888):
        """
        AlaskaServer constructor. Starts the server at the given port.
        """
        self.date = dt.datetime.now().strftime('%Y-%m-%d')
        self.time = dt.datetime.now().strftime('%H:%M:%S')

        self.indices = []
        self.projects = []
        self.samples = []
        self.queue = queue.Queue()
        self.current_proj = None

        # set up server
        self.PORT = port
        self.CONTEXT = zmq.Context()
        self.SOCKET = context.socket(zmq.ROUTER)
        self.SOCKET.bind('tcp://*:{}'.format(port))

    def start(self):
        """
        Starts the server.
        """
        # make log file
        self.log = open('{}-{}.log'.format(self.date, self.time))

        self.out('Starting AlaskaServer {}'.format(VERSION))
        self.RUNNING = True
        while self.RUNNING:
            msg = self.SOCKET.recv_multipart()
            # TODO: use message decoder

        self.stop()

    def stop(self):
        """
        Stops the server.
        """
        # TODO: implement

        self.log.close()

    def decode(self, msg):
        """
        Method to decode messages received from AlaskaRequest.
        """
        # TODO: implement

    def new_project(self):
        """
        Creates a new project.
        """
        # TODO: implement
        # TODO: how to set new project ID?

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
        # TODO: implmement

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
        self.log.write(line + '\n')

    def save(self):
        """
        Saves its current state.
        """
