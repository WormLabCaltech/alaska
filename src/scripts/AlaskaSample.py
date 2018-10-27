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

        Arguments:
        _id  -- (str) id of this sample
        name -- (str) nickname of this sample

        Returns: None
        """
        self.id = _id
        self.name = name
        self.type = 1       # 1: single-end, 2: pair-end
        self.pairs = []
        self.organism = ''
        self.ref_ver = ''   # kallisto index for this sample
        self.length = 0     # used for single-end
        self.stdev = 0      # used for single-end
        self.bootstrap_n = 100  # number of bootstraps to perform
        self.reads = {}     # keys: folders; values: list of read files
        self.projects = []  # list of projects that refer to this sample

        # METADATA
        self.meta = {}
        self.meta['title'] = ''
        self.meta['contributors'] = []
        self.meta['chars'] = {}
        self.meta['description'] = ''
        self.meta['platform'] = ''
        self.datetime = dt.datetime.now().strftime(Alaska.DATETIME_FORMAT)
