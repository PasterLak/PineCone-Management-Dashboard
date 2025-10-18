#!/bin/bash

# Standard pyenv initialization
export PATH="$HOME/.pyenv/bin:$PATH"
eval "$(pyenv init -)"
eval "$(pyenv virtualenv-init -)"

# Activate virtual environment
pyenv activate bl_venv

# run compile file
./genromap
