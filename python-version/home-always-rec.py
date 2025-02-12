import sys
import sx126xtester as sx126x
import time
import select
import termios
import tty
import json
from threading import Timer

old_settings = termios.tcgetattr(sys.stdin)
tty.setcbreak(sys.stdin.fileno())

time.sleep(1)
print("Enter curr node address (0-65535):")
current_address = int(input())

node = sx126x.sx126x(serial_num="/dev/ttyAMA0", freq=433, addr=current_address, power=22, rssi=False)

def send_command(command, target_address):
    """Sends a command."""
    timestamp = time.strftime("%Y-%m-%d %H:%M:%S")
    message = {"command": command, "time": timestamp}
    json_message = json.dumps(message)

    original_address = node.addr
    node.addr_temp = node.addr
    node.set(node.freq, target_address, node.power, node.rssi)
    node.send(json_message)
    node.set(node.freq, original_address, node.power, node.rssi)
    time.sleep(0.2)
    print(f"Command sent to {target_address}.")


try:
    time.sleep(1)
    print("Enter target node address (0-65535):")
    target_address = int(input())

    print("Press \033[1;32m1\033[0m to send Motor ON command")
    print("Press \033[1;32m2\033[0m to send Motor OFF command")
    print("Press \033[1;32m3\033[0m to send Motor STATUS request")
    print("Press \033[1;32mEsc\033[0m to exit")

    while True:
        # Check for incoming data first
        received_data = node.receive()
        if received_data:
            current_time = time.strftime("%Y-%m-%d %H:%M:%S", time.localtime())
            print(f"[{current_time}] Received: {received_data}")  # No need for ReceiveDataContinuously

        # Then, check for keyboard input without blocking
        if select.select([sys.stdin], [], [], 0) == ([sys.stdin], [], []):
            c = sys.stdin.read(1)

            if c == '\x1b':  # Esc key
                break

            if c == '1':
                send_command("ON", target_address)
            elif c == '2':
                send_command("OFF", target_address)
            elif c == '3':
                send_command("STATUS", target_address)

            sys.stdout.flush()

        time.sleep(0.01) # Small delay for responsiveness

except ValueError:
    print("Invalid target address. Please enter a number between 0 and 65535.")
except Exception as e:
    print(f"An error occurred: {e}")
finally:
    termios.tcsetattr(sys.stdin, termios.TCSADRAIN, old_settings)