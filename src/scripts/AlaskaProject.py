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
import shutil
import ftplib
import tarfile
import pandas as pd
import warnings as w
import datetime as dt
from copy import copy
from collections import defaultdict
from pyunpack import Archive
from AlaskaSample import AlaskaSample
from Alaska import Alaska


class AlaskaProject(Alaska):
    """
    AlaskaProject. Class to wrap all project data.

    Methods:
    fetch_reads
    get_raw_reads
    unpack_reads
    infer_samples
    write_matrix
    prepare_submission
    write_soft
    submit_geo
    save
    load
    """

    def __init__(self, _id):
        """
        AlaskaProject constructor. Must receive id.

        Arguments:
        _id -- (str) id of this project

        Returns: None
        """
        self.id = _id
        self.dir = '{}/{}'.format(Alaska.PROJECTS_DIR, _id)
        self.qc_dir = '{}/{}'.format(self.dir, Alaska.QC_DIR)
        self.raw_dir = '{}/{}'.format(self.dir, Alaska.RAW_DIR)
        self.align_dir = '{}/{}'.format(self.dir, Alaska.ALIGN_DIR)
        self.diff_dir = '{}/{}'.format(self.dir, Alaska.DIFF_DIR)
        self.temp_dir = '{}/{}'.format(self.dir, Alaska.TEMP_DIR)
        self.jobs = []  # jobs related to this project
        self.raw_reads = {}
        self.samples = {}
        self.design = 1  # 1: single-factor, 2: two-factor
        self.controls = {}
        self.factors = {}

        # Booleans that tell whether or not to perform enrichment / epistasis
        # analyses.
        self.enrichment = True
        self.epistasis = False

        self.progress = 0       # int to denote current analysis progress
        self.notifications = 0  # number of raw read deletion notifications sent

        # METADATA
        self.meta = {}
        self.meta['title'] = ''
        self.meta['abstract'] = ''
        self.meta['corresponding'] = {
            'email': '',
            'name': ''
        }
        self.meta['contributors'] = []
        self.meta['SRA_center_code'] = ''
        self.datetime = dt.datetime.now().strftime(Alaska.DATETIME_FORMAT)

    def fetch_reads(self):
        """
        Simply fetches all files & folders in the raw reads directory in JSON
        format.

        Arguments: None

        Returns: (list) of reads
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
                size = os.path.getsize(path)
                read = {
                    'folder': folder,
                    'filename': fname,
                    'size': '{} bytes'.format(size),
                    'path': path
                }
                reads.append(read)
        return reads

    def get_raw_reads(self):
        """
        Retrieves list of uploaded sample files. Unpacks archive if detected.

        Arguments: None

        Returns: None
        """
        unpack = []
        for root, dirs, files in os.walk(self.raw_dir):
            for fname in files:
                # if the file name does not end in a known raw read extension,
                # and is a known (and unpackable) archive, add to list
                if not fname.endswith(Alaska.RAW_EXT) \
                   and fname.endswith(Alaska.ARCH_EXT):
                    unpack.append('{}/{}'.format(root, fname))

        # if files need to be unpack_reads
        if not len(unpack) == 0:
            self.out('{}: unpacking required'.format(self.id))
            for fname in unpack:
                self.out('{}: unpacking {}'.format(self.id, fname))
                try:
                    self.unpack_reads(fname)
                except Exception as e:
                    raise Exception('{}: exception occured ' +
                                    'while unpacking {}'.format(self.id, fname))
            self.out('{}: unpacking finished'.format(self.id))

        # walk through raw reads directory
        self.raw_reads = {}
        for root, dirs, files in os.walk(self.raw_dir):
            # go straight to deepest directory
            if not len(dirs) == 0:
                continue

            reads = {}  # list to contain read files for each directory
            for fname in files:
                # only files ending with certain extensions
                # and not directly located in raw read directory should be added
                if fname.endswith(Alaska.RAW_EXT) \
                   and '{}/{}'.format(root, fname) not in unpack:
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
                raise Exception('{}: raw reads folder is empty!'.format(
                                self.id))

    def unpack_reads(self, fname):
        """
        Unpacks read archive.

        Arguments:
        fname -- (str) filename of archive to unpack

        Returns: None
        """
        Archive(fname).extractall(fname + '_ext', auto_create_dir=True)

    def infer_samples(self, f, temp=None, md5=True):
        """
        Infers samples from raw reads.
        Assumes each sample is in separate folders.
        Only to be called when raw reads is not empty.

        Arguments:
        f    -- (func) to generate unique id
        temp -- (dict) that holds temporary samples (default: None)
        md5  -- (bool) whether or not to compute md5 checksums (default: True)

        Returns: None
        """
        # TODO: add way to infer single- or pair-end read
        w.warn('{}: Alaska is currently unable to infer paired-end samples'
               .format(self.id), Warning)

        # Reset samples if we have already inferred them.
        for sample_id, sample in self.samples.items():
            if temp is not None and sample_id in temp:
                del temp[sample_id]

        # loop through each folder with sample
        self.samples = {}
        for folder, reads in self.raw_reads.items():
            _id = 'AS{}'.format(f())
            sample = AlaskaSample(_id, folder)

            if temp is not None:  # if temporary variable is given
                temp[_id] = sample

            self.out('{}: new sample created with id {}'.format(self.id, _id))

            for read, item in reads.items():
                sample.reads[read] = item

            sample.projects.append(self.id)
            self.samples[_id] = sample

    def write_matrix(self):
        """
        Writes design matrix to rna_seq_info.txt

        Arguments: None

        Returns: None
        """
        # First, let's construct a DataFrame with just one column.
        sample_names = []
        for sample_id in self.samples:
            sample_names.append(self.samples[sample_id].name.replace(' ', '_'))
        df = pd.DataFrame(sample_names, columns=['sample'])
        df.set_index('sample', inplace=True)

        # Add a column for each factor.
        for control_name, control_value in self.controls.items():
            column = []

            for sample_id, sample in self.samples.items():
                name = sample.name
                factor_value = sample.meta['chars'][control_name]

                # append a_ if this is a control. otherwise append b_
                if (factor_value == control_value):
                    factor_value = 'a_' + factor_value
                else:
                    factor_value = 'b_' + factor_value

                column.append([name, factor_value.replace(' ', '_')])

            col = pd.DataFrame(column, columns=['sample',
                               control_name.replace(' ', '_')])
            col.set_index('sample', inplace=True)
            df = pd.concat([df, col], axis=1, sort=True)

        df.to_csv('{}/rna_seq_info.txt'.format(self.diff_dir),
                  sep=' ', index=True, index_label='sample')

    def get_info_str(self, only=None):
        """
        Helper function to get the string to write to the file.
        """
        # factor string
        factor_str = None
        if self.design == 1:
            factor_str = 'single'
        else:
            factor_str = 'two'

        # arguments string
        args = ''
        genus = ''
        species = ''
        version = ''
        for sample_id, sample in self.samples.items():
            # If we want to only include a single sample.
            if only and sample_id != only:
                continue

            name = sample.name
            genus = sample.organism['genus']
            species = sample.organism['species']
            version = sample.organism['version']

            arg = '-b {} --bias'.format(sample.bootstrap_n)
            if sample.type == 1:
                arg += ' --single -l {} -s {}'.format(sample.length,
                                                      sample.stdev)
            args += '{}({}):\t{}.\n'.format(sample_id, name, arg)

        # Construct dictionary for string formatting.
        format_dict = {'factor_str': factor_str,
                       'qc_list': ', '.join(Alaska.QC_LIST),
                       'qc_agg': Alaska.QC_AGGREGATE,
                       'quant': Alaska.QUANT,
                       'diff': Alaska.DIFF,
                       'quant_args': args,
                       'genus': genus.capitalize(),
                       'species': species,
                       'version': version,
                       'diff_test': Alaska.DIFF_TEST}

        info = ('RNA-seq data was analyzed with Alaska using the '
                '{factor_str}-factor design option.\nBriefly, Alaska '
                'performs quality control using\n{qc_list} and outputs\n'
                'a summary report generated using {qc_agg}. Read '
                'quantification and\ndifferential expression analysis of '
                'transcripts were performed using\n{quant} and {diff}. '
                '{quant} was run using the\nfollowing flags for each '
                'sample:\n{quant_args}\n'
                'Reads were aligned using\n{genus} {species} genome '
                'version {version}\nas provided by Wormbase.\n\n'
                'Differential expression analyses with {diff} were '
                'performed using a\n{diff_test} corrected for '
                'multiple-testing.\n\n').format(**format_dict)

        # Add more info if enrichment analysis was performed.
        if self.enrichment:
            info += ('Enrichment analysis was performed using the WormBase '
                     'Enrichment Suite:\n'
                     'https://doi.org/10.1186/s12859-016-1229-9\n'
                     'https://www.wormbase.org/tools/enrichment/tea/tea.cgi\n')
        # if self.epistasis:
        #     info += ('Alaska performed epistasis analyses as first '
        #              'presented in\nhttps://doi.org/10.1073/pnas.1712387115\n')

        return info

    def write_info(self):
        """
        Writes an information txt file about this project to the project root
        directory.
        """
        format_dict = {'proj_id': self.id,
                       'datetime': self.datetime,
                       'n_samples': len(self.samples)}

        info = ('alaska_info.txt for {proj_id}\n'
                'This project was created on {datetime} PST with '
                '{n_samples} samples.\n\n').format(**format_dict)

        # Get the info string.
        info += self.get_info_str()

        # Write the text file.
        with open('{}/alaska_info.txt'.format(self.dir), 'w') as f:
            f.write(info)

    def prepare_submission(self):
        """
        Prepares files for GEO submission.

        Arguments: None

        Returns: None
        """
        # Write the SOFT format seq_info.txt
        out = 'seq_info.txt'
        self.write_soft(out)

        # Make a new archive.
        geo_arch = '{}/{}'.format(self.dir, Alaska.GEO_ARCH)
        with tarfile.open(geo_arch, 'w:gz') as tar:
            for sample_id, sample in self.samples.items():
                name = sample.name

                for path in sample.reads:
                    full_path = '{}/{}'.format(self.dir, path)
                    basename = os.path.basename(path)
                    arcname = '{}_{}'.format(name.replace(' ', '_'), basename)
                    tar.add(full_path, arcname=arcname)

                # deal with kallisto outputs
                kal_dir = '{}/{}'.format(self.align_dir, name)
                for file in os.listdir(kal_dir):
                    full_path = '{}/{}'.format(kal_dir, file)
                    arcname = '{}_{}'.format(name.replace(' ', '_'), file)
                    tar.add(full_path, arcname=arcname)

            # Add differential expression results.
            for root, dirs, files in os.walk(self.diff_dir):
                for file in files:
                    if not file.endswith(('out.txt', '.rds', '.R', '.svg')):
                        full_path = os.path.join(root, file)
                        arcname = file
                        tar.add(full_path, arcname=arcname)

            # Add the softfile.
            full_path = '{}/{}'.format(self.dir, out)
            tar.add(full_path, arcname=out)

    def write_soft(self, out='soft_info.txt'):
        """
        Writes project in SOFT format for GEO submission.

        Arguments:
        out -- (str) output soft filename (default: soft_info.txt)

        Returns: None
        """
        def format_indicator(indicator, value):
            """
            Helper function to format indicators in soft format.

            Arguments:
            indicator -- (str) soft format indicator
            value     -- (str) value for the given indicator

            Returns: (str) of formatted indicator
            """
            return '^{} = {}\n'.format(indicator, value)

        def format_attribute(attribute, value):
            """
            Helper function to format attributes in soft format.

            Arguments:
            attribute -- (str) soft format attribute
            value     -- (str) value for the given attribute

            Returns: (str) of formatted attribute
            """
            return '!{} = {}\n'.format(attribute, value)

        def write_series(f):
            """
            Helper function to write SERIES in SOFT format.

            Arguments:
            f -- (file descriptor) of output file

            Returns: None
            """
            f.write(format_indicator('SERIES', self.id))
            f.write(format_attribute('Series_title', self.meta['title']))
            f.write(format_attribute('Series_summary', self.meta['abstract']))

            formatting = {'n_factors': len(self.factors),
                          'factors': ', '.join(list(self.factors.keys())),
                          'n_samples': len(self.samples)}
            design = ('The experiment was designed as a {n_factors}-factor '
                      '({factors}) contrast experiment with {n_samples} samples. ') \
                      .format(**formatting)

            for factor_name, factor_control in self.controls.items():
                design += ('For factor {factor_name}, the control was '
                           + '{factor_control}. ') \
                           .format(**{'factor_name': factor_name,
                                      'factor_control': factor_control})

                factor_values = self.factors[factor_name].copy()
                factor_values.remove(factor_control)
                if len(factor_values) > 1:
                    design += ('The test values for this factor were: '
                               '{}. ').format(', '.join(factor_values))
                else:
                    design += ('The test value for this factor was '
                               '{}. ').format(factor_values[0])

            design += ('The experimental design matrix is enclosed as '
                       'rna_seq_info.txt.')

            f.write(format_attribute('Series_overall_design', design))

            for cont in self.meta['contributors']:
                f.write(format_attribute('Series_contributor', cont))

            for sample_id in self.samples:
                f.write(format_attribute('Series_sample_id', sample_id))

            supplementary = []
            diff_files = os.listdir(self.diff_dir)
            for root, dirs, files in os.walk(self.diff_dir):
                for file in files:
                    if not file.endswith(('out.txt', '.rds', '.R', '.svg')):
                        supplementary.append(file)

            for file in supplementary:
                f.write(format_attribute('Series_supplementary_file', file))

        def write_sample(f, sample):
            """
            Helper function to write the given sample in SOFT format.

            Arguments:
            f      -- (file descriptor) of output file
            sample -- (AlaskaSample) sample

            Returns: None
            """
            f.write(format_indicator('SAMPLE', sample.id))
            f.write(format_attribute('Sample_type', 'SRA'))
            f.write(format_attribute('Sample_title', sample.name))
            f.write(format_attribute('Sample_source_name',
                                     sample.meta['chars']['tissue']))

            # Convert organism dictionary, which contains the genus, species,
            # and reference version, to standard NCBI taxonomy, which is just
            # a string of the genus and species.
            # https://www.ncbi.nlm.nih.gov/Taxonomy/taxonomyhome.html/
            taxonomy = '{} {}'.format(sample.organism['genus'].capitalize(),
                                      sample.organism['species'])
            f.write(format_attribute('Sample_organism', taxonomy))

            f.write(format_attribute('Sample_genome_build',
                                     sample.organism['version']))

            to_exclude = [
                'growth conditions',
                'library preparation',
                'sequenced molecules',
                'miscellaneous'
            ]

            for char, value in sample.meta['chars'].items():
                if char not in to_exclude:
                    f.write(format_attribute('Sample_characteristics',
                            '{}: {}'.format(char, value)))

            f.write(format_attribute('Sample_molecule',
                    sample.meta['chars']['sequenced molecules']))
            f.write(format_attribute('Sample_growth_protocol',
                    sample.meta['chars']['growth conditions']))
            f.write(format_attribute('Sample_library_construction_protocol',
                    sample.meta['chars']['library preparation']))
            f.write(format_attribute('Sample_library_strategy', 'RNA-Seq'))

            info = self.get_info_str(only=sample.id)
            info = info.replace('\n\n', ' ').replace('\n', ' ').replace('\t', ' ')
            f.write(format_attribute('Sample_data_processing', info))

            f.write(format_attribute('Sample_description',
                    sample.meta['description']))

            # Write raw files.
            if sample.type == 1:
                # construct values
                files = []
                types = []
                md5s = []
                lengths = []

                for path, read in sample.reads.items():
                    name = sample.name
                    basename = os.path.basename(path)
                    arcname = '{}_{}'.format(name.replace(' ', '_'), basename)
                    ext = os.path.splitext(basename)[1]
                    files.append(arcname)
                    types.append(ext)
                    md5s.append(read['md5'])
                    lengths.append(str(sample.length))

                f.write(format_attribute(
                        'Sample_raw_file_name_run1', ', '.join(files)))
                f.write(format_attribute(
                        'Sample_raw_file_type_run1', ', '.join(types)))
                f.write(format_attribute(
                        'Sample_raw_file_checksum_run1', ', '.join(md5s)))
                f.write(format_attribute(
                        'Sample_raw_file_single_or_paired-end_run1', 'single'))
                f.write(format_attribute(
                        'Sample_raw_file_read_length_run1', ', '.join(lengths)))
                f.write(format_attribute(
                        'Sample_raw_file_standard_deviation_run1',
                        sample.stdev))
                f.write(format_attribute(
                        'Sample_raw_file_instrument_model_run1',
                        sample.meta['platform']))
            elif sample.type == 2:
                # we need to add a new run for each pair.
                for i in range(len(sample.pairs)):
                    run = str(i + 1)
                    pair = sample.pairs[i]
                    read_1 = pair[0]
                    read_2 = pair[1]
                    files = []
                    types = []
                    md5s = []

                    for read in pair:
                        name = sample.name
                        basename = os.path.basename(read)
                        arcname = '{}_{}'.format(name.replace(' ', '_'),
                                                 basename)
                        ext = os.path.splitext(basename)[1]
                        files.append(arcname)
                        types.append(ext)
                        md5s.append(sample.reads[read]['md5'])

                    f.write(format_attribute(
                            'Sample_raw_file_name_run' + run, ', '.join(files)))
                    f.write(format_attribute(
                            'Sample_raw_file_type_run' + run, ', '.join(types)))
                    f.write(format_attribute(
                            'Sample_raw_file_checksum_run' + run,
                            ', '.join(md5s)))
                    f.write(format_attribute(
                            'Sample_raw_file_single_or_paired-end_run1',
                            'paired-end'))
                    f.write(format_attribute(
                            'Sample_raw_file_instrument_model_run' + run,
                            sample.meta['platform']))

            # write processed data files.
            quant_path = '{}/{}'.format(self.align_dir, sample.name)
            quant_files = os.listdir(quant_path)
            for quant_file in quant_files:
                name = sample.name
                arcname = '{}_{}'.format(name.replace(' ', '_'), quant_file)
                f.write(format_attribute('Sample_processed_data_file', arcname))
            # END HELPER FUNCTIONS

        with open('{}/{}'.format(self.dir, out), 'w') as f:
            write_series(f)
            f.write('\n')

            for sample_id, sample in self.samples.items():
                write_sample(f, sample)
                f.write('\n')

    def submit_geo(self, fname, host, uname, passwd):
        """
        Submit compiled geo submission to geo.

        Arguments:
        fname  -- (str) filename to store on GEO FTP
        host   -- (str) GEO FTP host
        uname  -- (str) GEO FTP username
        passwd -- (str) GEO FTP password

        Returns: None
        """
        # Open a new FTP connection.
        try:
            conn = ftplib.FTP(host, uname, passwd)
            conn.cwd(Alaska.GEO_DIR)
            with open('{}/{}'.format(self.dir, Alaska.GEO_ARCH), 'rb') as f:
                conn.storbinary('STOR {}'.format(fname), f)
            conn.quit()
        except Exception as e:
            raise Exception('{}: error occurred while connecting to FTP'
                            .format(self.id))

    def remove(self):
        """
        Removes this project.

        Arguments: None

        Returns: None
        """
        shutil.rmtree(self.dir)

    def save(self, folder=None):
        """
        Save project to JSON.

        Arguments:
        folder -- (str) folder to save (default: self.dir)

        Returns: None
        """
        if folder is None:  # if folder not given, save to project root
            path = self.dir
        else:
            path = '{}/{}'.format(self.dir, folder)

        with open('{}/{}.json'.format(path, self.id), 'w') as f:
            json.dump(self.__dict__, f, default=self.encode_json, indent=4)

    def load(self, folder=None):
        """
        Loads project from JSON.

        Arguments:
        folder -- (str) folder to load (default: self.dir)

        Returns: None
        """
        if folder is None:  # if folder not given, load from project root
            path = self.dir
        else:
            path = '{}/{}'.format(self.dir, folder)

        with open('{}/{}.json'.format(path, self.id), 'r') as f:
            loaded = json.load(f)

        if not loaded['id'] == self.id:
            raise Exception('{}: JSON id {} does not match object id'
                            .format(self.id, loaded['id']))

        try:
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
        except Exception as e:
            traceback.print_exc()
            raise Exception('Error occurred while unpacking {}'.format(key))
