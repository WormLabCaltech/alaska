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
        'check':                b'\x00', # empty request for pinging server
        'new_proj':             b'\x01', # create new project
        'load_proj':            b'\x02', # load project from JSON
        'save_proj':            b'\x03', # save project to JSON
        'infer_samples':        b'\x04', # extract raw reads and infer samples
        'get_idx':              b'\x05', # get list of avaliable indices
        'new_sample':           b'\x06', # create new sample with unique id
        'set_proj':             b'\x07', # set project data by reading temporary JSON
        'finalize_proj':        b'\x08', # finalize project
        'read_quant':           b'\x09', # perform read quantification
        'diff_exp':             b'\x10', # perform differential expression
        'proj_status':          b'\x11', # check project status
        'save':                 b'\x94', # saves server state
        'load':                 b'\x95', # loads server state
        'log':                  b'\x96', # force log
        'update_idx':           b'\x97', # force index update
        'start':                b'\x98', # start server
        'stop':                 b'\x99'  # stop server
    }

    def __init__(self, port=8888):
        """
        AlaskaRequest constructor. Connects to given port.
        """
        self.id = '_{}'.format(self.rand_str(4))

        # connect to server
        self.PORT = port
        self.CONTEXT = zmq.Context()
        self.SOCKET = self.CONTEXT.socket(zmq.DEALER)

    def send(self, msg):
        """
        Sends message to server.
        """
        # encode message to byte
        _id = self.id.encode()
        m = self.CODES[msg]

        # TODO: how to tell if server is online?
        print('Connecting to server on port {}'.format(self.PORT))
        self.SOCKET.setsockopt(zmq.IDENTITY, _id)
        self.SOCKET.connect('tcp://localhost:{}'.format(self.PORT))

        if self.check():
            self.SOCKET.send(m)
            print('Connected successfully')
            self.listen()
        else:
            print('Error connecting to server')
            self.SOCKET.close()
            self.CONTEXT.term()
            quit()

    def check(self):
        """
        Check if server is responding correctly.
        """
        self.SOCKET.send(self.CODES['check'])

        # use poller for timeout
        poller = zmq.Poller()
        poller.register(self.SOCKET, zmq.POLLIN)

        if poller.poll(3*1000): # wait for 3 seconds
            response = self.SOCKET.recv_string()
            if response == self.id:
                return True
            else:
                return False
        else:
            return False

    def listen(self):
        """
        Listen for responses.
        """
        print('Waiting for response')
        while True:
            response = self.SOCKET.recv_string()
            print(response)

            # stop listening if message starts with END
            if response.endswith('END'):
                self.SOCKET.close()
                self.CONTEXT.term()
                quit()
                break


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
