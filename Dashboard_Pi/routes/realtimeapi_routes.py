from flask import request, jsonify, Response, stream_with_context
from datetime import datetime, timezone
import json
import time
import device_manager


def _parse_ids(raw):
    if not raw:
        return set()
    return {x.strip() for x in raw.split(",") if x.strip()}


def _filtered_devices(ids_set):
    devices = device_manager.get_all_devices()
    if not ids_set:
        return devices
    return {k: v for k, v in devices.items() if k in ids_set}


def _build_payload(ids_set):
    return {
        "server_time": datetime.now(timezone.utc).isoformat(timespec="milliseconds"),
        "devices": _filtered_devices(ids_set),
    }


def register_realtimeapi_routes(app):
    @app.route("/api/realtime/snapshot", methods=["GET"])
    def realtime_snapshot():
        ids_set = _parse_ids(request.args.get("ids", ""))
        return jsonify(_build_payload(ids_set))

    @app.route("/api/realtime/stream", methods=["GET"])
    def realtime_stream():
        ids_set = _parse_ids(request.args.get("ids", ""))
        interval_ms = max(50, min(2000, int(request.args.get("interval", "100"))))

        def gen():
            last_data = None
            while True:
                data = json.dumps(_build_payload(ids_set), ensure_ascii=False)
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