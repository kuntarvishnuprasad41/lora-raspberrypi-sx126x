const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout,
});

class SX126X {
    constructor(serial_num, freq, addr, power, rssi) {
        console.log('[SX126X] Constructor called');
        this.rssi = rssi;
        this.addr = addr;
        this.freq = freq;
        this.serial_n = serial_num;
        this.power = power;
        this.send_to = addr;

        this.M0 = 22;
        this.M1 = 27;

        this.cfg_reg = [0xC2, 0x00, 0x09, 0x00, 0x00, 0x00, 0x62, 0x00, 0x17, 0x00, 0x00, 0x00];
        this.get_reg = Buffer.alloc(12);
        this.serialPort = null;

        this.SX126X_UART_BAUDRATE_1200 = 0x00;
        this.SX126X_UART_BAUDRATE_2400 = 0x20;
        this.SX126X_UART_BAUDRATE_4800 = 0x40;
        this.SX126X_UART_BAUDRATE_9600 = 0x60;
        this.SX126X_UART_BAUDRATE_19200 = 0x80;
        this.SX126X_UART_BAUDRATE_38400 = 0xA0;
        this.SX126X_UART_BAUDRATE_57600 = 0xC0;
        this.SX126X_UART_BAUDRATE_115200 = 0xE0;

        this.SX126X_AIR_SPEED_300bps = 0x00;
        this.SX126X_AIR_SPEED_1200bps = 0x01;
        this.SX126X_AIR_SPEED_2400bps = 0x02;
        this.SX126X_AIR_SPEED_4800bps = 0x03;
        this.SX126X_AIR_SPEED_9600bps = 0x04;
        this.SX126X_AIR_SPEED_19200bps = 0x05;
        this.SX126X_AIR_SPEED_38400bps = 0x06;
        this.SX126X_AIR_SPEED_62500bps = 0x07;

        this.SX126X_PACKAGE_SIZE_240_BYTE = 0x00;
        this.SX126X_PACKAGE_SIZE_128_BYTE = 0x40;
        this.SX126X_PACKAGE_SIZE_64_BYTE = 0x80;
        this.SX126X_PACKAGE_SIZE_32_BYTE = 0xC0;

        this.SX126X_Power_22dBm = 0x00;
        this.SX126X_Power_17dBm = 0x01;
        this.SX126X_Power_13dBm = 0x02;
        this.SX126X_Power_10dBm = 0x03;

        this.initializeGPIO();

    }

    beginSerial(serial_num) {
        console.log('[SX126X] beginSerial called with serial_num:', serial_num);

        const SerialPort = require('serialport').SerialPort;

        this.serialPort = new SerialPort({ // e.g., '/dev/ttyS0'
            path: serial_num,
            baudRate: 9600,
        });

        this.serialPort.on('open', () => {
            this.serialPort.flush(() => {
                console.log('[SX126X] Serial port opened and input flushed');
            });
        });

        this.serialPort.on('error', (err) => {
            console.error("[SX126X] Serial port error:", err);
        });

    }

    async initializeGPIO() {
        console.log('[SX126X] initializeGPIO called');
        try {
            const pigpio = require('pigpio').Gpio;
            this.m0Pin = new pigpio(this.M0, { mode: pigpio.OUTPUT });
            this.m1Pin = new pigpio(this.M1, { mode: pigpio.OUTPUT });

            this.m0Pin.digitalWrite(0);
            this.m1Pin.digitalWrite(1);
            console.log('[SX126X] GPIO initialized and pins set (M0:0, M1:1)');
        } catch (error) {
            console.error("[SX126X] Error initializing GPIO:", error);
        }
    }

    initializeSerial(serial_num) {
        console.log('[SX126X] initializeSerial called with serial_num:', serial_num);

        const SerialPort = require('serialport').SerialPort;

        this.serialPort = new SerialPort({ // e.g., '/dev/ttyS0'
            path: serial_num,
            baudRate: 9600,
        });

        this.serialPort.on('open', () => {
            this.serialPort.flush(() => { // Flush input buffer on open
                console.log('[SX126X] Serial port opened and input flushed');
            });
        });

        this.serialPort.on('error', (err) => {
            console.error("[SX126X] Serial port error:", err);
        });

    }


    air_speed_cal(air_speed) {
        console.log('[SX126X] air_speed_cal called with air_speed:', air_speed);
        let speedCode;
        if (air_speed === 300) speedCode = this.SX126X_AIR_SPEED_300bps;
        else if (air_speed === 1200) speedCode = this.SX126X_AIR_SPEED_1200bps;
        else if (air_speed === 2400) speedCode = this.SX126X_AIR_SPEED_2400bps;
        else if (air_speed === 4800) speedCode = this.SX126X_AIR_SPEED_4800bps;
        else if (air_speed === 9600) speedCode = this.SX126X_AIR_SPEED_9600bps;
        else if (air_speed === 19200) speedCode = this.SX126X_AIR_SPEED_19200bps;
        else if (air_speed === 38400) speedCode = this.SX126X_AIR_SPEED_38400bps;
        else if (air_speed === 62500) speedCode = this.SX126X_AIR_SPEED_62500bps;
        else speedCode = this.SX126X_AIR_SPEED_2400bps; // Default to 2400 if not matched
        console.log(`[SX126X] air_speed_cal returning speedCode: 0x${speedCode.toString(16)}`);
        return speedCode;
    }

    buffer_size_cal(buffer_size) {
        console.log('[SX126X] buffer_size_cal called with buffer_size:', buffer_size);
        let sizeCode;
        if (buffer_size === 240) sizeCode = this.SX126X_PACKAGE_SIZE_240_BYTE;
        else if (buffer_size === 128) sizeCode = this.SX126X_PACKAGE_SIZE_128_BYTE;
        else if (buffer_size === 64) sizeCode = this.SX126X_PACKAGE_SIZE_64_BYTE;
        else if (buffer_size === 32) sizeCode = this.SX126X_PACKAGE_SIZE_32_BYTE;
        else sizeCode = this.SX126X_PACKAGE_SIZE_240_BYTE; // Default to 240
        console.log(`[SX126X] buffer_size_cal returning sizeCode: 0x${sizeCode.toString(16)}`);
        return sizeCode;
    }

    power_cal(power) {
        console.log('[SX126X] power_cal called with power:', power);
        let powerCode;
        if (power === 22) powerCode = this.SX126X_Power_22dBm;
        else if (power === 17) powerCode = this.SX126X_Power_17dBm;
        else if (power === 13) powerCode = this.SX126X_Power_13dBm;
        else if (power === 10) powerCode = this.SX126X_Power_10dBm;
        else powerCode = this.SX126X_Power_22dBm; // Default to 22dBm
        console.log(`[SX126X] power_cal returning powerCode: 0x${powerCode.toString(16)}`);
        return powerCode;
    }


    async set(freq, addr, power, rssi, air_speed = 2400,
        net_id = 0, buffer_size = 240, crypt = 0,
        relay = false, lbt = false, wor = false) {
        console.log('[SX126X] set called with freq:', freq, 'addr:', addr, 'power:', power, 'rssi:', rssi, 'air_speed:', air_speed, 'net_id:', net_id, 'buffer_size:', buffer_size, 'crypt:', crypt, 'relay:', relay, 'lbt:', lbt, 'wor:', wor);

        this.send_to = addr;
        this.addr = addr;

        this.m0Pin.digitalWrite(0); // GPIO.LOW
        this.m1Pin.digitalWrite(1); // GPIO.HIGH
        console.log('[SX126X] set: GPIO pins set M0:0, M1:1');
        await new Promise(resolve => setTimeout(resolve, 100)); // time.sleep(0.1)

        let low_addr = addr & 0xff;
        let high_addr = (addr >> 8) & 0xff;
        let net_id_temp = net_id & 0xff;
        let freq_temp;
        if (freq > 850) {
            freq_temp = freq - 850;
        } else if (freq > 410) {
            freq_temp = freq - 410;
        } else {
            freq_temp = freq; // Or handle error/default case
        }

        let air_speed_temp = this.air_speed_cal(air_speed);
        let buffer_size_temp = this.buffer_size_cal(buffer_size);
        let power_temp = this.power_cal(power);

        let rssi_temp = rssi ? 0x80 : 0x00; // Conditional for RSSI

        let l_crypt = crypt & 0xff;
        let h_crypt = (crypt >> 8) & 0xff;

        this.cfg_reg[3] = high_addr;
        this.cfg_reg[4] = low_addr;
        this.cfg_reg[5] = net_id_temp;
        this.cfg_reg[6] = this.SX126X_UART_BAUDRATE_9600 + air_speed_temp;
        this.cfg_reg[7] = buffer_size_temp + power_temp + 0x20;
        this.cfg_reg[8] = freq_temp;
        this.cfg_reg[9] = 0x03 + rssi_temp;
        this.cfg_reg[10] = h_crypt;
        this.cfg_reg[11] = l_crypt;

        const configBytes = Buffer.from(this.cfg_reg); // Convert array to Buffer
        console.log('[SX126X] set: Configuration bytes to send:', configBytes);

        for (let i = 0; i < 2; i++) {
            console.log(`[SX126X] set: Attempt ${i + 1} to write config`);
            this.serialPort.write(configBytes, (err) => { // Send config command
                if (err) {
                    console.log('[SX126X] set: Serial port write error:', err);
                    return; // Exit if write fails
                }
                console.log('[SX126X] set: Serial port write success, config sent.');
            });

            await new Promise(resolve => setTimeout(resolve, 200)); // time.sleep(0.2)

            if (this.serialPort.readable) { // Check if data is waiting (using 'readable' event might be better for non-blocking)
                await new Promise(resolve => setTimeout(resolve, 100)); // time.sleep(0.1) - small delay before reading

                const responseBuffer = this.serialPort.read(this.serialPort.bytesToRead); // Read available data
                if (responseBuffer && responseBuffer.length > 0) {
                    console.log('[SX126X] set: Response received:', responseBuffer);
                    if (responseBuffer[0] === 0xC1) {
                        console.log("[SX126X] set: Parameters setting successful.");
                        console.log("parameters setting is :", configBytes); // If you want to log config
                        console.log("parameters return is  :", responseBuffer); // If you want to log response
                        // Success - you can add more detailed logging if needed
                    } else {
                        console.log("[SX126X] set: Parameters setting fail, response code:", responseBuffer[0]);
                        console.log("parameters setting fail :", responseBuffer); // If you want to log failure response
                        // Setting failed - you can add more detailed error handling
                    }
                    break; // Exit loop on response (success or fail)
                }
            } else {
                console.log("[SX126X] set: No response received, trying again!");
                await new Promise(resolve => {
                    this.serialPort.flush(() => { // Flush input buffer before retry
                        console.log('[SX126X] set: Input flushed for retry.');
                        console.log('\x1b[1A\r'); // ANSI escape code - might need to handle this differently in Node.js if needed in console
                        if (i === 1) {
                            console.log("setting fail after 2 attempts, press Esc to exit and run again");
                            setTimeout(resolve, 2000); // time.sleep(2)
                            console.log('\x1b[1A\r'); // ANSI escape code - might need to handle this differently in Node.js if needed in console
                        } else {
                            resolve();
                        }
                    });
                });

                await new Promise(resolve => setTimeout(resolve, 200)); // time.sleep(0.2)
            }
        }

        this.m0Pin.digitalWrite(0); // GPIO.LOW
        this.m1Pin.digitalWrite(0); // GPIO.LOW
        console.log('[SX126X] set: GPIO pins set M0:0, M1:0 (Mode change complete)');
        await new Promise(resolve => setTimeout(resolve, 100)); // time.sleep(0.1)
        console.log('[SX126X] set: Configuration process finished.');
    }


    receive() {
        console.log('[SX126X] receive called');
        return new Promise((resolve, reject) => {
            let accumulatedData = ''; // Buffer to accumulate data

            const dataHandler = (data) => {
                console.log("[SX126X - receive()] Raw Bytes Received (Before Filter):", data); // Log raw data BEFORE filter

                let filteredData = data; // Assume no prefix initially
                const prefixBuffer = Buffer.from([0x00, 0x1e]);

                // Robust prefix check: Does data START WITH <Buffer 00 1e>?
                if (data.indexOf(prefixBuffer) === 0) {
                    filteredData = data.subarray(prefixBuffer.length); // Remove prefix
                    console.log("[SX126X - receive()] Prefix <Buffer 00 1e> detected and removed. Filtered Data:", filteredData); // Log filtered data
                } else {
                    console.log("[SX126X - receive()] No prefix <Buffer 00 1e> detected. Data:", data); // Log data if no prefix
                }


                const receivedString = filteredData.toString('utf8');
                accumulatedData += receivedString; // Append to buffer

                // Attempt to parse accumulated data as JSON
                try {

                    // const cleanData = accumulatedData.replace(/[\uFFFD\u0000-\u001F]/g, '');
                    const cleanData = accumulatedData.replace(/^[^{]+/, '');

                    accumulatedData = cleanData; // Clean up data before parsing

                    console.log('[SX126X - receive()] Attempting to parse accumulated data as JSON:', accumulatedData);

                    const parsedJSON = JSON.parse(accumulatedData);
                    // JSON parsing successful!
                    console.log(`[SX126X - receive()] Complete JSON Received and Parsed:`, parsedJSON);
                    this.serialPort.off('data', dataHandler);
                    this.serialPort.off('error', errorHandler);
                    resolve(JSON.stringify(parsedJSON));
                    accumulatedData = ''; // Reset buffer

                } catch (parseError) {
                    // JSON parsing failed - Incomplete or invalid
                    console.log("[SX126X - receive()] Incomplete or Invalid JSON, accumulating more data...", accumulatedData);
                    console.error("[SX126X - receive()] JSON Parse Error:", parseError); // Optional: Log parse error
                }
            };

            const errorHandler = (err) => {
                console.error("[SX126X - receive()] Error during receive:", err);
                this.serialPort.off('data', dataHandler);
                this.serialPort.off('error', errorHandler);
                reject(err);
            };

            console.log("[SX126X - receive()] Setting up data listener...");
            this.serialPort.on('data', dataHandler);
            this.serialPort.on('error', errorHandler);
        });
    }

    async send(tx_data) {
        console.log('[SX126X] send called with tx_data:', tx_data);
        return new Promise((resolve, reject) => {
            this.m0Pin.digitalWrite(0);
            this.m1Pin.digitalWrite(0);
            console.log('[SX126X] send: GPIO pins set M0:0, M1:0');

            const target_addr_high = (this.send_to >> 8) & 0xff;
            const target_addr_low = this.send_to & 0xff;
            const current_addr_high = (this.addr >> 8) & 0xff;
            const current_addr_low = this.addr & 0xff;

            const header = Buffer.from([target_addr_high, target_addr_low, current_addr_high, current_addr_low]);
            const data = Buffer.from(tx_data, 'utf8'); // Encode string to Buffer
            const bufferToSend = Buffer.concat([header, data]);

            console.log('[SX126X] send: Buffer to send:', bufferToSend);

            this.serialPort.write(bufferToSend, (err) => {
                if (err) {
                    console.error('[SX126X] send: Serial port send error:', err);
                    reject(err);
                } else {
                    console.log('[SX126X] send: Serial port sent data successfully.');
                    resolve();
                }
            });
        });
    }
}

// ===================== Tests =====================
async function runModuleConnectionTest(loraModule) {
    console.log("\n[Test Case] 1. Module Connection Test");
    try {
        loraModule.beginSerial(loraModule.serial_n);
        await new Promise(resolve => setTimeout(resolve, 2000)); // Wait for serial port to open
        if (loraModule.serialPort && loraModule.serialPort.isOpen) {
            console.log("[Test Passed] Module Connection: Serial port opened successfully.");
            return true;
        } else {
            console.error("[Test Failed] Module Connection: Serial port not opened.");
            return false;
        }
    } catch (error) {
        console.error("[Test Error] Module Connection Test Error:", error);
        return false;
    } finally {
        if (loraModule.serialPort && loraModule.serialPort.isOpen) {
            await new Promise(resolve => {
                loraModule.serialPort.close((err) => {
                    if (err) {
                        console.error("Error closing serial port after test:", err);
                    } else {
                        console.log("Serial port closed after Module Connection Test.");
                    }
                    resolve();
                });
            });
        }
    }
}


async function runSendingTest(loraModule, testData) {
    console.log("\n[Test Case] 3. Sending Test");
    try {
        loraModule.beginSerial(loraModule.serial_n); // Ensure serial port is open
        await new Promise(resolve => setTimeout(resolve, 2000));

        if (!loraModule.serialPort || !loraModule.serialPort.isOpen) {
            console.error("[Test Skipped] Sending Test: Serial port is not open.");
            return false;
        }

        await loraModule.send(testData);
        console.log("[Test Passed] Sending Test: Data sent successfully (check logs for 'Serial port sent data').");
        return true;

    } catch (error) {
        console.error("[Test Failed] Sending Test Error:", error);
        return false;
    } finally {
        if (loraModule.serialPort && loraModule.serialPort.isOpen) {
            await new Promise(resolve => {
                loraModule.serialPort.close((err) => {
                    if (err) {
                        console.error("Error closing serial port after test:", err);
                    } else {
                        console.log("Serial port closed after Sending Test.");
                    }
                    resolve();
                });
            });
        }
    }
}


async function runReceivingTest(loraModule) {
    console.log("\n[Test Case] 4. Receiving Test (Requires external sending to module)");
    loraModule.beginSerial(loraModule.serial_n); // Ensure serial port is open
    await new Promise(resolve => setTimeout(resolve, 2000));

    if (!loraModule.serialPort || !loraModule.serialPort.isOpen) {
        console.error("[Test Skipped] Receiving Test: Serial port is not open.");
        return false;
    }

    console.log("[Test Info] Receiving Test: Listening for data... (Send data to the module now)");
    try {
        const receivedData = await loraModule.receive();
        console.log("[Test Passed] Receiving Test: Data received successfully:", receivedData);
        return true;
    } catch (error) {
        console.error("[Test Failed] Receiving Test Error:", error);
        return false;
    } finally {
        if (loraModule.serialPort && loraModule.serialPort.isOpen) {
            await new Promise(resolve => {
                loraModule.serialPort.close((err) => {
                    if (err) {
                        console.error("Error closing serial port after test:", err);
                    } else {
                        console.log("Serial port closed after Receiving Test.");
                    }
                    resolve();
                });
            });
        }
    }
}


async function runSignalStrengthConfigTest(loraModule, rssiConfig) {
    console.log("\n[Test Case] 5. Signal Strength (RSSI) Configuration Test");
    try {
        await loraModule.set(868, 0x1234, 22, rssiConfig); // Configure with RSSI on/off
        const expectedRssiBit = rssiConfig ? 0x80 : 0x00;
        const actualRssiBit = loraModule.cfg_reg[9] & 0x80; // Check the RSSI bit in cfg_reg[9]

        console.log(`[Test Info] RSSI Config Parameter: ${rssiConfig}, Expected RSSI bit: 0x${expectedRssiBit.toString(16)}, Actual RSSI byte (cfg_reg[9]): 0x${loraModule.cfg_reg[9].toString(16)}, Actual RSSI bit: 0x${actualRssiBit.toString(16)}`);


        if (actualRssiBit === expectedRssiBit) {
            console.log("[Test Passed] Signal Strength Config Test: RSSI configuration bit set correctly.");
            return true;
        } else {
            console.error("[Test Failed] Signal Strength Config Test: RSSI configuration bit NOT set correctly.");
            return false;
        }
    } catch (error) {
        console.error("[Test Error] Signal Strength Config Test Error:", error);
        return false;
    }
}

async function runFullConfigSetTest(loraModule) {
    console.log("\n[Test Case] 6. Full Configuration 'set' Test");
    try {
        await loraModule.set(870, 0x4321, 17, true, 4800, 10, 128, 12345, false, true, false);
        console.log("[Test Passed] Full Configuration 'set' Test: 'set' function executed without errors. Check logs for detailed config and response.");
        return true;
    } catch (error) {
        console.error("[Test Failed] Full Configuration 'set' Test Error:", error);
        return false;
    }
}


async function runPacketLossSimulationTest(loraModule, packetCount = 10, simulateLossRate = 0.2) {
    console.log(`\n[Test Case] 2. Packet Loss Simulation Test (Sending ${packetCount} packets, simulating loss rate of ${simulateLossRate * 100}%)`);
    loraModule.beginSerial(loraModule.serial_n); // Ensure serial port is open
    await new Promise(resolve => setTimeout(resolve, 2000));

    if (!loraModule.serialPort || !loraModule.serialPort.isOpen) {
        console.error("[Test Skipped] Packet Loss Simulation Test: Serial port is not open.");
        return false;
    }

    let packetsSent = 0;
    let packetsSimulatedLost = 0;

    for (let i = 0; i < packetCount; i++) {
        const testData = `Packet ${i + 1} - Time: ${Date.now()}`;
        packetsSent++;
        if (Math.random() < simulateLossRate) {
            packetsSimulatedLost++;
            console.log(`[Packet Loss Simulation] Intentionally dropped packet: ${i + 1}`);
            continue; // Simulate packet loss
        }

        try {
            await loraModule.send(testData);
            console.log(`[Packet Loss Simulation] Sent packet: ${i + 1}`);
            await new Promise(resolve => setTimeout(resolve, 500)); // ചെറിയ delay കൊടുക്കുന്നു sender sideil response receive cheyyan
        } catch (error) {
            console.error(`[Packet Loss Simulation] Error sending packet ${i + 1}:`, error);
        }
    }

    const packetLossPercentage = (packetsSimulatedLost / packetsSent) * 100;
    console.log(`[Test Finished] Packet Loss Simulation Test: Packets Sent: ${packetsSent}, Packets Simulated Lost: ${packetsSimulatedLost}, Simulated Packet Loss Rate: ${packetLossPercentage.toFixed(2)}%`);
    console.log("[Test Info] Packet Loss Simulation Test: This test SIMULATES packet loss during sending. Actual packet loss in a real environment would need to be measured by the receiver side.");

    return true; // In a simulation, "success" is about running the simulation, not actual reception.
}

function displayMenu() {
    console.log("\nSX126X Module Test Menu:");
    console.log("1. Module Connection Test");
    console.log("2. Packet Loss Simulation Test");
    console.log("3. Sending Test");
    console.log("4. Receiving Test");
    console.log("5. Signal Strength Config Test (RSSI On)");
    console.log("6. Signal Strength Config Test (RSSI Off)");
    console.log("7. Full Configuration 'set' Test");
    console.log("8. Exit");
    return new Promise(resolve => {
        readline.question('Enter test number: ', resolve);
    });
}

async function getTestChoice() {
    const choice = await displayMenu();
    return parseInt(choice);
}

async function runTestByChoice(choice, loraModule) {
    let testPassed;
    const testMessage = JSON.stringify({ sensor: "temp", value: 25.5 });

    switch (choice) {
        case 1:
            testPassed = await runModuleConnectionTest(loraModule);
            break;
        case 2:
            testPassed = await runPacketLossSimulationTest(loraModule);
            break;
        case 3:
            testPassed = await runSendingTest(loraModule, testMessage);
            break;
        case 4:
            testPassed = await runReceivingTest(loraModule);
            break;
        case 5:
            testPassed = await runSignalStrengthConfigTest(loraModule, true);
            break;
        case 6:
            testPassed = await runSignalStrengthConfigTest(loraModule, false);
            break;
        case 7:
            testPassed = await runFullConfigSetTest(loraModule);
            break;
        case 8:
            console.log("Exiting test program.");
            readline.close();
            return false; // Signal to exit main loop
        default:
            console.log("Invalid choice. Please enter a number between 1 and 8.");
            return true; // To continue main loop
    }

    if (choice >= 1 && choice <= 7) {
        if (testPassed) {
            console.log(`[Test Summary] Test ${choice} PASSED.`);
        } else {
            console.log(`[Test Summary] Test ${choice} FAILED.`);
        }
    }
    return true; // To continue main loop
}


// ==== Main execution and test runner ====
async function main() {
    console.log("Starting SX126X Module Interactive Tests...");

    const serialPortName = "/dev/ttyS0"; // Replace with your serial port
    const loraModule = new SX126X(serialPortName, 868, 0x1234, 22, false); // Example parameters

    let continueTesting = true;
    while (continueTesting) {
        const choice = await getTestChoice();
        continueTesting = await runTestByChoice(choice, loraModule);
        if (!continueTesting) break; // Exit if user chose to exit or invalid choice but wants to exit.
    }

    console.log("SX126X Module Tests Finished.");
}


main();

module.exports = SX126X;