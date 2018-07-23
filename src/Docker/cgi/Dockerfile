# Dockerfile for cgi container.
# UBUNTU VERSION: 16.04 (xenial)

FROM ubuntu:xenial

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

##### Install Docker #####
RUN curl -fsSL https://download.docker.com/linux/ubuntu/gpg | apt-key add -
RUN add-apt-repository \
   "deb [arch=amd64] https://download.docker.com/linux/ubuntu \
   $(lsb_release -cs) \
   stable"
RUN apt-get update && apt-get install -y \
    docker-ce
