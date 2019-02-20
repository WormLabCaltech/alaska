#!/bin/bash
# Builds the alaska_request image with appropriate options.
source scripts/set_env_variables.sh

# build request image
docker build -t $DOCKER_REQUEST_TAG \
             --build-arg TIMEZONE="$TIMEZONE" \
             --build-arg MINICONDA_VER="$MINICONDA_VER" \
             --build-arg MINICONDA3_URL="$MINICONDA3_URL" \
             --no-cache \
             Docker/request/

# exit with return value of the above command
exit $?
