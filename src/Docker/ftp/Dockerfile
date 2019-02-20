# FTP server for Alaska
# This image uses the stilliard/pure-ftpd as the base
FROM stilliard/pure-ftpd:hardened

# Timezone
ARG TIMEZONE=America/Los_Angeles
RUN ln -snf /usr/share/zoneinfo/$TIMEZONE /etc/localtime && \
    echo $TIMEZONE > /etc/timezone

# Copy startup script.
COPY ftp_startup.sh ftp_startup.sh
RUN chmod +x ftp_startup.sh

CMD ["/ftp_startup.sh"]

EXPOSE 21 30000-30009
