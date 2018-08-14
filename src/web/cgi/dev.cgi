#!/usr/bin/env python

# Python cgi script for development/debugging.
import sys
sys.stderr = sys.stdout
import cgi
import cgitb
cgitb.enable()

def run_sys(cmd):
    """
    Runs a system command and echos all output.
    This function blocks until command execution is terminated.
    """
    with sp.Popen(cmd, stdout=sp.PIPE, stderr=sp.STDOUT, bufsize=1, universal_newlines=True) as p:
        output = ''

        while p.poll() is None:
            line = p.stdout.readline()
            if not line.isspace() and len(line) > 1:
                output += line
                print(line, end='')
                sys.stdout.flush()
        p.stdout.read()
        p.stdout.close()

    if p.returncode != 0:
        sys.exit('command terminated with non-zero return code {}!'.format(p.returncode))
    return output


request_script = '/alaska/scripts/cgi_request.sh'

print('Content-Type: text/plain\n')

# Get input data.
form = cgi.FieldStorage()
command = form['command'].value
args = [request_script] + command.split(' ')

run_sys(args)
