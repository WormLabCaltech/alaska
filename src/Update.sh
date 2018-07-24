#!/bin/bash

# Mounting point for Juancarlos's CGI folder.
DOCKER_CGI_MOUNT="/home/azurebrd/public_html/cgi-bin:/usr/lib/cgi-bin"

# This script sets up the cgi container.
DOCKER_CGI_TAG="alaska_cgi"

# remove any old cgi containers
docker container rm --force alaska_cgi

# build cgi image
docker build -t $DOCKER_CGI_TAG Docker/cgi/

# create cgi container
docker create --name="$DOCKER_CGI_TAG" -it -v "/etc/localtime:/etc/localtime:ro"\
                                  -v "/var/run/docker.sock:/var/run/docker.sock"\
                                  -v "alaska_script_volume:/alaska/scripts"\
                                  -v "alaska_data_volume:/alaska/root"\
                                  -v $DOCKER_CGI_MOUNT\
                                  alaska_cgi:latest
