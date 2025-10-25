#!/bin/bash

# BL602 Project Compilation Script

echo "BL602 Compilation Started"

export BL60X_SDK_PATH="$HOME/bl602_iot_sdk"

# Standard pyenv initialization
export PATH="$HOME/.pyenv/bin:$PATH"
eval "$(pyenv init -)"
eval "$(pyenv virtualenv-init -)"


pyenv virtualenv 3.12 bl_venv

# Activate virtual environment
pyenv activate bl_venv

# Run compile file
chmod u+x genromap
./genromap

echo "================================================"
echo "BL602 Compilation Finished"
echo "================================================"
