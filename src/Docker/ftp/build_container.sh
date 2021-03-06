#!/bin/bash
# Builds the alaska_ftp container with appropriate options.
source scripts/set_env_variables.sh

# create ftp container
docker create -it --name="$DOCKER_FTP_TAG" \
              -v $DOCKER_DATA_MOUNT \
              -v $DOCKER_FTP_MOUNT \
              -p $DOCKER_FTP_PORT \
              -p $DOCKER_FTP_PORTS \
              -e "$DOCKER_FTP_HOST" \
              -e "$DOCKER_FTP_FLAGS" \
              -e "TZ=$TIMEZONE" \
              --restart unless-stopped \
              $DOCKER_FTP_BASE

# exit with return value of the above command
exit $?
