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
    AlaskaDocker. An abstraction around the Docker Python API.
    Used to call qc, kallisto, and sleuth Docker images.

    Methods:
    run
    out_listener
    hook
    terminate
    """

    def __init__(self, img_tag):
        """
        Constructor.

        Arguments:
        img_tag -- (str) Docker tag of image

        Returns: None
        """
        self.img_tag = img_tag
        self.id = ''
        self.output = []
        self.running = False

    def run(self, cmd, **args):
        """
        Start container with the given.

        Arguments:
        cmd  -- (str) command to run on Docker image
        args -- arguments to pass to the docker.client.containers.run method

        Returns: None
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
        Listens container output and records it.

        Arguments: None

        Returns: None
        """
        for line in self.hook():
            line = line.decode(Alaska.ENCODING).strip()
            self.output += line

        self.running = False

    def hook(self):
        """
        Hooks onto stdout of container.

        Arguments: None

        Returns: None
        """
        client = docker.from_env()
        container = client.containers.get(self.id)
        hook = container.attach(stream=True)
        return hook

    def terminate(self):
        """
        Force terminates container.

        Arguments: None

        Returns: None
        """
        client = docker.from_env()
        container = client.containers.get(self.id)
        container.remove(force=True)
