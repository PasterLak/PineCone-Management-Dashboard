"""
PineCone Management Dashboard - Flask Backend
Receives POST requests from PineCone BL602 IoT devices and serves a web dashboard.
"""

from flask import Flask, render_template, request
from datetime import datetime

from config import HOST, PORT, DEBUG
from network_utils import resolve_current_endpoint, resolve_dashboard_endpoints

import device_manager
import console_logger

from routes.device_routes import register_device_routes
from routes.simulator_routes import register_simulator_routes
from routes.console_routes import register_console_routes
from routes.realtimeapi_routes import register_realtimeapi_routes

app = Flask(__name__, template_folder="templates", static_folder="static")

console_logger.setup_console_logging(app)

register_device_routes(app)
register_simulator_routes(app)
register_console_routes(app)
register_realtimeapi_routes(app)

@app.after_request
def add_cors_headers(resp):
    resp.headers["Access-Control-Allow-Origin"] = "*"
    resp.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization"
    resp.headers["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS"
    return resp

@app.route("/")
def index():
    current_endpoint = resolve_current_endpoint(request.host, request.host_url, PORT)
    dashboard_endpoints = resolve_dashboard_endpoints(request.host, request.host_url, PORT)
    return render_template(
        "index.html",
        devices=device_manager.get_all_devices(),
        server_now_ms=int(datetime.now().timestamp() * 1000),
        dashboard_endpoint=current_endpoint,
        dashboard_endpoints=dashboard_endpoints,
    )

if __name__ == "__main__":
    app.run(host=HOST, port=PORT, debug=DEBUG, threaded=True)