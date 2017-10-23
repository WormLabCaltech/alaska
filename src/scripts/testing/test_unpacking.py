import os
import subprocess
import shutil

def new_proj():
    result = subprocess.check_output(['python', '../AlaskaRequest.py', 'new_proj'])
    result = result.decode('utf-8').strip()
    results = result.split('\n')
    _id = results[-2].split(':')[0]

    return _id

def copy_reads_folder(_id):
    shutil.copytree('../../test_samples/minimum', '../../root/projects/{}/0_raw_reads/reads'.format(_id))

def copy_reads_archive(_id):
    shutil.copy2('../../test_samples/minimum.tar.gz', '../../root/projects/{}/0_raw_reads/minimum.tar.gz'.format(_id))

if __name__ == '__main__':
    print('testing directories')
    _id = new_proj()
    print('id is {}'.format(_id))

    copy_reads_folder(_id)