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
        self.chk_md5 = {} # md5 checksums
        self.samples = {}
        self.design = 1 # 1: single-factor, 2: two-factor
        self.ctrls = {} # controls

        self.progress = 0 # int to denote current analysis progress
                            # 0: project created
                            # 1: unpacking and inferring raw reads
                            # 2: raw reads extracted and loaded
                            # 3: project data set and checked (at least once)
                            # 4: finalized
                            # 5: added to queue
                            # 6: performing alignment
                            # 7: performed alignment
                            # 8: added to queue
                            # 9: performing diff exp
                            # 10: performed diff exp
                            # 11: analysis completed

        self.meta = {} # variable for all metadata
        # from GEO submission template
        self.meta['title'] = ''
        self.meta['summary'] = ''
        self.meta['contributors'] = []
        self.meta['SRA_center_code'] = ''
        self.meta['email'] = ''
        # end from GEO submission template
        self.meta['datetime'] = dt.datetime.now().strftime('%Y-%m-%d %H:%M:%S')


    def get_raw_reads(self):
        """
        Retrieves list of uploaded sample files. Unpacks archive if detected.
        """
        unpack = []
        for root, dirs, files in os.walk(self.raw_dir):
            for fname in files:
                # if the file name does not end in a known raw read extension,
                # and is a known (and unpackable) archive, add to list
                if not fname.endswith(self.RAW_EXT) and fname.endswith(self.ARCH_EXT):
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
        for root, dirs, files in os.walk(self.raw_dir):
            # go straight to deepest directory
            if not len(dirs) == 0:
                continue

            reads = [] # list to contain read files for each directory
            for fname in files:
                # only files ending with certain extensions
                # and not directly located in raw read directory should be added
                if fname.endswith(self.RAW_EXT) and '{}/{}'.format(root, fname) not in unpack:
                    # remove project folder from root
                    split = root.split('/')
                    split.remove(Alaska.PROJECTS_DIR)
                    split.remove(self.id)
                    reads.append('{}/{}'.format('/'.join(split), fname))

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

        # make sure that md5 checksums have been calculated
        if md5 and len(self.chk_md5) == 0:
            raise Exception('{}: MD5 checksums have not been calculated'.format(self.id))

        # loop through each folder with sample
        for folder, reads in self.raw_reads.items():
            _id = 'AS{}'.format(f())
            sample = AlaskaSample(_id, folder)
            if temp is not None: # if temporary variable is given
                temp[_id] = sample

            self.out('{}: new sample created with id {}'.format(self.id, _id))

            if md5:
                for read, md5 in zip(reads, self.chk_md5[folder]):
                    sample.reads.append(read)
                    sample.chk_md5.append(md5)
            else:
                for read in reads:
                    sample.reads.append(read)

            sample.projects.append(self.id)
            self.samples[_id] = sample

    def analyze_reads(self):
        """
        Analyzes reads to infer whether samples are single or paired end.
        """
        # TODO: implement

    # def new_sample(self, _id):
    #     """
    #     Creates new sample with id.
    #     """
    #     sample = AlaskaSample(_id)
    #     self.samples[_id] = sample
    #
    def reset_samples(self):
        """
        Resets samples.
        """
        for _id, sample in self.samples.items():
            sample.reset()

    def reverse_ctrls(self):
        """
        Reverses controls and assigns ctrl_rev.
        """
        reversed = defaultdict(list)

        for key, item in self.ctrls.items():
            reversed[item].append(key)

        self.ctrls_rev = dict(reversed)

    def write_qcs(self):
        """
        Writes all qc scripts.
        """
        # TODO: implement helper functions for each qc step
        sh = BashWriter('qc', self.dir)

        # append commands to convert to BAM
        self.write_bam(sh)

        # # append commands to run rseqc
        # write_rseqc(sh)
        #
        # # append commands to run fastqc
        # write_fastqc(sh)
        #
        # # append commands to run multiqc
        # write_multiqc(sh)

        # write all commands to .sh file
        sh.write()



    def write_bam(self, sh):
        """
        Writes script to generate BAM files from raw reads.
        Raw reads are aligned using Bowtie2 and converted to BAM
        using samtools.
        """
        # TODO: implement
        sh.add('# convert raw reads to BAM')
        for _id, sample in self.samples.items():
            bam = '{}/{}/{}.bam'.format(self.id, self.QC_DIR, _id)
            split = sample.organism.split('_')
            bt_idx = '{}/{}_{}_{}'.format(self.IDX_DIR, split[0].lower(), split[1], sample.ref_ver)
            command = 'bowtie2 -x {} -U {} --threads {} | samtools view -b | samtools sort -o {} -@ {}'.format(
                bt_idx,
                ','.join(['{}/{}/{}'.format(self.id, self.RAW_DIR, read) for read in sample.reads]),
                self.THREADS,
                bam,
                self.THREADS
            )
            sh.add(command)

            command = 'samtools index {}'.format(bam)
            sh.add(command)

    def write_rseqc(self, sh):
        """
        Writes script to run rseqc.
        """
        # TODO: implement
        sh.add('# run rseqc')

        for _id, sample in self.samples.items():
            bam = '{}/{}.bam'.format(self.qc_dir, _id)
            ref = PLACE_BED_HERE

            command = 'read_distribution.py -i {} -r {} > {}'.format(
                bam,
                ref,
                '{}_distribution.txt'.format(_id)
            )
            sh.add(command)

            command = 'geneBody_coverage.py -i {} -r {} -o {}'.format(
                bam,
                ref,
                _id
            )
            sh.add(command)



    def write_fastqc(self, sh):
        """
        Writes script to run fastqc.
        """
        # TODO: implement
        pass

    def write_multiqc(self):
        """
        Writes script to run multiqc.
        """
        # TODO: implement
        pass

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


    # def write_kallisto(self):
    #     """
    #     Writes bash script that will perform read quantification using Kallisto.
    #     """
    #     sh = BashWriter('kallisto', self.dir)
    #     for _id, sample in self.samples.items():
    #         sh.add('# align sample {}'.format(_id))
    #         if sample.type == 1: # single-end
    #             sh.add('kallisto quant -i {} -o {} -b {} --threads={} --single -l {} -s {} {}\n'.format(
    #                     './{}/{}'.format(self.IDX_DIR, sample.idx),
    #                     '{}/{}'.format(self.align_dir, _id),
    #                     sample.bootstrap_n,
    #                     self.THREADS,
    #                     sample.length,
    #                     sample.stdev,
    #                     ' '.join(['{}/{}'.format(self.raw_dir, read) for read in sample.reads])
    #             ))
    #
    #         elif sample.type == 2: #paired-end
    #             sh.add('kallisto quant -i {} -o {} -b {} --threads={} {}\n'.format(
    #                     './{}/{}'.format(self.IDX_DIR, sample.idx),
    #                     '{}/{}'.format(self.align_dir, _id),
    #                     sample.bootstrap_n,
    #                     self.THREADS,
    #                     ' '.join(['{}/{}'.format(self.raw_dir, read) for read in [item for sublist in sample.reads for item in sublist]])
    #             ))
    #
    #     sh.write()

    def write_matrix(self):
        """
        Writes rna_seq_info.txt
        """
        if self.design == 1: # single-factor
            # write design matrix txt
            ctrl_ftr = list(self.ctrls.values())[0]
            head = ['sample', 'condition']
            data = []
            for _id, sample in self.samples.items():
                if _id in self.ctrls:
                    ftr = 'a_{}'.format(sample.meta['chars'][ctrl_ftr])
                else:
                    ftr = 'b_{}'.format(sample.meta['chars'][ctrl_ftr])
                data.append([sample.name, ftr]) # TODO: batch??
            # convert to dataframe and save with space as delimiter
            df = pd.DataFrame(data, columns=head)
        elif self.design == 2: # two-factor
            pass # TODO: implement

        df.to_csv('{}/rna_seq_info.txt'.format(self.dir), sep=' ', index=False)

    # def write_sleuth(self):
    #     """
    #     Writes bash script to run sleuth.
    #     """
    #     if self.design == 1: #single-factor
    #         sh = BashWriter('sleuth', self.dir)
    #         sh.add('sleuth.R -d {} -k {} -o {}\n'.format(
    #                 self.dir,
    #                 self.align_dir,
    #                 self.diff_dir
    #         ))
    #     elif self.design == 2:
    #         pass
    #
    #     sh.write()

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
