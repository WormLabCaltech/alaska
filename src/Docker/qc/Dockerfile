# Automated quality control docker
# UBUNTU VERSION: 16.04 (xenial)
FROM ubuntu:xenial

# VERSIONS
ENV MINICONDA_VER 4.3.31
ENV MINICONDA_URL https://repo.continuum.io/miniconda/Miniconda2-$MINICONDA_VER-Linux-x86_64.sh
ENV BOWTIE2_VER 2.3.4
ENV SAMTOOLS_VER 1.7
ENV RSEQC_VER 2.6.4
ENV FASTQC_VER 0.11.6
ENV MULTIQC_VER 1.4
ENV KALLISTO_VER 0.44.0
ENV KALLISTO_URL https://github.com/pachterlab/kallisto/releases/download/v$KALLISTO_VER/kallisto_linux-v$KALLISTO_VER.tar.gz

RUN mkdir /downloads/

# Install dependencies
RUN apt-get update && apt-get install -y \
    apt-utils \
    wget \
    bzip2 \
    software-properties-common \
    python-software-properties

# Install Miniconda (python)
RUN wget $MINICONDA_URL -O /downloads/miniconda.sh
# run Anaconda installation
RUN bash /downloads/miniconda.sh -b -f -p /miniconda/
# add miniconda to PATH
ENV PATH="/miniconda/bin:${PATH}"
RUN conda config --add channels defaults
RUN conda config --add channels conda-forge
RUN conda config --add channels bioconda
# update miniconda packages
RUN conda update --all -y
# remove installation script
RUN rm ./downloads/miniconda.sh
RUN conda install bowtie2==$BOWTIE2_VER
RUN conda install samtools==$SAMTOOLS_VER
RUN conda install fastqc==$FASTQC_VER
RUN conda install rseqc==$RSEQC_VER
RUN conda install multiqc==$MULTIQC_VER

# Install R
RUN apt-get update && apt-get install -y \
    apt-transport-https
RUN apt-key adv --keyserver keyserver.ubuntu.com --recv-keys E298A3A825C0D65DFD57CBB651716619E084DAB9 \
    && add-apt-repository 'deb [arch=amd64,i386] https://cran.rstudio.com/bin/linux/ubuntu xenial/' \
    && apt-get update \
    && apt-get install r-base r-base-dev -y

##### KALLISTO INSTALLATION #####
RUN mkdir /kallisto/

RUN wget $KALLISTO_URL \
    -O ./kallisto/kallisto.tar.gz

# extract kallisto to directory
RUN tar -xvzf ./kallisto/kallisto.tar.gz -C ./kallisto/ --strip-components=1
# add kallisto to PATH
ENV PATH="/kallisto:${PATH}"



