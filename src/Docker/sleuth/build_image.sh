#!/bin/bash
# Builds the alaska_sleuth image with appropriate options.
source scripts/set_env_variables.sh

# build request image
docker build -t $DOCKER_SLEUTH_TAG \
             --build-arg MINICONDA_VER="$MINICONDA_VER" \
             --build-arg MINICONDA3_URL="$MINICONDA3_URL" \
             --build-arg SLEUTH_VER="$SLEUTH_VER" \
             --no-cache \
             Docker/sleuth/

# exit with return value of the above command
exit $?
