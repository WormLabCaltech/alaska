"""Contains the AlaskaOrganism class.

Contains all necessary information about a model organism. This class holds
multiple AlaskaReference objects, one for each reference version.
"""

__author__ = 'Kyung Hoi (Joseph) Min'
__copyright__ = 'Copyright 2017 WormLabCaltech'
__credits__ = ['David Angeles', 'Raymond Lee', 'Juancarlos Chan']
__license__ = "MIT"
__version__ = "alpha"
__maintainer__ = "Kyung Hoi (Joseph) Min"
__email__ = "kmin@caltech.edu"
__status__ = "alpha"

import os
import json
from Alaska import Alaska
from AlaskaReference import AlaskaReference


class AlaskaOrganism(Alaska):
    """
    AlaskaOrganism class. Every organism that is supported by Alaska
    has its own AlaskaOrganism object.

    Methods:
    add_new_ref
    save
    load
    """

    def __init__(self, genus, species):
        """
        Constructor.

        Arguments:
        genus   -- (str) genus of organism
        species -- (str) species of organism
        """
        self.genus = genus
        self.species = species
        self.full = '{}_{}'.format(genus, species)
        self.short = '{}_{}'.format(genus[0].lower(), species)
        self.refs = {}
        self.path = '{}/{}/{}'.format(Alaska.ORGS_DIR, genus, species)

    def add_new_ref(self, ver, dna, cdna, bed):
        """
        Adds a new reference object to the dictionary of references.

        Arguments:
        ver  -- (str) reference version
        dna  -- (str) dna file
        cdna -- (str) cdna file
        bed  -- (str) bed file

        Returns: None
        """
        ref = AlaskaReference(ver, dna, cdna, bed)
        self.refs[ver] = ref

    def save(self, folder=None):
        """
        Saves organism data to JSON.

        Arguments:
        folder -- (str) folder to save JSON (default: Alaska.ORGS_DIR)

        Returns: None
        """
        if folder is None:
            path = Alaska.ORGS_DIR
        else:
            path = folder

        out = '{}/jsons/{}.json'.format(path, self.full)
        os.makedirs(os.path.dirname(out), exist_ok=True)
        with open(out, 'w') as f:
            json.dump(self.__dict__, f, default=self.encode_json, indent=4)

    def load(self, folder=None):
        """
        Loads organism from JSON.

        Arguments:
        folder -- (str) folder to load JSON (default: Alaska.ORGS_DIR)

        Returns: None
        """
        if folder is None:
            path = Alaska.ORGS_DIR
        else:
            path = folder

        with open('{}/jsons/{}.json'.format(path, self.full), 'r') as f:
            loaded = json.load(f)

        # load each item now
        for key, item in loaded.items():
            if key == 'refs':
                for ver, obj in item.items():
                    dna = obj['dna']
                    cdna = obj['cdna']
                    bed = obj['bed']
                    kallisto_idx = obj['kallisto_idx']
                    bowtie_idx = obj['bowtie_idx']

                    ref = AlaskaReference(ver, dna, cdna, bed, kallisto_idx,
                                          bowtie_idx)
                    self.refs[ver] = ref
