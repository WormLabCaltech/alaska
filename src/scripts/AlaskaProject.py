"""Contains the AlaskaProject class.

Alaska is organized into "projects." These project hold all information about
a specific experiment. The ultimate goal of a project is to perform
differential expression analysis and identify differentially expressed genes
among samples.
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
import pandas as pd
import warnings as w
import datetime as dt
from collections import defaultdict
from pyunpack import Archive
from BashWriter import BashWriter
from AlaskaSample import AlaskaSample
# from multiprocessing import Process
from Alaska import Alaska

class AlaskaProject(Alaska):
    """
    AlaskaProject. Class to wrap all project data.
    """

    def __init__(self, _id):
        """
        AlaskaProject constructor. Must receive id.
        """
        self.id = _id
        self.dir = '{}/{}'.format(Alaska.PROJECTS_DIR, _id)
        self.qc_dir = '{}/{}'.format(self.dir, Alaska.QC_DIR)
        self.raw_dir = '{}/{}'.format(self.dir, Alaska.RAW_DIR)
        self.align_dir = '{}/{}'.format(self.dir, Alaska.ALIGN_DIR)
        self.diff_dir = '{}/{}'.format(self.dir, Alaska.DIFF_DIR)
        self.temp_dir = '{}/{}'.format(self.dir, Alaska.TEMP_DIR)
        self.jobs = [] # jobs related to this project
        self.raw_reads = {}
        self.samples = {}
        self.design = 1 # 1: single-factor, 2: two-factor
        self.controls = [] # controls
        self.factors = []

        self.progress = 0 # int to denote current analysis progress

        self.meta = {} # variable for all metadata
        # from GEO submission template
        self.meta['title'] = ''
        self.meta['abstract'] = ''
        self.meta['corresponding'] = {
            'email': '',
            'name': ''
        }
        self.meta['contributors'] = []
        self.meta['SRA_center_code'] = ''
        # end from GEO submission template
        self.meta['datetime'] = dt.datetime.now().strftime('%Y-%m-%d %H:%M:%S')

    def fetch_reads(self):
        """
        Simply fetches all files & folders in the raw reads directory in JSON format.
        """
        reads = []
        # walk through the raw directory
        for root, dirs, files in os.walk(self.raw_dir):
            for fname in files:
                # skip files that are not one of the recognized extensions.
                extensions = Alaska.RAW_EXT + Alaska.ARCH_EXT
                if not fname.endswith(extensions):
                    continue

                # otherwise, save info about the file
                path = '{}/{}/{}'.format(Alaska.ROOT_PATH, root, fname)
                folder = root.replace(self.raw_dir, '')
                filename = fname
                size = os.path.getsize(path) / (1024 ** 2)
                read = {
                    'folder': folder,
                    'filename': fname,
                    'size': '{} MB'.format(round(size,1)),
                    'path': path
                }
                reads.append(read)
        return reads

    def get_raw_reads(self):
        """
        Retrieves list of uploaded sample files. Unpacks archive if detected.
        """
        unpack = []
        for root, dirs, files in os.walk(self.raw_dir):
            for fname in files:
                # if the file name does not end in a known raw read extension,
                # and is a known (and unpackable) archive, add to list
                if not fname.endswith(Alaska.RAW_EXT) and fname.endswith(Alaska.ARCH_EXT):
                    unpack.append('{}/{}'.format(root, fname))

        # if files need to be unpack_reads
        if not len(unpack) == 0:
            self.out('{}: unpacking required'.format(self.id))
            for fname in unpack:
                self.out('{}: unpacking {}'.format(self.id, fname))
                try:
                    # p = Process(target=self.unpack_reads, args=(fname,))
                    # p.daemon = True
                    # p.start()
                    # p.join()
                    self.unpack_reads(fname)
                except Exception as e:
                    print(str(e))
                    raise Exception('{}: exception occured while unpacking {}'.format(self.id, fname))
            self.out('{}: unpacking finished'.format(self.id))

        # walk through raw reads directory
        self.raw_reads = {}
        for root, dirs, files in os.walk(self.raw_dir):
            # go straight to deepest directory
            if not len(dirs) == 0:
                continue

            reads = {} # list to contain read files for each directory
            for fname in files:
                # only files ending with certain extensions
                # and not directly located in raw read directory should be added
                if fname.endswith(Alaska.RAW_EXT) and '{}/{}'.format(root, fname) not in unpack:
                    full_path = '{}/{}'.format(root, fname)

                    # remove project folder from root
                    split = root.split('/')
                    split.remove(Alaska.PROJECTS_DIR)
                    split.remove(self.id)

                    path = '{}/{}'.format('/'.join(split), fname)
                    size = os.path.getsize(full_path)
                    md5 = None

                    read = {}
                    read['size'] = size
                    read['md5'] = md5

                    reads[path] = read


            # assign list to dictionary
            if not len(reads) == 0:
                self.raw_reads[root.replace(self.raw_dir, '')[1:]] = reads
            else:
                raise Exception('{}: raw reads folder is empty!'.format(self.id))

    def unpack_reads(self, fname):
        """
        Unpacks read archive.
        """
        Archive(fname).extractall(fname + '_extracted', auto_create_dir=True)

    def infer_samples(self, f, temp=None, md5=True):
        """
        Infers samples from raw reads.
        Assumes each sample is in separate folders.
        Only to be called when raw reads is not empty.
        """
        # TODO: add way to infer single- or pair-end read
        w.warn('{}: Alaska is currently unable to infer paired-end samples'
                .format(self.id), Warning)

        # # make sure that md5 checksums have been calculated
        # if md5 and len(self.chk_md5) == 0:
        #     raise Exception('{}: MD5 checksums have not been calculated'.format(self.id))

        # loop through each folder with sample
        self.samples = {}
        for folder, reads in self.raw_reads.items():
            _id = 'AS{}'.format(f())
            sample = AlaskaSample(_id, folder)

            if temp is not None: # if temporary variable is given
                temp[_id] = sample

            self.out('{}: new sample created with id {}'.format(self.id, _id))

            for read, item in reads.items():
                sample.reads[read] = item

            sample.projects.append(self.id)
            self.samples[_id] = sample

    def analyze_reads(self):
        """
        Analyzes reads to infer whether samples are single or paired end.
        """
        # TODO: implement

    def check(self):
        """
        Checks all data.
        """
        # Have to check: design vs sample
        w.warn('{}: Alaska is currently unable to verify experimental designs'.format(self.id),
                Warning)

        # ctrl_chars = {}
        # # first, get control characteristics
        # for _id, char in self.ctrls.items():
        #     if char not in ctrl_chars:
        #         ctrl_chars[char] = self.samples[_id].meta[char]
        #
        # # check controls & their characteristics
        # for _id, sample in self.samples.items():
        #     if _id in self.ctrls:
        #         char = self.ctrls[_id]
        #         if not sample.meta[char] == ctrl_chars[char]:
        #             msg = '{}: control sample {} does not have {} : {}' \
        #                     .format(self.id, _id, char, ctrl_chars[char])
        #             raise Exception(msg)
        #     else:
        #         if sample.meta[char] == ctrl_chars[char]:
        #             msg = '{}: non-control sample {} has {} : {}' \
        #                     .format(self.id, _id, char, ctrl_chars[char])
        #             raise Exception(msg)



        # # first check controls have matching control factors
        # # then check if non-controls have different factors
        # # TODO: check other data and ensure other factors are the same
        # for _id, sample in self.samples.items():
        #     # check controls have matching control factors
        #     if _id in self.ctrls:
        #         for __id, char in self.ctrls.items():
        #             val = self.samples[_id].meta[key]
        #             if not val == item:
        #                 msg = '{}: control sample {} does not have {}:{}. \
        #                     instead, has {}'.format(self.id, _id, key, item, val)
        #                 raise Exception(msg)
        #     else:
        #         # check if non-controls have different factors
        #         for key, item in self.ctrl_ftrs.items():
        #             val = self.samples[_id].meta[key]
        #             if val == item:
        #                 msg = '{}: non-control sample {} has {}:{}'.format(self.id, _id, key, item)
        #                 raise Exception(msg)



    def write_matrix(self):
        """
        Writes rna_seq_info.txt
        """
        # First, let's construct a DataFrame with just one column.
        sample_names = []
        for sample_id in self.samples:
            sample_names.append(self.samples[sample_id].name)
        df = pd.DataFrame(sample_names, columns=['sample'])
        df.set_index('sample', inplace=True)

        # Add a column for each factor.
        for i in range(self.design):
            column = []
            control = self.controls[i]
            control_name = control['name']
            control_value = control['value']

            for sample_id, sample in self.samples.items():
                name = sample.name
                factor_value = sample.meta['chars'][control_name]

                # append a_ if this is a control. otherwise append b_
                if (factor_value == control_value):
                    factor_value = 'a_' + factor_value
                else:
                    factor_value = 'b_' + factor_value

                column.append([name, factor_value])

            col = pd.DataFrame(column, columns=['sample', control_name])
            col.set_index('sample', inplace=True)
            df = pd.concat([df, col], axis=1, sort=True)

        df.to_csv('{}/rna_seq_info.txt'.format(self.diff_dir), sep=' ', index=True)

    def save(self, folder=None):
        """
        Save project to JSON.
        """
        if folder is None: # if folder not given, save to project root
            path = self.dir
        else:
            path = '{}/{}'.format(self.dir, folder)

        with open('{}/{}.json'.format(path, self.id), 'w') as f:
            json.dump(self.__dict__, f, default=self.encode_json, indent=4)


    def load(self, folder=None):
        """
        Loads project from JSON.
        """
        if folder is None: # if folder not given, load from project root
            path = self.dir
        else:
            path = '{}/{}'.format(self.dir, folder)

        with open('{}/{}.json'.format(path, self.id), 'r') as f:
            loaded = json.load(f)

        if not loaded['id'] == self.id:
            raise Exception('{}: JSON id {} does not match object id'
                        .format(self.id, loaded['id']))

        for key, item in loaded.items():
            if key == 'samples':
                # AlaskaSample object must be created for samples
                samples = {}
                for _id, vals in item.items():
                    sample = AlaskaSample(_id)
                    sample.__dict__ = vals
                    samples[_id] = sample
                # set samples
                self.samples = samples
            else:
                setattr(self, key, item)
