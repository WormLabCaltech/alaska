#!/bin/bash
# Builds the alaska_cgi container with appropriate options.

source scripts/set_env_variables.sh

# create cgi container
docker create -it --name="$DOCKER_CGI_TAG" \
              -v $DOCKER_TIME_MOUNT \
              -v $DOCKER_SOCKET_MOUNT \
              -v $DOCKER_SCRIPT_MOUNT \
              -v $DOCKER_CGI_MOUNT \
              -p $DOCKER_CGI_PORT \
              --restart unless-stopped \
              $DOCKER_CGI_TAG

# exit with return value of the above command
exit $?
