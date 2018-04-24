"""
AlaskaReference.py

Author: Joseph Min (kmin@caltech.edu)

Contains AlaskaReference class.
AlaskaReference is an object that contains information of each reference genome.
"""

from Alaska import Alaska

class AlaskaReference(Alaska):
    """
    AlaskaReference class.
    """
    def __init__(self, version, dna, cdna, bed, kallisto_idx='', bowtie_idx=[]):
        """
        AlaskaReference constructor.
        See implementation for member variables.
        """
        self.version = version
        self.dna = dna
        self.cdna = cdna
        self.bed = bed
        self.kallisto_idx = kallisto_idx
        self.bowtie_idx = bowtie_idx