import sys
import sx126x
import time
import json
import RPi.GPIO as GPIO
import os 

# GPIO Setup
GPIO.setmode(GPIO.BCM)
GPIO.setup(25, GPIO.IN, pull_up_down=GPIO.PUD_DOWN)  # Sensor Input

# DOUT Pin and Address Setup
DOUT_PIN = 25
current_address = 30
target_address = 0

# Noise Filtering Variables
stable_zero_count = 0
ZERO_THRESHOLD = 100

# Initialize LoRa
node = sx126x.sx126x(serial_num="/dev/ttyS0", freq=433, addr=current_address, power=22, rssi=False)

def send_status(status, target_address):
    """Sends the status (ON/OFF)."""
    message = json.dumps({"status": status, "time": time.strftime("%Y-%m-%d %H:%M:%S")})
    original_address = node.addr
    node.set(node.freq, target_address, node.power, node.rssi)
    node.send(message)
    node.set(node.freq, original_address, node.power, node.rssi)
    print(f"Status '{status}' sent to {target_address}.")

try:
    while True:
        # Read sensor signal
        current_signal = GPIO.input(DOUT_PIN)

        # Determine status based on stable zero count
        if current_signal:
            stable_zero_count = 0  # Reset if signal is detected
        else:
            stable_zero_count += 1  # Increment if no signal

        # Determine status to send
        status = "ON" if stable_zero_count == 0 else "OFF"
        send_status(status, target_address)

        # Wait for 5 seconds before sending the next status
        time.sleep(5)

except KeyboardInterrupt:
    GPIO.cleanup()
    print("Program terminated.")
