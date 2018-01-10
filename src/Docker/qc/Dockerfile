# Automated quality control docker
# UBUNTU VERSION: 16.04 (xenial)
# BOWTIE2 VERSION: 1.2.2
# SAMTOOLS VERSION: 1.6
# RNASEQC VERSION: 1.1.8

FROM ubuntu:xenial
RUN mkdir ./bowtie2/ ./samtools/ ./rnaseqc/ ./fastqc/

# Install dependencies
RUN apt-get update && apt-get install -y \
    wget \
    unzip \
    openjdk-8-jre

# Install Bowtie2
RUN wget https://github.com/BenLangmead/bowtie2/releases/download/v2.3.4/bowtie2-2.3.4-linux-x86_64.zip \
    -O /bowtie2.zip
RUN unzip bowtie2.zip
RUN mv bowtie2-2.3.4-linux-x86_64 bowtie2
ENV PATH="/bowtie2:${PATH}"

# Install Samtools
RUN wget https://github.com/samtools/samtools/releases/download/1.6/samtools-1.6.tar.bz2 \
    -O /samtools/samtools.tar.bz2
RUN tar -xvjf /samtools/samtools.tar.bz2 -C /samtools --strip-components=1
ENV PATH="/samtools:${PATH}"

# Install RNAseQC
RUN wget http://www.broadinstitute.org/cancer/cga/tools/rnaseqc/RNA-SeQC_v1.1.8.jar \
    -O /rnaseqc/rnaseqc.jar
ENV PATH="/rnaseqc:${PATH}"

# Install FastQC
RUN wget https://www.bioinformatics.babraham.ac.uk/projects/fastqc/fastqc_v0.11.6.zip \
    -O fastqc.zip
RUN unzip fastqc.zip
RUN mv FastQC fastqc
ENV PATH="/fastqc:${PATH}"

# Install MultiQC
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
RUN conda install -c bioconda multiqc


