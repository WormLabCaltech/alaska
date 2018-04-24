"""Contains the AlaskaDocker class.

The AlaskaDocker class is a wrapper around the Docker Python API, which is
used to manage the spawning/monitoring/termination of Docker images and
containers. All containers spawned by Alaska is spawned through an
AlaskaDocker object.
"""

__author__ = 'Kyung Hoi (Joseph) Min'
__copyright__ = 'Copyright 2017 WormLabCaltech'
__credits__ = ['David Angeles', 'Raymond Lee', 'Juancarlos Chan']
__license__ = "MIT"
__version__ = "alpha"
__maintainer__ = "Kyung Hoi (Joseph) Min"
__email__ = "kmin@caltech.edu"
__status__ = "alpha"

import docker
from Alaska import Alaska
from threading import Thread

class AlaskaDocker(Alaska):
    """
    AlaskaDocker.
    """

    def __init__(self, img_tag):
        """
        Constructor. Takes docker image tag and volumes as argument.
        """
        self.img_tag = img_tag
        self.id = ''
        self.output = []
        self.running = False

    def run(self, cmd, **args):
        """
        Start container with arguments.
        """
        client = docker.from_env()
        container = client.containers.run(self.img_tag, cmd, detach=True,
                        auto_remove=False, **args)
        self.id = container.short_id
        self.running = True

        # t = Thread(target=self.out_listener)
        # t.daemon = True
        # t.start()

    def out_listener(self):
        """
        Listens container output and records.
        """
        for l in self.hook():
            l = l.decode(Alaska.ENCODING).strip()
            self.output += l

        self.running = False

    def hook(self):
        """
        Hooks onto stdout of container.
        """
        client = docker.from_env()
        container = client.containers.get(self.id)
        hook = container.attach(stream=True)
        return hook

    def terminate(self):
        """
        Force terminates container.
        """
        client = docker.from_env()
        container = client.containers.get(self.id)
        container.remove(force=True)


