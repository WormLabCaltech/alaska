# Automated quality control docker
# UBUNTU VERSION: 16.04 (xenial)

FROM ubuntu:xenial

RUN mkdir /downloads/

# Install dependencies
RUN apt-get update && apt-get install -y \
    wget \
    bzip2 \
    software-properties-common \
    python-software-properties

# Install Rseqc & MultiQC
# Install Anaconda (python) first
RUN wget https://repo.continuum.io/archive/Anaconda2-5.0.1-Linux-x86_64.sh -O /downloads/anaconda.sh
# run Anaconda installation
RUN bash /downloads/anaconda.sh -b -f -p /anaconda/
# add anaconda to PATH
ENV PATH="/anaconda/bin:${PATH}"
RUN conda config --add channels defaults
RUN conda config --add channels conda-forge
RUN conda config --add channels bioconda
# update anaconda packages
RUN conda update --all -y
# remove installation script
RUN rm ./downloads/anaconda.sh
RUN conda install bowtie2==2.3.4
RUN conda install samtools==1.7
RUN conda install rna-seqc==1.1.8
RUN conda install fastqc==0.11.6
RUN conda install rseqc==2.6.4
RUN conda install multiqc==1.4

# Install R
RUN apt-get update && apt-get install -y \
    apt-transport-https
RUN apt-key adv --keyserver keyserver.ubuntu.com --recv-keys E298A3A825C0D65DFD57CBB651716619E084DAB9 \
    && add-apt-repository 'deb [arch=amd64,i386] https://cran.rstudio.com/bin/linux/ubuntu xenial/' \
    && apt-get update \
    && apt-get install r-base r-base-dev -y




