"""
PineCone Management Dashboard - Flask Backend
Receives POST requests from PineCone BL602 IoT devices and serves a web dashboard.
Also works with MQTT and MQTT w TLS (mTLS)
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

from routes.device_routes import process_device_data

import threading
import paho.mqtt.client as mqtt
from paho.mqtt.enums import CallbackAPIVersion
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

def on_message(client, userdata, msg):
    print(f"[{userdata}] RX {msg.topic}: {msg.payload.decode(errors='replace')}")
    try:
        data = json.loads(msg.payload.decode(errors="replace"))
        resp, code = process_device_data(data, "mqtt")
        print(f"[{userdata}] processed: {resp}")

        response_topic = data.get("response_topic")
        node_id = data.get("id")
        if not response_topic and node_id:
            response_topic = f"/api/data/response"
        if response_topic:
            response_payload = {
                "s": resp.get("s", "ok"),
                "id": resp.get("id"),
                "d": resp.get("d"),
            }
            for key in ("b", "ffs", "error"):
                if key in resp:
                    response_payload[key] = resp[key]
            response_payload["http_code"] = code
            client.publish(response_topic, json.dumps(response_payload), qos=1)
            #print(f"[{userdata}] MQTT response sent to {response_topic}: {response_payload}")

    except Exception as e:
        print(f"[{userdata}] ERROR processing MQTT data: {e}")

def start_mqtt(tls :bool = True):
    MQTT_HOST = "127.0.0.1"
    MQTT_PLAIN_PORT = 1883
    MQTT_TLS_PORT = 8883
    MQTT_TOPIC = "/api/data"

    # Your required scheme:
    CA_CERT = "./keys/ca.crt"
    CLIENT_CERT = "./keys/mosquitto.crt"
    CLIENT_KEY = "./keys/mosquitto.key"

    # --- Plain MQTT client ---
    if (not tls):
        try:
            client_plain = mqtt.Client(
                callback_api_version=CallbackAPIVersion.VERSION1,
                client_id="flask-plain", 
                protocol=mqtt.MQTTv311, 
                userdata="plain"
                )
            client_plain.on_message = on_message
            client_plain.connect(MQTT_HOST, MQTT_PLAIN_PORT, 60)
            client_plain.subscribe(MQTT_TOPIC)
            threading.Thread(target=client_plain.loop_forever, daemon=True).start()
            print("[plain] MQTT connected (1883)")
        except Exception as e:
            print(f"[plain] MQTT FAILED on 1883: {e}")

    if tls:
        try:
            client_tls = mqtt.Client(
                callback_api_version=CallbackAPIVersion.VERSION1,
                client_id="flask-tls", 
                protocol=mqtt.MQTTv311, 
                userdata="tls"
                )
            client_tls.on_message = on_message

            client_tls.tls_set(
                ca_certs=CA_CERT,
                certfile=CLIENT_CERT,
                keyfile=CLIENT_KEY,
                tls_version=ssl.PROTOCOL_TLSv1_2,
                cert_reqs=ssl.CERT_REQUIRED,
            )

            # Bypass SAN/hostname mismatch (because your cert has no SAN)
            client_tls.tls_insecure_set(True)

            client_tls.connect(MQTT_HOST, MQTT_TLS_PORT, 60)
            client_tls.subscribe(MQTT_TOPIC)
            threading.Thread(target=client_tls.loop_forever, daemon=True).start()
            print("[tls] MQTT connected (8883, mTLS)")
        except Exception as e:
            print(f"[tls] MQTT FAILED on 8883: {e}")

start_mqtt()

if __name__ == "__main__":
    app.run(host=HOST, port=PORT, debug=DEBUG, threaded=True)