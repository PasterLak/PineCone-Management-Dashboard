

#!/bin/bash

echo "INSTALLING"

cd $HOME

sudo apt-get install build-essential python3 python3-pip git screen wget xz-utils curl libssl-dev libbz2-dev ncurses-dev libffi-dev libsqlite3-dev tk-dev liblzma-dev libreadline-dev

curl -fsSL https://pyenv.run | bash

echo 'export PYENV_ROOT="$HOME/.pyenv"' >> ~/.bashrc
echo '[[ -d $PYENV_ROOT/bin ]] && export PATH="$PYENV_ROOT/bin:$PATH"' >> ~/.bashrc
echo 'eval "$(pyenv init - bash)"' >> ~/.bashrc

git clone --recursive https://github.com/ttefke/bl602_iot_sdk.git

cd bl602_iot_sdk
echo export BL60X_SDK_PATH=$(pwd) >> ~/.bashrc
echo export CONFIG_CHIP_NAME=BL602 >> ~/.bashrc

mkdir -p toolchain/compiler

wget https://github.com/ttefke/riscv-gnu-toolchain/releases/download/2025.08.29/suas-gcc-15-1.tar.xz -O /tmp/toolchain.tar.xz
tar xJf /tmp/toolchain.tar.xz -C toolchain/compiler


mkdir -p toolchain/bin
wget https://github.com/spacemeowx2/blflash/releases/download/v0.3.5/blflash-linux-amd64 -O toolchain/bin/blflash
chmod u+x toolchain/bin/blflash

echo export PATH="$PATH:$(pwd)/toolchain/bin" >> ~/.bashrc


sudo usermod -a -G dialout $USER


exec "$SHELL"




pyenv install 3.12
pyenv virtualenv 3.12 bl_venv

pyenv activate bl_venv

#  BL602 SDK Environment Setup


sudo tee /etc/profile.d/bl602.sh >/dev/null <<EOF
export BL60X_SDK_PATH=~/bl602_iot_sdk
export CONFIG_CHIP_NAME=BL602
EOF

sudo tee -a /etc/bash.bashrc >/dev/null <<EOF

# BL602 SDK Configuration
export BL60X_SDK_PATH=~/bl602_iot_sdk
export CONFIG_CHIP_NAME=BL602
EOF

source /etc/bash.bashrc

echo $BL60X_SDK_PATH


















