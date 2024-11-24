// DOM Elements
const connectButton = document.getElementById('connectBleButton');
const disconnectButton = document.getElementById('disconnectBleButton');
const onButton = document.getElementById('onButton');
const offButton = document.getElementById('offButton');
const fetchDataButton = document.getElementById('fetchDataButton');
const jsonDataContainer = document.getElementById('jsonData');
const bleStateContainer = document.getElementById('bleState');

// Define BLE Device Specs
const deviceName = 'ESP32';
const bleService = '19b10000-e8f2-537e-4f6c-d104768a1214';
const ledCharacteristic = '19b10002-e8f2-537e-4f6c-d104768a1214';
const saveStrtCharacteristic = '19b10001-e8f2-537e-4f6c-d104768a1214';

// Global Variables to Handle Bluetooth
let bleServer;
let bleServiceFound;

// Connect Button
connectButton.addEventListener('click', connectToDevice);
disconnectButton.addEventListener('click', disconnectDevice);

// Write to the ESP32 LED Characteristic
onButton.addEventListener('click', () => writeOnCharacteristic(1));
offButton.addEventListener('click', () => writeOnCharacteristic(0));

// Fetch JSON Data
fetchDataButton.addEventListener('click', fetchJSONData);

// Connect to BLE Device
function connectToDevice() {
    navigator.bluetooth.requestDevice({
        filters: [{ name: deviceName }],
        optionalServices: [bleService]
    })
    .then(device => {
        bleStateContainer.innerHTML = 'Connected to device ' + device.name;
        bleStateContainer.style.color = "#24af37";
        return device.gatt.connect();
    })
    .then(gattServer => {
        bleServer = gattServer;
        return bleServer.getPrimaryService(bleService);
    })
    .then(service => {
        bleServiceFound = service;
        console.log("Connected to service:", service.uuid);
    })
    .catch(error => {
        console.error('Error connecting to BLE device:', error);
    });
}

// Write to LED Characteristic
function writeOnCharacteristic(value) {
    if (bleServer && bleServer.connected) {
        bleServiceFound.getCharacteristic(ledCharacteristic)
        .then(characteristic => {
            const data = new Uint8Array([value]);
            return characteristic.writeValue(data);
        })
        .then(() => {
            console.log("LED state updated:", value ? "ON" : "OFF");
        })
        .catch(error => {
            console.error("Error writing to LED characteristic:", error);
        });
    } else {
        alert("Bluetooth is not connected. Connect first!");
    }
}

// Fetch JSON Data
function fetchJSONData() {
    if (bleServer && bleServer.connected) {
        bleServiceFound.getCharacteristic(saveStrtCharacteristic)
        .then(characteristic => characteristic.readValue())
        .then(value => {
            const decodedValue = new TextDecoder().decode(value);
            jsonDataContainer.innerHTML = decodedValue;
            const arrs = parseJsonToArrays(decodedValue);
            console.log("Fetched JSON Data:", arrs);
        })
        .catch(error => {
            console.error("Error fetching JSON data:", error);
        });
    } else {
        alert("Bluetooth is not connected. Connect first!");
    }
}

// Disconnect BLE Device
function disconnectDevice() {
    if (bleServer && bleServer.connected) {
        bleServer.disconnect();
        bleStateContainer.innerHTML = "Disconnected";
        bleStateContainer.style.color = "#d13a30";
        console.log("BLE device disconnected.");
    } else {
        alert("No BLE device connected to disconnect.");
    }
}

function parseJsonToArrays(jsonString) {
    try {
        // Parse the JSON string into a JavaScript object
        const jsonObject = JSON.parse(jsonString);

        const keys = Object.keys(jsonObject);
        const values = Object.values(jsonObject);

        console.log("Keys:", keys);
        console.log("Values:", values);

        return { keys, values };
    } catch (error) {
        console.error("Error parsing JSON:", error.message);
        return { keys: [], values: [] }; 
    }
}