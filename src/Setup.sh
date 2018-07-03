#!/bin/bash
# This script sets up alaska on a new machine
# Please run it in the parent of the root directory

# Find out script's directory
# SOURCE="${BASH_SOURCE[0]}"
# while [ -h "$SOURCE" ]; do # resolve $SOURCE until the file is no longer a symlink
#   DIR="$( cd -P "$( dirname "$SOURCE" )" && pwd )"
#   SOURCE="$(readlink "$SOURCE")"
#   [[ $SOURCE != /* ]] && SOURCE="$DIR/$SOURCE" # if $SOURCE was a relative symlink, we need to resolve it relative to the path where the symlink file was located
# done
# SCRIPTPATH="$( cd -P "$( dirname "$SOURCE" )" && pwd )"
# echo $SCRIPTPATH > PATH_TO_HERE

DOCKER_SCRIPT_VOLUME="alaska_script_volume"
DOCKER_DATA_VOLUME="alaska_data_volume"
DOCKER_ALASKA_TAG="alaska"
DOCKER_REQUEST_TAG="alaska_request"
DOCKER_QC_TAG="alaska_qc"
DOCKER_KALLISTO_TAG="alaska_kallisto"
DOCKER_SLEUTH_TAG="alaska_sleuth"
DOCKER_CGI_TAG="alaska_cgi"

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
docker create --name="$DOCKER_ALASKA_TAG" -it -v "/etc/localtime:/etc/localtime:ro"\
                                  -v "/var/run/docker.sock:/var/run/docker.sock"\
                                  -v "alaska_script_volume:/alaska/scripts"\
                                  -v "alaska_data_volume:/alaska/root"\
                                  --restart unless-stopped\
                                  alaska:latest

# create cgi container
docker create --name="$DOCKER_CGI_TAG" -it -v "/etc/localtime:/etc/localtime:ro"\
                                  -v "/var/run/docker.sock:/var/run/docker.sock"\
                                  -v "alaska_script_volume:/alaska/scripts"\
                                  -v "alaska_data_volume:/alaska/root"\
                                  alaska_cgi:latest
