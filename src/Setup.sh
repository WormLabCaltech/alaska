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

# Then, check if the ftp container is already running.
if [[ $(docker inspect -f '{{.State.Running}}' $DOCKER_FTP_TAG) == "true" ]]
then
    printf "%s\n" "$DOCKER_FTP_TAG is currently running."
    printf "%s\n" "The container must be stopped before rebuilding any images."
    printf "%s\n" "Would you like to proceed? (Y/N)"
    read -p ">" choice
    case "$choice" in
        Y|y ) docker stop $DOCKER_FTP_TAG;;
        * ) exit 0;;
    esac
fi

# remove old containers
docker container rm --force $DOCKER_ALASKA_TAG
docker container rm --force $DOCKER_CGI_TAG
docker container rm --force $DOCKER_FTP_TAG

# make data volumes
docker volume create --name $DOCKER_SCRIPT_VOLUME
docker volume create --name $DOCKER_DATA_VOLUME
docker volume create --name $DOCKER_CGI_VOLUME
docker volume create --name $DOCKER_FTP_VOLUME

# build alaska image
Docker/alaska/build_image.sh
exit_code=$?
if [ $exit_code -ne 0 ]; then
    printf "%s\n" "Failed to build $DOCKER_ALASKA_TAG image."
    exit $exit_code
fi

# make alaska container
Docker/alaska/build_container.sh
exit_code=$?
if [ $exit_code -ne 0 ]; then
    printf "%s\n" "Failed to build $DOCKER_ALASKA_TAG container."
    exit $exit_code
fi

# build request image
Docker/request/build_image.sh
exit_code=$?
if [ $exit_code -ne 0 ]; then
    printf "%s\n" "Failed to build $DOCKER_REQUEST_TAG image."
    exit $exit_code
fi

# build qc image
Docker/qc/build_image.sh
exit_code=$?
if [ $exit_code -ne 0 ]; then
    printf "%s\n" "Failed to build $DOCKER_QC_TAG image."
    exit $exit_code
fi

# build kallisto image
Docker/kallisto/build_image.sh
exit_code=$?
if [ $exit_code -ne 0 ]; then
    printf "%s\n" "Failed to build $DOCKER_KALLISTO_TAG image."
    exit $exit_code
fi

# build sleuth image
Docker/sleuth/build_image.sh
exit_code=$?
if [ $exit_code -ne 0 ]; then
    printf "%s\n" "Failed to build $DOCKER_SLEUTH_TAG image."
    exit $exit_code
fi

# build cgi image
Docker/cgi/build_image.sh
exit_code=$?
if [ $exit_code -ne 0 ]; then
    printf "%s\n" "Failed to build $DOCKER_CGI_TAG image."
    exit $exit_code
fi

# cgi container
Docker/cgi/build_container.sh
exit_code=$?
if [ $exit_code -ne 0 ]; then
    printf "%s\n" "Failed to build $DOCKER_CGI_TAG container."
    exit $exit_code
fi

# cgi container
Docker/ftp/build_container.sh
exit_code=$?
if [ $exit_code -ne 0 ]; then
    printf "%s\n" "Failed to build $DOCKER_FTP_TAG container."
    exit $exit_code
fi
