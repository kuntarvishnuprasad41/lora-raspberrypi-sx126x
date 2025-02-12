let sentPackets = 0;
let receivedPackets = 0;

setInterval(() => {
    const packet = `Packet ${sentPackets}`;
    sender.serialPort.write(Buffer.from(packet), (err) => {
        if (!err) sentPackets++;
    });
}, 1000);

receiver.serialPort.on('data', (data) => {
    receivedPackets++;
    console.log(`Received: ${data.toString()}`);
    console.log(`Packet loss rate: ${(1 - receivedPackets / sentPackets) * 100}%`);
});
