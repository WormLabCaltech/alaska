"""Contains the Alaska class.

The Alaska class is inherited by all AlaskaX classes. The class contains
all shared variables among the Alaska family.
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
    DATETIME_FORMAT = '%Y-%m-%d %H:%M:%S'
    # HOST_DIR = None     # root dir on host machine
    #                     # this is required because spawning host container from host container
    #                     # needs to have host's absolute path
    ROOT_DIR = 'root' # root dir
    ROOT_PATH = '/alaska/{}'.format(ROOT_DIR)
    SAVE_DIR = 'saves' # folder to save server states
    SAVE_MAX = 20   # maximum number of saves to keep
    # IMG_DIR = 'images'
    SCRIPT_DIR = '../scripts' # scripts directory
    IDX_SCRIPT = 'build_index.py'
    ANL_SCRIPT = 'run_analysis.py'
    SLE_SCRIPT = 'sleuth.R'
    SHI_SCRIPT = 'open_sleuth_server.R'
    SHI_PORTS = list(range(40000, 45000))
    JOBS_DIR = 'jobs' # jobs directory
    ORGS_DIR = 'organisms'
    REF_DIR = 'reference'
    TRANS_DIR = 'reference/fasta' # transcripts directory
    BED_DIR = 'reference/bed'
    IDX_DIR = 'index' # index directory name
    LOG_DIR = 'logs' # log directory name
    TEMP_DIR = '_temp' # temporary files directory
    PROJECTS_DIR = 'projects' # project directory name
    PROJECT_L = 6 # length of project ids
    FTP_PW_L = 10 # length of ftp password
    FTP_SIZE_LIMIT = 20000 # limit to transfer size (in MB)
    FTP_COUNT_LIMIT = 1000 # limit to number of files
    RAW_DIR = '0_raw_reads' # raw reads directory name
    RAW_EXT = ('.fastq.gz', '.fastq') # extensions for raw reads (needs to be tuple)
    # archives that patool can unpack
    # patool supports 7z (.7z, .cb7), ACE (.ace, .cba), ADF (.adf), ALZIP (.alz),
    # APE (.ape), AR (.a), ARC (.arc), ARJ (.arj), BZIP2 (.bz2), CAB (.cab),
    # COMPRESS (.Z), CPIO (.cpio), DEB (.deb), DMS (.dms), FLAC (.flac),
    # GZIP (.gz), ISO (.iso), LRZIP (.lrz), LZH (.lha, .lzh), LZIP (.lz),
    # LZMA (.lzma), LZOP (.lzo), RPM (.rpm), RAR (.rar, .cbr), RZIP (.rz),
    # SHN (.shn), TAR (.tar, .cbt), XZ (.xz), ZIP (.zip, .jar, .cbz)
    # and ZOO (.zoo) archive formats.
    # It relies on helper applications to handle those archive formats
    # (for example bzip2 for BZIP2 archives).
    ARCH_EXT = ('.7z', '.cb7', '.ace', '.cba', '.adf', '.alz', '.ape',
                '.a', '.arc', '.arj', '.bz2', '.cab', '.Z', '.cpio', '.deb',
                '.dms', '.flac', '.gz', '.iso', '.lrz', '.lha', '.lzh', '.lz',
                '.lzma', '.lzo', '.rpm', '.rar', '.cbr', '.rz', '.shn', '.tar',
                '.cbt', '.xz', '.zip', '.jar', '.cbz', '.zoo')
    QC_DIR = '1_qc' # quality control directory name
    ALIGN_DIR = '2_alignment' # alignment directory name
    DIFF_DIR = '3_diff_exp' # differential expression directory name
    CPUS = '1-3' # processing CPUs
    NTHREADS = 3 # number of threads for processing
    DOCKER_SCRIPT_VOLUME = 'alaska_script_volume'
    DOCKER_DATA_VOLUME = 'alaska_data_volume'
    DOCKER_QC_TAG = 'alaska_qc:latest'
    DOCKER_KALLISTO_TAG = 'alaska_kallisto:latest' # kallisto image version to use
    DOCKER_SLEUTH_TAG = 'alaska_sleuth:latest' # sleuth image version to use
    DOCKER_FTP_TAG = 'ftpd_server'

    TEST_RAW_READS_MINIMUM = ['test_samples/raw/minimum/mt1',
                            'test_samples/raw/minimum/mt2',
                            'test_samples/raw/minimum/wt1',
                            'test_samples/raw/minimum/wt2']

    TEST_RAW_READS_FULL = ['test_samples/raw/full/mt1',
                            'test_samples/raw/full/wt1'
                            ]


    # messeging codes
    CODES = {
        'check':                b'\x00', # empty request for pinging server
        'new_proj':             b'\x01', # create new project
        'load_proj':            b'\x02', # load project from JSON
        'save_proj':            b'\x03', # save project to JSON
        'fetch_reads':          b'\x04',
        'infer_samples':        b'\x05', # extract raw reads and infer samples
        # 'get_idx':              b'\x05', # get list of avaliable indices
        # 'new_sample':           b'\x06', # create new sample with unique id
        'get_organisms':        b'\x06',
        'set_proj':             b'\x07', # set project data by reading temporary JSON
        'finalize_proj':        b'\x08', # finalize project
        'qc':                   b'\x09',
        'read_quant':           b'\x10', # perform read quantification
        'diff_exp':             b'\x11', # perform differential expression
        'do_all':               b'\x12', # perform qc, read quant, and diff exp
        'open_sleuth_server':   b'\x13',
        'get_proj_status':      b'\x14', # check project status
        'test_copy_reads':      b'\x47',
        'test_set_vars':        b'\x48',
        'test_qc':              b'\x49',
        'test_read_quant':      b'\x50',
        'test_diff_exp':        b'\x51',
        'test_all':             b'\x52',
        'get_queue':            b'\x92',
        'is_online':            b'\x93',
        'save':                 b'\x94', # saves server state
        'load':                 b'\x95', # loads server state
        'log':                  b'\x96', # force log
        'update_orgs':          b'\x97', # force organism update
        'start':                b'\x98', # start server
        'stop':                 b'\x99', # stop server
    }

    # Server state.
    SERVER_STATE = {
        0: 'under maintenance',
        1: 'active',
    }

    # 0: This is a new project.
    # 1: raw reads fetched
    # 2: samples inferred.
    # 3: project set.
    # 4: project finalized.
    # 5: QC added to queue
    # 6: QC started
    # 7: QC finished
    # 8: Alignment added to queue
    # 9: Alignment started
    # 10: Alignment finished
    # 11: Diff exp added to queue
    # 12: Diff exp started
    # 13: Diff exp finished.
    # 14: Server opened



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

    def __repr__(self):
        """
        String representation of this object.
        """
        return str(self.__dict__)
