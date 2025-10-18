#!/bin/bash

port="/dev/ttyUSB0"

echo "================================================"
echo "PineCone Serial Monitor"
echo "================================================"
echo "Port: $port"
echo "Baud rate: 2000000"
echo ""
echo "Make sure PineCone is in operating mode:"
echo "- IO8 bridged with L (Low)"
echo "- Device powered on"
echo ""
echo "Press Ctrl+A then K to exit screen session"
echo "================================================"

screen "$port" 2000000