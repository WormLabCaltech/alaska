"""
AlaskaSample.py

Author: Joseph Min (kmin@caltech.edu)

This file contains the class AlaskaSample, which contains all sample metadata.
Managed by AlaskaProject.
"""

class AlaskaSample():
    """
    AlaskaSample. Class to wrap all sample data.
    """
    VERSION = 'dev'

    def __init__(self, _id):
        """
        AlaskaSample constructor. Must receive id.
        """
        self.id = _id
        self.name = ''
        self.meta = {} # variable for all metadata
        self.meta['date created'] = dt.datetime.now().strftime('%Y-%m-%d')
        self.meta['time created'] = dt.datetime.now().strftime('%H:%M:%S')
        self.reads = []

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