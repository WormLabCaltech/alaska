"""
AlaskaJob.py

Author: Joseph Min (kmin@caltech.edu)

This file contains the class AlaskaJob, which contains job information.
Managed by Alaskaserver.
"""
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

    def __init__(self, _id, name, proj, img_tag, cmd, **args):
        """
        Constructor.
        """
        self.id = _id # job id
        self.name = name
        self.proj = proj # project associated with this job
        self.docker = AlaskaDocker(img_tag)
        self.docker_cmd = cmd
        self.docker_args = args
        self.date_created = dt.datetime.now().strftime('%Y-%m-%d')
        self.time_created = dt.datetime.now().strftime('%H:%M:%S')
        self.date_started = ''
        self.time_started = ''
        self.date_finished = ''
        self.time_finished = ''

    def run(self):
        """
        Work to do.
        """
        self.date_started = dt.datetime.now().strftime('%Y-%m-%d')
        self.time_started = dt.datetime.now().strftime('%H:%M:%S')
        self.save()

        self.docker.run(self.docker_cmd, **self.docker_args)

    def finished(self):
        """
        Notifies that the job is done.
        """
        self.date_finished = dt.datetime.now().strftime('%Y-%m-%d')
        self.time_finished = dt.datetime.now().strftime('%H:%M:%S')
        self.save() # save job info


    def save(self, folder=None):
        """
        Saves job information to JSON.
        """
        if folder is None: # if folder not given, save to project root
            path = self.JOBS_DIR
        else:
            path = folder

        with open('{}/{}.json'.format(path, self.id), 'w') as f:
            json.dump(self.__dict__, f, default=self.encode_json, indent=4)


