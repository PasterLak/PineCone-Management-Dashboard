#!/bin/bash
set -euo pipefail

APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$APP_DIR/.." && pwd)"
GAME_DIR="$PROJECT_ROOT/game_client"
GAME_SERVER_DIR="$PROJECT_ROOT/game_server"

echo "PineCone Dashboard Setup (Linux)"

CERT_DIR="${1:-/etc/mosquitto/certs}"
SESSION="pinecone_dashboard"
MOSQUITTO_LISTENERS_CONF="/etc/mosquitto/conf.d/listeners.conf"
MQTT_USER="flask"
MQTT_PASS="root"
MQTT_PASSWD_FILE="/etc/mosquitto/passwd"

CA_FILE="$CERT_DIR/ca.pem"
CERT_FILE="$CERT_DIR/server.pem"
KEY_FILE="$CERT_DIR/server.key"

cd "$APP_DIR"

restart_mosquitto() {
  set +e
  if command -v systemctl >/dev/null 2>&1 && systemctl list-unit-files | grep -q '^mosquitto\.service'; then
    sudo systemctl enable --now mosquitto >/dev/null 2>&1
    sudo systemctl restart mosquitto
    set -e
    return 0
  fi
  if command -v service >/dev/null 2>&1; then
    sudo service mosquitto restart >/dev/null 2>&1 && { set -e; return 0; }
  fi
  echo "No service manager found; starting mosquitto manually..."
  sudo pkill -x mosquitto >/dev/null 2>&1 || true
  sudo mosquitto -c /etc/mosquitto/mosquitto.conf -d
  set -e
}

# --- Basic checks ---
if ! command -v apt-get >/dev/null 2>&1; then
  echo "Error: apt-get not found. This script targets Debian/Ubuntu."
  exit 1
fi

if [[ ! -f /etc/mosquitto/mosquitto.conf ]]; then
  echo "Error: /etc/mosquitto/mosquitto.conf not found (is mosquitto installed correctly?)"
  exit 1
fi

echo "Installing required packages..."
sudo apt-get update
sudo apt-get install -y \
  mosquitto mosquitto-clients \
  python3 python3-pip python3-venv \
  tmux openssl iproute2

# --- Ensure Mosquitto conf.d exists and is included ---
sudo mkdir -p /etc/mosquitto/conf.d

if ! grep -qE '^\s*include_dir\s+/etc/mosquitto/conf\.d\s*$' /etc/mosquitto/mosquitto.conf; then
  echo "Adding include_dir /etc/mosquitto/conf.d to /etc/mosquitto/mosquitto.conf"
  echo "" | sudo tee -a /etc/mosquitto/mosquitto.conf >/dev/null
  echo "include_dir /etc/mosquitto/conf.d" | sudo tee -a /etc/mosquitto/mosquitto.conf >/dev/null
fi

# --- Generate MQTT TLS certificates if missing (robust exists-check) ---
need_certs=0
for f in "$CA_FILE" "$CERT_FILE" "$KEY_FILE"; do
  if [[ ! -s "$f" ]]; then
    need_certs=1
    break
  fi
done

if (( need_certs )); then
  echo "Generating MQTT TLS certificates in $CERT_DIR..."
  if [[ "$CERT_DIR" == /etc/* ]]; then
    sudo "$APP_DIR/gen_mqtt_certs.sh" "$CERT_DIR"
  else
    "$APP_DIR/gen_mqtt_certs.sh" "$CERT_DIR"
  fi
else
  echo "TLS certs already exist: $CA_FILE, $CERT_FILE, $KEY_FILE"
fi

# --- Fix permissions for Mosquitto TLS key/certs (important on fresh Ubuntu) ---
if [[ "$CERT_DIR" == /etc/* ]]; then
  [[ -f "$KEY_FILE"  ]] && sudo chown mosquitto:mosquitto "$KEY_FILE"  && sudo chmod 600 "$KEY_FILE"
  [[ -f "$CA_FILE"   ]] && sudo chown mosquitto:mosquitto "$CA_FILE"   && sudo chmod 644 "$CA_FILE"
  [[ -f "$CERT_FILE" ]] && sudo chown mosquitto:mosquitto "$CERT_FILE" && sudo chmod 644 "$CERT_FILE"
fi

# --- Python venv for dashboard ---
if [[ ! -d "$APP_DIR/dashboard" ]]; then
  echo "Creating Python virtual environment 'dashboard'..."
  python3 -m venv "$APP_DIR/dashboard"
  "$APP_DIR/dashboard/bin/pip" install --upgrade pip
  "$APP_DIR/dashboard/bin/pip" install flask flask-socketio paho-mqtt
fi

# --- Sanity checks ---
APP_PY="$APP_DIR/app.py"
if [[ ! -f "$APP_PY" ]]; then echo "Error: $APP_PY not found."; exit 1; fi
if [[ ! -d "$GAME_DIR" ]]; then echo "Error: $GAME_DIR not found."; exit 1; fi
if [[ ! -d "$GAME_SERVER_DIR" ]]; then echo "Error: $GAME_SERVER_DIR not found."; exit 1; fi

# --- Create Mosquitto user/password if missing ---
if [[ ! -f "$MQTT_PASSWD_FILE" ]]; then
  echo "Creating Mosquitto user/password..."
  sudo mosquitto_passwd -c -b "$MQTT_PASSWD_FILE" "$MQTT_USER" "$MQTT_PASS"
  sudo chown mosquitto:mosquitto "$MQTT_PASSWD_FILE" || true
  sudo chmod 640 "$MQTT_PASSWD_FILE" || true
else
  echo "Mosquitto password file exists: $MQTT_PASSWD_FILE"
fi

# --- Write listeners.conf ---
echo "Writing Mosquitto listeners.conf to $MOSQUITTO_LISTENERS_CONF..."
sudo tee "$MOSQUITTO_LISTENERS_CONF" >/dev/null <<EOF
per_listener_settings true

# Plain MQTT (no auth) - local only
listener 1883 127.0.0.1
allow_anonymous true

# TLS MQTT (with auth) - local only
listener 8883 127.0.0.1
cafile $CA_FILE
certfile $CERT_FILE
keyfile $KEY_FILE

allow_anonymous false
password_file $MQTT_PASSWD_FILE
EOF

echo "Restarting Mosquitto..."
restart_mosquitto

# --- Verify Mosquitto is listening on both ports ---
echo "Checking Mosquitto listeners..."
sudo ss -ltnp | grep -E ':(1883|8883)\b' || { echo "Error: Mosquitto is not listening on 1883/8883"; sudo journalctl -u mosquitto -e --no-pager; exit 1; }

# --- tmux session ---
tmux kill-session -t "$SESSION" 2>/dev/null || true

tmux new-session -d -s "$SESSION" -n 'Flask' \
  "cd $APP_DIR && sudo bash -c '$APP_DIR/dashboard/bin/python3 app.py'"

tmux new-window -t "$SESSION:1" -n 'GameServer' \
  "cd $GAME_SERVER_DIR && $APP_DIR/dashboard/bin/python3 app.py"

tmux new-window -t "$SESSION:2" -n 'GameClient' \
  "cd $GAME_DIR && python3 -m http.server 8081"

tmux select-window -t "$SESSION:0"

echo "-----------------------------------------"
echo "Dashboard: http://localhost:80"
echo "Game:      http://localhost:8081/index.html"
echo "Game API:  http://localhost:8082"
echo "-----------------------------------------"
echo "tmux session: $SESSION"
tmux attach-session -t "$SESSION"