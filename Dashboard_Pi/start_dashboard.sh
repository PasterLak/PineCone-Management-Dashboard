#!/bin/bash
set -e

APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$APP_DIR/.." && pwd)"
GAME_DIR="$PROJECT_ROOT/game_client"
GAME_SERVER_DIR="$PROJECT_ROOT/game_server"

echo -e "PineCone Dashboard Setup (Linux)"

cd "$APP_DIR"

if [ ! -d "dashboard" ]; then
  echo -e "Creating Python virtual environment 'dashboard'..."
  python3 -m venv dashboard
fi

source ./dashboard/bin/activate

pip install --upgrade pip
pip install flask
pip install flask-socketio

APP_PY="$APP_DIR/app.py"

if [ -f "$APP_PY" ]; then
  echo -e "Flask-App found: $APP_PY"
  chmod +x "$APP_PY"
else
  echo -e "Error: $APP_PY not found."
  exit 1
fi

if [ ! -d "$GAME_DIR" ]; then
  echo -e "Error: $GAME_DIR not found."
  exit 1
fi

if [ ! -d "$GAME_SERVER_DIR" ]; then
  echo -e "Error: $GAME_SERVER_DIR not found."
  exit 1
fi

kill_port_if_used() {
  local port="$1"
  local pids
  pids=$(lsof -ti tcp:"$port" 2>/dev/null || true)
  if [ -n "$pids" ]; then
    echo "Stopping existing process on port $port..."
    kill $pids 2>/dev/null || true
    sleep 0.5
    pids=$(lsof -ti tcp:"$port" 2>/dev/null || true)
    if [ -n "$pids" ]; then
      kill -9 $pids 2>/dev/null || true
    fi
  fi
}

kill_port_if_used 8081
kill_port_if_used 8082

(cd "$GAME_DIR" && python3 -m http.server 8081 >/tmp/game_client.log 2>&1) &
GAME_PID=$!

(cd "$GAME_SERVER_DIR" && "$APP_DIR"/dashboard/bin/python3 app.py >/tmp/game_server.log 2>&1) &
GAME_SERVER_PID=$!

cleanup() {
  kill "$GAME_PID" 2>/dev/null || true
  kill "$GAME_SERVER_PID" 2>/dev/null || true
}
trap cleanup EXIT INT TERM

echo -e "Setup completed!"
echo "-----------------------------------------"
echo "Dashboard: http://localhost:80"
echo "Game:      http://localhost:8081/index.html"
echo "Game API:  http://localhost:8082"
echo "-----------------------------------------"

sudo ./dashboard/bin/python3 app.py