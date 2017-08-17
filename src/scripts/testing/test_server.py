"""
Script for testing purposes.
"""
import zmq

def run(port=5555):
    context = zmq.Context()

    # using zmq.ROUTER
    socket = context.socket(zmq.ROUTER)

    # bind socket
    socket.bind('tcp://*:{}'.format(port))

    while True:
        msg = socket.recv_multipart()
        print('Received message {}'.format(msg))
        socket.send_multipart([msg[0], b'', b'RECEIVED'])

if __name__ == '__main__':
    run()