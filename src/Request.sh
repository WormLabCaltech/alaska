#!/bin/bash
# This script sends a new request to the AlaskaServer
COMMAND="$1"
ID="$2 $3"

# Set up variables from set_env_variables.sh
source scripts/set_env_variables.sh

docker run -i --rm --network="container:$DOCKER_ALASKA_TAG" \
                -v $DOCKER_SCRIPT_MOUNT \
                -w "/alaska/scripts" \
                alaska_request:$VERSION \
                python AlaskaRequest.py ${COMMAND} ${ID}
