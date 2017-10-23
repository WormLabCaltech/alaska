"""
Alaska.py

Author: Joseph Min (kmin@caltech.edu)

This file contains the class Alaska, which is inherited by all Alaska scripts.
"""
import os
import random
import datetime as dt

class Alaska():
    """
    Alaska.
    This class contains all variables that are shared among Alaska scripts.
    Including: directory structure, etc.
    """
    VERSION = 'dev' # alaska version
    ENCODING = 'utf-8' # encoding for decoding byte literals
    HOST_DIR = '/media/sf_Github/alaska/src/root'   # root dir on host machine
                                                    # this is required because spawning host container from host container
                                                    # needs to have host's absolute path
    ROOT_DIR = '../root' # root dir in docker image
    SAVE_DIR = 'saves' # folder to save server states
    # IMG_DIR = 'images'
    SCRIPT_DIR = 'scripts' # scripts directory
    JOBS_DIR = 'jobs' # jobs directory
    TRANS_DIR = 'transcripts' # transcripts directory
    IDX_DIR = 'idx' # index directory name
    LOG_DIR = 'logs' # log directory name
    TEMP_DIR = '_temp' # temporary files directory
    PROJECTS_DIR = 'projects' # project directory name
    PROJECT_L = 6 # length of project ids
    RAW_DIR = '0_raw_reads' # raw reads directory name
    RAW_EXT = ('.fastq.gz', '.fastq') # extensions for raw reads (needs to be tuple)
    ALIGN_DIR = '1_alignment' # alignment directory name
    DIFF_DIR = '2_diff_exp' # differential expression directory name
    CPUS = '1-3' # processing CPUs
    THREADS = 3 # number of threads for processing
    KAL_VERSION = 'kallisto:latest' # kallisto image version to use
    SLE_VERSION = 'sleuth:latest' # sleuth image version to use

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

    def out(self, out, override=False):
        """
        Prints message to terminal and log with appropriate prefix.
        """
        datetime = dt.datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        prefix = '[{}]'.format(datetime)

        line = '{} {}'.format(prefix, out)

        # shorten output if too long
        if override:
            print(line)
        else:
            if len(out) > 90:
                out = '{}...'.format(out[:90])
            line_short = '{} {}'.format(prefix, out)
            print(line_short)

        return line

    def encode_json(self, obj):
        """
        Encodes current object to JSON.
        """
        try:
            dic = obj.__dict__
            return dic
        except:
            self.out('ERROR: could not serialize {}'.format(type(obj)))

    def save(self):
        """
        Saves object state to JSON.
        """
        pass
