#!/bin/bash
# Builds the alaska_kallisto image with appropriate options.
source scripts/set_env_variables.sh

# build kallisto image
docker build -t "$DOCKER_KALLISTO_TAG:$VERSION" \
             --build-arg TIMEZONE="$TIMEZONE" \
             --build-arg MINICONDA_VER="$MINICONDA_VER" \
             --build-arg MINICONDA3_URL="$MINICONDA3_URL" \
             --build-arg KALLISTO_VER="$KALLISTO_VER" \
             --build-arg KALLISTO_URL="$KALLISTO_URL" \
             --force-rm \
             --no-cache \
             Docker/kallisto/

# exit with return value of the above command
exit $?
