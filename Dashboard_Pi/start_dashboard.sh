#!/bin/bash
# start_dashboard.sh
set -e
APP_DIR="$(pwd)"

echo -e "PineCone Dashboard Setup (Linux, Current Folder)"

# Create virtual environment if it doesn't exist
if [ ! -d "dashboard" ]; then
  echo -e "Creating Python virtual environment 'dashboard'..."
  python3 -m venv dashboard
fi

# Activate virtual environment
source ./dashboard/bin/activate

# Upgrade pip and install flask
pip install --upgrade pip
pip install flask

APP_PY="$APP_DIR/app.py"

if [ -f "$APP_PY" ]; then
  echo -e "Flask-App found: $APP_PY"
  chmod +x "$APP_PY"
else
  echo -e "Error: $APP_PY not found."
  exit 1
fi

echo -e "Setup completed!"
echo "-----------------------------------------"
echo "open in Browser:"
echo "  http://localhost:5000"
echo "-----------------------------------------"

sudo ./dashboard/bin/python3 app.py
