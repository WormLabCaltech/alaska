#!/bin/bash
# Builds the alaska_server container with appropriate options.
source scripts/set_env_variables.sh

# create alaska container
docker create -it --name="$DOCKER_ALASKA_TAG" \
              -v $DOCKER_SOCKET_MOUNT \
              -v $DOCKER_SCRIPT_MOUNT \
              -v $DOCKER_DATA_MOUNT \
              --network host \
              --restart unless-stopped \
              $DOCKER_ALASKA_TAG:$VERSION

# exit with return value of the above command
exit $?
