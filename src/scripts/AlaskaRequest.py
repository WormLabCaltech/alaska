"""Contains the AlaskaRequest class.

The AlaskaRequest class is used to run commands on the AlaskaServer.
When run from the command line, this script creates an AlaskaRequest and sends
that to the AlaskaServer.
"""

__author__ = 'Kyung Hoi (Joseph) Min'
__copyright__ = 'Copyright 2017 WormLabCaltech'
__credits__ = ['David Angeles', 'Raymond Lee', 'Juancarlos Chan']
__license__ = "MIT"
__version__ = "alpha"
__maintainer__ = "Kyung Hoi (Joseph) Min"
__email__ = "kmin@caltech.edu"
__status__ = "alpha"
import zmq
import sys
from Alaska import Alaska

class AlaskaRequest(Alaska):
    """
    AlaskaRequest
    """

    def __init__(self, port=8888, _id=None):
        """
        AlaskaRequest constructor. Connects to given port.
        """
        if _id is None:
            self.id = '_{}'.format(self.rand_str(4))
        else:
            self.id = _id

        # connect to server
        self.PORT = port
        self.CONTEXT = zmq.Context()
        self.SOCKET = self.CONTEXT.socket(zmq.DEALER)
        self.SOCKET.setsockopt(zmq.IDENTITY, _id)

    def send(self, msg):
        """
        Sends message to server.
        """
        # encode message to byte
        _id = self.id.encode()
        m = Alaska.CODES[msg]

        # TODO: how to tell if server is online?
        print('INFO: Connecting to server on port {}'.format(self.PORT))
        self.SOCKET.connect('tcp://localhost:{}'.format(self.PORT))

        if self.check():
            self.SOCKET.send(m)
            print('INFO: Connected successfully')
            self.listen()
        else:
            print('ERROR: Error connecting to server')
            self.SOCKET.close()
            self.CONTEXT.term()
            sys.exit(1)

    def check(self):
        """
        Check if server is responding correctly.
        """
        self.SOCKET.send(Alaska.CODES['check'])

        # use poller for timeout
        poller = zmq.Poller()
        poller.register(self.SOCKET, zmq.POLLIN)

        if poller.poll(3*1000): # wait for 3 seconds
            response = self.SOCKET.recv_multipart()
            if response[0] == self.id:
                return True
            else:
                return False
        else:
            return False

    def listen(self):
        """
        Listen for responses.
        """
        print('INFO: Waiting for response')
        print('-' * 30)
        while True:
            response = self.SOCKET.recv_multipart()
            print(response[1])

            # stop listening if message starts with END
            if response[1].endswith('END'):
                self.SOCKET.close()
                self.CONTEXT.term()
                quit()
                break


if __name__ == '__main__':
    import argparse
    choices = Alaska.CODES.keys()

    # command line arguments
    parser = argparse.ArgumentParser(description='Send request to AlaskaServer.')
    parser.add_argument('action',
                        type=str,
                        choices=choices)
    parser.add_argument('--id',
                        type=str,
                        default=None)

    args = parser.parse_args()

    # assign ID if given
    if args.id is not None:
        print('ID: {}'.format(args.id))
    request = AlaskaRequest(_id=args.id)

    print('INFO: Creating {} request'.format(args.action))

    # gate for actions
    request.send(args.action)
