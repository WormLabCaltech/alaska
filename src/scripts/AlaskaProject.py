"""
AlaskaProject.py

Author: Joseph Min (kmin@caltech.edu)

This file contains the class AlaskaProject, which contains all data related
to a project.
Managed by AlaskaServer.
"""
import os
import json
import pandas as pd
from pyunpack import Archive
import datetime as dt
from BashWriter import BashWriter
from AlaskaSample import AlaskaSample
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
        self.dir = './{}/{}'.format(self.PROJECTS_DIR, _id)
        self.raw_dir = '{}/{}'.format(self.dir, self.RAW_DIR)
        self.align_dir = '{}/{}'.format(self.dir, self.ALIGN_DIR)
        self.diff_dir = '{}/{}'.format(self.dir, self.DIFF_DIR)
        self.raw_reads = {}
        self.samples = {}
        self.bootstrap_n = 300
        self.idx = ''
        self.design = 1 # 1: single-factor, 2: two-factor
        self.ctrl_ids = [] # control ids
        self.ctrl_ftrs = {} # if single-factor, key and value
                            # if two-factor, key: value, key: value
                            # (refers to keys of self.meta)
        self.progress = 0

        self.meta = {} # variable for all metadata
        self.meta['name'] = ''
        self.meta['date created'] = dt.datetime.now().strftime('%Y-%m-%d')
        self.meta['time created'] = dt.datetime.now().strftime('%H:%M:%S')


    def get_raw_reads(self):
        """
        Retrieves list of uploaded sample files. Unpacks archive if detected.
        """
        # get list of files/directories in raw reads directory
        flist = os.listdir(self.raw_dir)
        unpack = all(not os.path.isdir(d) for d in flist)

        # if files need to be unpack_reads
        if unpack:
            self.out('{}: unpacking required'.format(self.id))
            for fname in flist:
                self.out('{}: unpacking {}'.format(self.id, fname))
                try:
                    self.unpack_reads(fname)
                except:
                    raise Exception('{}: exception occured while unpacking {}'.format(self.id, fname))
            self.out('{}: unpacking finished'.format(self.id))

        # walk through raw reads directory
        for root, dirs, files in os.walk(self.raw_dir):
            reads = [] # list to contain read files for each directory
            for fname in files:
                # only files ending with certain extensions
                # and not directly located in raw read directory should be added
                if fname.endswith(self.RAW_EXT) and fname not in flist:
                    reads.append(fname)

            # assign list to dictionary
            if not len(reads) == 0:
                self.raw_reads[root.replace(self.raw_dir, '')] = reads


    def unpack_reads(self, fname):
        """
        Unpacks read archive.
        """
        Archive('{}/{}'.format(self.raw_dir, fname)).extractall(self.raw_dir)

    def infer_samples(self, f):
        """
        Infers samples from raw reads.
        Assumes each sample is in separate folders.
        Only to be called when raw reads is not empty.
        """
        # TODO: add way to infer single- or pair-end read

        # loop through each folder with sample
        for folder, reads in self.raw_reads.items():
            _id = 'AS{}'.format(f())
            sample = AlaskaSample(_id)
            self.out('{}: new sample created with id {}'.format(self.id, _id))

            for read in reads:
                sample.reads.append('{}/{}'.format(folder, read))

            self.samples[_id] = sample

    def analyze_reads(self):
        """
        Analyzes reads to infer whether samples are single or paired end.
        """
        # TODO: implement

    def reset_samples(self):
        """
        Resets samples.
        """
        for _id, sample in self.samples:
            sample.reset()

    def check(self):
        """
        Checks all data.
        """
        # Have to check: design vs sample

        # first check controls have matching control factors
        # then check if non-controls have different factors
        # TODO: check other data and ensure other factors are the same
        for _id, sample in self.samples.items():
            # check controls have matching control factors
            if _id in self.ctrl_ids:
                for key, item in self.ctrl_ftrs.items():
                    val = self.samples[_id].meta[key]
                    if not val == item:
                        msg = '{}: control sample {} does not have {}:{}. \
                            instead, has {}'.format(self.id, _id, key, item, val)
                        raise Exception(msg)
            else:
                # check if non-controls have different factors
                for key, item in self.ctrl_ftrs.items():
                    val = self.samples[_id].meta[key]
                    if val == item:
                        msg = '{}: non-control sample {} has {}:{}'.format(self.id, _id, key, item)
                        raise Exception(msg)


    def write_kallisto(self):
        """
        Writes bash script that will perform read quantification using Kallisto.
        """
        sh = BashWriter('kallisto', self.dir)
        for _id, sample in self.samples.items():
            sh.add('# align sample {}'.format(_id))
            if sample.type == 1: # single-end
                sh.add('kallisto quant -i {} -o {} -b {} --threads={} --single -l {} -s {} {}\n'.format(
                        './{}/{}'.format(self.IDX_DIR, self.idx),
                        '{}/{}'.format(self.align_dir, _id),
                        self.bootstrap_n,
                        self.THREADS,
                        sample.length,
                        sample.stdev,
                        ' '.join(['{}{}'.format(self.raw_dir, read) for read in sample.reads])
                ))

            elif sample.type == 2: #paired-end
                sh.add('kallisto quant -i {} -o {} -b {} --threads={} {}\n'.format(
                        './{}/{}'.format(self.IDX_DIR, self.idx),
                        '{}/{}'.format(self.align_dir, _id),
                        self.bootstrap_n,
                        self.THREADS,
                        ' '.join(['{}{}'.format(self.raw_dir, read) for read in [item for sublist in sample.reads for item in sublist]])
                ))

        sh.write()

    def write_matrix(self):
        """
        Writes rna_seq_info.txt
        """
        if self.design == 1: # single-factor
            # write design matrix txt
            ctrl_ftr = list(self.ctrl_ftrs.keys())[0]
            ctrl_id = self.ctrl_ids[0]
            head = ['sample', ctrl_ftr]
            data = []
            for _id, sample in self.samples.items():
                if _id == ctrl_id:
                    ftr = 'a_{}'.format(sample.meta[ctrl_ftr])
                else:
                    ftr = 'b_{}'.format(sample.meta[ctrl_ftr])
                data.append([_id, ftr]) # TODO: batch??
            # convert to dataframe and save with space as delimiter
            df = pd.DataFrame(data, columns=head)
        elif self.design == 2: # two-factor
            pass # TODO: implement

        df.to_csv('{}/rna_seq_info.txt'.format(self.dir), sep=' ', index=False)

    def write_sleuth(self):
        """
        Writes bash script to run sleuth.
        """
        if self.design == 1: #single-factor
            sh = BashWriter('sleuth', self.dir)
            sh.add('sleuth.R -d {} -k {} -o {} -g {}\n'.format(
                    self.dir,
                    self.align_dir,
                    self.diff_dir,
                    list(self.ctrl_ftrs.keys())[0]
            ))
        elif self.design == 2:
            pass

        sh.write()

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
        # TODO: check if object id and JSON id matches
        if folder is None: # if folder not given, load from project root
            path = self.dir
        else:
            path = '{}/{}'.format(self.dir, folder)

        with open('{}/{}.json'.format(path, self.id), 'r') as f:
            loaded = json.load(f)

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
