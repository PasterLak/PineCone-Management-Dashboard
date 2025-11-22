"""
PineCone Management Dashboard - Flask Backend
Receives POST requests from PineCone BL602 IoT devices and serves a web dashboard.
"""

from flask import Flask, render_template

# Import configuration
from config import HOST, PORT, DEBUG

# Import managers
import device_manager
import console_logger

# Import route handlers
from routes.device_routes import register_device_routes
from routes.simulator_routes import register_simulator_routes
from routes.console_routes import register_console_routes

# Initialize Flask app
app = Flask(__name__, template_folder="templates", static_folder="static")

# Setup console logging
console_logger.setup_console_logging(app)

# Register all API routes
register_device_routes(app)
register_simulator_routes(app)
register_console_routes(app)


# Main web route
@app.route("/")
def index():
    """Serve the main dashboard page"""
    return render_template("index.html", devices=device_manager.get_all_devices())


# Run the app
if __name__ == "__main__":
    app.run(host=HOST, port=PORT, debug=DEBUG)
