import paho.mqtt.client as mqtt
import json
import datetime

BROKER_ADDRESS = "192.168.2.30"
BROKER_PORT = 1883
HEARTBEAT_TOPIC = "pinecone/heartbeat"
CONTROL_TOPIC = "test"

def send_to_pinecone(client, message):
    client.publish(CONTROL_TOPIC, message)
    print(f"Sent to PineCone: {message}")

def on_connect(client, userdata, flags, reason_code, properties):
    if reason_code == 0:
        print(f"Connected to Broker: {BROKER_ADDRESS}")
        client.subscribe(HEARTBEAT_TOPIC)
        print(f"Listening on: {HEARTBEAT_TOPIC}")
        
        # Beispiel: Sofort eine Bestätigung beim Start senden
        send_to_pinecone(client, "Server Online")
    else:
        print(f"Connection failed: {reason_code}")

def on_message(client, userdata, msg):
    timestamp = datetime.datetime.now().strftime("%H:%M:%S")
    payload_str = msg.payload.decode("utf-8")
    
    print(f"\nTime: {timestamp} | Topic: {msg.topic}")
    
    try:
        data = json.loads(payload_str)
        print(json.dumps(data, indent=4))
        
        if "Counter" in data and data["Counter"] % 10 == 0:
            send_to_pinecone(client, f"Counter reached {data['Counter']}")
            
    except json.JSONDecodeError:
        print(f"Raw Data: {payload_str}")

client = mqtt.Client(mqtt.CallbackAPIVersion.VERSION2)
client.on_connect = on_connect
client.on_message = on_message

try:
    print(f"Connecting to {BROKER_ADDRESS}...")
    client.connect(BROKER_ADDRESS, BROKER_PORT, 60)
    client.loop_forever()

except KeyboardInterrupt:
    print("\nProgram exited.")
except Exception as e:
    print(f"\nError: {e}")