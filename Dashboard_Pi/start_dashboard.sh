#!/bin/bash
set -e

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

cd "$APP_DIR"

# --- Helpers ---
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

have_venv() {
  python3 -c "import venv" >/dev/null 2>&1
}

# --- Install required packages if missing ---
if ! command -v apt-get >/dev/null 2>&1; then
  echo "Error: apt-get not found. This script currently targets Debian/Ubuntu."
  exit 1
fi

echo "Installing required packages (if missing)..."
sudo apt-get update
sudo apt-get install -y \
  mosquitto mosquitto-clients \
  python3 python3-pip python3-venv \
  tmux openssl

# --- Generate MQTT TLS certificates if missing ---
if [ ! -f "$CERT_DIR/ca.pem" ] || [ ! -f "$CERT_DIR/server.crt" ] || [ ! -f "$CERT_DIR/server.key" ]; then
  echo "Generating MQTT TLS certificates in $CERT_DIR..."
  if [[ "$CERT_DIR" == /etc/* ]]; then
    sudo "$APP_DIR/gen_mqtt_certs.sh" "$CERT_DIR"
  else
    "$APP_DIR/gen_mqtt_certs.sh" "$CERT_DIR"
  fi
fi

# --- Python venv for dashboard ---
if [ ! -d "$APP_DIR/dashboard" ]; then
  echo "Creating Python virtual environment 'dashboard'..."
  python3 -m venv "$APP_DIR/dashboard"
  "$APP_DIR/dashboard/bin/pip" install --upgrade pip
  "$APP_DIR/dashboard/bin/pip" install flask flask-socketio paho-mqtt
fi

# --- Sanity checks ---
APP_PY="$APP_DIR/app.py"
if [ ! -f "$APP_PY" ]; then echo "Error: $APP_PY not found."; exit 1; fi
if [ ! -d "$GAME_DIR" ]; then echo "Error: $GAME_DIR not found."; exit 1; fi
if [ ! -d "$GAME_SERVER_DIR" ]; then echo "Error: $GAME_SERVER_DIR not found."; exit 1; fi

# --- Mosquitto config dir ---
sudo mkdir -p /etc/mosquitto/conf.d

# Ensure include_dir is present (otherwise conf.d is ignored)
if ! grep -qE '^\s*include_dir\s+/etc/mosquitto/conf\.d\s*$' /etc/mosquitto/mosquitto.conf; then
  echo "Adding include_dir /etc/mosquitto/conf.d to /etc/mosquitto/mosquitto.conf"
  echo "" | sudo tee -a /etc/mosquitto/mosquitto.conf >/dev/null
  echo "include_dir /etc/mosquitto/conf.d" | sudo tee -a /etc/mosquitto/mosquitto.conf >/dev/null
fi

# --- Write listeners.conf  ---
echo "Writing Mosquitto listeners.conf to $MOSQUITTO_LISTENERS_CONF..."
sudo tee "$MOSQUITTO_LISTENERS_CONF" >/dev/null <<EOF
per_listener_settings true

# Plain MQTT (no auth) - local only
listener 1883 127.0.0.1
allow_anonymous true

# TLS MQTT (with auth) - local only
listener 8883 127.0.0.1
cafile $CERT_DIR/ca.pem
certfile $CERT_DIR/server.crt
keyfile $CERT_DIR/server.key
allow_anonymous false
password_file $MQTT_PASSWD_FILE
EOF

# --- Create Mosquitto user/password if missing ---
if [ ! -f "$MQTT_PASSWD_FILE" ]; then
  echo "Creating Mosquitto user/password..."
  sudo mosquitto_passwd -c -b "$MQTT_PASSWD_FILE" "$MQTT_USER" "$MQTT_PASS"
  sudo chown mosquitto:mosquitto "$MQTT_PASSWD_FILE" || true
  sudo chmod 640 "$MQTT_PASSWD_FILE" || true
fi

echo "Restarting Mosquitto..."
restart_mosquitto

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