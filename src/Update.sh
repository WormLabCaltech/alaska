#!/bin/bash
# This script updates the server with the option --restart unless-stopped.

DOCKER_ALASKA_TAG="alaska"

# remove old container
docker container rm --force alaska

# build alaska image
docker build -t $DOCKER_ALASKA_TAG Docker/alaska/

# create alaska container
docker create --name="$DOCKER_ALASKA_TAG" -it -v "/etc/localtime:/etc/localtime:ro"\
                                  -v "/var/run/docker.sock:/var/run/docker.sock"\
                                  -v "alaska_script_volume:/alaska/scripts"\
                                  -v "alaska_data_volume:/alaska/root"\
                                  --restart unless-stopped\
                                  alaska:latest
