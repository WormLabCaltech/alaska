"""Contains the AlaskaSample class.

Contains all information on a given sample. AlaskaProjects hold multiple
AlaskaSample objects, one per sample.
"""

__author__ = 'Kyung Hoi (Joseph) Min'
__copyright__ = 'Copyright 2017 WormLabCaltech'
__credits__ = ['David Angeles', 'Raymond Lee', 'Juancarlos Chan']
__license__ = "MIT"
__version__ = "alpha"
__maintainer__ = "Kyung Hoi (Joseph) Min"
__email__ = "kmin@caltech.edu"
__status__ = "alpha"

from Alaska import Alaska
import datetime as dt

class AlaskaSample(Alaska):
    """
    AlaskaSample. Class to wrap all sample data.
    """

    def __init__(self, _id, name=''):
        """
        AlaskaSample constructor. Must receive id.
        """
        self.id = _id
        self.name = name
        self.type = 1 # 1: single-end, 2: pair-end
        self.pairs = []
        self.organism = ''
        self.ref_ver = '' # kallisto index for this sample
        self.length = 0 # used for single-end
        self.stdev = 0 # used for single-end
        self.bootstrap_n = 100 # number of bootstraps to perform
        self.reads = {} # list of paths if single-end
                        # list of lsit of paths, if pair-end
        self.projects = [] # list of projects that refer to this sample

        self.meta = {} # variable for all metadata
        # from GEO submission template
        self.meta['title'] = ''
        self.meta['contributors'] = []
        self.meta['source'] = ''
        self.meta['chars'] = {} # multiple allowed
        self.meta['description'] = ''
        self.meta['datetime'] = dt.datetime.now().strftime('%Y-%m-%d %H:%M:%S')
