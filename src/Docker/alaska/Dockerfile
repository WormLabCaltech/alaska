# Alaska containerization
# UBUNTU VERSION: 16.04 (xenial)
FROM ubuntu:xenial

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
# install pandas
RUN conda install pandas

##### Install Docker #####
RUN curl -fsSL https://download.docker.com/linux/ubuntu/gpg | apt-key add -
RUN add-apt-repository \
   "deb [arch=amd64] https://download.docker.com/linux/ubuntu \
   $(lsb_release -cs) \
   stable"
RUN apt-get update && apt-get install -y \
    docker-ce

# install pyunpack & docker
RUN pip install docker && pip install patool && pip install pyunpack

# Set up working directory
WORKDIR /alaska/scripts
CMD ["python", "AlaskaServer.py"]
