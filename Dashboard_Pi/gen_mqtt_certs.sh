#!/bin/bash
set -e

CERT_DIR="$1"

if [ -z "$CERT_DIR" ]; then
  echo "Usage: $0 <cert-dir>"
  exit 1
fi

mkdir -p "$CERT_DIR"
cd "$CERT_DIR"

echo "Generating CA key and certificate..."
openssl genrsa -out ca.key 2048
openssl req -new -x509 -days 365 -key ca.key -out ca.pem -subj "/CN=mosquitto-ca"

echo "Generating server key and certificate..."
openssl genrsa -out server.key 2048
openssl req -new -key server.key -out server.csr -subj "/CN=mosquitto-server"
openssl x509 -req -in server.csr -CA ca.pem -CAkey ca.key -CAcreateserial -out server.crt -days 365

echo "Cleaning up..."
rm server.csr

ls -l "$CERT_DIR"
echo "Certificates generated in $CERT_DIR"
