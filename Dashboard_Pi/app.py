from flask import Flask, request, jsonify, render_template
from datetime import datetime
from pathlib import Path
import uuid
import json

# Speicherort für die Device-Daten
DATA_DIR = Path("data")
DATA_DIR.mkdir(parents=True, exist_ok=True)
DEVICES_JSON = DATA_DIR / "devices.json"

app = Flask(__name__, template_folder="templates", static_folder="static")

devices = {}


def load_devices():
    # Vorhandene Device-Daten aus JSON-Datei laden
    if DEVICES_JSON.is_file():
        try:
            with DEVICES_JSON.open("r", encoding="utf-8") as f:
                data = json.load(f)
            # Defaults setzen, falls Einträge fehlen
            for v in data.values():
                v.setdefault("description", "")
                v.setdefault("ip", "")
                v.setdefault("last_seen", "")
            return data
        except Exception:
            pass
    return {}


def save_devices():
    # Aktuellen Device-Status in JSON-Datei speichern
    with DEVICES_JSON.open("w", encoding="utf-8") as f:
        json.dump(devices, f, ensure_ascii=False, indent=2)


# Beim Start einmal Device Daten aus Datei laden
devices.update(load_devices())

# Startseite mit Device-Übersicht
@app.route("/")
def index():
    return render_template("index.html", devices=devices)


# API-Endpunkt zum Empfangen von Device-Daten (PineCone)
@app.route("/api/data", methods=["POST"])
def receive_data():
    data = request.json or {}

    req_node_id = (data.get("node_id") or "").strip()
    incoming_desc = (data.get("description") or "").strip()

    # Fall 1: neues oder unbekanntes Device
    if not req_node_id or req_node_id not in devices:
        node_id = req_node_id or f"auto-{uuid.uuid4().hex[:8]}"
        # Beim ersten Kontakt wird description von Device übernommen
        description = incoming_desc
    else:
        # Fall 2: bekanntes Device -> Server-Beschreibung wird beibehalten
        node_id = req_node_id
        description = devices[node_id].get("description", "")

    devices[node_id] = {
        "ip": request.remote_addr or "",
        "description": description,
        "last_seen": datetime.now().isoformat(timespec="seconds"),
    }

    save_devices()

    return jsonify({
        "status": "ok",
        "node_id": node_id,
        "description": description,
    })


# API-Endpunkt zum Aktualisieren der Device-Beschreibung – Weboberfläche
@app.route("/api/update_description", methods=["POST"])
def update_description():
    data = request.json or {}
    node_id = data.get("node_id")

    if node_id not in devices:
        return jsonify({"error": "not found"}), 404

    devices[node_id]["description"] = data.get("description", "") or ""
    save_devices()

    return jsonify({"status": "ok"})


# Neuer Endpoint fürs Polling der Daten vom Browser aus
@app.route("/api/devices", methods=["GET"])
def get_devices():
    return jsonify({"devices": devices})

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
