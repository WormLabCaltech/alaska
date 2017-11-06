# requests containerization
# UBUNTU VERSION: 16.04 (xenial)

# IMPORTANT
# Alaska root folder must be mounted to /alaska/

FROM ubuntu:xenial
RUN mkdir ./downloads/


##### DEPENDENCIES #####
RUN apt-get update && apt-get install -y \
    wget \
    bzip2 \
    apt-transport-https \
    ca-certificates \
    curl \
    software-properties-common

##### ANACONDA (PYTHON) INSTALLATION #####
# fetch Anaconda installation script
RUN wget https://repo.continuum.io/archive/Anaconda3-5.0.0.1-Linux-x86_64.sh -O ./downloads/anaconda.sh
# run Anaconda installation
RUN bash ./downloads/anaconda.sh -b -f -p ./anaconda/
# add anaconda to PATH
ENV PATH="/anaconda/bin:${PATH}"
# update anaconda packages
RUN conda update --all -y
# remove installation script
RUN rm ./downloads/anaconda.sh