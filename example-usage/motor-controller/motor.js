const SerialPort = require('serialport');
const Readline = require('@serialport/parser-readline');
const Gpio = require('onoff').Gpio;
const os = require('os');
const moment = require('moment');

// GPIO Setup
const relayOn = new Gpio(23, 'out'); // Relay ON
const relayOff = new Gpio(24, 'out'); // Relay OFF
const sensorInput = new Gpio(25, 'in', 'both'); // Sensor Input

// Initial States
relayOn.writeSync(0);
relayOff.writeSync(0);
let prevState = "OFF";
let stableZeroCount = 0;
const ZERO_THRESHOLD = 100;

// LoRa Setup
const port = new SerialPort('/dev/ttyS0', { baudRate: 9600 });
const parser = port.pipe(new Readline({ delimiter: '\n' }));
const currentAddress = 30;
const targetAddress = 0;

function sendCommand(command, target) {
    const message = JSON.stringify({ command, time: moment().format('YYYY-MM-DD HH:mm:ss') });
    port.write(`<${target}>${message}\n`);
    console.log(`Command sent to ${target}: ${command}`);
}

function sendReply(message, target) {
    const replyMessage = JSON.stringify({ reply: message, time: moment().format('YYYY-MM-DD HH:mm:ss') });
    port.write(`<${target}>${replyMessage}\n`);
    console.log(`Reply sent to ${target}: ${message}`);
}

parser.on('data', (data) => {
    try {
        const receivedJson = JSON.parse(data.trim());
        const command = receivedJson.command;

        if (command === "ON") {
            relayOff.writeSync(0);
            relayOn.writeSync(1);
            sendReply("Motor on", targetAddress);
            prevState = "ON";
            stableZeroCount = 0;
        } else if (command === "OFF") {
            relayOn.writeSync(0);
            relayOff.writeSync(1);
            setTimeout(() => relayOff.writeSync(0), 500);
            sendReply("Motor off", targetAddress);
            prevState = "OFF";
            stableZeroCount = 0;
        } else if (command === "STATUS") {
            sendReply(`Motor is ${prevState}`, targetAddress);
        } else {
            sendReply("Unknown command", targetAddress);
        }
    } catch (error) {
        console.error(`Received invalid data: ${data}`);
    }
});

sensorInput.watch((err, value) => {
    if (err) {
        console.error('Sensor error:', err);
        return;
    }

    if (value === 1) {
        console.log("On Detected");
        stableZeroCount = 0;
        if (prevState === "OFF") {
            relayOff.writeSync(0);
            relayOn.writeSync(1);
            sendCommand("ON", targetAddress);
            prevState = "ON";
        }
    } else {
        stableZeroCount++;

        if (stableZeroCount >= ZERO_THRESHOLD && prevState === "ON") {
            relayOn.writeSync(0);
            relayOff.writeSync(1);
            setTimeout(() => relayOff.writeSync(0), 500);
            sendReply("Motor off", targetAddress);
            sendCommand("OFF", targetAddress);
            prevState = "OFF";
            stableZeroCount = 0;
        }
    }
});

process.on('SIGINT', () => {
    relayOn.unexport();
    relayOff.unexport();
    sensorInput.unexport();
    console.log("Program terminated.");
    process.exit();
});
