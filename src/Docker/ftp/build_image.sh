#!/bin/bash
# Builds the alaska_ftp image with appropriate options.
source scripts/set_env_variables.sh

# build ftp image
docker build -t $DOCKER_FTP_TAG \
             --build-arg TIMEZONE=$TIMEZONE \
             --no-cache \
             Docker/ftp/

# exit with return value of the above command
exit $?
