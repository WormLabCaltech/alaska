"""
AlaskaRequest.py

Author: Joseph Min (kmin@caltech.edu)

This script is to be called exclusively from the web portal (via HTML/PHP request).
Bridge between browser and server.
"""

import zmq
from Alaska import Alaska

class AlaskaRequest(Alaska):
    """
    AlaskaRequest
    """
    # messeging codes
    CODES = {
        'new_proj':             b'\x01',
        'load_proj':            b'\x02',
        'save_proj':            b'\x03',
        'infer_samples':        b'\x04',
        'set_proj':             b'\x05',
        'finalize_proj':        b'\x06',
        'read_quant':           b'\x07',
        'diff_exp':             b'\x08'
    }

    def __init__(self, port=8888):
        """
        AlaskaRequest constructor. Connects to given port.
        """
        self.id = '_{}'.format(self.rand_str(4))

        # connect to server
        self.PORT = port
        self.CONTEXT = zmq.Context()
        self.SOCKET = self.CONTEXT.socket(zmq.REQ)

    def send(self, msg):
        """
        Sends message to server.
        """
        # encode message to byte
        _id = self.id.encode()
        m = self.CODES[msg]

        print('Connecting to server on port {}'.format(self.PORT))
        self.SOCKET.setsockopt(zmq.IDENTITY, _id)
        self.SOCKET.connect('tcp://localhost:{}'.format(self.PORT))
        self.SOCKET.send(m)

        print('Waiting for response')
        response = self.SOCKET.recv_string()
        print('Here is the response:')
        print(response)


if __name__ == '__main__':
    import argparse

    request = AlaskaRequest()
    choices = request.CODES.keys()

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
        request.id = args.id

    print('Creating {} request'.format(args.action))
    # gate for actions
    request.send(args.action)
