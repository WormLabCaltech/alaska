# requests containerization
# UBUNTU VERSION: 16.04 (xenial)
FROM ubuntu:xenial

# Timezone
ARG TIMEZONE=America/Los_Angeles
RUN ln -snf /usr/share/zoneinfo/$TIMEZONE /etc/localtime && \
    echo $TIMEZONE > /etc/timezone

# default to 4.5.1
ARG MINICONDA_VER=4.5.1
ARG MINICONDA3_URL=https://repo.continuum.io/miniconda/Miniconda3-$MINICONDA_VER-Linux-x86_64.sh

##### DEPENDENCIES #####
RUN apt-get update && apt-get install -y \
    bzip2 \
    apt-transport-https \
    ca-certificates \
    curl \
    software-properties-common

##### MINICONDA (PYTHON) INSTALLATION #####
# fetch miniconda installation script
RUN curl $MINICONDA3_URL --create-dirs -o /downloads/miniconda.sh
# make script executable
RUN chmod +x /downloads/miniconda.sh
# run miniconda installation
RUN /downloads/miniconda.sh -b -f -p /miniconda/
# add miniconda to PATH
ENV PATH="/miniconda/bin:${PATH}"
# remove installation script
RUN rm /downloads/miniconda.sh
# install zeromq
RUN conda install zeromq
RUN conda install pyzmq
