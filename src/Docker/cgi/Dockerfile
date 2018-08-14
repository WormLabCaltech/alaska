# Dockerfile for cgi container.
# UBUNTU VERSION: 16.04 (xenial)
FROM ubuntu:xenial

# default to 4.5.1
ARG MINICONDA_VER=4.5.1
ARG MINICONDA3_URL=https://repo.continuum.io/miniconda/Miniconda3-$MINICONDA_VER-Linux-x86_64.sh

##### DEPENDECIES #####
RUN apt-get update && apt-get install -y \
    lsb-release \
    software-properties-common \
    apt-transport-https \
    apache2 \
    perl \
    curl

##### Perl Packages #####
RUN apt-get update && apt-get install -y \
    libcgi-pm-perl \
    libjson-perl \
    libtie-ixhash-perl

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

##### Install Docker #####
RUN curl -fsSL https://download.docker.com/linux/ubuntu/gpg | apt-key add -
RUN add-apt-repository \
   "deb [arch=amd64] https://download.docker.com/linux/ubuntu \
   $(lsb_release -cs) \
   stable"
RUN apt-get update && apt-get install -y \
    docker-ce

# Set up conf
COPY serve-cgi-bin.conf /etc/apache2/conf-available/serve-cgi-bin.conf

# Copy startup script.
COPY cgi_startup.sh cgi_startup.sh
RUN chmod +x cgi_startup.sh

CMD ["./cgi_startup.sh"]
