#!/bin/bash
# This script defines all variables used by all Alaska bash scripts.
# These include: Update.sh, Setup.sh, and Start.sh
# This script is to be called with the 'source' prefix.

# Alaska version.
# This version will also match with the image versions!
VERSION="beta-1"

# Timezone for all containers.
TIMEZONE="America/Los_Angeles"

####### DEFINE VARIABLES #######
# Docker tags.
DOCKER_SCRIPT_VOLUME="alaska_script_volume"
DOCKER_DATA_VOLUME="alaska_data_volume"
DOCKER_CGI_VOLUME="alaska_cgi_volume"
DOCKER_FTP_VOLUME="alaska_ftp_volume"
DOCKER_ALASKA_TAG="alaska_server"
DOCKER_FTP_TAG="alaska_ftp"
DOCKER_FTP_BASE="stilliard/pure-ftpd:hardened"
DOCKER_REQUEST_TAG="alaska_request"
DOCKER_QC_TAG="alaska_qc"
DOCKER_KALLISTO_TAG="alaska_kallisto"
DOCKER_SLEUTH_TAG="alaska_sleuth"
DOCKER_CGI_TAG="alaska_cgi"

# Mounting points.
DOCKER_SOCKET_MOUNT="/var/run/docker.sock:/var/run/docker.sock"
DOCKER_SCRIPT_MOUNT="$DOCKER_SCRIPT_VOLUME:/alaska/scripts"
DOCKER_DATA_MOUNT="$DOCKER_DATA_VOLUME:/alaska/root"
DOCKER_CGI_MOUNT="$DOCKER_CGI_VOLUME:/usr/lib/cgi-bin/alaska"
DOCKER_FTP_MOUNT="$DOCKER_FTP_VOLUME:/etc/pure-ftpd"
# DOCKER_FTP_MOUNT="ftppswd:/etc/pure-ftpd"

# Port mappings & networking.
DOCKER_CGI_PORT="80:80"
# FTP
DOCKER_FTP_PORT="21:21"
DOCKER_FTP_PASV="30000:30099"
DOCKER_FTP_PORTS="30000-30099:30000-30099"
DOCKER_FTP_HOST="PUBLICHOST=alaska.caltech.edu"
DOCKER_FTP_FLAGS="ADDED_FLAGS=-d -d -O w3c:/var/log/pure-ftpd/transfer.log"
DOCKER_FTP_FLAGS="$DOCKER_FTP_FLAGS -c 50 -C 10 -p $DOCKER_FTP_PASV"

# Declare array varables for required images, containers, volumes, and networks
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
    "$DOCKER_FTP_TAG"
    "$DOCKER_CGI_TAG"
)
declare -a volumes=(
    "$DOCKER_SCRIPT_VOLUME"
    "$DOCKER_DATA_VOLUME"
    "$DOCKER_CGI_VOLUME"
    "$DOCKER_FTP_VOLUME"
)

# Software version control.
MINICONDA_VER="4.5.12"
BOWTIE2_VER="2.3.5"
SAMTOOLS_VER="1.9"
RSEQC_VER="3.0.0"
FASTQC_VER="0.11.8"
MULTIQC_VER="1.7"
KALLISTO_VER="0.45.0"
SLEUTH_VER="0.30.0"

# Note: some bioconda packages require python2, which is why
#       there is also a link for miniconda 2.
MINICONDA2_URL="https://repo.continuum.io/miniconda/Miniconda2-$MINICONDA_VER-\
Linux-x86_64.sh"
MINICONDA3_URL="https://repo.continuum.io/miniconda/Miniconda3-$MINICONDA_VER-\
Linux-x86_64.sh"
KALLISTO_URL="https://github.com/pachterlab/kallisto/releases/download/\
v$KALLISTO_VER/kallisto_linux-v$KALLISTO_VER.tar.gz"
####### END VARIABLE DEFINITIONS #######
