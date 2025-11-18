#!/bin/bash
# setup_linux_pc.sh

set -e
APP_DIR="$(pwd)"

echo -e "\033[0;36m== PineCone Dashboard Setup (Linux, Current Folder) ==\033[0m"

if ! command -v pyenv &> /dev/null; then
  echo -e "\033[0;31mFehler: pyenv is not installed.\033[0m"
  echo "pls install first: (https://github.com/pyenv/pyenv)."
  exit 1
fi

if ! pyenv versions | grep -q "bl_venv"; then
  echo -e "\033[0;32mErstelle pyenv-Environment 'bl_venv'...\033[0m"
  pyenv virtualenv 3.11.9 bl_venv
fi

pyenv local bl_venv
pip install --upgrade pip
pip install flask flask-socketio eventlet

mkdir -p "$APP_DIR/templates" "$APP_DIR/static"

echo -e "\033[0;32mCreate Flask-App in: $APP_DIR/app.py\033[0m"

cat > "$APP_DIR/app.py" <<'PY'
import eventlet
eventlet.monkey_patch()
from flask import Flask, request, jsonify, render_template
from flask_socketio import SocketIO
from datetime import datetime
import uuid
import json
from pathlib import Path
import tempfile
import shutil

DATA_DIR = Path("data")
DATA_DIR.mkdir(parents=True, exist_ok=True)
DEVICES_JSON = DATA_DIR / "devices.json"

app = Flask(__name__, template_folder='templates', static_folder='static')
socketio = SocketIO(app, cors_allowed_origins="*")

devices = {}

def load_devices() -> dict:
    if DEVICES_JSON.is_file():
        try:
            with DEVICES_JSON.open("r", encoding="utf-8") as f:
                data = json.load(f)
            for v in data.values():
                v.setdefault("description", "")
                v.setdefault("ip", "")
                v.setdefault("last_seen", "")
            return data
        except Exception:
            pass
    return {}

def save_devices_atomic(state: dict) -> None:
    try:
        with tempfile.NamedTemporaryFile("w", delete=False, dir=str(DATA_DIR), encoding="utf-8") as tf:
            json.dump(state, tf, ensure_ascii=False, indent=2)
            tf.flush()
        shutil.move(tf.name, DEVICES_JSON)
    except Exception:
        pass

devices.update(load_devices())

@app.route('/')
def index():
    return render_template('index.html', devices=devices)

@app.route('/api/data', methods=['POST'])
def receive_data():
    data = request.json or {}
    node_id = data.get("node_id")
    if not node_id or str(node_id).strip() == "":
        node_id = f"auto-{uuid.uuid4().hex[:8]}"
    devices[node_id] = {
        "ip": request.remote_addr,
        "description": data.get("description", ""),
        "last_seen": datetime.now().isoformat(timespec="seconds")
    }
    save_devices_atomic(devices)
    socketio.emit("update", {"devices": devices})
    return jsonify({"status": "ok", "node_id": node_id})

@app.route('/api/configuration/<node_id>', methods=['GET'])
def get_config(node_id):
    device = devices.get(node_id)
    if not device:
        return jsonify({"error": "Unknown device"}), 404
    return jsonify({
        "node_id": node_id,
        "description": device.get("description", "")
    })

@app.route('/api/update_description', methods=['POST'])
def update_description():
    data = request.json or {}
    node_id = data.get("node_id")
    new_desc = data.get("description", "")
    if node_id in devices:
        devices[node_id]["description"] = new_desc
        save_devices_atomic(devices)
        socketio.emit("update", {"devices": devices})
        return jsonify({"status": "ok"})
    return jsonify({"error": "not found"}), 404

@app.route('/api/export', methods=['GET'])
def export_devices():
    return jsonify(devices)

@app.route('/api/reload', methods=['POST'])
def reload_devices():
    devices.clear()
    devices.update(load_devices())
    socketio.emit("update", {"devices": devices})
    return jsonify({"status": "ok", "source": "file"})

@socketio.on("connect")
def on_connect():
    socketio.emit("update", {"devices": devices})

if __name__ == "__main__":
    socketio.run(app, host="0.0.0.0", port=5000, debug=True)
PY

for f in index.html header.html footer.html scripts.html; do
  if [ -f "$APP_DIR/$f" ]; then
    cp "$APP_DIR/$f" "$APP_DIR/templates/$f"
    echo -e "\033[0;32m$f → templates/$f copied.\033[0m"
  else
    echo -e "\033[0;33m$f not found – pls add manually.\033[0m"
  fi
done

echo -e "\033[0;32mSetup completed!\033[0m"
echo "-----------------------------------------"
echo "open in Browser:"
echo "  http://localhost:5000"
echo "-----------------------------------------"
eval "$(pyenv init -)"
eval "$(pyenv virtualenv-init -)"
pyenv activate bl_venv
python app.py
