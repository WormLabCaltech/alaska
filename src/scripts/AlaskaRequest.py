"""
AlaskaRequest.py

Author: Joseph Min (kmin@caltech.edu)

This script is to be called exclusively from the web portal (via HTML/PHP request).
Bridge between browser and server.
"""

import zmq

class AlaskaRequest():
    """
    AlaskaRequest
    """
    VERSION = 'dev'

    def __init__(self, port=8888):
        """
        AlaskaRequest constructor. Connects to given port.
        """
        self.id = ''

        # connect to server
        self.CONTEXT = zmq.Context()
        self.SOCKET = self.CONTEXT.socket(zmq.REQ)
        self.SOCKET.connect('tcp://localhost:{}'.format(port))
        # TODO: how to set new project ID?

    def new_project(self):
        """
        Sends request to AlaskaServer to create a new project.
        """
        # TODO: implement

    def load_project(self, id):
        """
        Sends request to AlaskaServer to load a project.
        """
        # TODO: implement

    def save_project(self, id):
        """
        Sends request to AlaskaServer to save project to JSON.
        """
        # TODO: implement

    def get_raw_reads(self, id):
        """
        Sends request to AlaskaServer to retrieve list of uploaded samples.
        """
        # TODO: implement

    def set_proj_metadata(self, id):
        """
        Sends request to AlaskaServer to set project metadata.
        """
        # TODO: implement

    def set_sample_metadata(self, id):
        """
        Sends request to AlaskaServer to set sample metadata.
        """
        # TODO: implement

    def read_quant(self, id):
        """
        Sends request to AlaskaServer to perform read quantification.
        """
        # TODO: implement

    def diff_exp(self, id):
        """
        Sends request to AlaskaServer to perform differential expression analysis.
        """
        # TODO: implement
