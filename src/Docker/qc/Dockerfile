# Automated quality control docker
# UBUNTU VERSION: 16.04 (xenial)
# BOWTIE2 VERSION: 1.2.2
# SAMTOOLS VERSION: 1.6
# RNASEQC VERSION: 1.1.8

FROM ubuntu:xenial
RUN mkdir ./bowtie2/ ./samtools/ ./downloads/

# Install dependencies
RUN apt-get update && apt-get install -y \
    wget \
    unzip \
    bzip2 \
    openjdk-8-jre \
    gcc \
    libncurses5-dev \
    zlib1g-dev \
    libbz2-dev \
    liblzma-dev \
    libcurl4-openssl-dev \
    libssl-dev \
    make \
    perl

# Install Bowtie2
RUN wget https://github.com/BenLangmead/bowtie2/releases/download/v2.3.4/bowtie2-2.3.4-linux-x86_64.zip \
    -O /downloads/bowtie2.zip
RUN unzip /downloads/bowtie2.zip
RUN mv /bowtie2-2.3.4-linux-x86_64 /bowtie2
ENV PATH="/bowtie2/bowtie2-2.3.4-linux-x86_64:${PATH}"

# Install Samtools
RUN wget https://github.com/samtools/samtools/releases/download/1.6/samtools-1.6.tar.bz2 \
    -O /downloads/samtools.tar.bz2
RUN tar -xvjf /downloads/samtools.tar.bz2 -C /downloads
RUN cd /downloads/samtools-1.6 && ./configure --prefix=/samtools && make && make install
ENV PATH="/samtools/bin:${PATH}"

# Install RNAseQC
# RUN wget http://www.broadinstitute.org/cancer/cga/tools/rnaseqc/RNA-SeQC_v1.1.8.jar \
#     -O /rnaseqc.jar
# ENV PATH="/rnaseqc:${PATH}"

# Install FastQC
RUN wget https://www.bioinformatics.babraham.ac.uk/projects/fastqc/fastqc_v0.11.6.zip \
    -O /downloads/fastqc.zip
RUN unzip /downloads/fastqc.zip
RUN chmod 755 /FastQC/fastqc
ENV PATH="/FastQC:${PATH}"

# Install Rseqc & MultiQC
# Install Anaconda (python) first
RUN wget https://repo.continuum.io/archive/Anaconda2-5.0.1-Linux-x86_64.sh -O ./downloads/anaconda.sh
# run Anaconda installation
RUN bash ./downloads/anaconda.sh -b -f -p ./anaconda/
# add anaconda to PATH
ENV PATH="/anaconda/bin:${PATH}"
# update anaconda packages
RUN conda update --all -y
# remove installation script
RUN rm ./downloads/anaconda.sh
RUN conda install -c bioconda rseqc
RUN conda install -c bioconda multiqc


