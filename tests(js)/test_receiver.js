const receiver = new SX126X('/dev/ttyS1', 915, 0x02, 22, -100);
receiver.initializeSerial('/dev/ttyS1');

receiver.serialPort.on('data', (data) => {
    console.log('Received message:', data.toString());
});
