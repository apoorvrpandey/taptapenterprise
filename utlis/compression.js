const { deflate, unzip } = require('node:zlib'); // Using node:zlib to import zlib from Node.js standard library
const { promisify } = require('util');

const promisifiedDeflate = promisify(deflate); // Promisify deflate function
const promisifiedUnzip = promisify(unzip); // Promisify unzip function

const compressData = async (data) => {
    try {
        const compressedBuffer = await promisifiedDeflate(Buffer.from(JSON.stringify(data)));
        return compressedBuffer.toString('base64'); // Convert compressed buffer to base64 string
    } catch (error) {
        throw new Error(`Compression error: ${error.message}`);
    }
};

const decompressData = async (compressedData) => {
    try {
        const buffer = Buffer.from(compressedData, 'base64'); // Convert base64 string back to buffer
        const decompressedBuffer = await promisifiedUnzip(buffer);
        const decompressedString = decompressedBuffer.toString();
        return JSON.parse(decompressedString);
    } catch (error) {
        throw new Error(`Decompression error: ${error.message}`);
    }
};

module.exports = {
    compressData,
    decompressData
};