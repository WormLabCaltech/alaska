#!/bin/bash
# This script is run when the cgi container is started.
a2enmod cgi
apachectl -D FOREGROUND
