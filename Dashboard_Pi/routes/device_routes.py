"""
Device API endpoints - handle device data, updates, and actions
"""
from flask import request, jsonify
import simulator_manager
from datetime import datetime
from zoneinfo import ZoneInfo
import device_manager

_force_full_sync_nodes = set()
BERLIN_TZ = ZoneInfo("Europe/Berlin")

def _merge_pins(existing_pins, incoming_pins, full_sync=False):
    if incoming_pins is None:
        return existing_pins or {}

    if full_sync:
        return incoming_pins or {}

    merged = dict(existing_pins or {})
    for gpio, pin_data in (incoming_pins or {}).items():
        if pin_data is None:
            merged.pop(gpio, None)   # allow deleting a pin via partial update
        else:
            merged[gpio] = pin_data
    return merged


def register_device_routes(app):
    """Register all device-related API routes"""
    
    @app.route("/api/data", methods=["POST"])
    def receive_data():
        """Main endpoint where BL602 devices POST their data"""
        data = request.json or {}

        req_node_id = (data.get("node_id") or "").strip()
        if not req_node_id:
            return jsonify({"error": "node_id required"}), 400

        has_desc = "description" in data
        has_pins = "pins" in data
        incoming_desc = (data.get("description") or "").strip() if has_desc else None
        incoming_pins = data.get("pins") if has_pins else None
        full_sync = bool(data.get("full_sync", False))

        existing_device = device_manager.get_device(req_node_id)
        node_id = req_node_id
        force_full_sync = False

        if not existing_device and not (full_sync and has_desc and has_pins):
            _force_full_sync_nodes.add(node_id)
            return jsonify({
                "status": "ok",
                "node_id": node_id,
                "force_full_sync": True,
            })

        if not existing_device:
            description = incoming_desc if has_desc else ""
            pins = incoming_pins if has_pins else {}
            blink = False
        else:
            node_id = req_node_id
            description = incoming_desc if has_desc else existing_device.get("description", "")
            pins = _merge_pins(existing_device.get("pins", {}), incoming_pins, full_sync=full_sync)
            blink = existing_device.get("blink", False)

        device_data = {
            "ip": request.remote_addr or "",
            "description": description,
            "last_seen": datetime.now(BERLIN_TZ).isoformat(timespec="milliseconds"),
            "pins": pins,
            "blink": blink,
        }

        device_manager.update_device(node_id, device_data)

        if node_id in _force_full_sync_nodes:
            if full_sync and has_desc and has_pins:
                _force_full_sync_nodes.discard(node_id)
            else:
                force_full_sync = True

        response = {
            "status": "ok",
            "node_id": node_id,
            "description": description,
        }

        if blink:
            response["blink"] = True
        if force_full_sync:
            response["force_full_sync"] = True

        return jsonify(response)

    
    @app.route("/api/update_description", methods=["POST"])
    def update_description():
        """Update a device's description from web UI"""
        data = request.json or {}
        node_id = data.get("node_id")
        
        device = device_manager.get_device(node_id)
        if not device:
            return jsonify({"error": "not found"}), 404
        
        updated = dict(device)
        updated["description"] = data.get("description", "") or ""
        device_manager.update_device(node_id, updated)

        synced = simulator_manager.sync_simulator_descriptions(node_id, updated["description"])
        
        return jsonify({"status": "ok"})
    
    
    @app.route("/api/toggle_blink", methods=["POST"])
    def toggle_blink():
        """Toggle the blink flag for a device"""
        data = request.json or {}
        node_id = data.get("node_id")
        
        device = device_manager.get_device(node_id)
        if not device:
            return jsonify({"error": "not found"}), 404
        
        updated = dict(device)
        updated["blink"] = not device.get("blink", False)
        device_manager.update_device(node_id, updated)
        
        return jsonify({
            "status": "ok",
            "blink": updated["blink"]
        })
    
    
    @app.route("/api/delete_device", methods=["POST"])
    def delete_device():
        """Remove a device from the dashboard"""
        data = request.json or {}
        node_id = data.get("node_id")
        
        if not device_manager.delete_device(node_id):
            return jsonify({"error": "not found"}), 404

        # ask node to send one full payload after deletion
        if node_id:
            _force_full_sync_nodes.add(node_id)
        
        return jsonify({"status": "ok"})

    
    @app.route("/api/devices", methods=["GET"])
    def get_devices():
        """Return all devices (polled by browser)"""
        return jsonify({
            "devices": device_manager.get_all_devices(),
            "server_now_ms": int(datetime.now().timestamp() * 1000)
        })
