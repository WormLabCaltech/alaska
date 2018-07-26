#!/bin/bash
# This script sets up alaska on a new machine

####### DEFINE VARIABLES #######
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

# First, check if the container is already running.
if [[ $(docker ps -a -f "name=$DOCKER_ALASKA_TAG" --format '{{.Names}}') != $DOCKER_ALASKA_TAG ]]
then
    printf "%s\n" "It seems there is a previous installation of Alaska. \
                    Are you sure you would like to reinstall? Continuing will \
                    remove the containers 'alaska' and 'alaska_cgi', as well \
                    as rebuilding all necessary Docker images. (Y/N)"
    read -p ">" choice
    case "$choice" in
        Y|y ) ;;
        * ) exit 0;;
    esac
fi

# remove old containers
docker container rm --force alaska
docker container rm --force alaska_cgi

# build alaska image
docker build -t $DOCKER_ALASKA_TAG Docker/alaska/

# build request image
docker build -t $DOCKER_REQUEST_TAG Docker/request/

# build qc image
docker build -t $DOCKER_QC_TAG Docker/qc/

# build kallisto image
docker build -t $DOCKER_KALLISTO_TAG Docker/kallisto/

# build sleuth image
docker build -t $DOCKER_SLEUTH_TAG Docker/sleuth/

# build cgi image
docker build -t $DOCKER_CGI_TAG Docker/cgi/

# make data volumes
docker volume create --name $DOCKER_SCRIPT_VOLUME
docker volume create --name $DOCKER_DATA_VOLUME

# create alaska container
docker create --name="$DOCKER_ALASKA_TAG" -it -v $DOCKER_TIME_MOUNT \
                                  -v $DOCKER_SOCKET_MOUNT \
                                  -v $DOCKER_SCRIPT_MOUNT \
                                  -v $DOCKER_DATA_MOUNT \
                                  --restart unless-stopped \
                                  alaska:latest

# create cgi container
docker create --name="$DOCKER_CGI_TAG" -it -v $DOCKER_TIME_MOUNT \
                                  -v $DOCKER_SOCKET_MOUNT \
                                  -v $DOCKER_SCRIPT_MOUNT \
                                  -v $DOCKER_DATA_MOUNT \
                                  -v $DOCKER_CGI_MOUNT \
                                  alaska_cgi:latest
