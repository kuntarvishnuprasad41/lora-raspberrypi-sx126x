# LoRa Motor Controller Server

This project is a WebSocket-based server using Express and WebSockets to communicate with a LoRa-based motor controller module. The **HomeServer** module always receives data from the LoRa module at the motor side and, if and when the user gives a command, it sends the instruction to the motor end.

## Features
- WebSocket communication with clients
- Continuous data reception from the motor-side LoRa module
- Dynamic address assignment for LoRa nodes
- Command sending to the motor controller
- Real-time status updates

## Technologies Used
- **Node.js** (Express, WebSocket)
- **LoRa Module** (SX126X)

## Installation
1. Clone the repository:
   ```sh
   git clone https://github.com/your-repo/lora-motor-controller-server.git
   cd lora-motor-controller-server
   ```
2. Install dependencies:
   ```sh
   npm install
   ```
3. Run the server:
   ```sh
   node server.js
   ```

## WebSocket API
### Client Messages
#### Set Current Address
```json
{
  "type": "set_current_address",
  "address": 10
}
```
Sets the LoRa module's current address.

#### Set Target Address
```json
{
  "type": "set_target_address",
  "address": 30
}
```
Sets the target address for sending commands to the motor controller.

#### Send Command
```json
{
  "type": "command",
  "command": "TURN_ON"
}
```
Sends a command to the motor controller at the target node.

### Server Responses
#### Status Updates
```json
{
  "type": "status",
  "message": "LoRa module initialized and listening for data."
}
```

#### Errors
```json
{
  "type": "error",
  "message": "Invalid current address."
}
```

## Notes
- Ensure the LoRa module is properly connected.
- WebSocket clients should handle JSON responses properly.
- The server listens on `ws://localhost:PORT`
 


# LoRa Motor Hop

# LoRa GPIO Control with Node.js

## Overview
This is a Node.js implementation for controlling a relay-based motor system using a LoRa module and GPIO pins on a Raspberry Pi. The system listens for LoRa commands to turn the motor ON/OFF and monitors a sensor input for automatic control. It also always receives the data from server, unless if there any request from user 

## Features
- LoRa communication via SerialPort.
- Relay control for motor ON/OFF.
- Sensor-based automatic motor control.
- Stable zero count mechanism to prevent false triggers.
- Graceful termination with cleanup.

## Requirements
- Raspberry Pi (with GPIO support)
- LoRa module connected to `/dev/ttyS0`
- Relays connected to GPIO 23 and 24
- Sensor input on GPIO 25
- Node.js installed

## Installation
1. Clone this repository:
   ```sh
   git clone https://github.com/your-repo/lora-gpio-control.git
   cd lora-gpio-control
   ```
2. Install dependencies:
   ```sh
   npm install
   ```
3. Run the script:
   ```sh
   node index.js
   ```

## Configuration
- Modify `currentAddress` and `targetAddress` in `index.js` as needed.
- Ensure correct GPIO pin mappings for relays and sensors.

## Usage
- Sends and receives LoRa commands (`ON`, `OFF`, `STATUS`).
- Automatically controls motor based on sensor input.
- Uses a stable zero count threshold to prevent noise interference.

## Cleanup
To stop the script safely and release GPIO resources, press `CTRL+C`.

## License
This project is open-source and available under the MIT License.

