#!/bin/bash

# Set up variables from set_env_variables.sh
source scripts/set_env_variables.sh

# remove any old cgi containers
docker stop $DOCKER_CGI_TAG
docker container rm --force $DOCKER_CGI_TAG

# remove any old alaska containers
docker stop $DOCKER_ALASKA_TAG
docker container rm --force $DOCKER_ALASKA_TAG

# make network
docker network create $DOCKER_ALASKA_NETWORK

# create alaska container
docker create -t --name="$DOCKER_ALASKA_TAG" \
              --network="$DOCKER_ALASKA_NETWORK" \
              -v $DOCKER_TIME_MOUNT \
              -v $DOCKER_SOCKET_MOUNT \
              -v $DOCKER_SCRIPT_MOUNT \
              -v $DOCKER_DATA_MOUNT \
              --restart unless-stopped \
              $DOCKER_ALASKA_TAG

# create cgi container
docker create -t --name="$DOCKER_CGI_TAG" \
              --network="$DOCKER_ALASKA_NETWORK" \
              -v $DOCKER_TIME_MOUNT \
              -v $DOCKER_SOCKET_MOUNT \
              -v $DOCKER_SCRIPT_MOUNT \
              -v $DOCKER_DATA_MOUNT \
              -v $DOCKER_CGI_MOUNT \
              -p $DOCKER_CGI_PORT \
              --restart unless-stopped \
              $DOCKER_CGI_TAG
