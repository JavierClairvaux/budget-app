#!/bin/sh
set -e

if [ -f /etc/nginx/certs/server.crt ] && [ -f /etc/nginx/certs/server.key ]; then
    echo "Certs found — enabling HTTP + HTTPS"
    rm -f /etc/nginx/conf.d/nginx.http.conf
else
    echo "No certs found — running HTTP only"
    rm -f /etc/nginx/conf.d/nginx.https.conf
fi

exec nginx -g "daemon off;"
