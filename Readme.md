# SX126X Node.js and python Library

This repository provides a Node.js library for interfacing with the SX126X series LoRa modules using UART and GPIO. The python version is seperate dir


## Features
- Configurable frequency, address, power, and RSSI.
- UART communication with serial port handling.
- GPIO initialization for mode selection.
- Configurable air speed and buffer size.
- Baud rate configuration support.

# Note: 
Follow these steps mandatorily to a successful working.
# Enabling Serial and SPI on Raspberry Pi

## **Enable Serial Interface**
Follow these steps to enable the Serial interface on your Raspberry Pi:

1. Open the terminal and run:
   ```sh
   sudo raspi-config
   ```
2. Navigate to **"Interface Options"**.
3. Select **"Serial Port"**.
4. When prompted:
   - "Would you like a login shell to be accessible over serial?" → **Select No**.
   - "Would you like the serial port hardware to be enabled?" → **Select Yes**.
5. Exit the tool and reboot your Raspberry Pi:
   ```sh
   sudo reboot
   ```

### **Verify Serial Interface**
After reboot, check if the serial interface is enabled:
```sh
ls -l /dev/serial*
```
You should see `/dev/serial0` or `/dev/ttyS0` in the output.

---

## **Enable SPI Interface**
Follow these steps to enable SPI on your Raspberry Pi:

1. Open the terminal and run:
   ```sh
   sudo raspi-config
   ```
2. Navigate to **"Interface Options"**.
3. Select **"SPI"**.
4. When prompted, select **Yes** to enable SPI.
5. Exit the tool and reboot your Raspberry Pi:
   ```sh
   sudo reboot
   ```

### **Verify SPI Interface**
After reboot, check if the SPI interface is enabled:
```sh
lsmod | grep spi
```
You should see something like `spi_bcm2835` in the output.

---

## **Additional Notes**
- Make sure you have the necessary permissions to access serial and SPI devices.
- If using the UART, disable the serial console in `/boot/config.txt` by adding:
  ```sh
  enable_uart=1
  ````
- Check logs for errors if the devices are not detected:
  ```sh
  dmesg | grep tty
  ```

This completes the setup for enabling Serial and SPI on Raspberry Pi!




## Installation
Ensure you have Node.js installed, then install the required dependencies:

```sh
npm install serialport pigpio
```

or just use 

```sh
 npm install ```


## Usage

### Import and Initialize
```javascript
const SX126X = require('./SX126X'); // Adjust path if needed

const lora = new SX126X('/dev/ttyS0', 915, 0x01, 22, -90);
lora.beginSerial('/dev/ttyS0');
```

### Configuration Methods
#### Set Air Speed
```javascript
const airSpeed = lora.air_speed_cal(9600);
```

#### Initialize GPIO
```javascript
lora.initializeGPIO();
```

### Handling Serial Communication
#### Opening Serial Port
```javascript
lora.initializeSerial('/dev/ttyS0');
```

#### Handling Errors
```javascript
lora.serialPort.on('error', (err) => {
    console.error("Serial port error:", err);
});
```

## Constants
### UART Baud Rates
- `SX126X_UART_BAUDRATE_1200`
- `SX126X_UART_BAUDRATE_2400`
- `SX126X_UART_BAUDRATE_4800`
- `SX126X_UART_BAUDRATE_9600`
- `SX126X_UART_BAUDRATE_19200`
- `SX126X_UART_BAUDRATE_38400`
- `SX126X_UART_BAUDRATE_57600`
- `SX126X_UART_BAUDRATE_115200`

### Air Speeds
- `SX126X_AIR_SPEED_300bps`
- `SX126X_AIR_SPEED_1200bps`
- `SX126X_AIR_SPEED_2400bps`
- `SX126X_AIR_SPEED_4800bps`
- `SX126X_AIR_SPEED_9600bps`
- `SX126X_AIR_SPEED_19200bps`
- `SX126X_AIR_SPEED_38400bps`
- `SX126X_AIR_SPEED_62500bps`

### Power Levels
- `SX126X_Power_22dBm`
- `SX126X_Power_17dBm`
- `SX126X_Power_13dBm`
- `SX126X_Power_10dBm`

## License
This project is licensed under the MIT License.

## Example Usage
 

## Example Usage
# SX126X LoRa Module Communication

## Overview
This project provides a Node.js interface to communicate with the SX126X LoRa module using serial communication. It allows sending and receiving messages, monitoring temperature, and configuring LoRa parameters.

## Features
- Initialize and configure the SX126X LoRa module
- Send messages to a target address
- Receive messages constantly
- Send temperature data continuously
- Receive temperature data continuously
- REST API for interaction

## Installation
```sh
npm install express cors 
```

## Example Usage

### Server Setup
Create an Express server to interact with the SX126X module via REST API.

```javascript
const express = require('express');
const cors = require('cors');
const SX126X = require('./sx126x');

const app = express();
app.use(express.json());
app.use(cors());

let node;
let currentAddress;
let targetAddress = 30;
let receivingDataStarted = false;

// Initialize LoRa Module
app.get('/init', (req, res) => {
    if (!node) {
        node = new SX126X(null, 433, currentAddress, 22, false);
        node.beginSerial("/dev/ttyAMA0");
        res.json({ message: 'LoRa module initialized' });
    } else {
        res.json({ message: 'LoRa module already initialized' });
    }
});

// Send a message
app.post('/send', (req, res) => {
    const { message } = req.body;
    if (node) {
        node.send(message);
        res.json({ message: 'Message sent' });
    } else {
        res.status(500).json({ error: 'LoRa module not initialized' });
    }
});

// Receive messages continuously
app.get('/receive', (req, res) => {
    if (node) {
        node.receive((data) => {
            res.json({ message: data.toString() });
        });
    } else {
        res.status(500).json({ error: 'LoRa module not initialized' });
    }
});

// Send temperature continuously
app.get('/send-temperature', (req, res) => {
    if (node) {
        setInterval(() => {
            const temperature = Math.random() * 50; // Simulated temperature data
            node.send(`Temperature: ${temperature.toFixed(2)}°C`);
        }, 5000);
        res.json({ message: 'Temperature data transmission started' });
    } else {
        res.status(500).json({ error: 'LoRa module not initialized' });
    }
});

// Receive temperature data continuously
app.get('/receive-temperature', (req, res) => {
    if (node) {
        node.receive((data) => {
            if (data.toString().startsWith('Temperature:')) {
                res.json({ temperature: data.toString() });
            }
        });
    } else {
        res.status(500).json({ error: 'LoRa module not initialized' });
    }
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
```



