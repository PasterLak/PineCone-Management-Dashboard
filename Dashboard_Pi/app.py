"""
PineCone Management Dashboard - Flask Backend
Receives POST requests from PineCone BL602 IoT devices and serves a web dashboard.
Also works with MQTT and MQTT w TLS
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

import threading
import paho.mqtt.client as mqtt
import ssl
import json

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

from routes.device_routes import process_device_data

def on_message(client, userdata, msg):
    print(f"[{userdata}] RX {msg.topic}: {msg.payload.decode(errors='replace')}")
    try:
        data = json.loads(msg.payload.decode(errors="replace"))
        resp, code = process_device_data(data, "mqtt")
        print(f"[{userdata}] processed: {resp}")
    except Exception as e:
        print(f"[{userdata}] ERROR processing MQTT data: {e}")

def start_mqtt():
    MQTT_HOST = "127.0.0.1"
    MQTT_PLAIN_PORT = 1883
    MQTT_TLS_PORT = 8883
    MQTT_TOPIC = "/api/data"
    TLS_CA_FILE = "/etc/mosquitto/certs/ca.pem"
    TLS_USERNAME = "flask"
    TLS_PASSWORD = "root"

    client_plain = mqtt.Client(client_id="flask-plain", protocol=mqtt.MQTTv311, userdata="plain")
    client_plain.on_message = on_message
    client_plain.connect(MQTT_HOST, MQTT_PLAIN_PORT, 60)
    client_plain.subscribe(MQTT_TOPIC)
    threading.Thread(target=client_plain.loop_forever, daemon=True).start()

    client_tls = mqtt.Client(client_id="flask-tls", protocol=mqtt.MQTTv311, userdata="tls")
    client_tls.username_pw_set(TLS_USERNAME, TLS_PASSWORD)
    client_tls.tls_set(ca_certs=TLS_CA_FILE, tls_version=ssl.PROTOCOL_TLS_CLIENT)
    client_tls.tls_insecure_set(False)
    client_tls.on_message = on_message
    client_tls.connect(MQTT_HOST, MQTT_TLS_PORT, 60)
    client_tls.subscribe(MQTT_TOPIC)
    threading.Thread(target=client_tls.loop_forever, daemon=True).start()

start_mqtt()

if __name__ == "__main__":
    app.run(host=HOST, port=PORT, debug=DEBUG, threaded=True)