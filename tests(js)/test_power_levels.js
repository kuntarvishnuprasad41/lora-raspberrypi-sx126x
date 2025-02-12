const powerLevels = [10, 13, 17, 22];
let currentPowerIndex = 0;

const testPower = () => {
    if (currentPowerIndex >= powerLevels.length) return;

    sender.power = powerLevels[currentPowerIndex];
    console.log(`Testing power level: ${sender.power} dBm`);

    sender.serialPort.write(Buffer.from(`Power Test ${sender.power}`), (err) => {
        if (err) console.error('Error sending:', err);
    });

    currentPowerIndex++;
    setTimeout(testPower, 3000);
};

setTimeout(testPower, 3000);