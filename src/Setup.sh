#!/bin/bash
# This script sets up alaska on a new machine
# Please run it in the parent of the root directory

pushd `dirname $0` > /dev/null
SCRIPTPATH="$( cd "$(dirname "$0")" ; pwd -P )"
printf "Root Directory: ${SCRIPTPATH}\n"
echo $SCRIPTPATH > PATH_TO_HERE

# remove old containers
docker container rm --force alaska

# build alaska image
docker build -t alaska ./Docker/alaska/

# build request image
docker build -t request ./Docker/request/

# build kallisto image
docker build -t kallisto ./Docker/kallisto/

# build sleuth image
docker build -t sleuth ./Docker/sleuth/

# create alasa container
docker create --name="alaska" -it -v "/etc/localtime:/etc/localtime:ro"\
                                  -v "/var/run/docker.sock:/var/run/docker.sock"\
                                  -v "${SCRIPTPATH}:/alaska"\
                                  alaska:latest
