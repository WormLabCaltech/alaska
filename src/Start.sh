#!/bin/bash
# This script starts AlaskaServer

# Set up variables from set_env_variables.sh
source scripts/set_env_variables.sh

# Make sure all the required images are present.
for val in "${images[@]}"
do
    if [[ $(docker images -q $val) == "" ]]
    then
        printf "%s\n" "Docker image '$val' is not correctly installed."
        printf "%s\n" "Please run Setup.sh to correctly set up Alaska."
        exit 1
    fi
done

# Make sure all the required containers are present.
for val in "${containers[@]}"
do
    if [[ $(docker ps -a -f "name=$val" --format '{{.Names}}') != $val ]]
    then
        printf "%s\n" "Docker container '$val' is not correctly installed."
        printf "%s\n" "Please run Setup.sh to correctly set up Alaska."
        exit 1
    fi
done

# Make sure all the required volumes are present.
for val in "${volumes[@]}"
do
    if [[ $(docker volume ls -f "name=$val" --format '{{.Name}}') != $val ]]
    then
        printf "%s\n" "Docker volume '$val' is not correctly installed."
        printf "%s\n" "Please run Setup.sh to correctly set up Alaska."
        exit 1
    fi
done


#### Now, we can ensure Alaska was properly installed.
# Let's go on to start the server.

# First, start ftp if it isn't running already
if [[ $(docker inspect -f '{{.State.Running}}' $DOCKER_FTP_TAG) != "true" ]]
then
    printf "%s\n" "$DOCKER_FTP_TAG is not running."
    printf "%s\n" "Starting container."
    docker start $DOCKER_FTP_TAG
fi

# Then, check if the alaska_server container is already running.
if [[ $(docker inspect -f '{{.State.Running}}' $DOCKER_ALASKA_TAG) == "true" ]]
then
    printf "%s\n" "Alaska is already running. What would you like to do?"
    printf "\t%s\n" "1. Attach to the stdout of the container that is currently running."
    printf "\t%s\n" "2. Restart the container."
    printf "\t%s\n" "3. Stop the container."
    printf "\t%s\n" "4. Exit this script without doing anything."
    read -p ">" choice
    case "$choice" in
        1 ) docker attach $DOCKER_ALASKA_TAG;;
        2 ) docker cp scripts/. $DOCKER_ALASKA_TAG:/alaska/scripts
            docker restart $DOCKER_ALASKA_TAG;;
        3 ) docker stop $DOCKER_ALASKA_TAG;;
        * ) ;;
    esac
else
    docker cp scripts/. $DOCKER_ALASKA_TAG:/alaska/scripts
    docker start $DOCKER_ALASKA_TAG
fi

# If the cgi container isn't running, start that too.
# First, check if the server container is already running.
if [[ $(docker inspect -f '{{.State.Running}}' $DOCKER_CGI_TAG) != "true" ]]
then
    printf "%s\n" "$DOCKER_CGI_TAG is not running."
    printf "%s\n" "Starting container."
    docker start $DOCKER_CGI_TAG
    docker cp web/cgi/. $DOCKER_CGI_TAG:/usr/lib/cgi-bin/alaska
    docker cp web/html/. $DOCKER_CGI_TAG:/var/www/html
else
    printf "%s\n" "$DOCKER_CGI_TAG is running."
    printf "%s\n" "Would you like to re-copy all files in the cgi folder to the container? (Y/N)"
    read -p ">" choice
    case "$choice" in
        Y|y ) docker cp web/cgi/. $DOCKER_CGI_TAG:/usr/lib/cgi-bin/alaska
              docker cp web/html/. $DOCKER_CGI_TAG:/var/www/html;;
        * ) ;;
    esac
fi

# Check if user would like to attach to the alaska_server stdout.
printf "%s\n" "Would you like to attach to the $DOCKER_ALASKA_TAG stdout? (Y/N)"
read -p ">" choice
case "$choice" in
    Y|y ) docker attach $DOCKER_ALASKA_TAG;;
    * ) ;;
esac
