#!/bin/bash

# 07/03/2018
# # This script updates the server with the option --restart unless-stopped.
#
# DOCKER_ALASKA_TAG="alaska"
#
# # remove old container
# docker container rm --force alaska
#
# # build alaska image
# docker build -t $DOCKER_ALASKA_TAG Docker/alaska/
#
# # create alaska container
# docker create --name="$DOCKER_ALASKA_TAG" -it -v "/etc/localtime:/etc/localtime:ro"\
#                                   -v "/var/run/docker.sock:/var/run/docker.sock"\
#                                   -v "alaska_script_volume:/alaska/scripts"\
#                                   -v "alaska_data_volume:/alaska/root"\
#                                   --restart unless-stopped\
#                                   alaska:latest

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
                                  alaska_cgi:latest
