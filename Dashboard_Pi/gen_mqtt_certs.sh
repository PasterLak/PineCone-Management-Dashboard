#!/bin/bash
set -euo pipefail

CERT_DIR="${1:-}"
if [[ -z "$CERT_DIR" ]]; then
  echo "Usage: $0 <cert-dir>"
  exit 1
fi

# Create dir
mkdir -p "$CERT_DIR"
cd "$CERT_DIR"

echo "Generating CA key and certificate..."
openssl genrsa -out ca.key 4096
openssl req -x509 -new -nodes -key ca.key -sha256 -days 3650 \
  -out ca.pem -subj "/CN=Local Mosquitto CA"

echo "Generating server key and CSR..."
openssl genrsa -out server.key 2048
openssl req -new -key server.key -out server.csr -subj "/CN=localhost"

cat > server-ext.cnf <<'EOF'
subjectAltName = @alt_names
extendedKeyUsage = serverAuth

[alt_names]
DNS.1 = localhost
IP.1 = 127.0.0.1
EOF

echo "Signing server certificate with SAN..."
openssl x509 -req -in server.csr -CA ca.pem -CAkey ca.key -CAcreateserial \
  -out server.pem -days 825 -sha256 -extfile server-ext.cnf

echo "Cleaning up..."
rm -f server.csr server-ext.cnf ca.srl 2>/dev/null || true

echo "Done. Files in $CERT_DIR:"
ls -l