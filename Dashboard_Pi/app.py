"""
PineCone Management Dashboard - Flask Backend
Receives POST requests from PineCone BL602 IoT devices and serves a web dashboard.
"""

from flask import Flask, request, jsonify, render_template
from datetime import datetime
from pathlib import Path
import uuid
import json
import threading
import time
import sys
import logging
from io import StringIO

# Where we store device data between restarts
DATA_DIR = Path("data")
DATA_DIR.mkdir(parents=True, exist_ok=True)
DEVICES_JSON = DATA_DIR / "devices.json"

app = Flask(__name__, template_folder="templates", static_folder="static")

devices = {}  # In-memory storage: { "node_id": { ip, description, pins, last_seen, blink } }

# Simulator state (for testing without real hardware)
simulator_threads = {}      # Running background threads
simulator_stop_flags = {}   # Flags to signal thread shutdown
simulator_configs = {}      # Per-simulator configuration
simulator_responses = {}    # Server responses shown in simulator console

# Console log capture (shown in web UI)
console_logs = []
console_log_lock = threading.Lock()
MAX_CONSOLE_LOGS = 150


def get_max_simulator_responses(sim_id):
    """Get max responses limit for a simulator (from config or default)"""
    if sim_id in simulator_configs:
        return simulator_configs[sim_id].get("maxResponses", 100)
    return 100


def get_timestamp():
    """Returns current time as HH:MM:SS string"""
    return datetime.now().strftime("%H:%M:%S")


def add_simulator_log(sim_id, message):
    """Add a timestamped log entry to a simulator's console output"""
    if sim_id not in simulator_responses:
        simulator_responses[sim_id] = []
    simulator_responses[sim_id].append(f"[{get_timestamp()}] {message}")
    
    # Keep only last N entries (configured per simulator)
    max_responses = get_max_simulator_responses(sim_id)
    if len(simulator_responses[sim_id]) > max_responses:
        simulator_responses[sim_id] = simulator_responses[sim_id][-max_responses:]


# Captures Flask's log output and makes it available via /api/console/logs
class ConsoleLogHandler(logging.Handler):
    def emit(self, record):
        try:
            msg = self.format(record)
            with console_log_lock:
                console_logs.append(msg)
                # Keep only last MAX_CONSOLE_LOGS entries
                if len(console_logs) > MAX_CONSOLE_LOGS:
                    console_logs[:] = console_logs[-MAX_CONSOLE_LOGS:]
        except Exception:
            self.handleError(record)


# Setup console logging
console_handler = ConsoleLogHandler()
console_handler.setLevel(logging.DEBUG)
formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
console_handler.setFormatter(formatter)

# Add handler to Flask's logger
app.logger.addHandler(console_handler)

logger = logging.getLogger('logger')
logger.setLevel(logging.DEBUG)

# Captures stdout/stderr (print statements, errors) and adds them to console_logs
class StdoutCapture:
    def __init__(self, original):
        self.original = original
    
    def write(self, text):
        if text and text.strip():
            with console_log_lock:
                console_logs.append(text.rstrip())
                if len(console_logs) > MAX_CONSOLE_LOGS:
                    console_logs[:] = console_logs[-MAX_CONSOLE_LOGS:]
        self.original.write(text)
    
    def flush(self):
        self.original.flush()

sys.stdout = StdoutCapture(sys.stdout)
sys.stderr = StdoutCapture(sys.stderr)


# Load device data from disk (persists between server restarts)
def load_devices():
    if DEVICES_JSON.is_file():
        try:
            with DEVICES_JSON.open("r", encoding="utf-8") as f:
                data = json.load(f)
            # Set defaults if entries are missing
            for v in data.values():
                v.setdefault("description", "")
                v.setdefault("ip", "")
                v.setdefault("last_seen", "")
                v.setdefault("pins", {})
                v.setdefault("blink", False)
            return data
        except Exception:
            pass
    return {}

# Save device data to disk
def save_devices():
    with DEVICES_JSON.open("w", encoding="utf-8") as f:
        json.dump(devices, f, ensure_ascii=False, indent=2)


# Load device data from file once at startup
devices.update(load_devices())

# ===== WEB ROUTES =====

# Serve the main dashboard page
@app.route("/")
def index():
    return render_template("index.html", devices=devices)


# ===== DEVICE API ENDPOINTS =====

# Main endpoint where BL602 devices POST their data
# Devices send: { node_id, description, pins: { GPIO0: {...}, ... } }
@app.route("/api/data", methods=["POST"])
def receive_data():
    data = request.json or {}

    req_node_id = (data.get("node_id") or "").strip()
    incoming_desc = (data.get("description") or "").strip()
    incoming_pins = data.get("pins") or {}

    # New device: use provided node_id or generate one
    if not req_node_id or req_node_id not in devices:
        node_id = req_node_id or f"auto-{uuid.uuid4().hex[:8]}"
        description = incoming_desc  # First contact: use device's description
        pins = incoming_pins
        blink = False  
    else:
        # Existing device: keep server-side description, update pins
        node_id = req_node_id
        description = devices[node_id].get("description", "")
        pins = incoming_pins
        blink = devices[node_id].get("blink", False)

    devices[node_id] = {
        "ip": request.remote_addr or "",
        "description": description,
        "last_seen": datetime.now().isoformat(timespec="seconds"),
        "pins": pins,
        "blink": blink,
    }

    save_devices()

    # Tell the device if it should blink (controlled from web UI)
    response = {
        "status": "ok",
        "node_id": node_id,
        "description": description,
    }
    
    if blink:
        response["blink"] = True

    return jsonify(response)


# Update a device's description from the web UI
@app.route("/api/update_description", methods=["POST"])
def update_description():
    data = request.json or {}
    node_id = data.get("node_id")

    if node_id not in devices:
        return jsonify({"error": "not found"}), 404

    devices[node_id]["description"] = data.get("description", "") or ""
    save_devices()

    return jsonify({"status": "ok"})


# Toggle the "blink" flag for a device (tells device to blink LED)
@app.route("/api/toggle_blink", methods=["POST"])
def toggle_blink():
    data = request.json or {}
    node_id = data.get("node_id")

    if node_id not in devices:
        return jsonify({"error": "not found"}), 404

    current_blink = devices[node_id].get("blink", False)
    devices[node_id]["blink"] = not current_blink
    save_devices()

    return jsonify({
        "status": "ok",
        "blink": devices[node_id]["blink"]
    })


# Remove a device from the dashboard
@app.route("/api/delete_device", methods=["POST"])
def delete_device():
    data = request.json or {}
    node_id = data.get("node_id")

    if node_id not in devices:
        return jsonify({"error": "not found"}), 404

    del devices[node_id]
    save_devices()

    return jsonify({"status": "ok"})


# Return all devices (polled by browser every second)
@app.route("/api/devices", methods=["GET"])
def get_devices():
    return jsonify({"devices": devices})


# ===== SIMULATOR API =====
# Background thread that simulates a BL602 device by POSTing to /api/data
def simulator_worker(sim_id, interval_ms, payload_str, auto_update):
    stop_flag = simulator_stop_flags[sim_id]
    interval_sec = interval_ms / 1000.0
    
    # Parse initial payload
    try:
        current_payload = json.loads(payload_str)
    except:
        current_payload = {"node_id": "", "description": ""}
    
    while not stop_flag["stop"]:
        try:
            # Check if autoUpdate has changed
            config = simulator_configs.get(sim_id, {})
            should_auto_update = config.get("autoUpdate", auto_update)
            
            # Check if payload was manually updated
            if "currentPayload" in config:
                current_payload = config["currentPayload"]
            
            # Send payload
            with app.test_client() as client:
                response = client.post("/api/data", json=current_payload)
                result = response.get_json()
                
                # Log response with timestamp
                add_simulator_log(sim_id, json.dumps(result))
                
                # Store current payload for frontend sync
                config["currentPayload"] = current_payload
                
                # Update payload if autoUpdate is enabled and server returned config
                if should_auto_update and result and result.get("status") == "ok":
                    if "node_id" in result:
                        current_payload["node_id"] = result["node_id"]
                    if "description" in result:
                        current_payload["description"] = result["description"]
                    # Update stored payload for frontend
                    config["currentPayload"] = current_payload
                    print(f"[Simulator {sim_id}] Updated payload: {current_payload}")
                
            print(f"[Simulator {sim_id}] Sent: {current_payload}")
        except Exception as e:
            add_simulator_log(sim_id, f"ERROR: {str(e)}")
            print(f"[Simulator {sim_id}] Error: {e}")
        
        # Sleep in small chunks to allow quick stop
        elapsed = 0
        while elapsed < interval_sec and not stop_flag["stop"]:
            time.sleep(0.1)
            elapsed += 0.1

# API Endpoint to start a new simulator
@app.route("/api/simulator/start", methods=["POST"])
def start_simulator():
    data = request.json or {}
    sim_id = data.get("id")
    interval = data.get("interval", 1000)
    payload = data.get("payload", "{}")
    auto_update = data.get("autoUpdate", True)
    max_responses = data.get("maxResponses", 100)
    
    if sim_id in simulator_threads and simulator_threads[sim_id].is_alive():
        return jsonify({"error": "already running"}), 400
    
    # Store config (including max responses limit)
    simulator_configs[sim_id] = {
        "autoUpdate": auto_update,
        "maxResponses": max_responses
    }
    
    # Preserve existing responses and add start message
    add_simulator_log(sim_id, "Simulator started")
    
    # Create stop flag
    simulator_stop_flags[sim_id] = {"stop": False}
    
    # Start thread
    thread = threading.Thread(
        target=simulator_worker,
        args=(sim_id, interval, payload, auto_update),
        daemon=True
    )
    thread.start()
    simulator_threads[sim_id] = thread
    
    return jsonify({"status": "started", "id": sim_id})

# API Endpoint to stop a running simulator
@app.route("/api/simulator/stop", methods=["POST"])
def stop_simulator():
    data = request.json or {}
    sim_id = data.get("id")
    
    if sim_id not in simulator_stop_flags:
        return jsonify({"error": "not found"}), 404
    
    # Add stop message to responses before cleaning up
    add_simulator_log(sim_id, "Simulator stopped")
    
    # Signal stop
    simulator_stop_flags[sim_id]["stop"] = True
    
    # Wait for thread to finish (max 2s)
    if sim_id in simulator_threads:
        simulator_threads[sim_id].join(timeout=2.0)
        del simulator_threads[sim_id]
    
    del simulator_stop_flags[sim_id]
    if sim_id in simulator_configs:
        del simulator_configs[sim_id]
    
    return jsonify({"status": "stopped", "id": sim_id})

# API Endpoint to get current status, responses, and updated payload for a specific simulator
@app.route("/api/simulator/status/<int:sim_id>", methods=["GET"])
def get_simulator_status(sim_id):
    # Return default state if simulator was never started (instead of 404)
    if sim_id not in simulator_configs and sim_id not in simulator_responses:
        return jsonify({
            "id": sim_id,
            "running": False,
            "autoUpdate": True,
            "currentPayload": None,
            "responses": [],
            "never_started": True
        }), 200
    
    config = simulator_configs.get(sim_id, {})
    responses = simulator_responses.get(sim_id, [])
    
    return jsonify({
        "id": sim_id,
        "running": sim_id in simulator_threads and simulator_threads[sim_id].is_alive(),
        "autoUpdate": config.get("autoUpdate", True),
        "currentPayload": config.get("currentPayload"),
        "responses": responses,
    })

# API Endpoint to update simulator settings (node_id, description)
@app.route("/api/simulator/update", methods=["POST"])
def update_simulator():
    data = request.json or {}
    sim_id = data.get("id")
    auto_update = data.get("autoUpdate")
    
    if sim_id not in simulator_configs:
        return jsonify({"error": "not found"}), 404
    
    simulator_configs[sim_id]["autoUpdate"] = auto_update
    return jsonify({"status": "updated", "id": sim_id})

# API Endpoint to update simulator payload (when approving changes)
@app.route("/api/simulator/update_payload", methods=["POST"])
def update_simulator_payload():
    data = request.json or {}
    sim_id = data.get("id")
    payload_str = data.get("payload", "{}")
    
    if sim_id not in simulator_configs:
        return jsonify({"error": "not found"}), 404
    
    try:
        payload = json.loads(payload_str)
        # Update the currentPayload that the worker thread uses
        simulator_configs[sim_id]["currentPayload"] = payload
        simulator_configs[sim_id]["payload"] = payload
        
        # Add log entry
        add_simulator_log(sim_id, "Payload updated manually")
        
        return jsonify({"status": "updated", "id": sim_id})
    except json.JSONDecodeError as e:
        return jsonify({"error": "Invalid JSON", "details": str(e)}), 400

# API Endpoint to send a single payload ONCE
@app.route("/api/simulator/send", methods=["POST"])
def send_simulator_once():
    data = request.json or {}
    sim_id = data.get("id")
    payload_str = data.get("payload", "{}")
    
    try:
        payload = json.loads(payload_str)
        with app.test_client() as client:
            response = client.post("/api/data", json=payload)
            result = response.get_json()
        
        # Add to simulator_responses if simulator exists
        if sim_id is not None:
            add_simulator_log(sim_id, f"Send once: {json.dumps(result)}")
        
        return jsonify({"status": "sent", "response": result})
    except Exception as e:
        return jsonify({"error": str(e)}), 400

# API Endpoint to clear simulator responses (clear button)
@app.route("/api/simulator/clear", methods=["POST"])
def clear_simulator_responses():
    data = request.json or {}
    sim_id = data.get("id")
    
    if sim_id is not None:
        
        simulator_responses[sim_id] = []
    
    return jsonify({"status": "cleared", "id": sim_id})

# API Endpoint to delete simulator responses (when simulator is removed)
@app.route("/api/simulator/delete", methods=["POST"])
def delete_simulator_responses():
    data = request.json or {}
    sim_id = data.get("id")
    
    if sim_id is not None and sim_id in simulator_responses:
        del simulator_responses[sim_id]
    
    return jsonify({"status": "deleted", "id": sim_id})


# ===== CONSOLE API =====
@app.route("/api/console/logs", methods=["GET"])
def get_console_logs():
    """Return all captured console logs"""
    with console_log_lock:
        return jsonify({"logs": list(console_logs)})


@app.route("/api/console/clear", methods=["POST"])
def clear_console_logs():
    """Clear all console logs"""
    with console_log_lock:
        console_logs.clear()
    return jsonify({"status": "cleared"})


# MAIN
if __name__ == "__main__":
    # Add startup message to console
    with console_log_lock:
        console_logs.append("=" * 60)
        console_logs.append("PineCone Management Dashboard - Flask Server Starting")
        console_logs.append("=" * 60)
    
    app.run(host="0.0.0.0", port=5000, debug=True)
