# Kallisto automation using docker container
# UBUNTU VERSION: 16.04 (xenial)
FROM ubuntu:xenial

# Timezone
ARG TIMEZONE=America/Los_Angeles
RUN echo $TIMEZONE > /etc/timezone \
    && rm -f /etc/localtime \
    && dpkg-reconfigure -f noninteractive tzdata

# versions
ARG MINICONDA_VER=4.5.1
ARG MINICONDA3_URL=https://repo.continuum.io/miniconda/Miniconda3-$MINICONDA_VER-Linux-x86_64.sh
ARG KALLISTO_VER=0.44.0
ARG KALLISTO_URL=https://github.com/pachterlab/kallisto/releases/download/v$KALLISTO_VER/kallisto_linux-v$KALLISTO_VER.tar.gz

##### DEPENDENCIES #####
RUN apt-get update && apt-get install -y \
    curl \
    bzip2

##### KALLISTO INSTALLATION #####
RUN curl -L $KALLISTO_URL --create-dirs -o /kallisto/kallisto.tar.gz
# extract kallisto to directory
RUN tar -xvzf /kallisto/kallisto.tar.gz -C /kallisto --strip-components=1
# remove tar
RUN rm /kallisto/kallisto.tar.gz
# add kallisto to PATH
ENV PATH="/kallisto:${PATH}"

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
