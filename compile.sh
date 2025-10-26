#!/bin/bash


echo "================================================"
echo " BL602 Compilation Started"
echo "================================================"

export BL60X_SDK_PATH="$HOME/bl602_iot_sdk"

# Activate virtual environment
#------------------------------------------------------------------------------#

export PATH="$HOME/.pyenv/bin:$PATH"
eval "$(pyenv init -)"
eval "$(pyenv virtualenv-init -)"


pyenv virtualenv 3.12 bl_venv

pyenv activate bl_venv

pip install --upgrade pip

#------------------------------------------------------------------------------#
# Run compile file
chmod u+x genromap
./genromap

echo "================================================"
echo "  BL602 Compilation Finished"
echo "================================================"
