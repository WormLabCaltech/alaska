"""
AlaskaProject.py

Author: Joseph Min (kmin@caltech.edu)

This file contains the class AlaskaProject, which contains all data related
to a project.
Managed by AlaskaServer.
"""
import os
import datetime as dt
from AlaskaSample import AlaskaSample
from Alaska import Alaska

class AlaskaProject(Alaska):
    """
    AlaskaProject. Class to wrap all project data.
    """

    def __init__(self, _id):
        """
        AlaskaProject constructor. Must receive id.
        """
        self.id = _id
        self.raw_reads = []
        self.samples = []
        self.design = 1 # 1: single-factor, 2: two-factor
        self.progress = 0

        self.meta = {} # variable for all metadata
        self.meta['name'] = ''
        self.meta['date created'] = dt.datetime.now().strftime('%Y-%m-%d')
        self.meta['time created'] = dt.datetime.now().strftime('%H:%M:%S')


    def get_raw_reads(self):
        """
        Retrieves list of uploaded sample files.
        """
        # TODO: implement

    def set_metadata(self):
        """
        Sets project metadata by reading JSON.
        """
        # TODO: implement

    def check_metadata(self):
        """
        Checks metadata for sanity.
        """
        # TODO: implement

    def read_quant(self):
        """
        Performs read quantification.
        """
        # TODO: implement

    def diff_exp(self):
        """
        Performs differential expression analysis.
        """
        # TODO: implement

    def save(self):
        """
        Save project to JSON.
        """
        # TODO: implement