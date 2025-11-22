"""
Device data management - loading, saving, and in-memory storage
"""
import json
from datetime import datetime
from config import DEVICES_JSON

# In-memory device storage
devices = {}


def load_devices():
    """Load device data from disk"""
    if not DEVICES_JSON.is_file():
        return {}
    
    try:
        with DEVICES_JSON.open("r", encoding="utf-8") as f:
            data = json.load(f)
        
        # Set defaults for missing fields
        for device in data.values():
            device.setdefault("description", "")
            device.setdefault("ip", "")
            device.setdefault("last_seen", "")
            device.setdefault("pins", {})
            device.setdefault("blink", False)
        
        return data
    except Exception as e:
        print(f"Error loading devices: {e}")
        return {}


def save_devices():
    """Save device data to disk"""
    try:
        with DEVICES_JSON.open("w", encoding="utf-8") as f:
            json.dump(devices, f, ensure_ascii=False, indent=2)
    except Exception as e:
        print(f"Error saving devices: {e}")


def get_device(node_id):
    """Get a device by ID"""
    return devices.get(node_id)


def update_device(node_id, data):
    """Update or create a device"""
    devices[node_id] = data
    save_devices()


def delete_device(node_id):
    """Delete a device"""
    if node_id in devices:
        del devices[node_id]
        save_devices()
        return True
    return False


def get_all_devices():
    """Get all devices"""
    return devices


# Load devices on module import
devices.update(load_devices())
