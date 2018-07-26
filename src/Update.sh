#!/bin/bash

####### DEFINE VARIABLES ####### these are taken directly from Setup.sh
# Docker image tags.
DOCKER_SCRIPT_VOLUME="alaska_script_volume"
DOCKER_DATA_VOLUME="alaska_data_volume"
DOCKER_ALASKA_TAG="alaska"
DOCKER_REQUEST_TAG="alaska_request"
DOCKER_QC_TAG="alaska_qc"
DOCKER_KALLISTO_TAG="alaska_kallisto"
DOCKER_SLEUTH_TAG="alaska_sleuth"
DOCKER_CGI_TAG="alaska_cgi"

# Mounting points.
DOCKER_TIME_MOUNT="/etc/localtime:/etc/localtime:ro"
DOCKER_SOCKET_MOUNT="/var/run/docker.sock:/var/run/docker.sock"
DOCKER_SCRIPT_MOUNT="alaska_script_volume:/alaska/scripts"
DOCKER_DATA_MOUNT="alaska_data_volume:/alaska/root"
DOCKER_CGI_MOUNT="/home/azurebrd/public_html/cgi-bin:/usr/lib/cgi-bin"
####### END VARIABLE DEFINITIONS #######

# remove any old cgi containers
docker container rm --force alaska_cgi

# build cgi image
docker build -t $DOCKER_CGI_TAG Docker/cgi/

# create cgi container
docker create --name="$DOCKER_CGI_TAG" -it -v $DOCKER_TIME_MOUNT \
                                  -v $DOCKER_SOCKET_MOUNT \
                                  -v $DOCKER_SCRIPT_MOUNT \
                                  -v $DOCKER_DATA_MOUNT \
                                  -v $DOCKER_CGI_MOUNT \
                                  alaska_cgi:latest
