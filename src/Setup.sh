#!/bin/bash
# This script sets up alaska on a new machine

# Set up variables from set_env_variables.sh
source scripts/set_env_variables.sh

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

# make network
docker network create $DOCKER_ALASKA_NETWORK

# create alaska container
docker create --name="$DOCKER_ALASKA_TAG" \
              --network="$DOCKER_ALASKA_NETWORK" \
              -v $DOCKER_TIME_MOUNT \
              -v $DOCKER_SOCKET_MOUNT \
              -v $DOCKER_SCRIPT_MOUNT \
              -v $DOCKER_DATA_MOUNT \
              --restart unless-stopped \
              alaska:latest

# create cgi container
docker create --name="$DOCKER_CGI_TAG"
              --network="$DOCKER_ALASKA_NETWORK" \
              -v $DOCKER_TIME_MOUNT \
              -v $DOCKER_SOCKET_MOUNT \
              -v $DOCKER_SCRIPT_MOUNT \
              -v $DOCKER_DATA_MOUNT \
              -v $DOCKER_CGI_MOUNT \
              -p $DOCKER_CGI_PORT \
              --restart unless-stopped \
              alaska_cgi:latest
