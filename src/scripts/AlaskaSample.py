"""
AlaskaSample.py

Author: Joseph Min (kmin@caltech.edu)

This file contains the class AlaskaSample, which contains all sample metadata.
Managed by AlaskaProject.
"""
from Alaska import Alaska
import datetime as dt

class AlaskaSample(Alaska):
    """
    AlaskaSample. Class to wrap all sample data.
    """

    def __init__(self, _id):
        """
        AlaskaSample constructor. Must receive id.
        """
        self.id = _id
        self.type = 1 # 1: single-end, 2: pair-end
        self.length = 0 # used for single-end
        self.stdev = 0 # used for single-end
        self.reads = [] # list of paths if single-end
                        # list of lsit of paths, if pair-end

        self.meta = {} # variable for all metadata
        self.meta['name'] = ''
        self.meta['genotype'] = ''
        self.meta['date created'] = dt.datetime.now().strftime('%Y-%m-%d')
        self.meta['time created'] = dt.datetime.now().strftime('%H:%M:%S')

    def reset(self):
        """
        Resets sample by calling constructor.
        """
        self.__init__()

    def set_metadata(self):
        """
        Sets sample metadata by reading JSON.
        """
        with open('{}/meta.json'.format(self.dir), 'r') as f:
            loaded = json.load(f)
        for key, item in loaded.items():
            self.meta[key] = item


    def save(self):
        """
        Save sample to JSON.
        """
        path = '{}/{}'.format(self.dir, self.RAW_DIR)
        with open('{}/{}.json'.format(path, self.id), 'w') as f:
            json.dump(self.__dict__, f, default=self.encode_json, indent=4)

    def load(self):
        """
        Load sample from JSON.
        """
        pass