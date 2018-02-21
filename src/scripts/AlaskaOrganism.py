"""
AlaskaOrganism.py

Author: Joseph Min (kmin@caltech.edu)

Contains AlaskaOrganism class.
AlaskaOrganism is an object that contains information of each organism.
(Including all available reference sequences.)
"""

import json
from Alaska import Alaska
from AlaskaReference import AlaskaReference

class AlaskaOrganism(Alaska):
    """
    AlaskaOrganism class.
    """

    def __init__(self, genus, species):
        """
        AlaskaOrganism constructor.
        See implementation for member variables.
        """
        self.genus = genus
        self.species = species
        self.short = '{}_{}'.format(genus[0].lower(), species)
        self.refs = {}
        self.path = '{}/{}/{}'.format(self.ORGS_DIR, genus, species)

    def add_new_ref(self, version, cds, bed):
        """
        Adds a new reference object to the list of references.
        """
        ref = AlaskaReference(version, cds, bed)
        self.refs[ref] = ref

    def save(self, folder=None):
        """
        Saves organism data to JSON.
        """
        if folder is None:
            path = self.path
        else:
            path = folder

        with open('{}/{}.json'.format(path, self.short), 'w') as f:
            json.dump(self.__dict__, f, default=self.encode_json, indent=4)

    def load(self, folder=None):
        """
        Loads organism from JSON.
        """
        if folder is None:
            path = self.path
        else:
            path = folder

        with open('{}/{}.json'.format(path, self.short), 'r') as f:
            loaded = json.load(f)

        # load each item now
        for key, item in loaded.items():
            if key == 'refs':
                for ver, obj in item.items():
                    cds = obj['cds']
                    bed = obj['bed']
                    kallisto_idx = obj['kallisto_idx']
                    bowtie_idx = obj['bowtie_idx']

                    ref = AlaskaReference(ver, cds, bed, kallisto_idx, bowtie_idx)
                    self.refs[ver] = ref