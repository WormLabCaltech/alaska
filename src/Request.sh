#!/bin/bash
# This script sends a new request to the AlaskaServer
COMMAND="$1"
ID="$2 $3"

docker run -i --rm --network="container:alaska"\
                -v "alaska_script_volume:/alaska/scripts"\
                -w "/alaska/scripts"\
                alaska_request\
                python AlaskaRequest.py ${COMMAND} ${ID}
