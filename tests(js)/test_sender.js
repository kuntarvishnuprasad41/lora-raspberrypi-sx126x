const SX126X = require('./SX126X');

const sender = new SX126X('/dev/ttyS0', 915, 0x01, 22, -100);
sender.initializeSerial('/dev/ttyS0');

setTimeout(() => {
    const message = 'Hello from sender';
    sender.serialPort.write(Buffer.from(message), (err) => {
        if (err) console.error('Error sending:', err);
        else console.log('Message sent:', message);
    });
}, 2000);