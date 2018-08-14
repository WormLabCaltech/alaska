#!/bin/bash
# This script allows the user the selectively rebuild images / containers.

# Set up variables from set_env_variables.sh
source scripts/set_env_variables.sh

printf "%s\n" "What image/container would you like to rebuild?"
printf "%s\n" "If you would like to rebuild everything, please use Setup.sh"
printf "\t%s\n" "1. [IMAGE] $DOCKER_REQUEST_TAG"
printf "\t%s\n" "2. [IMAGE] $DOCKER_QC_TAG"
printf "\t%s\n" "3. [IMAGE] $DOCKER_KALLISTO_TAG"
printf "\t%s\n" "4. [IMAGE] $DOCKER_SLEUTH_TAG"
printf "\t%s\n" "5. [CONTAINER] $DOCKER_ALASKA_TAG"
printf "\t%s\n" "6. [CONTAINER] $DOCKER_CGI_TAG"
printf "\t%s\n" "7. [IMAGE+CONTAINER] $DOCKER_ALASKA_TAG"
printf "\t%s\n" "8. [IMAGE+CONTAINER] $DOCKER_CGI_TAG"

read -p ">" choice
case "$choice" in
    1 ) Docker/request/Build.sh;;
    2 ) ;;
    3 ) ;;
    4 ) ;;
    5 ) ;;
    6 ) ;;
    7 ) ;;
    8 ) ;;
    * ) ;;
esac
