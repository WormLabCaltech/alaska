# Kallisto automation using docker container
# UBUNTU VERSION: 16.04 (xenial)
FROM ubuntu:xenial

# IMPORTANT
# Current project folder must be mounted to /projects/ in container
# Index folder must be mounted to /idx/ in container
RUN mkdir ./kallisto/ ./projects/ ./idx/ ./scripts/ ./transcripts/

# KALLISTO VERSION: 0.44.0
ENV KALLISTO_VER 0.44.0
ENV KALLISTO_URL https://github.com/pachterlab/kallisto/releases/download/v$KALLISTO_VER/kallisto_linux-v$KALLISTO_VER.tar.gz

##### DEPENDENCIES #####
RUN apt-get update && apt-get install -y \
    wget \
    bzip2

##### KALLISTO INSTALLATION #####
RUN wget $KALLISTO_URL \
    -O ./kallisto/kallisto.tar.gz

# extract kallisto to directory
RUN tar -xvzf ./kallisto/kallisto.tar.gz -C ./kallisto/ --strip-components=1
# add kallisto to PATH
ENV PATH="/kallisto:${PATH}"