# Docker for building Bowtie2 and Kallisto indices
# from CDS and bed/bff files.
# Uses Miniconda Docker Image 4.3.27p0

FROM miniconda:4.3.27p0

# add channels
RUN conda config --add channels defaults
RUN conda config --add channels conda-forge
RUN conda config --add channels bioconda

# update anaconda packages
RUN conda update --all -y

# install Bowtie2, Kallisto, and Bedops
RUN conda install bowtie2==2.3.4
RUN conda install bedops==2.4.30
RUN conda install kallisto==0.43.1
