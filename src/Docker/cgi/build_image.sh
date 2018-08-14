#!/bin/bash
# Builds the alaska_cgi image with appropriate options.

source scripts/set_env_variables.sh

# build cgi image
docker build -t $DOCKER_CGI_TAG \
             --build-arg MINICONDA_VER="$MINICONDA_VER" \
             --build-arg MINICONDA3_URL="$MINICONDA3_URL" \
             --no-cache \
             Docker/cgi/

# exit with return value of the above command
exit $?