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
from threading import Thread
import subprocess as sp

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
    print('# ' + ' '.join(cmd))
    with sp.Popen(' '.join(cmd), shell=True, stdout=sp.PIPE, stderr=sp.STDOUT, bufsize=1, universal_newlines=True) as p:
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
    time.sleep(1)

    if p.returncode != 0:
        sys.exit('command terminated with non-zero return code {}!'.format(p.returncode))
    return output

def run_qc(proj, nthreads):
    """
    Runs read quantification with RSeQC, FastQC and MultiQC.
    """
    def bowtie2(_id, path, bt2_path, reads, t):
        """
        Helper function to call bowtie2 alignment.
        """
        args = ['bowtie2', '-x', bt2_path]

        if t == 1:
            args += ['-U', ','.join(reads)]
        else:
            pair1 = []
            pair2 = []
            for pair in reads:
                pair1.append(pair[0])
                pair2.append(pair[1])
            args += ['-1', ','.join(pair1)]
            args += ['-2', ','.join(pair2)]

        args += ['-S', '{}/alignments.sam'.format(path)]
        args += ['-u', str(2 * (10 ** 5))]
        args += ['--threads', str(nthreads)]
        # args += ['--verbose']
        run_sys(args, prefix=_id)


    def samtools_sort(_id):
        """
        Helper function to call samtools to sort .bam
        """
        sam_path = 'alignments.sam'
        args = ['samtools', 'sort', sam_path]
        sorted_bam = 'sorted.bam'
        args += ['-o', sorted_bam]
        args += ['-@', str(nthreads-1)]
        args += ['-m', '4G']
        run_sys(args, prefix=_id)

    def samtools_index(_id):
        """
        Helper function to call samtools to index .bam
        """
        args = ['samtools', 'index', 'sorted.bam']
        run_sys(args, prefix=_id)


    def read_distribution(_id, bed_path):
        """
        Helper function to run read_distribution.py
        """
        args = ['read_distribution.py']
        args += ['-i', 'sorted.bam']
        args += ['-r', bed_path]

        # print(args)
        output = run_sys(args, prefix=_id)
        # output file
        with open('{}_distribution.txt'.format(_id), 'w') as out:
            out.write(output)


    def geneBody_coverage(_id, bed_path):
        """
        Helper function to run geneBody_coverage.py
        """
        args = ['geneBody_coverage.py']
        args += ['-i', 'sorted.bam']
        args += ['-r', bed_path]
        args += ['-o', '{}_coverage'.format(_id)]

        run_sys(args, prefix=_id)

    def tin(_id, bed_path):
        """
        Helper function to run tin.py
        """
        args = ['tin.py']
        args += ['-i', 'sorted.bam']
        args += ['-r', bed_path]

        output = run_sys(args, prefix=_id)
        # output file
        with open('{}_tin.txt'.format(_id), 'w') as out:
            out.write(output)

    def fastqc(_id):
        """
        Helper function to run fastqc.
        """
        args = ['fastqc', 'sorted.bam']
        run_sys(args, prefix=_id)

    def multiqc(_id):
        """
        Helper function to run multiqc.
        """
        args = ['multiqc', '.']
        run_sys(args, prefix=_id)


    def worker(qu, i=0):
        """
        Worker function for multithreading.
        """
        while True:
            # get item from queue
            item = qu.get()

            # a way to stop the workers
            if item is None:
                break

            _id = item[0]
            type = item[1]
            path = item[2]
            f = item[3]
            args = item[4]

            # change _id argument to reflect the thread number
            args[0] = '[Thread-{}] {}'.format(i, args[0])

            print('# {}: starting {} on thread {}'.format(_id, type, i))
            f(*args)

            qu.task_done()


    ########## HELPER FUNCTIONS END HERE ###########

    print('{} samples detected...'.format(len(proj['samples'])), end='')
    for _id in proj['samples']:
        print('{}({})'.format(_id, proj['samples'][_id]['name']), end=' ')
    print()

    # run kallisto to get pseudobam
    # run_kallisto(proj, nthreads, qc=True, nbootstraps=0, ver=235)

    for _id in proj['samples']:
        # define necessary variables
        name = proj['samples'][_id]['name']
        wdir = os.getcwd()
        path = '1_qc/{}'.format(name)
        org = proj['samples'][_id]['organism'].split('_')
        ver = str(proj['samples'][_id]['ref_ver'])
        bed_path = '/alaska/root/organisms/{}/{}/{}/reference'.format(org[0], org[1], ver)
        bed_path += '/{}_{}_{}.bed'.format(org[0][0], org[1], ver)
        bt2_idx = '{}_{}_{}'.format(org[0][0], org[1], ver)
        bt2_path = '/alaska/root/organisms/{}/{}/{}/index/{}'.format(org[0], org[1], ver, bt2_idx)

        # get all the raw reads for this sample
        reads = []
        # finally, add the sample reads
        for read in proj['samples'][_id]['reads']:
            reads.append(read)

        # Align with bowtie2
        if (proj['samples'][_id]['type'] == 1):
            bowtie2(_id, path, bt2_path, reads, 1)
        elif (proj['samples'][_id]['type'] == 2):
            # TODO: implement
            pass
        else:
            print('unrecognized sample type!')

        os.chdir(path)
        print('# changed working directory to {}'.format(path))
        _id = name

        # Sort and index reads with samtools first.
        samtools_sort(_id)
        # Give it some time.
        time.sleep(1)
        samtools_index(_id)

        # If nthread > 1, we want to multithread.
        if nthreads > 1:
            qu = queue.Queue()

            # Enqueue everything here!
            print('# multithreading on.')

            # queue items will have the format:
            # [_id, analysis type, path, function, arguments]
            qu.put([_id, 'read_distribution', path,
                        read_distribution, (_id, bed_path)])
            print('# enqueued read_distribution for {}'.format(_id))

            qu.put([_id, 'geneBody_coverage', path,
                        geneBody_coverage, (_id, bed_path)])
            print('# enqueued geneBody_coverage for {}'.format(_id))

            qu.put([_id, 'tin', path,
                        tin, (_id, bed_path)])
            print('# enqueued tin for {}'.format(_id))

            qu.put([_id, 'fastqc', path,
                        fastqc, (_id)])
            print('# enqueued fastqc for {}'.format(_id))

            # spawn threads
            threads = []
            for i in range(nthreads):
                t = Thread(target=worker, args=(qu, i))
                t.start()
                threads.append(t)

            # block until all tasks are done
            qu.join()

            # stop workers
            for i in range(nthreads):
                qu.put(None)
            for t in threads:
                t.join()
        else:
            # read_distribution.py
            read_distribution(_id, bed_path)

            # geneBody_coverage.py
            geneBody_coverage(_id, bed_path)

            # tin.py
            tin(_id, bed_path)

            # FastQC
            fastqc(_id)

        # MultiQC
        multiqc(_id)

        os.chdir(wdir)
        print('# returned to {}'.format(wdir))

        if nthreads > 1:
            print('# starting analysis of {} items in queue'.format(qu.qsize()))



def run_kallisto(proj, nthreads):
    """
    Runs read quantification with Kallisto.
    Assumes that the indices are in the folder /organisms
    """
    print('{} samples detected...'.format(len(proj['samples'])), end='')
    for _id in proj['samples']:
        print('{}({})'.format(_id, proj['samples'][_id]['name']), end=' ')
    print()

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

        elif (proj['samples'][_id]['type'] == 2):
            # TODO: implement
            pass
        else:
            print('unrecognized sample type!')
        args += arg

        # finally, add the sample reads
        for read in proj['samples'][_id]['reads']:
            args.append(read)

        _id = name

        run_sys(args, prefix=_id)


def run_sleuth(proj):
    """
    Runs differential expression analysis with sleuth.
    Assumes that the design matrix is already present in the directory.
    """
    args = ['Rscript']
    args += ['./sleuth.R']
    args += ['-d', '.']
    args += ['-k', './2_alignment']
    args += ['-o', './3_diff_exp']
    # args += ['--shiny']

    run_sys(args)

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
    print('{} loaded'.format(data))

    if args.type == 'qc':
        run_qc(proj, nthreads)
    elif args.type == 'kallisto':
        run_kallisto(proj, nthreads)
    elif args.type == 'sleuth':
        run_sleuth(proj)
