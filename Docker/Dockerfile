# Alaska dependencies
# Ubuntu 16.04 (xenial)
# should we change to a more lightweight linux?
FROM ubuntu:xenial
ENV WORKDIR=/Alaska
WORKDIR ${WORKDIR}

# non-interactive frontend during build - does not persist in image
ARG DEBIAN_FRONTEND=noninteractive

############ MAKE FOLDERS ##################
RUN mkdir ./downloads/

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

############ R INSTALLATION #################
RUN apt-key adv --keyserver keyserver.ubuntu.com --recv-keys E298A3A825C0D65DFD57CBB651716619E084DAB9 \
    && add-apt-repository 'deb [arch=amd64,i386] https://cran.rstudio.com/bin/linux/ubuntu xenial/' \
    && apt-get update \
    && apt-get install r-base -y

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
