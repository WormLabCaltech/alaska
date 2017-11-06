#!/bin/bash
# This script sends a new request to the AlaskaServer
COMMAND="$1"
ID="$2 $3"
SCRIPTPATH=$(cat "PATH_TO_HERE")
docker run -it --rm --network="container:alaska"\
                -v "${SCRIPTPATH}/scripts/Alaska.py:/Alaska.py:ro"\
                -v "${SCRIPTPATH}/scripts/AlaskaRequest.py:/AlaskaRequest.py:ro"\
                request\
                python AlaskaRequest.py ${COMMAND} ${ID}