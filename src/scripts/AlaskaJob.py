"""Contains the AlaskaJob class.

Computationally-intense processes are managed by creating AlaskaJob objects.
The AlaskaJob class serves as an intermediary between the AlaskaServer and
AlaskaDocker. Specifically, this class provides abstractions that simplify
spawning containers, reading their output and terminating them. Quality
control, read alignment and differential expression analysis are done by using
this class.
"""

__author__ = 'Kyung Hoi (Joseph) Min'
__copyright__ = 'Copyright 2017 WormLabCaltech'
__credits__ = ['David Angeles', 'Raymond Lee', 'Juancarlos Chan']
__license__ = "MIT"
__version__ = "alpha"
__maintainer__ = "Kyung Hoi (Joseph) Min"
__email__ = "kmin@caltech.edu"
__status__ = "alpha"

import io
import contextlib as cl
import json
import datetime as dt
from Alaska import Alaska
from AlaskaDocker import AlaskaDocker

class AlaskaJob(Alaska):
    """
    AlaskaJob.
    """

    def __init__(self, _id, name=None, proj_id=None, img_tag=None, cmd=None, **args):
        """
        Constructor.
        """
        self.id = _id # job id
        self.name = name
        self.proj_id = proj_id # project associated with this job
        self.docker = AlaskaDocker(img_tag)
        self.docker_cmd = cmd
        self.docker_args = args
        self.date_created = dt.datetime.now().strftime('%Y-%m-%d')
        self.time_created = dt.datetime.now().strftime('%H:%M:%S')
        self.date_started = ''
        self.time_started = ''
        self.date_finished = ''
        self.time_finished = ''

        # self.save()

    def run(self):
        """
        Work to do.
        """
        self.date_started = dt.datetime.now().strftime('%Y-%m-%d')
        self.time_started = dt.datetime.now().strftime('%H:%M:%S')

        self.docker.run(self.docker_cmd, **self.docker_args)

        self.save()

    def finished(self):
        """
        Notifies that the job is done.
        """
        self.date_finished = dt.datetime.now().strftime('%Y-%m-%d')
        self.time_finished = dt.datetime.now().strftime('%H:%M:%S')

        self.docker.terminate()

        self.save() # save job info

    def save(self, folder=None):
        """
        Saves job information to JSON.
        """
        if folder is None: # if folder not given, save to project root
            path = Alaska.JOBS_DIR
        else:
            path = folder

        with open('{}/{}.json'.format(path, self.id), 'w') as f:
            json.dump(self.__dict__, f, default=self.encode_json, indent=4)

    def load(self, folder=None, proj=None):
        """
        Load job from JSON.
        """
        if folder is None:
            path = Alaska.JOBS_DIR
        else:
            path = folder

        with open('{}/{}.json'.format(path, self.id), 'r') as f:
            loaded = json.load(f)

        if not loaded['id'] == self.id:
            raise Exception('ERROR: job id {} does not match JSON id {}'
                            .format(self.id, loaded['id']))

        for key, item in loaded.items():
            if key == 'docker':
                self.docker = AlaskaDocker(item['img_tag'])
            else:
                setattr(self, key, item)

