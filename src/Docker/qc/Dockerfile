# Automated quality control docker
# UBUNTU VERSION: 16.04 (xenial)
FROM ubuntu:xenial

# versions
# Note: rseqc requires python2
ARG MINICONDA_VER=4.5.1
ARG MINICONDA2_URL=https://repo.continuum.io/miniconda/Miniconda2-$MINICONDA_VER-Linux-x86_64.sh
ARG BOWTIE2_VER=2.3.4
ARG SAMTOOLS_VER=1.7
ARG RSEQC_VER=2.6.4
ARG FASTQC_VER=0.11.6
ARG MULTIQC_VER=1.4
ARG SAMBAMBA_VER=0.6.6
ARG KALLISTO_VER=0.44.0
ARG KALLISTO_URL=https://github.com/pachterlab/kallisto/releases/download/v$KALLISTO_VER/kallisto_linux-v$KALLISTO_VER.tar.gz

# Install dependencies
RUN apt-get update && apt-get install -y \
    apt-utils \
    bzip2 \
    software-properties-common \
    python-software-properties \
    curl

##### MINICONDA (PYTHON) INSTALLATION #####
# fetch miniconda installation script
RUN curl $MINICONDA2_URL --create-dirs -o /downloads/miniconda.sh
# make script executable
RUN chmod +x /downloads/miniconda.sh
# run miniconda installation
RUN /downloads/miniconda.sh -b -f -p /miniconda/
# add miniconda to PATH
ENV PATH="/miniconda/bin:${PATH}"
# remove installation script
RUN rm /downloads/miniconda.sh

# Add channels.
RUN conda config --add channels defaults
RUN conda config --add channels conda-forge
RUN conda config --add channels bioconda

# install software
RUN conda install fontconfig
RUN conda install conda-forge::openjdk
RUN conda install bowtie2==$BOWTIE2_VER
RUN conda install samtools==$SAMTOOLS_VER
RUN conda install sambamba==$SAMBAMBA_VER
RUN conda install fastqc==$FASTQC_VER
RUN conda install rseqc==$RSEQC_VER
RUN conda install multiqc==$MULTIQC_VER
RUN conda install -c r r

##### KALLISTO INSTALLATION #####
RUN curl -L $KALLISTO_URL --create-dirs -o /kallisto/kallisto.tar.gz
# extract kallisto to directory
RUN tar -xvzf /kallisto/kallisto.tar.gz -C /kallisto --strip-components=1
# remove tar
RUN rm /kallisto/kallisto.tar.gz
# add kallisto to PATH
ENV PATH="/kallisto:${PATH}"
