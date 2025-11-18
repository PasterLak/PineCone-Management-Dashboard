#!/bin/bash
# setup_linux_pc.sh

set -e
APP_DIR="$(pwd)"

echo -e "PineCone Dashboard Setup (Linux, Current Folder)"

if ! command -v pyenv &> /dev/null; then
  echo -e "Fehler: pyenv is not installed."
  echo "pls install first: (https://github.com/pyenv/pyenv)."
  exit 1
fi

if ! pyenv versions | grep -q "bl_venv"; then
  echo -e "Erstelle pyenv-Environment 'bl_venv'..."
  pyenv virtualenv 3.11.9 bl_venv
fi

pyenv local bl_venv
pip install --upgrade pip
pip install flask

APP_PY="$APP_DIR/app.py"

if [ -f "$APP_PY" ]; then
  echo -e "Flask-App gefunden: $APP_PY"
else
  echo -e "Fehler: $APP_PY nicht gefunden."
  echo -e "Bitte lege app.py im Projektordner an (Python-Code ist jetzt ausgelagert)."
  exit 1
fi

echo -e "Setup completed!"
echo "-----------------------------------------"
echo "open in Browser:"
echo "  http://localhost:5000"
echo "-----------------------------------------"

eval "$(pyenv init -)"
eval "$(pyenv virtualenv-init -)"
pyenv activate bl_venv
python app.py
