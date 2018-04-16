# Sleuth automation using docker container
# UBUNTU VERSION: 16.04 (xenial)
# SLEUTH VERSION: 0.43.1

# IMPORTANT
# Current project folder must be mounted to /projects/ in container

FROM ubuntu:xenial
RUN mkdir /sleuth/ /projects/

##### DEPENDENCIES #####
RUN apt-get update && apt-get install -y \
    software-properties-common \
    apt-transport-https \
    libcurl4-openssl-dev \
    libssl-dev \
    libxml2-dev

##### R INSTALLATION #####
RUN apt-key adv --keyserver keyserver.ubuntu.com --recv-keys E298A3A825C0D65DFD57CBB651716619E084DAB9 \
    && add-apt-repository 'deb [arch=amd64,i386] https://cran.rstudio.com/bin/linux/ubuntu xenial/' \
    && apt-get update \
    && apt-get install r-base -y

##### SLEUTH INSTALLATION #####
# copy r script for installing packages
COPY install_sleuth.R ./sleuth/install_sleuth.R
RUN Rscript ./sleuth/install_sleuth.R
RUN rm /sleuth/install_sleuth.R