# Dockerfile for cgi container.
# UBUNTU VERSION: 16.04 (xenial)
FROM ubuntu:xenial

# Timezone
ARG TIMEZONE=America/Los_Angeles
RUN ln -snf /usr/share/zoneinfo/$TIMEZONE /etc/localtime && \
    echo $TIMEZONE > /etc/timezone

##### DEPENDECIES #####
RUN apt-get update && apt-get install -y \
    lsb-release \
    software-properties-common \
    apt-transport-https \
    apache2 \
    curl \
    bzip2 \
    php \
    libapache2-mod-php

##### Install Docker #####
RUN curl -fsSL https://download.docker.com/linux/ubuntu/gpg | apt-key add -
RUN add-apt-repository \
   "deb [arch=amd64] https://download.docker.com/linux/ubuntu \
   $(lsb_release -cs) \
   stable"
RUN apt-get update && apt-get install -y \
    docker-ce

# Set up conf
COPY serve-cgi-bin.conf /etc/apache2/conf-available/serve-cgi-bin.conf

# Copy startup script.
COPY cgi_startup.sh cgi_startup.sh
RUN chmod +x cgi_startup.sh

# Add www-data to docker group
RUN usermod -aG docker www-data

CMD ["./cgi_startup.sh"]
