#!/bin/bash
# This script defines all variables used by all Alaska bash scripts.
# These include: Update.sh, Setup.sh, and Start.sh
# This script is to be called with the 'source' prefix.

####### DEFINE VARIABLES #######
# Docker image tags.
DOCKER_SCRIPT_VOLUME="alaska_script_volume"
DOCKER_DATA_VOLUME="alaska_data_volume"
DOCKER_ALASKA_TAG="alaska"
DOCKER_REQUEST_TAG="alaska_request"
DOCKER_QC_TAG="alaska_qc"
DOCKER_KALLISTO_TAG="alaska_kallisto"
DOCKER_SLEUTH_TAG="alaska_sleuth"
DOCKER_CGI_TAG="alaska_cgi"

# Mounting points.
DOCKER_TIME_MOUNT="/etc/localtime:/etc/localtime:ro"
DOCKER_SOCKET_MOUNT="/var/run/docker.sock:/var/run/docker.sock"
DOCKER_SCRIPT_MOUNT="alaska_script_volume:/alaska/scripts"
DOCKER_DATA_MOUNT="alaska_data_volume:/alaska/root"
DOCKER_CGI_MOUNT="/home/azurebrd/public_html/cgi-bin:/usr/lib/cgi-bin"

# Declare array varables for required images, containers, and volumes.
declare -a images=(
    "$DOCKER_ALASKA_TAG"
    "$DOCKER_REQUEST_TAG"
    "$DOCKER_QC_TAG"
    "$DOCKER_KALLISTO_TAG"
    "$DOCKER_SLEUTH_TAG"
    "$DOCKER_CGI_TAG"
)
declare -a containers=(
    "$DOCKER_ALASKA_TAG"
    "$DOCKER_CGI_TAG"
)
declare -a volumes=(
    "$DOCKER_SCRIPT_VOLUME"
    "$DOCKER_DATA_VOLUME"
)
####### END VARIABLE DEFINITIONS #######
