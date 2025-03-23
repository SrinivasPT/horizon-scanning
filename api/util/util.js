// Convert ES Module to CommonJS format

// Helper function to convert UUID to binary
const uuidToBinary = uuid => {
    // Ensure uuid is a string before calling replace
    const uuidStr = String(uuid);
    return Buffer.from(uuidStr.replace(/-/g, ''), 'hex');
};

// Helper function to convert binary UUID to string format
const binaryToUuid = binary => {
    return Buffer.from(binary)
        .toString('hex')
        .replace(/(.{8})(.{4})(.{4})(.{4})(.{12})/, '$1-$2-$3-$4-$5');
};

module.exports = { uuidToBinary, binaryToUuid };
