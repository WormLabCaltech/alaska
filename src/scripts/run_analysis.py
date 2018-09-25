"""Script to run various analyses.

This script is used by AlaskaServer to perform quality control, read
alignment/quantification and differential expression analysis.
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
import sys
import time
import json
import queue
import tarfile
from threading import Thread
import multiprocessing as mp
from multiprocessing import Process
import subprocess as sp

def print_with_flush(s='', **kwargs):
    """
    Prints the given string and passes on additional kwargs to the builtin
    print function. This function flushes stdout immediately.
    """
    print(s, **kwargs)
    sys.stdout.flush()

def load_proj(_id):
    """
    Loads the project json into dictionary object.
    """
    # Read json.
    with open(_id, 'r') as f:
        loaded = json.load(f)

    return loaded

def run_sys(cmd, prefix=''):
    """
    Runs a system command and echos all output.
    This function blocks until command execution is terminated.
    """
    print_with_flush('# ' + ' '.join(cmd))
    output = ''
    with sp.Popen(cmd, stdout=sp.PIPE, stderr=sp.STDOUT, bufsize=1, universal_newlines=True) as p:
        # while p.poll() is None:
        #     try:
        #         line, _err = p.communicate(timeout=30)
        #
        #         if not line.isspace() and len(line) > 1:
        #             output += line
        #             print_with_flush('{}: {}'.format(prefix, line), end='')
        #     except sp.TimeoutExpired:
        #         sys.stdout.flush()
        #         if p.poll() is None:
        #             continue
        #         else:
        #             break
        #
        output = ''
        while p.poll() is None:
            line = p.stdout.readline()
            if not line.isspace() and len(line) > 1:
                output += line
                print(prefix + ': ' + line, end='')
                sys.stdout.flush()
        p.stdout.read()
        # p.stderr.read()
        p.stdout.close()
        # p.stderr.close()

        if p.returncode != 0:
            sys.exit('command terminated with non-zero return code {}!'.format(p.returncode))

    return output

def archive(out, source_dir):
    """
    Archive given source directory into output file.
    """
    with tarfile.open(out, 'w:gz') as tar:
        if isinstance(source_dir, str):
            tar.add(source_dir, arcname=os.path.sep)
        else:
            for d in source_dir:
                tar.add(d, arcname=os.path.sep)

######### These functions must be here to allow multiprocessing.
def read_distribution(_id, bed_path):
    """
    Helper function to run read_distribution.py
    """
    args = ['read_distribution.py']
    args += ['-i', '{}_sorted.bam'.format(_id)]
    args += ['-r', bed_path]

    # print_with_flush(args)
    output = run_sys(args, prefix=_id)
    # output file
    with open('{}_distribution.txt'.format(_id), 'w') as out:
        out.write(output)


def geneBody_coverage(_id, bed_path):
    """
    Helper function to run geneBody_coverage.py
    """
    args = ['geneBody_coverage.py']
    args += ['-i', '{}_sorted.bam'.format(_id)]
    args += ['-r', bed_path]
    args += ['-o', '{}_coverage'.format(_id)]

    run_sys(args, prefix=_id)

def tin(_id, bed_path):
    """
    Helper function to run tin.py
    """
    args = ['tin.py']
    args += ['-i', '{}_sorted.bam'.format(_id)]
    args += ['-r', bed_path]

    output = run_sys(args, prefix=_id)
    # output file
    with open('{}_tin.txt'.format(_id), 'w') as out:
        out.write(output)

def fastqc(_id):
    """
    Helper function to run fastqc.
    """
    args = ['fastqc', '{}_sorted.bam'.format(_id)]
    run_sys(args, prefix=_id)

def mp_helper(f, args, name, _id):
    """
    Helper function for multiprocessing.
    """
    print_with_flush('# starting {} for {}'.format(name, _id))

    f(*args)

    print_with_flush('# finished {} for {}'.format(name, _id))
######### These functions must be here to allow multiprocessing.


def run_qc(proj, nthreads):
    """
    Runs read quantification with RSeQC, FastQC and MultiQC.
    """
    def bowtie2(_id, path, bt2_path, reads, t):
        """
        Helper function to call bowtie2 alignment.
        """
        args = ['bowtie2', '-x', bt2_path]

        # single/paired-end
        if t == 1:
            args += ['-U', ','.join(reads)]
        elif t == 2:
            m1 = []
            m2 = []
            for pair in reads:
                m1.append(pair[0])
                m2.append(pair[1])
            args += ['-1', ','.join(m1)]
            args += ['-2', ','.join(m2)]

        args += ['-S', '{}/{}_alignments.sam'.format(path, _id)]
        args += ['-u', str(1 * (10 ** 5))]
        args += ['--threads', str(nthreads)]
        args += ['--verbose']
        run_sys(args, prefix=_id)


    def samtools_sort(_id):
        """
        Helper function to call samtools to sort .bam
        """
        sam_path = '{}_alignments.sam'.format(_id)
        args = ['samtools', 'sort', sam_path]
        sorted_bam = '{}_sorted.bam'.format(_id)
        args += ['-o', sorted_bam]
        args += ['-@', str(nthreads-1)]
        args += ['-m', '2G']
        run_sys(args, prefix=_id)

    def samtools_index(_id):
        """
        Helper function to call samtools to index .bam
        """
        args = ['samtools', 'index', '{}_sorted.bam'.format(_id)]
        args += ['-@', str(nthreads-1)]
        run_sys(args, prefix=_id)

    def sambamba_sort(_id):
        """
        Helper function to call samtools to sort .bam
        """
        sam_path = '{}_alignments.sam'.format(_id)
        args = ['sambamba', 'sort', sam_path]
        sorted_bam = '{}_sorted.bam'.format(_id)
        args += ['-o', sorted_bam]
        args += ['-t', str(nthreads-1)]
        args += ['-m', '2G']
        run_sys(args, prefix=_id)

    def sambamba_index(_id):
        """
        Helper function to call samtools to index .bam
        """
        args = ['sambamba', 'index', '{}_sorted.bam'.format(_id)]
        args += ['-t', str(nthreads-1)]
        args += ['-p']
        run_sys(args, prefix=_id)

    def multiqc(_id=''):
        """
        Helper function to run multiqc.
        """
        args = ['multiqc', '.']
        run_sys(args, prefix=_id)

    ########## HELPER FUNCTIONS END HERE ###########
    print_with_flush('{} samples detected...'.format(len(proj['samples'])), end='')
    for _id in proj['samples']:
        print_with_flush('{}({})'.format(_id, proj['samples'][_id]['name']), end=' ')
    print_with_flush()

    # run kallisto to get pseudobam
    # run_kallisto(proj, nthreads, qc=True, nbootstraps=0, ver=235)

    wdir = os.getcwd()

    for _id in proj['samples']:
        # define necessary variables
        name = proj['samples'][_id]['name']
        path = '1_qc/{}'.format(name)
        org = proj['samples'][_id]['organism'].split('_')
        ver = str(proj['samples'][_id]['ref_ver'])
        bed_path = '/alaska/root/organisms/{}/{}/{}/reference'.format(org[0], org[1], ver)
        bed_path += '/{}_{}_{}.bed'.format(org[0][0], org[1], ver)
        bt2_idx = '{}_{}_{}'.format(org[0][0], org[1], ver)
        bt2_path = '/alaska/root/organisms/{}/{}/{}/index/{}'.format(org[0], org[1], ver, bt2_idx)

        # Align with bowtie2
        if (proj['samples'][_id]['type'] == 1):
            reads = proj['samples'][_id]['reads'].keys()
        elif (proj['samples'][_id]['type'] == 2):
            reads = proj['samples'][_id]['pairs']
        else:
            print_with_flush('unrecognized sample type!')
        bowtie2(name, path, bt2_path, reads, proj['samples'][_id]['type'])

        os.chdir(path)
        print_with_flush('# changed working directory to {}'.format(path))
        _id = name

        # Sort and index reads with samtools first.
        samtools_sort(_id)
        samtools_index(_id)
        # sambamba_sort(_id)

        # If nthreads > 1, we want to multithread.
        if nthreads > 1:
            pool = mp.Pool(processes=nthreads)
            print_with_flush('# multithreading on.')

            args = [
                [read_distribution, [_id, bed_path], 'read_distribution', _id],
                [geneBody_coverage, [_id, bed_path], 'geneBody_coverage', _id],
                [tin, [_id, bed_path], 'tin', _id],
                [fastqc, [_id], 'fastqc', _id],
            ]

            # start processes
            pool.starmap(mp_helper, args)

        else:
            # read_distribution.py
            read_distribution(_id, bed_path)

            # geneBody_coverage.py
            geneBody_coverage(_id, bed_path)

            # tin.py
            tin(_id, bed_path)

            # FastQC
            fastqc(_id)

        # # MultiQC
        # multiqc(_id)

        os.chdir(wdir)
        print_with_flush('# returned to {}'.format(wdir))

    print_with_flush('# running multiqc for all samples')
    path = '1_qc'
    os.chdir(path)
    multiqc()
    os.chdir(wdir)

    print_with_flush('# qc finished, archiving')
    archive(path + '.tar.gz', path)
    print_with_flush('# done')



def run_kallisto(proj, nthreads):
    """
    Runs read quantification with Kallisto.
    Assumes that the indices are in the folder /organisms
    """
    print_with_flush('{} samples detected...'.format(len(proj['samples'])), end='')
    for _id in proj['samples']:
        print_with_flush('{}({})'.format(_id, proj['samples'][_id]['name']), end=' ')
    print_with_flush()

    for _id in proj['samples']:
        name = proj['samples'][_id]['name']
        path = '2_alignment/{}'.format(name)

        args = ['kallisto', 'quant']

        # first find the index
        org = proj['samples'][_id]['organism'].split('_')
        ver = str(proj['samples'][_id]['ref_ver'])
        idx_path = '/alaska/root/organisms/{}/{}/{}/index'.format(org[0], org[1], ver)
        idx_path += '/{}_{}_{}.idx'.format(org[0][0], org[1], ver)
        args += ['-i', idx_path]

        # find the output directory
        args += ['-o', path]

        # find the number of bootstraps
        nbootstraps = proj['samples'][_id]['bootstrap_n']
        args += ['-b', str(nbootstraps)]

        # number of threads
        args += ['-t', str(nthreads)]

        # single/paired end
        if (proj['samples'][_id]['type'] == 1):
            length = proj['samples'][_id]['length']
            stdev = proj['samples'][_id]['stdev']
            arg = ['--single', '-l', str(length), '-s', str(stdev)]
            args += arg

            # finally, add the sample reads
            for read in proj['samples'][_id]['reads']:
                args.append(read)

        elif (proj['samples'][_id]['type'] == 2):
            for pair in proj['samples'][_id]['pairs']:
                args.append(pair[0])
                args.append(pair[1])
        else:
            print_with_flush('unrecognized sample type!')

        _id = name

        run_sys(args, prefix=_id)

    path = '2_alignment'
    print_with_flush('# kallisto finished, archiving')
    archive(path + '.tar.gz', path)
    print_with_flush('# done')


def run_sleuth(proj):
    """
    Runs differential expression analysis with sleuth.
    Assumes that the design matrix is already present in the directory.
    Once sleuth is finished, runs TEA.
    """
    def run_tea(d):
        """
        Runs TEA on sleuth output.
        """
        try:
            import tissue_enrichment_analysis as tea
        except ImportError as e:
            print_with_flush('# TEA is not installed...skipping')
            sys.exit(0)
        try:
            import pandas as pd
        except ImportError as e:
            print_with_flush('# pandas is not installed...skipping')
            sys.exit(0)

        analyses = ['tissue', 'phenotype', 'go']

        # Load sleuth results.
        wdir = os.getcwd()
        print_with_flush('# entering 3_diff_exp')
        os.chdir(d)
        for file in os.listdir():
            if file.startswith('sleuth_table') and file.endswith('.csv') and not file.endswith(('tissue.csv', 'phenotype.csv', 'go.csv')):
                df = pd.read_csv(file, index_col=0)
                gene_list = df[df.qval < 0.05].ens_gene
                name = os.path.splitext(file)[0]

                for analysis in analyses:
                    print_with_flush('# performing {} enrichment analysis for {}'.format(analysis, file))
                    title = '{}_{}'.format(name, analysis)
                    fname = '{}.csv'.format(title)
                    df_dict = tea.fetch_dictionary(analysis)
                    df_results = tea.enrichment_analysis(gene_list, df_dict, aname=fname, save=True)
                    tea.plot_enrichment_results(df_results, analysis=analysis, title=title, save=True)
        os.chdir(wdir)
        print_with_flush('# returned to root')

    args = ['Rscript']
    args += ['./sleuth.R']
    args += ['-d', './3_diff_exp']
    args += ['-k', './2_alignment']
    args += ['-o', './3_diff_exp']
    # args += ['--shiny']

    run_sys(args)
    path = '3_diff_exp'
    print_with_flush('# sleuth finished, starting enrichment analysis')
    run_tea(path)
    print_with_flush('# enrichment analysis finished, archiving')
    archive(path + '.tar.gz', path)

    # Archive all
    print_with_flush('# all analyses finished, archiving entire project')
    dirs_to_archive = []
    for d in os.listdir():
        if d != '_temp' and d != '0_raw_reads' and not d.endswith('.tar.gz'):
            dirs_to_archive.append(d)
    archive(proj['id'] + '.tar.gz', dirs_to_archive)
    print_with_flush('# done')


if __name__ == '__main__':
    import argparse

    parser = argparse.ArgumentParser(description='Perform analysis.')
    parser.add_argument('type', choices=['qc', 'kallisto', 'sleuth'])
    parser.add_argument('--threads', type=int, default=1)
    args = parser.parse_args()

    nthreads = args.threads

    # Assume only one json file exists in current directory.
    files = os.listdir()

    # Find that json.
    for f in files:
        if f.endswith('.json'):
            data = f
            break

    # Load project json.
    proj = load_proj(data)
    print_with_flush('{} loaded'.format(data))

    if args.type == 'qc':
        run_qc(proj, nthreads)
    elif args.type == 'kallisto':
        run_kallisto(proj, nthreads)
    elif args.type == 'sleuth':
        run_sleuth(proj)
