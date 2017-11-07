#!/bin/bash
# This script sets up alaska on a new machine
# Please run it in the parent of the root directory

# Find out script's directory
SOURCE="${BASH_SOURCE[0]}"
while [ -h "$SOURCE" ]; do # resolve $SOURCE until the file is no longer a symlink
  DIR="$( cd -P "$( dirname "$SOURCE" )" && pwd )"
  SOURCE="$(readlink "$SOURCE")"
  [[ $SOURCE != /* ]] && SOURCE="$DIR/$SOURCE" # if $SOURCE was a relative symlink, we need to resolve it relative to the path where the symlink file was located
done
SCRIPTPATH="$( cd -P "$( dirname "$SOURCE" )" && pwd )"
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
