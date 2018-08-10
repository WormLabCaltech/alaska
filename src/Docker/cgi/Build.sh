#!/bin/bash
# Builds the cgi image AND container with appropriate options.

source scripts/set_env_variables.sh

# build cgi image
docker build -t $DOCKER_CGI_TAG Docker/cgi/

# create cgi container
docker create -it --name="$DOCKER_CGI_TAG" \
              -v $DOCKER_TIME_MOUNT \
              -v $DOCKER_SOCKET_MOUNT \
              -v $DOCKER_SCRIPT_MOUNT \
              -v $DOCKER_CGI_MOUNT \
              -p $DOCKER_CGI_PORT \
              --restart unless-stopped \
              $DOCKER_CGI_TAG
