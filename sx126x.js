class SX126X {
    constructor(serial_num, freq, addr, power, rssi) { 
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
        // const SerialPort = require('serialport');
        const SerialPort = require('serialport').SerialPort;

        this.serialPort = new SerialPort({ // e.g., '/dev/ttyS0'
            path: serial_num,
            baudRate: 9600,
        });

        this.serialPort.on('open', () => {
            this.serialPort.flush(() => {
                console.log('Serial port opened and input flushed');
            });
        });

        this.serialPort.on('error', (err) => {
            console.error("Serial port error:", err);
        });

    }

    async initializeGPIO() {
        const pigpio = require('pigpio').Gpio; // Import pigpio library
        this.m0Pin = new pigpio(this.M0, { mode: pigpio.OUTPUT });
        this.m1Pin = new pigpio(this.M1, { mode: pigpio.OUTPUT });

        this.m0Pin.digitalWrite(0); // GPIO.LOW in pigpio (0)
        this.m1Pin.digitalWrite(1); // GPIO.HIGH in pigpio (1)
    }

    initializeSerial(serial_num) {
        // const SerialPort = require('serialport');
        const SerialPort = require('serialport').SerialPort;

        this.serialPort = new SerialPort({ // e.g., '/dev/ttyS0'
            path: serial_num,
            baudRate: 9600,
        });

        this.serialPort.on('open', () => {
            this.serialPort.flush(() => { // Flush input buffer on open
                console.log('Serial port opened and input flushed');
            });
        });

        this.serialPort.on('error', (err) => {
            console.error("Serial port error:", err);
        });

    }


    air_speed_cal(air_speed) {
 
        if (air_speed === 300) return this.SX126X_AIR_SPEED_300bps;
        else if (air_speed === 1200) return this.SX126X_AIR_SPEED_1200bps;
        else if (air_speed === 2400) return this.SX126X_AIR_SPEED_2400bps;
        else if (air_speed === 4800) return this.SX126X_AIR_SPEED_4800bps;
        else if (air_speed === 9600) return this.SX126X_AIR_SPEED_9600bps;
        else if (air_speed === 19200) return this.SX126X_AIR_SPEED_19200bps;
        else if (air_speed === 38400) return this.SX126X_AIR_SPEED_38400bps;
        else if (air_speed === 62500) return this.SX126X_AIR_SPEED_62500bps;
        else return this.SX126X_AIR_SPEED_2400bps; // Default to 2400 if not matched
    }

    buffer_size_cal(buffer_size) {
     
        if (buffer_size === 240) return this.SX126X_PACKAGE_SIZE_240_BYTE;
        else if (buffer_size === 128) return this.SX126X_PACKAGE_SIZE_128_BYTE;
        else if (buffer_size === 64) return this.SX126X_PACKAGE_SIZE_64_BYTE;
        else if (buffer_size === 32) return this.SX126X_PACKAGE_SIZE_32_BYTE;
        else return this.SX126X_PACKAGE_SIZE_240_BYTE; // Default to 240
    }

    power_cal(power) {
   
        if (power === 22) return this.SX126X_Power_22dBm;
        else if (power === 17) return this.SX126X_Power_17dBm;
        else if (power === 13) return this.SX126X_Power_13dBm;
        else if (power === 10) return this.SX126X_Power_10dBm;
        else return this.SX126X_Power_22dBm; // Default to 22dBm
    }


    async set(freq, addr, power, rssi, air_speed = 2400,
        net_id = 0, buffer_size = 240, crypt = 0,
        relay = false, lbt = false, wor = false) {

        this.send_to = addr;
        this.addr = addr;

        this.m0Pin.digitalWrite(0); // GPIO.LOW
        this.m1Pin.digitalWrite(1); // GPIO.HIGH
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

        for (let i = 0; i < 2; i++) {
            this.serialPort.write(configBytes, (err) => { // Send config command
                if (err) {
                    console.log('Serial port write error:', err);
                    return; // Exit if write fails
                }
            });

            await new Promise(resolve => setTimeout(resolve, 200)); // time.sleep(0.2)

            if (this.serialPort.readable) { // Check if data is waiting (using 'readable' event might be better for non-blocking)
                await new Promise(resolve => setTimeout(resolve, 100)); // time.sleep(0.1) - small delay before reading

                const responseBuffer = this.serialPort.read(this.serialPort.bytesToRead); // Read available data
                if (responseBuffer && responseBuffer.length > 0) {
                    if (responseBuffer[0] === 0xC1) {
                        // console.log("parameters setting is :", configBytes); // If you want to log config
                        // console.log("parameters return is  :", responseBuffer); // If you want to log response
                        // Success - you can add more detailed logging if needed
                    } else {
                        // console.log("parameters setting fail :", responseBuffer); // If you want to log failure response
                        // Setting failed - you can add more detailed error handling
                    }
                    break; // Exit loop on response (success or fail)
                }
            } else {
                console.log("trying again!");
                await new Promise(resolve => {
                    this.serialPort.flush(() => { // Flush input buffer before retry
                        console.log('\x1b[1A\r'); // ANSI escape code - might need to handle this differently in Node.js if needed in console
                        if (i === 1) {
                            console.log("setting fail, press Esc to exit and run again");
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
        await new Promise(resolve => setTimeout(resolve, 100)); // time.sleep(0.1)
    }

    // receive() { // Modified receive method with more logging
    //     return new Promise((resolve, reject) => {
    //         const dataHandler = (data) => {
    //             const receivedString = data.toString('utf8');
    //             console.log(`[SerialPort - receive()] Data event received: ${receivedString}`); // Added logging here
    //             this.serialPort.off('data', dataHandler);
    //             this.serialPort.off('error', errorHandler);
    //             resolve(receivedString);
    //         };

    //         const errorHandler = (err) => {
    //             console.error("[SerialPort - receive()] Error during receive:", err); // Added logging here
    //             this.serialPort.off('data', dataHandler);
    //             this.serialPort.off('error', errorHandler);
    //             reject(err);
    //         };

    //         console.log("[SerialPort - receive()] Setting up data listener..."); // Added logging when listener is set
    //         this.serialPort.on('data', dataHandler);
    //         this.serialPort.on('error', errorHandler);
    //     });
    // }

    receive() {
        return new Promise((resolve, reject) => {
            let accumulatedData = ''; // Buffer to accumulate data

            const dataHandler = (data) => {
                console.log("[SerialPort - receive()] Raw Bytes Received (Before Filter):", data); // Log raw data BEFORE filter

                let filteredData = data; // Assume no prefix initially
                const prefixBuffer = Buffer.from([0x00, 0x1e]);

                // Robust prefix check: Does data START WITH <Buffer 00 1e>?
                if (data.indexOf(prefixBuffer) === 0) {
                    filteredData = data.subarray(prefixBuffer.length); // Remove prefix
                    console.log("[SerialPort - receive()] Prefix <Buffer 00 1e> detected and removed. Filtered Data:", filteredData); // Log filtered data
                } else {
                    console.log("[SerialPort - receive()] No prefix <Buffer 00 1e> detected. Data:", data); // Log data if no prefix
                }


                const receivedString = filteredData.toString('utf8');
                accumulatedData += receivedString; // Append to buffer

                // Attempt to parse accumulated data as JSON
                try {

                    // const cleanData = accumulatedData.replace(/[\uFFFD\u0000-\u001F]/g, '');
                    const cleanData = accumulatedData.replace(/^[^{]+/, '');

                    accumulatedData = cleanData; // Clean up data before parsing

                    console.log('\n\n\n\n\n\n', accumulatedData, '\n\n\n\n\n');

                    const parsedJSON = JSON.parse(accumulatedData);
                    // JSON parsing successful!
                    console.log(`[SerialPort - receive()] Complete JSON Received and Parsed:`, parsedJSON);
                    this.serialPort.off('data', dataHandler);
                    this.serialPort.off('error', errorHandler);
                    resolve(JSON.stringify(parsedJSON));
                    accumulatedData = ''; // Reset buffer

                } catch (parseError) {
                    // JSON parsing failed - Incomplete or invalid
                    console.log("[SerialPort - receive()] Incomplete or Invalid JSON, accumulating more data...", accumulatedData);
                    // console.error("[SerialPort - receive()] JSON Parse Error:", parseError); // Optional: Log parse error
                }
            };

            const errorHandler = (err) => {
                console.error("[SerialPort - receive()] Error during receive:", err);
                this.serialPort.off('data', dataHandler);
                this.serialPort.off('error', errorHandler);
                reject(err);
            };

            console.log("[SerialPort - receive()] Setting up data listener...");
            this.serialPort.on('data', dataHandler);
            this.serialPort.on('error', errorHandler);
        });
    }

    async send(tx_data) {
        return new Promise((resolve, reject) => {
            this.m0Pin.digitalWrite(0);
            this.m1Pin.digitalWrite(0);

            const target_addr_high = (this.send_to >> 8) & 0xff;
            const target_addr_low = this.send_to & 0xff;
            const current_addr_high = (this.addr >> 8) & 0xff;
            const current_addr_low = this.addr & 0xff;

            const header = Buffer.from([target_addr_high, target_addr_low, current_addr_high, current_addr_low]);
            const data = Buffer.from(tx_data, 'utf8'); // Encode string to Buffer
            const bufferToSend = Buffer.concat([header, data]);


            this.serialPort.write(bufferToSend, (err) => {
                if (err) {
                    console.error('Serial port send error:', err);
                    reject(err);
                } else {
                    console.log('Serial port sent data:', bufferToSend);
                    resolve();
                }
            });
        });
    }
}

// Example of how to use it (you'd need to provide the correct serial port)
async function main() {
    const loraModule = new SX126X("/dev/ttyS0", 868, 0x1234, 22, false); // Example parameters
    // You can add more function calls to loraModule object here to use other functionalities
    console.log("LoRa module initialized and configured.");
}

main();

module.exports = SX126X;
