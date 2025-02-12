import sys
import sx126x
import time
import json
import RPi.GPIO as GPIO
import os 

# GPIO Setup
GPIO.setmode(GPIO.BCM)
GPIO.setup(23, GPIO.OUT)  # Relay ON
GPIO.setup(24, GPIO.OUT)  # Relay OFF
GPIO.setup(25, GPIO.IN, pull_up_down=GPIO.PUD_DOWN)  # Sensor Input

# Initial States
GPIO.output(23, GPIO.LOW)
GPIO.output(24, GPIO.LOW)
DOUT_PIN = 25
current_address = 30
target_address = 0
prev_state = "OFF"
on_from_remote = False

# Noise Filtering Variables
stable_zero_count = 0
ZERO_THRESHOLD = 100   

# Initialize LoRa
node = sx126x.sx126x(serial_num="/dev/ttyS0", freq=433, addr=current_address, power=22, rssi=False)

def send_command(command, target_address):
    """Sends a command."""
    message = json.dumps({"command": command, "time": time.strftime("%Y-%m-%d %H:%M:%S")})
    original_address = node.addr
    node.set(node.freq, target_address, node.power, node.rssi)
    node.send(message)
    node.set(node.freq, original_address, node.power, node.rssi)
    print(f"Command sent to {target_address}.")

def send_reply(message, target_address):
    """Sends a reply."""
    reply_message = json.dumps({"reply": message, "time": time.strftime("%Y-%m-%d %H:%M:%S")})
    original_address = node.addr
    node.set(node.freq, target_address, node.power, node.rssi)
    node.send(reply_message)
    node.set(node.freq, original_address, node.power, node.rssi)
    print(f"Reply sent to {target_address}.")

try:
    while True:
        received_data = node.receive()
        if received_data:
            try:
                received_json = json.loads(received_data)
                command = received_json.get("command", "")

                if command == "ON":
                    GPIO.output(24, GPIO.LOW)   # Turn OFF relay 24
                    GPIO.output(23, GPIO.HIGH)  # Turn ON relay 23
                    send_reply("Motor on", target_address)
                    on_from_remote = True
                    prev_state = "ON"
                    stable_zero_count = 0  # Reset counter

                elif command == "OFF":
                    GPIO.output(23, GPIO.LOW)   # Turn OFF relay 23
                    GPIO.output(24, GPIO.HIGH)  # Turn ON relay 24
                    time.sleep(0.5)
                    GPIO.output(24, GPIO.LOW)  # Ensure relay 24 is ON
                    send_reply("Motor off", target_address)
                    on_from_remote = False
                    prev_state = "OFF"
                    stable_zero_count = 0  # Reset counter

                elif command == "STATUS":
                    status = "ON" if GPIO.input(23) else "OFF"
                    send_reply(f"Motor is {status}", target_address)

                else:
                    send_reply("Unknown command", target_address)

            except json.JSONDecodeError:
                print(f"Received non-JSON data: {received_data}")

        sc = 0
        # **Noise Filtering Logic for Motor Control**
        current_signal = GPIO.input(DOUT_PIN)
        if stable_zero_count > 50 and sc==0:
            print(f"Stable Zero Count: {stable_zero_count}")
            sc = sc+1
        else:
            sc = 0


        if current_signal:  # If sensor detects current
            print("On Detected, {current_signal}")
            stable_zero_count = 0  # Reset counter
            if prev_state == "OFF":
                GPIO.output(24, GPIO.LOW)   # Turn OFF relay 24
                GPIO.output(23, GPIO.HIGH)  # Turn ON relay 23
                send_command("ON", target_address)
                prev_state = "ON"

        else:  # Possible OFF condition
            stable_zero_count += 1
            # print(f"Stable Zero Count: {stable_zero_count}")

            if stable_zero_count >= ZERO_THRESHOLD and prev_state == "ON":
                GPIO.output(23, GPIO.LOW)   # Turn OFF relay 23
                GPIO.output(24, GPIO.HIGH)  # Turn ON relay 24
                time.sleep(0.5)
                GPIO.output(24, GPIO.LOW)  # Ensure relay 24 is ON
                send_reply("Motor off", target_address)
                send_command("OFF", target_address)
                prev_state = "OFF"
                stable_zero_count = 0  # Reset counter

            if stable_zero_count >= ZERO_THRESHOLD and prev_state == "OFF":
                stable_zero_count = 10  # Reset counter

        time.sleep(0.001)  # Small delay to reduce CPU usage

except KeyboardInterrupt:
    GPIO.cleanup()
    print("Program terminated.")
