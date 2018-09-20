# Sleuth automation using docker container
# UBUNTU VERSION: 16.04 (xenial)
FROM ubuntu:xenial

# default to 4.5.1
ARG MINICONDA_VER=4.5.1
ARG MINICONDA3_URL=https://repo.continuum.io/miniconda/Miniconda3-$MINICONDA_VER-Linux-x86_64.sh
ARG SLEUTH_VER=0.30.0

##### DEPENDENCIES #####
RUN apt-get update && apt-get install -y \
    bzip2 \
    software-properties-common \
    apt-transport-https \
    ca-certificates \
    curl \
    libcurl4-openssl-dev \
    libssl-dev \
    libxml2-dev

###### MINICONDA INSTALLATION ######
RUN apt-get update && apt-get install -y \
    bzip2 \
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
# install tea
RUN conda install tea

##### R INSTALLATION #####
RUN apt-key adv --keyserver keyserver.ubuntu.com --recv-keys E298A3A825C0D65DFD57CBB651716619E084DAB9 \
    && add-apt-repository 'deb [arch=amd64,i386] https://cran.rstudio.com/bin/linux/ubuntu xenial/' \
    && apt-get update \
    && apt-get install r-base -y

##### SLEUTH INSTALLATION #####
# copy r script for installing packages
COPY install_sleuth.R /sleuth/install_sleuth.R
RUN Rscript /sleuth/install_sleuth.R $SLEUTH_VER
RUN rm /sleuth/install_sleuth.R

# default port for Sleuth Live
EXPOSE 42427
