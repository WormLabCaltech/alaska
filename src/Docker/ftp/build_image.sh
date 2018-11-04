#!/bin/bash
# Builds the alaska_ftp image with appropriate options.
source scripts/set_env_variables.sh

# build ftp image
docker build -t $DOCKER_FTP_TAG \
             --no-cache \
             Docker/ftp/

# exit with return value of the above command
exit $?
