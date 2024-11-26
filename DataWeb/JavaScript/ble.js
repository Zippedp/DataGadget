// DOM Elements
const connectButton = document.getElementById('connectBleButton');
const disconnectButton = document.getElementById('disconnectBleButton');
const onButton = document.getElementById('onButton');
const offButton = document.getElementById('offButton');
const radioButtons = document.querySelectorAll('input[name="uploadSlector"]');
const input1 = document.getElementById('input1');
const input2 = document.getElementById('input2');
const input3 = document.getElementById('input3');
const submitButton = document.getElementById('submitButton');

// Define BLE Device Specs
const deviceName = 'DataGadget';
const bleService = '19b10000-e8f2-537e-4f6c-d104768a1214';
const TIMER_CUSTOM_NAME_CHARACTERISTIC_UUID = '19b10001-e8f2-537e-4f6c-d104768a1214';
const ledCharacteristic = '19b10002-e8f2-537e-4f6c-d104768a1214';
const fileCharacteristic = '19b10003-e8f2-537e-4f6c-d104768a1214';
const INPUT_CHARACTERISTIC_UUID = '19b10004-e8f2-537e-4f6c-d104768a1214';

const restrictionRegex = /^[^\u4e00-\u9fa5:]*$/;


// Global Variables to Handle Bluetooth
let bleServer;
let bleServiceFound;
let fileCharacteristicObj;
let nameTimerCharacteristic;
let inputCharacteristic;
let nameChangeTarget = 1;

// Total keys and values arrays
const totalKeys = [];
const totalValues = [];

// Event Listeners
connectButton.addEventListener('click', connectToDevice);
disconnectButton.addEventListener('click', disconnectDevice);
submitButton.addEventListener('click', handleSubmit);
onButton.addEventListener('click', () => writeOnCharacteristic(1));
offButton.addEventListener('click', () => writeOnCharacteristic(0));

// Connect to BLE Device
async function connectToDevice() {
    try {
        const device = await navigator.bluetooth.requestDevice({
            filters: [{ name: deviceName }],
            optionalServices: [bleService]
        });

        bleServer = await device.gatt.connect();
        console.log("Connected to GATT Server");

        bleServiceFound = await bleServer.getPrimaryService(bleService);
        console.log("Connected to service:", bleServiceFound.uuid);

        // Set Up Notifications for File Characteristic (New Functionality)
        fileCharacteristicObj = await bleServiceFound.getCharacteristic(fileCharacteristic);
        await fileCharacteristicObj.startNotifications();
        fileCharacteristicObj.addEventListener('characteristicvaluechanged', handleFileData);
        console.log('FILE characteristic started.');

        nameTimerCharacteristic = await bleServiceFound.getCharacteristic(TIMER_CUSTOM_NAME_CHARACTERISTIC_UUID);
        console.log('TIMER_CUSTOM_NAME characteristic started.');

        inputCharacteristic = await bleServiceFound.getCharacteristic(INPUT_CHARACTERISTIC_UUID);
        await inputCharacteristic.startNotifications();
        inputCharacteristic.addEventListener('characteristicvaluechanged', diviceInput);
        console.log('INPUT characteristic started.');

    } catch (error) {
        console.error('Error connecting to BLE device:', error);
    }
}

function handleSubmit(event){
    event.preventDefault();

    const errorMessage = document.getElementById('errorMessage');
    errorMessage.style.display = 'none';

    const inputs = ['input1', 'input2', 'input3'].map(id => document.getElementById(id));
    let isValid = true;

    inputs.forEach(input => {
        const error = validateInput(input);
        if (error) {
            isValid = false;
            errorMessage.textContent = error;
            errorMessage.style.display = 'block';
        }
    });

    if (isValid) {
        submitBLE();
    }
}

function submitBLE() {
    if (bleServer && bleServer.connected && nameTimerCharacteristic) {
        const val1 = input1.value.trim();
        const val2 = input2.value.trim();
        const val3 = input3.value.trim();

        const stringadd = val1 +',' + val2 +','+ val3 +','+ nameChangeTarget.toString() + '\0'

        // to Uint8Array
        const encoder = new TextEncoder();
        const data = encoder.encode(stringadd);

        nameTimerCharacteristic.writeValue(data)
            .then(() => {
                console.log("sent to Arduino:", stringadd);
                console.log("sent to Arduino:", data);
                alert("NiceBro");
            })
            .catch(error => {
                console.error("sent failed:", error);
                alert("BedBro");
            });
    } else {
        alert("BLE not connected");
    }
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

// Disconnect BLE Device
function disconnectDevice() {
    if (bleServer && bleServer.connected) {
        bleServer.disconnect();
        console.log("BLE device disconnected.");
    } else {
        alert("No BLE device connected to disconnect.");
    }
}


// Handle Incoming File Data (New Functionality)
function handleFileData(event) {
    const value = new TextDecoder().decode(event.target.value);
    console.log("Received Data:", value);

    // Parse the data
    const lines = value.trim().split('\n');
    if (lines.length !== 4) { // Assuming each data pack should have exactly 4 lines
        console.warn('Incomplete data pack');
        return;
    }

    const keys = [];
    const values = [];

    let corrupted = false;

    lines.forEach(line => {
        const [key, val] = line.split(':');
        if (key && val !== undefined) {
            keys.push(key.trim());
            values.push(val.trim());
        } else {
            corrupted = true;
        }
    });

    if (corrupted) {
        console.warn('Corrupted data pack');
        return;
    }

    // Store parsed keys and values
    totalKeys.push(keys);
    totalValues.push(values);

    console.log('Parsed Keys:', keys);
    console.log('Parsed Values:', values);
}

radioButtons.forEach(radio => {
    radio.addEventListener('change', () => {
        radioButtons.forEach(btn => {
            if (btn.checked) {
                nameChangeTarget = btn.value;
                console.log(`choose: ${btn.value}`);
                console.log(nameChangeTarget);
            }
        });
    });
});


function validateInput(input) {
    const value = input.value;
    if (!restrictionRegex.test(value)) {
        return 'Name cannot contain the symbol ":" or uncommon characters.';
    }
    if (value.length > 20) {
        return "Name length cannot exceed 20 characters.";
    }
    return null;
}

function diviceInput(event){
    const value = event.target.value;
    const dataView = new DataView(value.buffer);
    const intValue = dataView.getInt32(0, true);
    console.log(intValue);
}