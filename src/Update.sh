#!/bin/bash

# Set up variables from set_env_variables.sh
source scripts/set_env_variables.sh

# remove any old cgi containers
docker stop $DOCKER_CGI_TAG
docker container rm --force $DOCKER_CGI_TAG

# build cgi image
docker build -t $DOCKER_CGI_TAG Docker/cgi/

# create cgi container
docker create --name="$DOCKER_CGI_TAG" -it -v $DOCKER_TIME_MOUNT \
                                  -v $DOCKER_SOCKET_MOUNT \
                                  -v $DOCKER_SCRIPT_MOUNT \
                                  -v $DOCKER_DATA_MOUNT \
                                  -v $DOCKER_CGI_MOUNT \
                                  -p $DOCKER_CGI_PORT \
                                  alaska_cgi:latest
