#!/bin/bash
# Builds the alaska_cgi image with appropriate options.

source scripts/set_env_variables.sh

# build cgi image
docker build -t "$DOCKER_CGI_TAG:$VERSION" \
             --build-arg TIMEZONE=$TIMEZONE \
             --force-rm \
             --no-cache \
             Docker/cgi/

# exit with return value of the above command
exit $?
