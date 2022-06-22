const { ethers } = require('hardhat');

const utils = {};

utils.providers = async () => {
    return await ethers.getSigners();
}

utils.deployContract = async (wallet, contractJSON, constructorArgs) => {
    let instance = null;
    if (constructorArgs == undefined) {
        instance = await ethers.ContractFactory.fromSolidity(contractJSON, wallet).deploy();
    } else {
        instance = await ethers.ContractFactory.fromSolidity(contractJSON, wallet).deploy(...constructorArgs);
    }
    await instance.deployed();
    return instance;
}

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

utils.toBigNumber = (amount) => {
    try {
        if (!isNaN(amount)) {
            return ethers.BigNumber.from(amount);
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
    await network.provider.send("evm_increaseTime", [time]);
    await network.provider.send("evm_mine");
}

module.exports = utils;
