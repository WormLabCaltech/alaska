"""
Script for testing purposes.
"""
import zmq
import random
import time

def run(port=5555):

    ID = random.randint(1000, 9999)
    context = zmq.Context()

    # using zmp.REQ
    socket = context.socket(zmq.REQ)
    socket.setsockopt(zmq.IDENTITY, str(ID).encode())

    # connect to socket
    print('Connecting to server on port {}'.format(port))
    socket.connect('tcp://localhost:{}'.format(port))

    print('Begin sending messages')
    for i in range(20):
        socket.send_string(str(i))
        print('Sent message {}'.format(i))
        msg = socket.recv()
        print('Received message {}'.format(msg))
        time.sleep(1)

if __name__ == '__main__':
    run()