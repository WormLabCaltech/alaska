# Kallisto automation using docker container
# UBUNTU VERSION: 16.04 (xenial)
FROM ubuntu:xenial

# IMPORTANT
# Current project folder must be mounted to /projects/ in container
# Index folder must be mounted to /idx/ in container
RUN mkdir /kallisto /downloads

# VERSIONS
ENV KALLISTO_VER 0.44.0
ENV KALLISTO_URL https://github.com/pachterlab/kallisto/releases/download/v$KALLISTO_VER/kallisto_linux-v$KALLISTO_VER.tar.gz
ENV MINICONDA_VER 4.3.31
ENV MINICONDA_URL https://repo.continuum.io/miniconda/Miniconda3-$MINICONDA_VER-Linux-x86_64.sh

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

# Install Miniconda (python)
RUN wget $MINICONDA_URL -O /downloads/miniconda.sh
# run Anaconda installation
RUN bash /downloads/miniconda.sh -b -f -p /miniconda/
# add miniconda to PATH
ENV PATH="/miniconda/bin:${PATH}"
# update miniconda packages
RUN conda update --all -y
