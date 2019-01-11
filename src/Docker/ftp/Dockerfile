# FTP server for Alaska
# This image uses the stilliard/pure-ftpd as the base
FROM stilliard/pure-ftpd:hardened

EXPOSE 21
EXPOSE 30000-30009

CMD /run.sh -c 30 -C 10 -l puredb:/etc/pure-ftpd/pureftpd.pdb -E -R -j -R \
            -P $PUBLICHOST -p 30000:30009 -s -A -j -Z -H -4 -E -R -G -X -x
