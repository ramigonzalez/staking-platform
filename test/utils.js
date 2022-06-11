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

utils.increaseOneYear = async (network) => {
    const ONE_YEAR = 60 * 60 * 24 * 365;
    await utils.increaseTime(network, ONE_YEAR);
}

utils.increaseTwoYears = async (network) => {
    const TWO_YEARS = 60 * 60 * 24 * 365 * 2;
    await utils.increaseTime(network, TWO_YEARS);
}

utils.increaseTime = async (network, time) => {
    const ONE_YEAR = 60 * 60 * 24 * 365;
    await network.provider.send("evm_increaseTime", [time]);
    await network.provider.send("evm_mine");
}

module.exports = utils;
