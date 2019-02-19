#!/bin/bash

docker rm alaska_ftp

docker run -d --restart unless-stopped --name alaska_ftp -p 21:21 -p 30000-30009:30000-30009 \
   -e "PUBLICHOST=alaska.caltech.edu" -e "ADDED_FLAGS=-d -d" -e "ADDED_FLAGS=-O w3c:/var/log/pure-ftpd/transfer.log" -e "ADDED_FLAGS=-c 25" -e "ADDED_FLAGS=-C 10" \
   -v ftppswd:/etc/pure-ftpd \
   -v ftpusers:/home/ftpusers \
   -v alaska_data_volume:/home/ftpusers/alaska_data_volume \
   stilliard/pure-ftpd:hardened

docker exec alaska_ftp bin/bash -c "pure-pw userdel alaska -m"
docker exec alaska_ftp bin/bash -c "(echo "Fidopjedd8"; echo "Fidopjedd8") | pure-pw useradd alaska -m -u ftpuser -d /home/ftpusers/alaska_data_volume"   
docker exec alaska_ftp chown -R ftpuser.ftpgroup /home/ftpusers/alaska_data_volume
