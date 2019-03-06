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

    Methods:
    rand_str
    rand_Str_except
    out
    encode_json
    __repr__
    """
    VERSION = 'dev'             # alaska version
    ENCODING = 'utf-8'          # encoding for decoding byte literals
    DATETIME_FORMAT = '%Y-%m-%d %H:%M:%S'   # datetime format

    # DIRECTORY VARIABLES
    ROOT_DIR = 'root'               # root foldername (where all data is stored)
    ROOT_PATH = '/alaska/{}'.format(ROOT_DIR)  # path to root foldername
    TRASH_DIR = 'trash'             # trash foldername
    SAVE_DIR = 'saves'              # server save foldername
    SCRIPT_DIR = '../scripts'       # scripts foldername
    JOBS_DIR = 'jobs'               # jobs foldername
    ORGS_DIR = 'organisms'          # organisms foldername
    REF_DIR = 'reference'           # reference foldername
    IDX_DIR = 'index'               # index foldername
    LOG_DIR = 'logs'                # log foldername
    PROJECTS_DIR = 'projects'       # project foldername
    # These folders are for each project.
    RAW_DIR = '0_raw_reads'         # raw reads foldername
    TEMP_DIR = '_temp'              # temporary foldername
    QC_DIR = '1_qc'                 # quality control foldername
    ALIGN_DIR = '2_alignment'       # alignment foldername
    DIFF_DIR = '3_diff_exp'         # differential expression foldername
    GEO_DIR = 'NEW_SUBMISSIONS'     # Folder on GEO FTP where submissions
                                    # are to be uploaded.

    # SCRIPT NAMES
    IDX_SCRIPT = 'build_index.py'
    ANL_SCRIPT = 'run_analysis.py'
    SLE_SCRIPT = 'sleuth.R'
    SHI_SCRIPT = 'open_sleuth_server.R'

    # NUMBER VARIABLES
    SAVE_MAX = 20               # maximum number of saves to keep
    SHI_DURATION = 1            # how long sleuth servers should be kept open
                                # in days
    SHI_PORTS = list(range(40000, 45000))  # Ports to choose from
    LOG_MAX = 200               # maximum number of logs to keep
    PROJECT_L = 6               # length of random string for project ids
    FTP_PW_L = 10               # length of ftp password
    FTP_SIZE_LIMIT = 20000      # ftp limit to transfer size (in MB)
    FTP_COUNT_LIMIT = 1000      # ftp limit to number of files
    RAW_NOTIFY = 3              # notify when there are 3 days left
    RAW_NOTIFY_2 = 1            # notify when there is 1 day left
    RAW_DURATION = 10           # keep reads for a max 10 days
    CPUS = '1-3'                # processing CPUs (for Docker)
    NTHREADS = 1                # number of threads for processing
    NTHREADS = 3                # number of threads for processing

    # VARIABLES FOR FURTHER ANALYSES
    ENRICHMENT_ORGS = [('caenorhabditis', 'elegans')]
    EPISTASIS_FACTOR_NUM = 2

    # SUPPORTED EXTENSIONS
    RAW_EXT = ('.fastq.gz', '.fastq')  # supported raw read extensions
    # patool supports 7z (.7z, .cb7), ACE (.ace, .cba), ADF (.adf),
    # ALZIP (.alz), APE (.ape), AR (.a), ARC (.arc), ARJ (.arj), BZIP2 (.bz2),
    # CAB (.cab), COMPRESS (.Z), CPIO (.cpio), DEB (.deb), DMS (.dms),
    # FLAC (.flac), GZIP (.gz), ISO (.iso), LRZIP (.lrz), LZH (.lha, .lzh),
    # LZIP (.lz), LZMA (.lzma), LZOP (.lzo), RPM (.rpm), RAR (.rar, .cbr),
    # RZIP (.rz), SHN (.shn), TAR (.tar, .cbt), XZ (.xz), ZIP (.zip, .jar, .cbz)
    # and ZOO (.zoo) archive formats.
    # It relies on helper applications to handle those archive formats
    # (for example bzip2 for BZIP2 archives).
    # But, let's just make things simpler and limit the choices.
    ARCH_EXT = ('.gz', '.rar', '.tar', '.zip')
    GEO_ARCH = 'geo_submission.tar.gz'  # Name of archive file for GEO

    # DOOCKER VARIABLES
    DOCKER_SCRIPT_VOLUME = 'alaska_script_volume'
    DOCKER_DATA_VOLUME = 'alaska_data_volume'
    DOCKER_QC_TAG = 'alaska_qc:latest'
    DOCKER_KALLISTO_TAG = 'alaska_kallisto:latest'
    DOCKER_SLEUTH_TAG = 'alaska_sleuth:latest'
    DOCKER_SERVER_TAG = 'alaska_server'
    DOCKER_FTP_TAG = 'alaska_ftp'

    # FTP root path
    FTP_ROOT_PATH = '/home/ftpusers/alaska_data_volume'

    # TESTING VARIABLES
    TEST_RAW_READS_MINIMUM = ['test_samples/raw/minimum/mt1',
                              'test_samples/raw/minimum/mt2',
                              'test_samples/raw/minimum/wt1',
                              'test_samples/raw/minimum/wt2']
    TEST_RAW_READS_FULL = ['test_samples/raw/full/mt1',
                           'test_samples/raw/full/mt2',
                           'test_samples/raw/full/wt1',
                           'test_samples/raw/full/wt2']

    # OPCODES
    CODES = {
        'check':                b'\x00',  # empty request for pinging server
        'new_proj':             b'\x01',  # create new project
        'load_proj':            b'\x02',  # load project from JSON
        'save_proj':            b'\x03',  # save project to JSON
        'fetch_reads':          b'\x04',  # fetch raw read files
        'infer_samples':        b'\x05',  # extract raw reads and infer samples
        'get_organisms':        b'\x06',  # get available organisms
        'set_proj':             b'\x07',  # set project data from JSON
        'finalize_proj':        b'\x08',  # finalize project
        'qc':                   b'\x09',
        'read_quant':           b'\x10',  # perform read quantification
        'diff_exp':             b'\x11',  # perform differential expression
        'do_all':               b'\x12',  # perform qc, read quant, and diff exp
        'open_sleuth_server':   b'\x13',  # open Sleuth server
        'get_proj_status':      b'\x14',  # check project status
        'get_ftp_info':         b'\x15',  # get ftp info
        'prepare_geo':          b'\x16',  # prepare submission to geo
        'submit_geo':           b'\x17',  # submit to geo
        # TESTING OPCODES
        'test_copy_reads':      b'\x47',
        'test_set_vars':        b'\x48',
        'test_qc':              b'\x49',
        'test_read_quant':      b'\x50',
        'test_diff_exp':        b'\x51',
        'test_all':             b'\x52',
        'get_var':              b'\x88',  # get contents of variable
        'reset':                b'\x89',
        'cleanup':              b'\x90',
        'remove_proj':          b'\x91',
        'get_queue':            b'\x92',
        'is_online':            b'\x93',
        'save':                 b'\x94',  # saves server state
        'load':                 b'\x95',  # loads server state
        'log':                  b'\x96',  # force log
        'update_orgs':          b'\x97',  # force organism update
        'start':                b'\x98',  # start server
        'stop':                 b'\x99',  # stop server
    }

    # Server state
    # TODO: use this
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
    PROGRESS = {
        'diff_error':     -12,   # error during diff. exp.
        'quant_error':     -9,   # error during quantification
        'qc_error':        -6,   # error during qc
        'error':           -1,   # general error
        'new':              0,   # this is a new project
        'raw_reads':        1,   # raw reads fetched
        'inferred':         2,   # samples inferred
        'set':              3,   # project data set from JSON
        'finalized':        4,   # project finalized
        'qc_queued':        5,   # qc queued
        'qc_started':       6,   # qc started
        'qc_finished':      7,   # qc finished
        'quant_queued':     8,   # quantification queued
        'quant_started':    9,   # quantification started
        'quant_finished':   10,  # quantification finished
        'diff_queued':      11,  # diff. exp. queued
        'diff_started':     12,  # diff. exp started
        'diff_finished':    13,  # diff. exp. finished
        'server_open':      14,  # sleuth server open
        'geo_compiling':    15,  # geo submission compiling
        'geo_compiled':     16,  # geo submission compiled
        'geo_submitting':   17,  # geo submission submitting
        'geo_submitted':    18   # geo submitted
    }

    def rand_str(self, l):
        """
        Generates a random string with lowercase and numbers.

        Arguments:
        l -- (int) length of string to generate

        Returns: (str) random string
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

        Arguments:
        l     -- (int) length of string to generate
        array -- (list) of strings to exclude

        Returns: (str) random string not in array
        """
        while True:
            rand = self.rand_str(l)
            if rand not in array:
                return rand

        return False

    def out(self, out, override=False):
        """
        Prints message to terminal and log with appropriate prefix.

        Arguments:
        out      -- (string) message to print and log
        override -- (bool) whether or not to shorten output (default: False)

        Returns: (str) line printed
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

        Arguments:
        obj -- (obj) to encode into a dictionary (i.e. JSON)

        Returns: (dict) representation of obj
        """
        try:
            dic = obj.__dict__
            return dic
        except Exception as e:
            self.out('ERROR: could not serialize {}'.format(type(obj)))

    def __repr__(self):
        """
        String representation of this object.

        Arguments: None

        Returns: (str) representation of this object.
        """
        return str(self.__dict__)
