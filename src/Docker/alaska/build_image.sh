#!/bin/bash
# Builds the alaska_server image with appropriate options.

source scripts/set_env_variables.sh

# build alaska image
docker build -t $DOCKER_ALASKA_TAG \
             --build-arg MINICONDA_VER="$MINICONDA_VER" \
             --build-arg MINICONDA3_URL="$MINICONDA3_URL" \
             --no-cache \
             Docker/alaska/

# exit with return value of the above command
exit $?
