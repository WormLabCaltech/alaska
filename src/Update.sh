#!/bin/bash

# Set up variables from set_env_variables.sh
source scripts/set_env_variables.sh

docker container rm --force $DOCKER_ALASKA_TAG

docker build -t $DOCKER_ALASKA_TAG \
             --build-arg MINICONDA_VER="$MINICONDA_VER" \
             --build-arg MINICONDA3_URL="$MINICONDA3_URL" \
             --no-cache \
             Docker/alaska/

             # create alaska container
             docker create -t --name="$DOCKER_ALASKA_TAG" \
                           -v $DOCKER_TIME_MOUNT \
                           -v $DOCKER_SOCKET_MOUNT \
                           -v $DOCKER_SCRIPT_MOUNT \
                           -v $DOCKER_DATA_MOUNT \
                           --restart unless-stopped \
                           $DOCKER_ALASKA_TAG
