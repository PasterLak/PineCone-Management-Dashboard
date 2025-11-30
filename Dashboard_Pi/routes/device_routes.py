"""
Device API endpoints - handle device data, updates, and actions
"""
from flask import request, jsonify
from datetime import datetime
import uuid
import device_manager


def register_device_routes(app):
    """Register all device-related API routes"""
    
    @app.route("/api/data", methods=["POST"])
    def receive_data():
        """Main endpoint where BL602 devices POST their data"""
        data = request.json or {}
        
        req_node_id = (data.get("node_id") or "").strip()
        incoming_desc = (data.get("description") or "").strip()
        incoming_pins = data.get("pins") or {}
        
        existing_device = device_manager.get_device(req_node_id)
        
        # New device
        if not req_node_id or not existing_device:
            node_id = req_node_id or f"auto-{uuid.uuid4().hex[:8]}"
            description = incoming_desc
            pins = incoming_pins
            blink = False
        # Existing device
        else:
            node_id = req_node_id
            description = existing_device.get("description", "")
            pins = incoming_pins
            blink = existing_device.get("blink", False)
        
        device_data = {
            "ip": request.remote_addr or "",
            "description": description,
            "last_seen": datetime.now().isoformat(timespec="seconds"),
            "pins": pins,
            "blink": blink,
        }
        
        device_manager.update_device(node_id, device_data)
        
        response = {
            "status": "ok",
            "node_id": node_id,
            "description": description,
        }
        
        if blink:
            response["blink"] = True
        
        return jsonify(response)
    
    
    @app.route("/api/update_description", methods=["POST"])
    def update_description():
        """Update a device's description from web UI"""
        data = request.json or {}
        node_id = data.get("node_id")
        
        device = device_manager.get_device(node_id)
        if not device:
            return jsonify({"error": "not found"}), 404
        
        device["description"] = data.get("description", "") or ""
        device_manager.update_device(node_id, device)
        
        return jsonify({"status": "ok"})
    
    
    @app.route("/api/toggle_blink", methods=["POST"])
    def toggle_blink():
        """Toggle the blink flag for a device"""
        data = request.json or {}
        node_id = data.get("node_id")
        
        device = device_manager.get_device(node_id)
        if not device:
            return jsonify({"error": "not found"}), 404
        
        device["blink"] = not device.get("blink", False)
        device_manager.update_device(node_id, device)
        
        return jsonify({
            "status": "ok",
            "blink": device["blink"]
        })
    
    
    @app.route("/api/delete_device", methods=["POST"])
    def delete_device():
        """Remove a device from the dashboard"""
        data = request.json or {}
        node_id = data.get("node_id")
        
        if not device_manager.delete_device(node_id):
            return jsonify({"error": "not found"}), 404
        
        return jsonify({"status": "ok"})
    
    
    @app.route("/api/devices", methods=["GET"])
    def get_devices():
        """Return all devices (polled by browser)"""
        return jsonify({
            "devices": device_manager.get_all_devices(),
            "server_now_ms": int(datetime.now().timestamp() * 1000)
        })
