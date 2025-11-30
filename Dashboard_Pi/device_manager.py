import json
from datetime import datetime
from config import DEVICES_JSON

# In-memory device storage
devices = {}
OFFLINE_THRESHOLD_SECONDS = 5


def _parse_iso(ts):
    try:
        return datetime.fromisoformat(ts)
    except Exception:
        return None


def _is_online(device):
    ts = _parse_iso(device.get("last_seen", ""))
    if not ts:
        return False
    delta = datetime.now() - ts
    return delta.total_seconds() <= OFFLINE_THRESHOLD_SECONDS


def load_devices():
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
    try:
        with DEVICES_JSON.open("w", encoding="utf-8") as f:
            json.dump(devices, f, ensure_ascii=False, indent=2)
    except Exception as e:
        print(f"Error saving devices: {e}")


def get_device(node_id):
    return devices.get(node_id)


def update_device(node_id, data):
    clean = {**data}
    clean.pop("online", None)
    devices[node_id] = clean
    save_devices()


def delete_device(node_id):
    if node_id in devices:
        del devices[node_id]
        save_devices()
        return True
    return False


def get_all_devices():
    enriched = {}
    for node_id, device in devices.items():
        enriched[node_id] = {**device, "online": _is_online(device)}
    return enriched


devices.update(load_devices())
