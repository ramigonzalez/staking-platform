const { ethers } = require('hardhat');

const utils = {};

utils.ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

utils.contractABI = (contractName) => {
    return require(`../artifacts/contracts/${contractName}.sol/${contractName}.json`);
};

/**
 *
 * @param {*} amount must be a number
 * @returns a fixed number in ether unit by default
 */
utils.toEthers = (amount) => {
    try {
        if (!isNaN(amount)) {
            return ethers.FixedNumber.fromString(amount.toString());
        } else throw new Error('Amount must be a number');
    } catch (e) {
        console.error(e.message);
        throw e;
    }
};

module.exports = utils;
