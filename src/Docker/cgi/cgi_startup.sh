#!/bin/bash
# This script is run when the cgi container is started.
# The docker socket must be owned by the docker group.
chown :docker /var/run/docker.sock

# Then, run the apache server.
a2enmod cgi
apachectl -D FOREGROUND
