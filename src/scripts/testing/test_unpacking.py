import os
import subprocess
import shutil
import hashlib as hl

def md5_chksum(fname):
    """
    Calculates the md5 checksum of the given file at location.
    """
    md5 = hl.md5()

    # open file and read in blocks
    with open(fname, 'rb') as f:
        for chunk in iter(lambda: f.read(4096), b''):
            md5.update(chunk)

    return md5.hexdigest()

def new_proj():
    result = subprocess.check_output(['../../Request.sh', 'new_proj'])
    result = result.decode('utf-8').strip()
    results = result.split('\n')
    _id = results[-2].split(':')[0]

    return _id

def infer_samples(_id, md5s):
    result = subprocess.check_output(['../../Request.sh', 'infer_samples', '--id', _id])
    result = result.decode('utf-8').strip()

    for fname, md5 in md5s.items():
        if fname in result:
            print('.', end='')
        else:
            print('\n{} not in result'.format(fname))

        if md5 in result:
            print('x', end='')
        else:
            print('\n{} not in result'.format(md5))

    print()

def copy_reads_folder(_id):
    os.rmdir('../../root/projects/{}/0_raw_reads'.format(_id))
    shutil.copytree('../../test_samples/minimum', '../../root/projects/{}/0_raw_reads/'.format(_id))

def copy_reads_archive(_id):
    shutil.copy2('../../test_samples/minimum.tar.gz', '../../root/projects/{}/0_raw_reads/minimum.tar.gz'.format(_id))

def copy_reads_multiple(_id):
    os.rmdir('../../root/projects/{}/0_raw_reads'.format(_id))
    shutil.copytree('../../test_samples/multiple', '../../root/projects/{}/0_raw_reads/'.format(_id))

if __name__ == '__main__':

    testn = 10 # number of times to test each case

    md5s = {'18844_CCGTCC_L001_R1_001aa.fastq.gz': 'd4eb3295777b6556988f772158f6eaee',
            '18844_CCGTCC_L001_R1_002aa.fastq.gz': 'be800e0e845f528aef13a2427db9c28c',
            '18844_CCGTCC_L001_R1_003aa.fastq.gz': '71b355c1d54ac7c15513fca4a5d09dcc',
            '18844_CCGTCC_L002_R1_001aa.fastq.gz': '6d13e0c1844339fcb73f6efd321435ba',
            '18844_CCGTCC_L002_R1_002aa.fastq.gz': 'fb42a29875358fda7bc9a3fbb1b26db6',
            '18844_CCGTCC_L002_R1_003aa.fastq.gz': '006e33f74303d076b0e0dcb6d0563352',
            '18845_GTCCGC_L001_R1_001aa.fastq.gz': '2cd48438b23f51a2807dd8173d022dd6',
            '18845_GTCCGC_L001_R1_002aa.fastq.gz': '6356c494452e44696c66436bd437f473',
            '18845_GTCCGC_L001_R1_003aa.fastq.gz': '9797c44857a9ed9b9540d0fd87bbfdf2',
            '18845_GTCCGC_L002_R1_001aa.fastq.gz': 'aacca6b59e419e9814985aa44a0c76bb',
            '18845_GTCCGC_L002_R1_002aa.fastq.gz': '9395e721461d3bb91a9945bfe77c17d1',
            '18845_GTCCGC_L002_R1_003aa.fastq.gz': '63ad9c405c181ea74bdaf78ec85f7ed6',
            '18841_AGTCAA_L001_R1_001aa.fastq.gz': '1e84587cf4d07cf3f9945656765f50aa',
            '18841_AGTCAA_L001_R1_002aa.fastq.gz': '34f2ee199d90250019cde457f7f3af3b',
            '18841_AGTCAA_L001_R1_003aa.fastq.gz': 'cb9a4a1d4bd792d29a0d6d73834d83a4',
            '18841_AGTCAA_L002_R1_001aa.fastq.gz': '2d9b1c464bfabcea7fd021f0e07c60f6',
            '18841_AGTCAA_L002_R1_002aa.fastq.gz': '71b3aeb73a909292b7a65a9f2eea6131',
            '18841_AGTCAA_L002_R1_003aa.fastq.gz': 'e7403dd5536d9acf71065fc5ef9c89b1',
            '18842_AGTTCC_L001_R1_001aa.fastq.gz': '4467221cbd918be2c6799d3ecbd73113',
            '18842_AGTTCC_L001_R1_002aa.fastq.gz': '3679701aab7ae4ffe55ad8203813b284',
            '18842_AGTTCC_L001_R1_003aa.fastq.gz': '32eedc6587834a18005fa31984910217',
            '18842_AGTTCC_L002_R1_001aa.fastq.gz': '11b0a8f6c0e1e78907ef5d9c1513d93a',
            '18842_AGTTCC_L002_R1_002aa.fastq.gz': '811bf0c7dd01e13792285d4e82a57637',
            '18842_AGTTCC_L002_R1_003aa.fastq.gz': 'dc0b307190a6edabafe890e90c811aec'}



    # calculate md5s
    new_md5s = {}
    for root, dirs, files in os.walk('../../test_samples/minimum'):
        for fname in files:
            md5 = md5_chksum('{}/{}'.format(root, fname))
            print('{}: {}'.format(fname, md5))
            new_md5s[fname] = md5

    assert md5s == new_md5s, 'MD5\'s do not match those in record!.'

    print('***Start unarchiving test***')

    for i in range(testn):
        print('**entire folder archived into one file {}***'.format(i))
        _id = new_proj()
        print('\tNew project: {}'.format(_id))
        copy_reads_archive(_id)
        print('\tInfer samples')
        result = infer_samples(_id, md5s)


    for i in range(testn):
        print('***unarchived & divided into folders {}***'.format(i))
        _id = new_proj()
        print('\tNew project: {}'.format(_id))
        copy_reads_folder(_id)
        print('\tInfer samples')
        result = infer_samples(_id, md5s)


    for i in range(testn):
        print('***multiple archives {}***'.format(i))
        _id = new_proj()
        print('\tNew project: {}'.format(_id))
        copy_reads_multiple(_id)
        print('\tInfer samples')
        result = infer_samples(_id, md5s)
