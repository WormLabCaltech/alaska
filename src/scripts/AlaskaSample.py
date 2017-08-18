"""
AlaskaSample.py

Author: Joseph Min (kmin@caltech.edu)

This file contains the class AlaskaSample, which contains all sample metadata.
Managed by AlaskaProject.
"""
from Alaska import Alaska

class AlaskaSample(Alaska):
    """
    AlaskaSample. Class to wrap all sample data.
    """

    def __init__(self, _id):
        """
        AlaskaSample constructor. Must receive id.
        """
        self.id = _id
        self.reads = []

        self.meta = {} # variable for all metadata
        self.meta['name'] = ''
        self.meta['date created'] = dt.datetime.now().strftime('%Y-%m-%d')
        self.meta['time created'] = dt.datetime.now().strftime('%H:%M:%S')

    def set_metadata(self):
        """
        Sets project metadata by reading JSON.
        """
        # TODO: implement

    def save(self):
        """
        Save project to JSON.
        """
        # TODO: implement