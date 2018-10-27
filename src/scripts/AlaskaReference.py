"""Contains the AlaskaReference class.

The AlaskaReference class contains all necessary information on a model
organism reference version. AlaskaOrganism objects hold multiple
AlaskaReference objects, one for each version.
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


class AlaskaReference(Alaska):
    """
    AlaskaReference class.
    """
    def __init__(self, version, dna, cdna, bed, kallisto_idx='', bowtie_idx=[]):
        """
        AlaskaReference constructor.
        See implementation for member variables.

        Arguments:
        version      -- (str) reference version
        dna          -- (str) dna file
        cdna         -- (str) cdna file
        bed          -- (str) bed file
        kallisto_idx -- (str) kallisto index file
        bowtie_idx   -- (list) of bowtie index files

        Returns: None
        """
        self.version = version
        self.dna = dna
        self.cdna = cdna
        self.bed = bed
        self.kallisto_idx = kallisto_idx
        self.bowtie_idx = bowtie_idx
