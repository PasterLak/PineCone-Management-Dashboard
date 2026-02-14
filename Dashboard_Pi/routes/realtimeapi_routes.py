from flask import request, jsonify, Response, stream_with_context
from datetime import datetime, timezone
import json
import time
import device_manager


DEFAULT_OFFLINE_THRESHOLD_MS = 100


def _parse_ids(raw):
    if not raw:
        return set()
    return {x.strip() for x in raw.split(",") if x.strip()}


def _filtered_devices(ids_set):
    devices = device_manager.get_all_devices()
    if not ids_set:
        return devices
    return {k: v for k, v in devices.items() if k in ids_set}


def _parse_offline_threshold_ms(raw):
    try:
        value = int(raw)
        return max(100, value)
    except (TypeError, ValueError):
        return DEFAULT_OFFLINE_THRESHOLD_MS


def _is_online(device, offline_threshold_ms):
    # offline when (now - last_seen) > threshold
    last_seen = device.get("last_seen")
    if not last_seen:
        return False

    try:
        ts = datetime.fromisoformat(last_seen)
    except (TypeError, ValueError):
        return False

    now = datetime.now()
    return (now - ts).total_seconds() * 1000 <= offline_threshold_ms


def _build_payload(ids_set, offline_threshold_ms):
    devices = _filtered_devices(ids_set)
    online_devices = {
        node_id: device
        for node_id, device in devices.items()
        if _is_online(device, offline_threshold_ms)
    }

    return {
        "server_time": datetime.now(timezone.utc).isoformat(timespec="milliseconds"),
        "devices": online_devices,
    }


def register_realtimeapi_routes(app):
    @app.route("/api/realtime/snapshot", methods=["GET"])
    def realtime_snapshot():
        ids_set = _parse_ids(request.args.get("ids", ""))
        offline_threshold_ms = _parse_offline_threshold_ms(
            request.args.get("offlineThreshold")
        )
        return jsonify(_build_payload(ids_set, offline_threshold_ms))

    @app.route("/api/realtime/stream", methods=["GET"])
    def realtime_stream():
        ids_set = _parse_ids(request.args.get("ids", ""))
        interval_ms = max(50, min(2000, int(request.args.get("interval", "100"))))
        offline_threshold_ms = _parse_offline_threshold_ms(
            request.args.get("offlineThreshold")
        )

        def gen():
            last_data = None
            while True:
                data = json.dumps(
                    _build_payload(ids_set, offline_threshold_ms),
                    ensure_ascii=False,
                )
                if data != last_data:
                    yield f"event: devices\ndata: {data}\n\n"
                    last_data = data
                else:
                    yield ": keepalive\n\n"
                time.sleep(interval_ms / 1000.0)

        return Response(
            stream_with_context(gen()),
            mimetype="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
                "X-Accel-Buffering": "no",
            },
        )