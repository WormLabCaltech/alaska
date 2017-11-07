#!/bin/bash
# This script sends a new request to the AlaskaServer
COMMAND="$1"
ID="$2 $3"

# Script's directory
SOURCE="${BASH_SOURCE[0]}"
while [ -h "$SOURCE" ]; do # resolve $SOURCE until the file is no longer a symlink
  DIR="$( cd -P "$( dirname "$SOURCE" )" && pwd )"
  SOURCE="$(readlink "$SOURCE")"
  [[ $SOURCE != /* ]] && SOURCE="$DIR/$SOURCE" # if $SOURCE was a relative symlink, we need to resolve it relative to the path where the symlink file was located
done
SCRIPTPATH="$( cd -P "$( dirname "$SOURCE" )" && pwd )"

docker run -it --rm --network="container:alaska"\
                -v "${SCRIPTPATH}/scripts/Alaska.py:/Alaska.py:ro"\
                -v "${SCRIPTPATH}/scripts/AlaskaRequest.py:/AlaskaRequest.py:ro"\
                request\
                python AlaskaRequest.py ${COMMAND} ${ID}