#!/bin/bash

project_name="PineCone-Management-Dashboard"
port="/dev/ttyUSB0"

echo "================================================"
echo "Starting Flashing Process"
echo "================================================"
echo "Project: $project_name"
echo "Port: $port"
echo "Firmware: build_out/${project_name}.bin"
echo ""

echo "Flashing firmware to device..."
blflash flash "build_out/${project_name}.bin" --port "$port"

echo ""
echo "Starting serial monitor..."
echo "Press Ctrl+A then K to exit screen session"
echo "================================================"

screen "$port" 2000000

echo "================================================"
echo "Flashing and Serial Monitor session ended"
echo "================================================"