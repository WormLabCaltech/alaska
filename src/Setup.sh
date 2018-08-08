#!/bin/bash
# This script sets up alaska on a new machine

# Set up variables from set_env_variables.sh
source scripts/set_env_variables.sh

printf "%s\n" "This script will REBUILD all Alaska images."
read -p "Are you sure you would like to continue? (Y/N)" choice
case "$choice" in
    Y|y ) ;;
    * ) exit 0;;
esac

# First, check if the server container is already running.
if [[ $(docker inspect -f '{{.State.Running}}' $DOCKER_ALASKA_TAG) == "true" ]]
then
    printf "%s\n" "$DOCKER_ALASKA_TAG is currently running."
    printf "%s\n" "The container must be stopped before rebuilding any images."
    printf "%s\n" "Would you like to proceed? (Y/N)"
    read -p ">" choice
    case "$choice" in
        Y|y ) docker stop $DOCKER_ALASKA_TAG;;
        * ) exit 0;;
    esac
fi

# Then, check if the cgi container is already running.
if [[ $(docker inspect -f '{{.State.Running}}' $DOCKER_CGI_TAG) == "true" ]]
then
    printf "%s\n" "$DOCKER_CGI_TAG is currently running."
    printf "%s\n" "The container must be stopped before rebuilding any images."
    printf "%s\n" "Would you like to proceed? (Y/N)"
    read -p ">" choice
    case "$choice" in
        Y|y ) docker stop $DOCKER_CGI_TAG;;
        * ) exit 0;;
    esac
fi

# remove old containers
docker container rm --force $DOCKER_ALASKA_TAG
docker container rm --force $DOCKER_CGI_TAG

# build alaska image
docker build -t $DOCKER_ALASKA_TAG \
             --build-arg MINICONDA_VER="$MINICONDA_VER" \
             --build-arg MINICONDA3_URL="$MINICONDA3_URL" \
             --no-cache \
             Docker/alaska/

# build request image
docker build -t $DOCKER_REQUEST_TAG \
             --build-arg MINICONDA_VER="$MINICONDA_VER" \
             --build-arg MINICONDA3_URL="$MINICONDA3_URL" \
             --no-cache \
             Docker/request/

# build qc image
docker build -t $DOCKER_QC_TAG \
             --build-arg MINICONDA_VER="$MINICONDA_VER" \
             --build-arg MINICONDA2_URL="$MINICONDA2_URL" \
             --build-arg BOWTIE2_VER="$BOWTIE2_VER" \
             --build-arg SAMTOOLS_VER="$SAMTOOLS_VER" \
             --build-arg RSEQC_VER="$RSEQC_VER" \
             --build-arg FASTQC_VER="$FASTQC_VER" \
             --build-arg MULTIQC_VER="$MULTIQC_VER" \
             --build-arg KALLISTO_VER="$KALLISTO_VER" \
             --build-arg KALLISTO_URL="$KALLISTO_URL" \
             --no-cache \
             Docker/qc/

# build kallisto image
docker build -t $DOCKER_KALLISTO_TAG \
             --build-arg MINICONDA_VER="$MINICONDA_VER" \
             --build-arg MINICONDA3_URL="$MINICONDA3_URL" \
             --build-arg KALLISTO_VER="$KALLISTO_VER" \
             --build-arg KALLISTO_URL="$KALLISTO_URL" \
             --no-cache \
             Docker/kallisto/

# build sleuth image
docker build -t $DOCKER_SLEUTH_TAG \
             --build-arg SLEUTH_VER="$SLEUTH_VER" \
             --no-cache \
             Docker/sleuth/

# build cgi image
docker build -t $DOCKER_CGI_TAG Docker/cgi/

# make data volumes
docker volume create --name $DOCKER_SCRIPT_VOLUME
docker volume create --name $DOCKER_DATA_VOLUME

# create alaska container
docker create -t --name="$DOCKER_ALASKA_TAG" \
              -v $DOCKER_TIME_MOUNT \
              -v $DOCKER_SOCKET_MOUNT \
              -v $DOCKER_SCRIPT_MOUNT \
              -v $DOCKER_DATA_MOUNT \
              --restart unless-stopped \
              $DOCKER_ALASKA_TAG

# create cgi container
docker create -t --name="$DOCKER_CGI_TAG" \
              -v $DOCKER_TIME_MOUNT \
              -v $DOCKER_SOCKET_MOUNT \
              -v $DOCKER_SCRIPT_MOUNT \
              -v $DOCKER_DATA_MOUNT \
              -v $DOCKER_CGI_MOUNT \
              -p $DOCKER_CGI_PORT \
              --restart unless-stopped \
              $DOCKER_CGI_TAG
