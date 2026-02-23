#!/bin/bash
set -euo pipefail
trap 'echo "ERROR: line $LINENO: $BASH_COMMAND" >&2' ERR

APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
echo "PineCone Dashboard Setup + Start (Linux)"
cd "$APP_DIR"

CERT_DIR="${1:-/etc/mosquitto/certs}"
CERT_SRC_DIR="${2:-$APP_DIR/mqtt_certs}"

MOSQUITTO_LISTENERS_CONF="/etc/mosquitto/conf.d/listeners.conf"
MQTT_USER="flask"
MQTT_PASS="root"
MQTT_PASSWD_FILE="/etc/mosquitto/passwd"

CA_FILE="$CERT_DIR/ca.pem"
CERT_FILE="$CERT_DIR/server.pem"
KEY_FILE="$CERT_DIR/server.key"

VENV_DIR="$APP_DIR/dashboard"
VENV_PY="$VENV_DIR/bin/python3"
VENV_PIP="$VENV_DIR/bin/pip"
APP_PY="$APP_DIR/app.py"

restart_mosquitto() {
  if command -v systemctl >/dev/null 2>&1 && systemctl list-unit-files | grep -q '^mosquitto\.service'; then
    sudo systemctl enable --now mosquitto
    sudo systemctl restart mosquitto
    return 0
  fi
  if command -v service >/dev/null 2>&1; then
    sudo service mosquitto restart
    return 0
  fi
  echo "No service manager found; starting mosquitto manually..."
  sudo pkill -x mosquitto >/dev/null 2>&1 || true
  sudo mosquitto -c /etc/mosquitto/mosquitto.conf -d
}

# --- Basic checks ---
command -v apt-get >/dev/null 2>&1 || { echo "Error: apt-get not found (Debian/Ubuntu only)."; exit 1; }
[[ -f /etc/mosquitto/mosquitto.conf ]] || { echo "Error: /etc/mosquitto/mosquitto.conf not found."; exit 1; }
[[ -f "$APP_PY" ]] || { echo "Error: $APP_PY not found."; exit 1; }

[[ -d "$CERT_SRC_DIR" ]] || { echo "Error: cert source dir not found: $CERT_SRC_DIR"; exit 1; }
for f in "$CERT_SRC_DIR/ca.crt" "$CERT_SRC_DIR/mosquitto.crt" "$CERT_SRC_DIR/mosquitto.key"; do
  [[ -s "$f" ]] || { echo "Error: missing/empty cert file: $f"; exit 1; }
done

# Make sure sudo is ready (prevents weird prompting behavior)
sudo -v

echo "Installing required packages..."
sudo apt-get update
sudo apt-get install -y \
  mosquitto mosquitto-clients \
  python3 python3-pip python3-venv \
  openssl iproute2

# --- Ensure Mosquitto conf.d exists and is included ---
sudo mkdir -p /etc/mosquitto/conf.d
if ! grep -qE '^\s*include_dir\s+/etc/mosquitto/conf\.d\s*$' /etc/mosquitto/mosquitto.conf; then
  echo "Adding include_dir /etc/mosquitto/conf.d to /etc/mosquitto/mosquitto.conf"
  echo "" | sudo tee -a /etc/mosquitto/mosquitto.conf >/dev/null
  echo "include_dir /etc/mosquitto/conf.d" | sudo tee -a /etc/mosquitto/mosquitto.conf >/dev/null
fi

# --- Install/copy MQTT TLS certificates if missing ---
need_certs=0
for f in "$CA_FILE" "$CERT_FILE" "$KEY_FILE"; do
  [[ -s "$f" ]] || { need_certs=1; break; }
done

if (( need_certs )); then
  echo "Installing MQTT TLS certificates into $CERT_DIR from $CERT_SRC_DIR..."
  sudo "$APP_DIR/gen_mqtt_certs.sh" "$CERT_DIR" "$CERT_SRC_DIR"
else
  echo "TLS certs already exist: $CA_FILE, $CERT_FILE, $KEY_FILE"
fi

# --- Fix permissions for Mosquitto TLS key/certs ---
if [[ "$CERT_DIR" == /etc/* ]]; then
  [[ -f "$KEY_FILE"  ]] && sudo chown mosquitto:mosquitto "$KEY_FILE"  && sudo chmod 600 "$KEY_FILE"
  [[ -f "$CA_FILE"   ]] && sudo chown mosquitto:mosquitto "$CA_FILE"   && sudo chmod 644 "$CA_FILE"
  [[ -f "$CERT_FILE" ]] && sudo chown mosquitto:mosquitto "$CERT_FILE" && sudo chmod 644 "$CERT_FILE"
fi

# --- Create Mosquitto user/password if missing ---
if [[ ! -f "$MQTT_PASSWD_FILE" ]]; then
  echo "Creating Mosquitto user/password..."
  sudo mosquitto_passwd -c -b "$MQTT_PASSWD_FILE" "$MQTT_USER" "$MQTT_PASS"
  sudo chown mosquitto:mosquitto "$MQTT_PASSWD_FILE"
  sudo chmod 640 "$MQTT_PASSWD_FILE"
else
  echo "Mosquitto password file exists: $MQTT_PASSWD_FILE"
fi

# --- Write listeners.conf ---
echo "Writing Mosquitto listeners.conf to $MOSQUITTO_LISTENERS_CONF..."
sudo tee "$MOSQUITTO_LISTENERS_CONF" >/dev/null <<EOF
per_listener_settings true

listener 1883 127.0.0.1
allow_anonymous true

listener 8883 127.0.0.1
cafile $CA_FILE
certfile $CERT_FILE
keyfile $KEY_FILE
allow_anonymous false
password_file $MQTT_PASSWD_FILE
EOF

echo "Restarting Mosquitto..."
restart_mosquitto

echo "Checking Mosquitto listeners..."
sudo ss -ltnp | grep -E ':(1883|8883)\b' >/dev/null || {
  echo "Error: Mosquitto is not listening on 1883/8883"
  sudo journalctl -u mosquitto -e --no-pager
  exit 1
}

# --- Python venv (create if missing) ---
if [[ ! -x "$VENV_PY" ]]; then
  echo "Creating Python virtual environment at $VENV_DIR..."
  rm -rf "$VENV_DIR"
  python3 -m venv "$VENV_DIR"
fi

echo "Installing Python deps..."
"$VENV_PIP" install --upgrade pip
if [[ -f "$APP_DIR/requirements.txt" ]]; then
  "$VENV_PIP" install -r "$APP_DIR/requirements.txt"
else
  "$VENV_PIP" install flask flask-socketio paho-mqtt
fi

echo "-----------------------------------------"
echo "Dashboard: http://localhost:80"
echo "-----------------------------------------"
echo "Starting Flask dashboard (foreground)..."
echo "Press CTRL+C to stop."
echo

# Important: run from APP_DIR even under sudo
exec sudo bash -lc "cd '$APP_DIR' && exec '$VENV_PY' '$APP_PY'"