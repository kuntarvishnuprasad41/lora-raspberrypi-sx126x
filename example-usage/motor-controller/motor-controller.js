const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');

const SX126X = require('./sx126x'); // Assuming sx126x.js is in the same directory

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json()); // for parsing application/json

let node; // SX126X instance will be stored here
let currentAddress;
let targetAddress = 30; // Default target address

wss.on('connection', ws => {
    console.log('Client connected');

    ws.on('message', message => {
        try {
            const msg = JSON.parse(message.toString());
            if (msg.type === 'set_current_address') {
                currentAddress = parseInt(msg.address);
                if (!isNaN(currentAddress) && currentAddress >= 0 && currentAddress <= 65535) {
                    console.log(`Current node address set to: ${currentAddress}`);
                    // Initialize LoRa module and serial port here, after getting current address
                    node = new SX126X(null, 433, currentAddress, 22, false);
                    node.beginSerial("/dev/ttyS0");
                    node.set(433, currentAddress, 22, false);
                    ws.send(JSON.stringify({ type: 'status', message: 'LoRa module initialized.' }));
                } else {
                    ws.send(JSON.stringify({ type: 'error', message: 'Invalid current address.' }));
                }
            } else if (msg.type === 'set_target_address') {
                targetAddress = parseInt(msg.address);
                if (!isNaN(targetAddress) && targetAddress >= 0 && targetAddress <= 65535) {
                    console.log(`Target node address set to: ${targetAddress}`);
                    ws.send(JSON.stringify({ type: 'status', message: `Target address updated to ${targetAddress}` }));
                } else {
                    ws.send(JSON.stringify({ type: 'error', message: 'Invalid target address.' }));
                }
            } else if (msg.type === 'command') {
                if (node) {
                    send_command(msg.command, targetAddress);
                    ws.send(JSON.stringify({ type: 'status', message: `Command "${msg.command}" sent to ${targetAddress}` }));
                } else {
                    ws.send(JSON.stringify({ type: 'error', message: 'LoRa module not initialized. Set current address first.' }));
                }
            }
        } catch (e) {
            console.error('Error parsing message:', e);
            ws.send(JSON.stringify({ type: 'error', message: 'Invalid message format.' }));
        }
    });

    ws.on('close', () => {
        console.log('Client disconnected');
    });

    ws.on('error', error => {
        console.error('WebSocket error:', error);
    });
});


function send_command(command, target_address) {
    if (!node) {
        console.error("LoRa module not initialized.");
        return;
    }
    const timestamp = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');
    const message = { command: command, time: timestamp };
    const json_message = JSON.stringify(message);

    const original_address = node.addr;
    node.addr_temp = node.addr;
    node.set(node.freq, target_address, node.power, node.rssi)
        .then(() => {
            node.send(json_message);
            return new Promise(resolve => setTimeout(resolve, 200));
        })
        .then(() => {
            return node.set(node.freq, original_address, node.power, node.rssi);
        })
        .then(() => {
            console.log(`Command sent to ${target_address}.`);
        })
        .catch(error => {
            console.error("Error in send_command:", error);
        });
}


// Basic route to serve index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});


const PORT = 3000; // Choose a different port if 8888 is still in use or conflicting
server.listen(PORT, () => {
    console.log(`Server started on http://192.168.100.16:${PORT}`);
});