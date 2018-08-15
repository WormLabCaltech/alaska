#!/bin/bash
# This script defines all variables used by all Alaska bash scripts.
# These include: Update.sh, Setup.sh, and Start.sh
# This script is to be called with the 'source' prefix.

####### DEFINE VARIABLES #######
# Docker image tags.
DOCKER_SCRIPT_VOLUME="alaska_script_volume"
DOCKER_DATA_VOLUME="alaska_data_volume"
DOCKER_CGI_VOLUME="alaska_cgi_volume"
DOCKER_ALASKA_TAG="alaska_server"
DOCKER_REQUEST_TAG="alaska_request"
DOCKER_QC_TAG="alaska_qc"
DOCKER_KALLISTO_TAG="alaska_kallisto"
DOCKER_SLEUTH_TAG="alaska_sleuth"
DOCKER_CGI_TAG="alaska_cgi"

# Mounting points.
DOCKER_TIME_MOUNT="/etc/localtime:/etc/localtime:ro"
DOCKER_SOCKET_MOUNT="/var/run/docker.sock:/var/run/docker.sock"
DOCKER_SCRIPT_MOUNT="$DOCKER_SCRIPT_VOLUME:/alaska/scripts"
DOCKER_DATA_MOUNT="$DOCKER_DATA_VOLUME:/alaska/root"
DOCKER_CGI_MOUNT="$DOCKER_CGI_VOLUME:/usr/lib/cgi-bin/alaska"

# Port mappings & networking.
DOCKER_CGI_PORT="81:80"

# Declare array varables for required images, containers, volumes, and networks.
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
    "$DOCKER_CGI_VOLUME"
)

# Software version control.
MINICONDA_VER="4.5.4"
BOWTIE2_VER="2.3.4"
SAMTOOLS_VER="1.7"
RSEQC_VER="2.6.4"
FASTQC_VER="0.11.6"
MULTIQC_VER="1.4"
KALLISTO_VER="0.44.0"
SLEUTH_VER="0.30.0"
SAMBAMBA_VER="0.6.6"

# Note: some bioconda packages require python2, which is why
#       there is also a link for miniconda 2.
MINICONDA2_URL="https://repo.continuum.io/miniconda/Miniconda2-$MINICONDA_VER-Linux-x86_64.sh"
MINICONDA3_URL="https://repo.continuum.io/miniconda/Miniconda3-$MINICONDA_VER-Linux-x86_64.sh"
KALLISTO_URL="https://github.com/pachterlab/kallisto/releases/download/v$KALLISTO_VER/kallisto_linux-v$KALLISTO_VER.tar.gz"
####### END VARIABLE DEFINITIONS #######
