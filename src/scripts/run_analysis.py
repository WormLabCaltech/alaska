# run_analysis.py
# This file is intended to be copied into the project folder.
# It runs the appropriate analysis on all samples in a directory-independent manner.
# (i.e. Does not require absolute path.)

import os
import json
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
    p = sp.Popen(cmd, stdout=sp.PIPE, stderr=sp.STDOUT, universal_newlines=True)
    output = ''

    for line in p.stdout:
        if not line.isspace():
            print(prefix + ': ' + line, end='')
        output += line

    return output

def run_kallisto(proj):
    """
    Runs read quantification with Kallisto.
    Assumes that the indices are in the folder /organisms
    """
    def bam_to_bai(_id, path):
        """
        Helper function to call samtools to convert .bam to .bam.bai
        """
        for f in os.listdir(path):
            if f.endswith('.bam'):
                bam_path = '{}/{}'.format(path, f)
        args = ['samtools', 'index', bam_path]
        run_sys(args, prefix=_id)


    print('{} samples detected...'.format(len(proj['samples'])), end='')
    for _id in proj['samples']:
        print(_id, end=' ')
    print()

    for _id in proj['samples']:
        path = './2_alignment/{}'.format(_id)

        args = ['kallisto', 'quant']

        # first find the index
        org = proj['samples'][_id]['organism'].split('_')
        ver = str(proj['samples'][_id]['ref_ver'])
        idx_path = '/organisms/{}/{}/{}/index'.format(org[0], org[1], ver)
        idx_path += '/{}_{}_{}.idx'.format(org[0][0], org[1], ver)
        arg = ['-i', idx_path]
        args += arg

        # find the output directory
        arg = ['-o', path]
        args += arg

        # find the number of bootstraps
        arg = ['-b', str(proj['samples'][_id]['bootstrap_n'])]
        args += arg

        # number of threads
        arg = ['-t', '3']

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

        # pseudobam
        arg = ['--pseudobam']
        args += arg

        # finally, add the sample reads
        for read in proj['samples'][_id]['reads']:
            args.append('./0_raw_reads/{}'.format(read))

        # run_sys(args, prefix=_id)

        bam_to_bai(_id, path)


def run_qc(proj):
    """
    Runs read quantification with RSeQC, FastQC and MultiQC.
    """
    def read_distribution(_id, path, bed_path):
        """
        Helper function to run read_distribution.py
        """
        args = ['read_distribution.py']
        arg = ['-i', bam_path]
        args += arg
        arg = ['-r', bed_path]
        args += arg

        # print(args)
        output = run_sys(args, prefix=_id)
        # output file
        with open('{}/{}_distribution.txt'.format(path, _id), 'w') as out:
            out.write(output)


    def geneBody_coverage(_id, path, bed_path):
        """
        Helper function to run geneBody_coverage.py
        """
        args = ['geneBody_coverage.py']
        arg = ['-i', bam_path]
        args += arg
        arg = ['-r', bed_path]
        args += arg
        arg = ['-o', '{}/{}_coverage'.format(path, _id)]
        args += arg

        run_sys(args, prefix=_id)

    def tin(_id, path, bed_path):
        """
        Helper function to run tin.py
        """
        args = ['tin.py']
        arg = ['-i', bam_path]
        args += arg
        arg = ['-r', bed_path]
        args += arg

        output = run_sys(args, prefix=_id)
        # output file
        with open('{}/{}_tin.txt'.format(path, _id), 'w') as out:
            out.write(output)

    def fastqc(_id, path, bed_path):
        """
        Helper function to run fastqc.
        """
        pass

    def multiqc(_id, path):
        """
        Helper function to run multiqc.
        """
        args = ['multiqc', path]
        run_sys(args, prefix=_id)
    ########## HELPER FUNCTIONS END HERE ###########

    print('{} samples detected...'.format(len(proj['samples'])), end='')
    for _id in proj['samples']:
        print(_id, end=' ')
    print()

    for _id in proj['samples']:
        # define necessary variables
        path = './2_alignment/{}'.format(_id)
        # find bam file
        for f in os.listdir(path):
            if f.endswith('.bam'):
                bam_path = '{}/{}'.format(path, f)
                break
        # find reference bed file
        org = proj['samples'][_id]['organism'].split('_')
        ver = str(proj['samples'][_id]['ref_ver'])
        bed_path = '/organisms/{}/{}/{}/reference'.format(org[0], org[1], ver)
        bed_path += '/{}_{}_{}.bed'.format(org[0][0], org[1], ver)

        # read_distribution.py
        # read_distribution(_id, path, bed_path)

        # geneBody_coverage.py
        # geneBody_coverage(_id, path, bed_path)

        # tin.py
        tin(_id, path, bed_path)

        # FastQC

        # MultiQC

def run_sleuth(proj):
    """
    Runs differential expression analysis with sleuth.
    Assumes that the design matrix is already present in the directory.
    """
    pass

if __name__ == '__main__':
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

    # Kallisto.
    run_kallisto(proj)

    # TODO: convert kallisto sam/bam to bam

    # QC.
    run_qc(proj)

