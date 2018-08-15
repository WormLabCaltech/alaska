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
        self.datetime_created = dt.datetime.now()
        self.datetime_started = None
        self.datetime_finished = None
        self.run_duration = None

        # self.save()

    def run(self):
        """
        Work to do.
        """
        self.datetime_started = dt.datetime.now()

        self.docker.run(self.docker_cmd, **self.docker_args)

        self.save()

    def finished(self):
        """
        Notifies that the job is done.
        """
        self.datetime_finished = dt.datetime.now()

        self.docker.terminate()

        # calculate run duration (in minutes)
        delta = self.datetime_finished - self.datetime_started
        self.run_duration = delta.total_seconds() / 60


        self.save() # save job info

    def save(self, folder=None):
        """
        Saves job information to JSON.
        """
        if folder is None: # if folder not given, save to project root
            path = Alaska.JOBS_DIR
        else:
            path = folder

        # convert all datetime objects to simple strings
        _datetime_created = self.datetime_created
        _datetime_started = self.datetime_started
        _datetime_finished = self.datetime_finished

        print(self.datetime_finished)

        if self.datetime_created is not None:
            self.datetime_created = self.datetime_created.strftime(Alaska.DATETIME_FORMAT)
        if self.datetime_started is not None:
            self.datetime_started = self.datetime_started.strftime(Alaska.DATETIME_FORMAT)
        if self.datetime_finished is not None:
            self.datetime_finished = self.datetime_finished.strftime(Alaska.DATETIME_FORMAT)

        with open('{}/{}.json'.format(path, self.id), 'w') as f:
            json.dump(self.__dict__, f, default=self.encode_json, indent=4)

        # restore datetime objects after saving
        self.datetime_created = _datetime_created
        self.datetime_started = _datetime_started
        self.datetime_finsihed = _datetime_finished

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
            elif key.startswith('datetime'):
                setattr(self, key, dt.datetime.strptime(item, Alaska.DATETIME_FORMAT))
            else:
                setattr(self, key, item)
