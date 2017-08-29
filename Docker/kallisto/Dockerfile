# Kallisto automation using docker container
# UBUNTU VERSION: 16.04 (xenial)
# KALLISTO VERSION: 0.43.1

# IMPORTANT
# Current project folder must be mounted to /projects/ in container
# Index folder must be mounted to /idx/ in container

FROM ubuntu:xenial
RUN mkdir ./kallisto/ ./projects/ ./idx/


##### DEPENDENCIES #####
RUN apt-get update && apt-get install -y \
    wget \
    bzip2

##### KALLISTO INSTALLATION #####
RUN wget https://github.com/pachterlab/kallisto/releases/download/v0.43.1/kallisto_linux-v0.43.1.tar.gz \
    -O ./kallisto/kallisto.tar.gz

# extract kallisto to directory
RUN tar -xvzf ./kallisto/kallisto.tar.gz -C ./kallisto/ --strip-components=1
# add kallisto to PATH
ENV PATH="/kallisto:${PATH}"