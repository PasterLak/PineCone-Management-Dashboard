"""
Simulator management - background threads that simulate BL602 devices
"""
import json
import time
import threading
from datetime import datetime
from config import DEFAULT_MAX_SIMULATOR_RESPONSES

# Simulator state
simulator_threads = {}
simulator_stop_flags = {}
simulator_configs = {}
simulator_responses = {}


def get_timestamp():
    """Returns current time as HH:MM:SS string"""
    return datetime.now().strftime("%H:%M:%S")


def get_max_responses(sim_id):
    """Get max responses limit for a simulator"""
    if sim_id in simulator_configs:
        return simulator_configs[sim_id].get("maxResponses", DEFAULT_MAX_SIMULATOR_RESPONSES)
    return DEFAULT_MAX_SIMULATOR_RESPONSES


def add_log(sim_id, message):
    """Add a timestamped log entry to a simulator's console"""
    if sim_id not in simulator_responses:
        simulator_responses[sim_id] = []
    
    simulator_responses[sim_id].append(f"[{get_timestamp()}] {message}")
    
    # Keep only last N entries
    max_responses = get_max_responses(sim_id)
    if len(simulator_responses[sim_id]) > max_responses:
        simulator_responses[sim_id] = simulator_responses[sim_id][-max_responses:]


def simulator_worker(app, sim_id, interval_ms, payload_str, auto_update):
    """Background thread that simulates a BL602 device"""
    stop_flag = simulator_stop_flags[sim_id]
    interval_sec = interval_ms / 1000.0
    
    # Parse initial payload
    try:
        current_payload = json.loads(payload_str)
    except:
        current_payload = {"node_id": "", "description": ""}
    
    while not stop_flag["stop"]:
        try:
            # Check current config
            config = simulator_configs.get(sim_id, {})
            should_auto_update = config.get("autoUpdate", auto_update)
            
            # Check if payload was manually updated
            if "currentPayload" in config:
                current_payload = config["currentPayload"]
            
            # Send payload to API
            with app.test_client() as client:
                response = client.post("/api/data", json=current_payload)
                result = response.get_json()
                
                # Log response
                add_log(sim_id, json.dumps(result))
                
                # Store current payload
                config["currentPayload"] = current_payload
                
                # Auto-update if enabled
                if should_auto_update and result and result.get("status") == "ok":
                    if "node_id" in result:
                        current_payload["node_id"] = result["node_id"]
                    if "description" in result:
                        current_payload["description"] = result["description"]
                    config["currentPayload"] = current_payload
                    print(f"[Simulator {sim_id}] Updated payload: {current_payload}")
                
            print(f"[Simulator {sim_id}] Sent: {current_payload}")
        
        except Exception as e:
            add_log(sim_id, f"ERROR: {str(e)}")
            print(f"[Simulator {sim_id}] Error: {e}")
        
        # Sleep in small chunks to allow quick stop
        elapsed = 0
        while elapsed < interval_sec and not stop_flag["stop"]:
            time.sleep(0.1)
            elapsed += 0.1


def start_simulator(app, sim_id, interval, payload, auto_update, max_responses):
    """Start a new simulator thread"""
    if sim_id in simulator_threads and simulator_threads[sim_id].is_alive():
        return {"error": "already running"}, 400
    
    # Store config
    simulator_configs[sim_id] = {
        "autoUpdate": auto_update,
        "maxResponses": max_responses
    }
    
    add_log(sim_id, "Simulator started")
    
    # Create stop flag
    simulator_stop_flags[sim_id] = {"stop": False}
    
    # Start thread
    thread = threading.Thread(
        target=simulator_worker,
        args=(app, sim_id, interval, payload, auto_update),
        daemon=True
    )
    thread.start()
    simulator_threads[sim_id] = thread
    
    return {"status": "started", "id": sim_id}, 200


def stop_simulator(sim_id):
    """Stop a running simulator"""
    if sim_id not in simulator_stop_flags:
        return {"error": "not found"}, 404
    
    add_log(sim_id, "Simulator stopped")
    
    # Signal stop
    simulator_stop_flags[sim_id]["stop"] = True
    
    # Wait for thread to finish
    if sim_id in simulator_threads:
        simulator_threads[sim_id].join(timeout=2.0)
        del simulator_threads[sim_id]
    
    del simulator_stop_flags[sim_id]
    if sim_id in simulator_configs:
        del simulator_configs[sim_id]
    
    return {"status": "stopped", "id": sim_id}, 200


def get_simulator_status(sim_id):
    """Get current status and responses for a simulator"""
    # Return default state if never started
    if sim_id not in simulator_configs and sim_id not in simulator_responses:
        return {
            "id": sim_id,
            "running": False,
            "autoUpdate": True,
            "currentPayload": None,
            "responses": [],
            "never_started": True
        }, 200
    
    config = simulator_configs.get(sim_id, {})
    responses = simulator_responses.get(sim_id, [])
    
    return {
        "id": sim_id,
        "running": sim_id in simulator_threads and simulator_threads[sim_id].is_alive(),
        "autoUpdate": config.get("autoUpdate", True),
        "currentPayload": config.get("currentPayload"),
        "responses": responses,
    }, 200


def update_simulator_config(sim_id, auto_update):
    """Update simulator settings"""
    if sim_id not in simulator_configs:
        return {"error": "not found"}, 404
    
    simulator_configs[sim_id]["autoUpdate"] = auto_update
    return {"status": "updated", "id": sim_id}, 200


def update_simulator_payload(sim_id, payload_str):
    """Update simulator payload"""
    if sim_id not in simulator_configs:
        return {"error": "not found"}, 404
    
    try:
        payload = json.loads(payload_str)
        simulator_configs[sim_id]["currentPayload"] = payload
        simulator_configs[sim_id]["payload"] = payload
        add_log(sim_id, "Payload updated manually")
        return {"status": "updated", "id": sim_id}, 200
    except json.JSONDecodeError as e:
        return {"error": "Invalid JSON", "details": str(e)}, 400


def send_payload_once(app, sim_id, payload_str):
    """Send a payload once without running simulator"""
    try:
        payload = json.loads(payload_str)
        with app.test_client() as client:
            response = client.post("/api/data", json=payload)
            result = response.get_json()
        
        if sim_id is not None:
            add_log(sim_id, f"Send once: {json.dumps(result)}")
        
        return {"status": "sent", "response": result}, 200
    except Exception as e:
        return {"error": str(e)}, 400


def clear_simulator_responses(sim_id):
    """Clear simulator console output"""
    if sim_id is not None:
        simulator_responses[sim_id] = []
    return {"status": "cleared", "id": sim_id}, 200


def delete_simulator_responses(sim_id):
    """Delete simulator responses when removed"""
    if sim_id is not None and sim_id in simulator_responses:
        del simulator_responses[sim_id]
    return {"status": "deleted", "id": sim_id}, 200
