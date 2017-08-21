"""
AlaskaProject.py

Author: Joseph Min (kmin@caltech.edu)

This file contains the class AlaskaProject, which contains all data related
to a project.
Managed by AlaskaServer.
"""
import os
import json
from pyunpack import Archive
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
        self.dir = './{}/{}'.format(self.PROJECTS_DIR, _id)
        self.raw_dir = '{}/{}'.format(self.dir, self.RAW_DIR)
        self.align_dir = '{}/{}'.format(self.dir, self.ALIGN_DIR)
        self.diff_dir = '{}/{}'.format(self.dir, self.DIFF_DIR)
        self.raw_reads = {}
        self.samples = []
        self.design = 1 # 1: single-factor, 2: two-factor
        self.progress = 0

        self.meta = {} # variable for all metadata
        self.meta['name'] = ''
        self.meta['date created'] = dt.datetime.now().strftime('%Y-%m-%d')
        self.meta['time created'] = dt.datetime.now().strftime('%H:%M:%S')


    def get_raw_reads(self):
        """
        Retrieves list of uploaded sample files. Unpacks archive if detected.
        """
        # TODO: implement
        # get list of files/directories in raw reads directory
        flist = os.listdir(self.raw_dir)
        unpack = all(not os.path.isdir(d) for d in flist)

        for fname in flist:
            self.unpack_reads(fname)

        # walk through raw reads directory
        for root, dirs, files in os.walk(self.raw_dir):
            reads = [] # list to contain read files for each directory
            for fname in files:
                # only files ending with certain extensions
                # and not directly located in raw read directory should be added
                if fname.endswith(self.RAW_EXT) and fname not in flist:
                    reads.append(fname)

            # assign list to dictionary
            if not len(reads) == 0:
                self.raw_reads[root.replace(self.raw_dir, '')] = reads


    def unpack_reads(self, fname):
        """
        Unpacks read archive.
        """
        # TODO: implement
        Archive('{}/{}'.format(self.raw_dir, fname)).extractall(self.raw_dir)

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
        with open('{}/{}.json'.format(self.dir, self.id), 'w') as f:
            json.dump(self.__dict__, f, indent=4)

    def load(self):
        """
        Loads project from JSON.
        """
        with open('{}/{}.json'.format(self.dir, self.id), 'r') as f:
            loaded = json.load(f)
        self.__dict__ = loaded