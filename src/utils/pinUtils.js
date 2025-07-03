const crypto = require('crypto');

// Function to generate a random 4-digit PIN
const generatePin = () => {
    return Math.floor(1000 + Math.random() * 9000).toString();
};

// Function to hash the PIN for secure storage
const hashPin = (pin) => {
    const hash = crypto.createHash('sha256');
    hash.update(pin);
    return hash.digest('hex');
};

// Function to verify the provided PIN against the stored hash
const verifyPin = (inputPin, storedHash) => {
    const inputHash = hashPin(inputPin);
    return inputHash === storedHash;
};

module.exports = {
    generatePin,
    hashPin,
    verifyPin
};