const senderTest = new SX126X('/dev/ttyS0', 915, 0x01, 22, -100);
const receiverTest = new SX126X('/dev/ttyS1', 915, 0x02, 22, -100);

senderTest.initializeSerial('/dev/ttyS0');
receiverTest.initializeSerial('/dev/ttyS1');

setTimeout(() => {
    const testMessage = 'Ping';
    senderTest.serialPort.write(Buffer.from(testMessage), (err) => {
        if (err) console.error('Error sending:', err);
        else console.log('Test message sent:', testMessage);
    });
}, 2000);

receiverTest.serialPort.on('data', (data) => {
    if (data.toString() === 'Ping') {
        console.log('SX126X modules are connected and communicating!');
    } else {
        console.log('Unexpected response:', data.toString());
    }
});
