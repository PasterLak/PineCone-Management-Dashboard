#!/bin/bash
set -e

APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$APP_DIR/.." && pwd)"
GAME_DIR="$PROJECT_ROOT/game_client"
GAME_SERVER_DIR="$PROJECT_ROOT/game_server"

echo -e "PineCone Dashboard Setup (Linux)"


CERT_DIR="${1:-/etc/mosquitto/certs}"

cd "$APP_DIR"

if [ ! -f "$CERT_DIR/ca.pem" ] || [ ! -f "$CERT_DIR/server.crt" ] || [ ! -f "$CERT_DIR/server.key" ]; then
  echo "Generating MQTT TLS certificates in $CERT_DIR..."
  if [[ "$CERT_DIR" == /etc/* ]]; then
    sudo "$APP_DIR/gen_mqtt_certs.sh" "$CERT_DIR"
  else
    "$APP_DIR/gen_mqtt_certs.sh" "$CERT_DIR"
  fi
fi

if [ ! -d "dashboard" ]; then
pip install --upgrade pip

if [ "$PORT" = "80" ]; then
  echo -e "Creating Python virtual environment 'dashboard' as root..."
  sudo python3 -m venv dashboard
  sudo ./dashboard/bin/pip install --upgrade pip
  sudo ./dashboard/bin/pip install flask flask-socketio paho-mqtt
else
  echo -e "Creating Python virtual environment 'dashboard'..."
  python3 -m venv dashboard
  source ./dashboard/bin/activate
  pip install --upgrade pip
  pip install flask flask-socketio paho-mqtt
fi
fi

APP_PY="$APP_DIR/app.py"

export MQTT_CERT_DIR="$CERT_DIR"

if [ ! -f "$APP_PY" ]; then
  echo "Error: $APP_PY not found."
  exit 1
fi

if [ ! -d "$GAME_DIR" ]; then
  echo "Error: $GAME_DIR not found."
  exit 1
fi

if [ ! -d "$GAME_SERVER_DIR" ]; then
  echo "Error: $GAME_SERVER_DIR not found."
  exit 1
fi

if ! command -v tmux >/dev/null 2>&1; then
  echo "tmux is getting installed..."
  sudo apt-get update
  sudo apt-get install -y tmux
fi

SESSION="pinecone_dashboard"
MOSQUITTO_LISTENERS_CONF="/etc/mosquitto/conf.d/listeners.conf"

if [ ! -f "$MOSQUITTO_LISTENERS_CONF" ]; then
  echo "Creating Mosquitto listeners.conf at $MOSQUITTO_LISTENERS_CONF..."
  sudo bash -c "cat > $MOSQUITTO_LISTENERS_CONF <<EOF
per_listener_settings true

# Plain MQTT (without auth)
listener 1883 127.0.0.1
allow_anonymous true

# TLS MQTT (with auth)
listener 8883 127.0.0.1
cafile $CERT_DIR/ca.pem
certfile $CERT_DIR/server.crt
keyfile $CERT_DIR/server.key
allow_anonymous false
password_file /etc/mosquitto/passwd
EOF"
  echo "Restarting Mosquitto..."
  sudo systemctl restart mosquitto || sudo service mosquitto restart
fi

if [ ! -f "$MOSQUITTO_LISTENERS_CONF" ]; then
  echo "Creating Mosquitto TLS config at $MOSQUITTO_LISTENERS_CONF..."
  sudo tee "$MOSQUITTO_LISTENERS_CONF" > /dev/null <<EOF
listener 8883
cafile $CERT_DIR/ca.pem
certfile $CERT_DIR/server.crt
keyfile $CERT_DIR/server.key
require_certificate false
EOF
  echo "Restarting Mosquitto..."
  sudo systemctl restart mosquitto || sudo service mosquitto restart
fi

MQTT_USER="flask"
MQTT_PASS="root"
MQTT_PASSWD_FILE="/etc/mosquitto/passwd"
if [ ! -f "$MQTT_PASSWD_FILE" ]; then
  echo "Creating Mosquitto user/password..."
  sudo mosquitto_passwd -c -b "$MQTT_PASSWD_FILE" "$MQTT_USER" "$MQTT_PASS"
  sudo chown mosquitto:mosquitto "$MQTT_PASSWD_FILE"
  sudo chmod 640 "$MQTT_PASSWD_FILE"
  sudo systemctl restart mosquitto || sudo service mosquitto restart
fi

tmux kill-session -t $SESSION 2>/dev/null || true

# Tab 0: Flask Dashboard (Port 80, sudo required)
tmux new-session -d -s $SESSION -n 'Flask' "cd $APP_DIR && sudo bash -c 'source ./dashboard/bin/activate && ./dashboard/bin/python3 app.py'"

# Tab 1: GameServer (Port 8082)
tmux new-window -t $SESSION:1 -n 'GameServer' "cd $GAME_SERVER_DIR && $APP_DIR/dashboard/bin/python3 app.py"

# Tab 2: GameClient Static Server (Port 8081)
tmux new-window -t $SESSION:2 -n 'GameClient' "cd $GAME_DIR && python3 -m http.server 8081"

tmux select-window -t $SESSION:0

echo "-----------------------------------------"
echo "Dashboard: http://localhost:80"
echo "Game:      http://localhost:8081/index.html"
echo "Game API:  http://localhost:8082"
echo "-----------------------------------------"
echo "Start tmux-Session '$SESSION' (Flask+MQTT, GameServer, GameClient)..."
echo "To kill session: tmux kill-session -t $SESSION"
echo "Press Strg+b and 0/1/2 or n to switch windows."
tmux attach-session -t $SESSION