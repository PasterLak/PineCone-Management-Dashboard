#!/bin/bash

echo "================================================"
echo "BL602 Toolchain Installation Script"
echo "================================================"

cd $HOME

echo "Installing system dependencies..."
sudo apt-get update
sudo apt-get install -y build-essential python3 python3-pip git screen wget xz-utils curl libssl-dev libbz2-dev ncurses-dev libffi-dev libsqlite3-dev tk-dev liblzma-dev libreadline-dev

echo "Installing pyenv..."
curl -fsSL https://pyenv.run | bash

echo "Configuring pyenv in bashrc..."
echo 'export PYENV_ROOT="$HOME/.pyenv"' >> ~/.bashrc
echo '[[ -d $PYENV_ROOT/bin ]] && export PATH="$PYENV_ROOT/bin:$PATH"' >> ~/.bashrc
echo 'eval "$(pyenv init - bash)"' >> ~/.bashrc

echo "Cloning BL602 SDK..."
git clone --recursive https://github.com/ttefke/bl602_iot_sdk.git

cd bl602_iot_sdk
echo "Setting up BL602 SDK environment variables..."
echo export BL60X_SDK_PATH=$(pwd) >> ~/.bashrc
echo export CONFIG_CHIP_NAME=BL602 >> ~/.bashrc

echo "Installing RISC-V toolchain..."
mkdir -p toolchain/compiler
wget https://github.com/ttefke/riscv-gnu-toolchain/releases/download/2025.08.29/suas-gcc-15-1.tar.xz -O /tmp/toolchain.tar.xz
tar xJf /tmp/toolchain.tar.xz -C toolchain/compiler

echo "Installing blflash tool..."
mkdir -p toolchain/bin
wget https://github.com/spacemeowx2/blflash/releases/download/v0.3.5/blflash-linux-amd64 -O toolchain/bin/blflash
chmod u+x toolchain/bin/blflash

echo "Adding tools to PATH..."
echo export PATH="$PATH:$(pwd)/toolchain/bin" >> ~/.bashrc

echo "Adding user to dialout group for serial access..."
sudo usermod -a -G dialout $USER

echo "Reloading shell configuration..."
exec "$SHELL"
# source ~/.bashrc

echo "Installing Python 3.12 and virtual environment..."
pyenv install 3.12
pyenv virtualenv 3.12 bl_venv

pyenv activate bl_venv

echo "Creating system-wide BL602 environment configuration..."
sudo tee /etc/profile.d/bl602.sh >/dev/null <<EOF
export BL60X_SDK_PATH=~/bl602_iot_sdk
export CONFIG_CHIP_NAME=BL602
EOF

sudo tee -a /etc/bash.bashrc >/dev/null <<EOF

# BL602 SDK Configuration
export BL60X_SDK_PATH=~/bl602_iot_sdk
export CONFIG_CHIP_NAME=BL602
EOF

echo "Sourcing environment configuration..."
source /etc/bash.bashrc

echo "Verifying BL602 SDK path..."
echo "BL60X_SDK_PATH is set to: $BL60X_SDK_PATH"



export PYENV_ROOT="$HOME/.pyenv"
[[ -d $PYENV_ROOT/bin ]] && export PATH="$PYENV_ROOT/bin:$PATH"
eval "$(pyenv init - bash)"
eval "$(pyenv virtualenv-init -)"


source ~/.bashrc

echo "================================================"
echo "Toolchain Installation Completed Successfully"
echo "================================================"

