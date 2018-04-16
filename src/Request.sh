#!/bin/bash
# This script sends a new request to the AlaskaServer
COMMAND="$1"
ID="$2 $3"

# Script's directory
# SOURCE="${BASH_SOURCE[0]}"
# while [ -h "$SOURCE" ]; do # resolve $SOURCE until the file is no longer a symlink
#   DIR="$( cd -P "$( dirname "$SOURCE" )" && pwd )"
#   SOURCE="$(readlink "$SOURCE")"
#   [[ $SOURCE != /* ]] && SOURCE="$DIR/$SOURCE" # if $SOURCE was a relative symlink, we need to resolve it relative to the path where the symlink file was located
# done
# SCRIPTPATH="$( cd -P "$( dirname "$SOURCE" )" && pwd )"

docker run -i --rm --network="container:alaska"\
                -v "alaska_script_volume:/alaska/scripts"\
                -w "/alaska/scripts"\
                alaska_request\
                python AlaskaRequest.py ${COMMAND} ${ID}