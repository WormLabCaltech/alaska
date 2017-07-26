# Alaska uses the latest ubuntu release
# 7/24/2017: ubuntu 16.04 (xenial)
# should we change to a more lightweight linux?
FROM ubuntu:latest
LABEL maintainer="kmin@caltech.edu"
ENV WORKDIR=/Alaska
WORKDIR ${WORKDIR}

# non-interactive frontend during build - does not persist in image
ARG DEBIAN_FRONTEND=noninteractive

############ MAKE FOLDERS ##################
RUN mkdir ./downloads/ ./projects/

############ DEPENDENCIES ##############
# dependency installation according to Dockerfile documentation
# https://docs.docker.com/engine/userguide/eng-image/dockerfile_best-practices/#sort-multi-line-arguments
RUN apt-get update && apt-get install -y \
    wget \
    bzip2 \
    software-properties-common \
    apt-transport-https \
    libcurl4-openssl-dev \
    libssl-dev \
    libxml2-dev \
    ruby-full

############ JAVA, JAVAFX INSTALLATION ##################
RUN apt-get update && apt-get install -y \
    openjdk-8-jre \
    openjfx

############ R INSTALLATION #################
RUN apt-key adv --keyserver keyserver.ubuntu.com --recv-keys E298A3A825C0D65DFD57CBB651716619E084DAB9 \
    && add-apt-repository 'deb [arch=amd64,i386] https://cran.rstudio.com/bin/linux/ubuntu xenial/' \
    && apt-get update \
    && apt-get install r-base -y

############ ANACONDA INSTALLATION ###############
# fetch Anaconda installation script
RUN wget https://repo.continuum.io/archive/Anaconda3-4.4.0-Linux-x86_64.sh \
    -O ./downloads/anaconda.sh
# run Anaconda installation
RUN bash ./downloads/anaconda.sh -b -f -p ./anaconda/
# add anaconda to PATH
ENV PATH="${WORKDIR}/anaconda/bin:${PATH}"
# update anaconda packages
RUN conda update --all -y

############## KALLISTO INSTALLATION ############
# brew can not be used as root, have to download manually
RUN wget $(curl -s https://api.github.com/repos/pachterlab/kallisto/releases/latest \
    | grep 'linux' \
    | grep 'download' \
    | cut -d '"' -f 4) -O ./downloads/kallisto.tar.gz
# extract kallisto to directory
RUN mkdir ./kallisto/ \
    && tar -xvzf ./downloads/kallisto.tar.gz -C ./kallisto/ --strip-components=1
# add kallisto to PATH
ENV PATH="${WORKDIR}/kallisto:${PATH}"

############## SLEUTH INSTALLATION ##############
# copy r script for installing packages
COPY install_sleuth.R ./downloads/install_sleuth.R
RUN Rscript ./downloads/install_sleuth.R

############# FOR DEVELOPMENT ONLY #############
# TODO: is there a way to start a gui within docker?
# install IntelliJ IDE
# RUN wget https://download.jetbrains.com/idea/ideaIU-2017.2.tar.gz \
#     -O ./downloads/intellij.tar.gz
# RUN mkdir ./intellij/ \
#     && tar -xvzf ./downloads/intellij.tar.gz -C ./intellij/ --strip-components=1
#
# RUN apt-get update && apt-get install -y \
#     xorg \
#     openbox
# RUN apt-get install -y xvfb
