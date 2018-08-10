#!/bin/bash
# Builds the alaska_qc image with appropriate options.
source scripts/set_env_variables.sh

# build qc image
docker build -t $DOCKER_QC_TAG \
             --build-arg MINICONDA_VER="$MINICONDA_VER" \
             --build-arg MINICONDA2_URL="$MINICONDA2_URL" \
             --build-arg BOWTIE2_VER="$BOWTIE2_VER" \
             --build-arg SAMTOOLS_VER="$SAMTOOLS_VER" \
             --build-arg RSEQC_VER="$RSEQC_VER" \
             --build-arg FASTQC_VER="$FASTQC_VER" \
             --build-arg MULTIQC_VER="$MULTIQC_VER" \
             --build-arg KALLISTO_VER="$KALLISTO_VER" \
             --build-arg KALLISTO_URL="$KALLISTO_URL" \
             --no-cache \
             Docker/qc/
