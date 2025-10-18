#!/bin/bash

# BL602 Project Compilation Script

echo "BL602 Compilation Started"

# Standard pyenv initialization
export PATH="$HOME/.pyenv/bin:$PATH"
eval "$(pyenv init -)"
eval "$(pyenv virtualenv-init -)"

# Activate virtual environment
pyenv activate bl_venv

# Run compile file
chmod u+x genromap
./genromap

echo "================================================"
echo "BL602 Compilation Finished"
echo "================================================"