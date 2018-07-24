#!/bin/bash
# This script starts AlaskaServer

container_name="alaska"

# First, check if the container is already running.
if [ $(docker inspect -f '{{.State.Running}}' $container_name) = "true" ]
then
    printf "%s\n" "Alaska is already running. What would you like to do?"
    printf "\t%s\n" "1. Attach to the stdout of the container that is currently running."
    printf "\t%s\n" "2. Restart the container."
    printf "\t%s\n" "3. Stop the container."
    printf "\t%s\n" "4. Exit this script without doing anything."
    read -p ">" choice
    case "$choice" in
        1 ) docker attach $container_name;;
        2 ) sudo cp -a scripts/* /var/lib/docker/volumes/alaska_script_volume/_data/
            docker restart $container_name;;
        3 ) docker stop $container_name;;
        * ) ;;
    esac
else
    sudo cp -a scripts/* /var/lib/docker/volumes/alaska_script_volume/_data/
    docker start -i $container_name
fi
