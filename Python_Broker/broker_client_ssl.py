import paho.mqtt.client as mqtt
# install in environment with: pip install paho-mqtt

import json
import datetime
import ssl

BROKER_ADDRESS = "192.168.2.30"
BROKER_PORT = 8883
HEARTBEAT_TOPIC = "pinecone/heartbeat"
CONTROL_TOPIC = "pinecone/receive"

CA_CERT = "ca.crt"
CLIENT_CERT = "mosquitto.crt"
CLIENT_KEY = "mosquitto.key"

counter = 1

def send_to_pinecone(client, message):
    client.publish(CONTROL_TOPIC, message)
    print(f"Sent: {message}")

def process_payload(topic, raw_payload):
    timestamp = datetime.datetime.now().strftime("%H:%M:%S")
    
    try:
        decoded_str = raw_payload.decode("utf-8").strip('\x00')
        
        try:
            data = json.loads(decoded_str)
            print(f"{timestamp} | JSON from {topic}:")
            print(json.dumps(data, indent=4))
        except json.JSONDecodeError:
            print(f"{timestamp} | Text from {topic}: {decoded_str}")
            
    except Exception as e:
        print(f"{timestamp} | Error decoding payload: {e}")

def on_connect(client, userdata, flags, reason_code, properties):
    if reason_code == 0:
        print(f"Connected to: {BROKER_ADDRESS}")
        client.subscribe(HEARTBEAT_TOPIC)
    else:
        print(f"Failed: {reason_code}")

def on_message(client, userdata, msg):
    global counter
    
    process_payload(msg.topic, msg.payload)
    
    response = f"PineCone Reply {counter}"
    send_to_pinecone(client, response)
    counter += 1

client = mqtt.Client(mqtt.CallbackAPIVersion.VERSION2)
client.on_connect = on_connect
client.on_message = on_message

try:
    client.tls_set(
        ca_certs=CA_CERT,
        certfile=CLIENT_CERT,
        keyfile=CLIENT_KEY,
        tls_version=ssl.PROTOCOL_TLSv1_2
    )
    client.tls_insecure_set(True)
except Exception as e:
    print(f"Error: {e}")
    exit(1)

try:
    client.connect(BROKER_ADDRESS, BROKER_PORT, 60)
    client.loop_forever()
except KeyboardInterrupt:
    print("Exit")