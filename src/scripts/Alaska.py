"""
Alaska.py

Author: Joseph Min (kmin@caltech.edu)

This file contains the class Alaska, which is inherited by all Alaska scripts.
"""
import os
import random

class Alaska():
    """
    Alaska.
    This class contains all variables that are shared among Alaska scripts.
    Including: directory structure, messaging codes, etc.
    """
    VERSION = 'dev'
    ENCODING = 'utf-8'
    ROOT_DIR = '../root' # root directory relative to where scripts are located
    IDX_DIR = 'idx' # index directory name
    LOG_DIR = 'log' # log directory name
    PROJECTS_DIR = 'projects' # project directory name
    PROJECT_L = 6 # length of project ids
    RAW_DIR = '0_raw_reads'# raw reads directory name
    RAW_EXT = ('.fastq.gz') # extensions for raw reads (needs to be tuple)
    ALIGN_DIR = '1_alignment'# alignment directory name
    DIFF_DIR = '2_diff_exp'# differential expression directory name

    def rand_str(self, l):
        """
        Generates a random string with lowercase and numbers.
        """
        chars = 'abcdefghijklmnopqrstuvwxyz'
        nums = '0123456789'
        choices = chars + nums

        rand = ''.join(random.sample(choices, l))
        return rand

    def rand_str_except(self, l, array):
        """
        Generates a random string with lowercase and numbers that is not in the
        given array.
        """
        while True:
            rand = self.rand_str(l)
            if rand not in array:
                return rand

        return False

    def save(self):
        """
        Saves object state to JSON.
        """
        pass
