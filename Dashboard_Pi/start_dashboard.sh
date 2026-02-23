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
pip install flask flask-socketio paho-mqtt

APP_PY="$APP_DIR/app.py"

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

# Kill old session if exists
tmux kill-session -t $SESSION 2>/dev/null || true

# Tab 0: Flask Dashboard (Port 80, sudo required)
tmux new-session -d -s $SESSION -n 'Flask' "cd $APP_DIR && sudo ./dashboard/bin/python3 app.py"

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