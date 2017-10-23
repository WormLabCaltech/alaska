#!/bin/bash
# This script sends a new request to the AlaskaServer
COMMAND="$1"
ID="$2 $3"
docker run -it --rm --network="container:alaska" request python AlaskaRequest.py ${COMMAND} ${ID}