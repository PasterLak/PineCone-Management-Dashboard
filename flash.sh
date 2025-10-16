#!/bin/bash

project_name="src"
port="/dev/ttyUSB0"

blflash flash "build_out/${project_name}.bin" --port "$port"
screen "$port" 2000000
