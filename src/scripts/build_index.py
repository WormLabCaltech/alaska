# build_index.py
import os
import sys
import time
import datetime as dt
import subprocess as sp

def run_sys(cmd, prefix='', file=None):
    """
    Runs a system command and echos all output.
    This function blocks until command execution is terminated.
    """
    for i in range(len(cmd)):
        if not isinstance(cmd[i], str):
            cmd[i] = str(cmd[i])
    print(' '.join(cmd))

    with sp.Popen(cmd, stdout=sp.PIPE, stderr=sp.STDOUT, bufsize=1, universal_newlines=True) as p:
        output = '# process started {}\n'.format(get_current_datetime())
        output += '# ' + ' '.join(cmd) + '\n'

        if file is not None:
            file.write(output)

        while p.poll() is None:
            line = p.stdout.readline()
            if not line.isspace() and len(line) > 1:
                if file is not None:
                    file.write(line)
                output += line
                print(prefix + ': ' + line, end='')
                sys.stdout.flush()
        p.stdout.read()
        # p.stderr.read()
        p.stdout.close()
        # p.stderr.close()

        last = '# process finished {}\n'.format(get_current_datetime())
        output += last
        if file is not None:
            file.write(last)

    time.sleep(1)

    if p.returncode != 0:
        sys.exit('command terminated with non-zero return code!')
    return output

def get_current_datetime():
    """
    Returns current date and time as a string.
    """
    now = dt.datetime.now()
    return now.strftime('%Y-%m-%d %H:%M:%S')

def build_bowtie2(dna, out, nthreads):
    """
    Builds bowtie2 index.
    """
    if os.path.isfile('bowtie2_log.txt'):
        os.remove('bowtie2_log.txt')

    with open('bowtie2_log.txt', 'a') as f:
        args = ['bowtie2-build', dna, out, '--threads', nthreads]
        output = run_sys(args, prefix='bowtie2', file=f)

    # if execution comes here, the command ran successfully
    with open('bowtie2_log.txt', 'a') as f:
        f.write('# success')



def build_kallisto(cdna, out):
    """
    Builds kallisto index.
    """
    if os.path.isfile('kallisto_log.txt'):
        os.remove('kallisto_log.txt')

    with open('kallisto_log.txt', 'a') as f:
        args = ['kallisto', 'index', '-i', out, cdna]
        output = run_sys(args, prefix='kallisto', file=f)

    # if execution comes here, the command ran successfully
    with open('kallisto_log.txt', 'a') as f:
        f.write('# success')


if __name__ == '__main__':
    import argparse

    parser = argparse.ArgumentParser(description='Build indices.')
    parser.add_argument('index', choices=['bowtie2', 'kallisto', 'all'])
    parser.add_argument('--threads', type=int, default=1)
    args = parser.parse_args()

    out = 'index'
    ref = 'reference'
    dna = None
    cdna = None

    for f in os.listdir(ref):
        if '_dna' in f:
            dna = f
        elif '_cdna' in f:
            cdna = f

    if dna is None or cdna is None:
        raise Exception('Failed to find necessary files.')

    # actual path to dna and cdna
    dna_path = '{}/{}'.format(ref, dna)
    cdna_path = '{}/{}'.format(ref, cdna)

    # extract genus species and reference version
    split = dna.split('_')
    genus = split[0]
    species = split[1]
    ver = split[2]

    # output paths
    prefix = '{}_{}_{}'.format(genus, species, ver)
    bt2_out = '{}/{}'.format(out, prefix)
    kal_out = '{}/{}.idx'.format(out, prefix)

    # build bowtie2 index
    if args.index == 'kallisto' or args.index == 'all':
        build_bowtie2(dna_path, bt2_out, args.threads)

    # build kallisto index
    if args.index == 'bowtie2' or args.index == 'all':
        build_kallisto(cdna_path, kal_out)
