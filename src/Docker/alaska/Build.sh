#!/bin/bash
# Builds the alaska_server image AND container with appropriate options.

source scripts/set_env_variables.sh

# build alaska image
docker build -t $DOCKER_ALASKA_TAG \
             --build-arg MINICONDA_VER="$MINICONDA_VER" \
             --build-arg MINICONDA3_URL="$MINICONDA3_URL" \
             --no-cache \
             Docker/alaska/

# create alaska container
docker create -it --name="$DOCKER_ALASKA_TAG" \
              -v $DOCKER_TIME_MOUNT \
              -v $DOCKER_SOCKET_MOUNT \
              -v $DOCKER_SCRIPT_MOUNT \
              -v $DOCKER_DATA_MOUNT \
              --restart unless-stopped \
              $DOCKER_ALASKA_TAG
