#!/bin/bash
# This script starts AlaskaServer
sudo cp -a scripts/* /var/lib/docker/volumes/alaska_script_volume/_data/
docker start -i alaska