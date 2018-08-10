#!/bin/bash
# Builds the alaska_sleuth image with appropriate options.
source scripts/set_env_variables.sh

# build request image
docker build -t $DOCKER_SLEUTH_TAG \
             --build-arg SLEUTH_VER="$SLEUTH_VER" \
             --no-cache \
             Docker/sleuth/
