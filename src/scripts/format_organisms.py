'''
This script renames all the cdna, dna, and annotation files in subdirectories.
It also calls bigBedTobed to convert .bb files to .bed files.
'''

import os
import subprocess as sp

def convert_bb_to_bed(bb, bed):
    '''
    Converts a .bb file to a .bed file using bigBedTobed.
    '''
    print('Converting {} to {}'.format(bb, bed))
    with sp.Popen(['bigBedTobed', bb, bed],
                  stdout=sp.PIPE, stderr=sp.STDOUT) as p:

        while p.poll() is None:
            line = p.stdout.readline()

        # Check that the program exited correctly.
        if p.returncode != 0:
            raise Exception('Error occurred while running process')

def rename_files(dirpath, filenames):
    '''
    Renames the files in the directory appropriately.
    Also converts the .bb file to .bed
    '''
    print('Renaming {}'.format(dirpath))

    dirpath_split = dirpath.split(os.path.sep)
    organism_prefix = '{}_{}_{}'.format(dirpath_split[-4][0],
                                        dirpath_split[-3],
                                        dirpath_split[-2])
    annotation_new = '{}_annotation.tsv'.format(organism_prefix)
    bed_new = '{}.bed'.format(organism_prefix)
    dna_new = '{}_dna.fa.gz'.format(organism_prefix)
    cdna_new = '{}_cdna.fa.gz'.format(organism_prefix)

    if all(f in filenames for f in [annotation_new, bed_new, dna_new, cdna_new]):
        print('{} already done'.format(dirpath))
        return

    prefix = '{}{}'.format(dirpath, os.path.sep)
    annotation_new_path = '{}{}'.format(prefix, annotation_new)
    bed_new_path = '{}{}'.format(prefix, bed_new)
    dna_new_path = '{}{}'.format(prefix, dna_new)
    cdna_new_path = '{}{}'.format(prefix, cdna_new)

    # Extract each file.
    bb = None
    cdna = None
    dna = None
    annotation = None
    for fname in filenames:
        if fname.endswith('.tsv'):
            annotation = fname
        elif fname.endswith('.bb'):
            bb = fname
        elif 'genomic' in fname:
            dna = fname
        elif 'transcripts' in fname:
            cdna = fname

    if None in [bb, cdna, dna, annotation]:
        raise Exception('Missing file in {}'.format(dirpath))

    # Rename variables.
    bb_path = '{}{}'.format(prefix, bb)
    cdna_path = '{}{}'.format(prefix, cdna)
    dna_path = '{}{}'.format(prefix, dna)
    annotation_path = '{}{}'.format(prefix, annotation)

    # Rename.
    os.rename(annotation_path, annotation_new_path)
    os.rename(dna_path, dna_new_path)
    os.rename(cdna_path, cdna_new_path)

    # Convert .bb to .bed
    convert_bb_to_bed(bb_path, bed_new_path)


if __name__ == '__main__':
    import argparse

    parser = argparse.ArgumentParser()
    parser.add_argument('-p', '--path', type=str, default='.',
                        help='root path (default: current directory)')
    args = parser.parse_args()

    path = args.path

    for dirpath, dirnames, filenames in os.walk(path):
        if not dirnames:
            rename_files(dirpath, filenames)
