#!/bin/bash
# This script is run when the ftp container is started.

# FTP mount must be owned by the ftpgroup.
chown -R ftpuser.ftpgroup /alaska/root

# Then, run ftp server
/run.sh -l puredb:/etc/pure-ftpd/pureftpd.pdb -E -j -R -P alaska.caltech.edu
