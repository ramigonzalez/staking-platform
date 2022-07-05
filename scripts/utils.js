const { ethers } = require('hardhat');

const utils = {};

utils.deployContract = async (wallet, contractJSON, constructorArgs) => {
    let instance = null;
    if (constructorArgs == undefined) {
        instance = await ethers.ContractFactory.fromSolidity(contractJSON, wallet).deploy();
    } else {
        instance = await ethers.ContractFactory.fromSolidity(contractJSON, wallet).deploy(...constructorArgs);
    }
    await instance.deployed();
    return instance;
};

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

/** Check transaction result. 
 * 1 it is the number of transction to wait */
utils.waitTransactionConfirmations = async (deployedContract, contractName, provider) => {
    tx_hash = deployedContract.deployTransaction.hash;
    const confirmations_number = 1;
    tx_result = await provider.waitForTransaction(tx_hash, confirmations_number);
    if (tx_result.confirmations < 0 || tx_result === undefined) {
        throw new Error(contractName || ' Contract ERROR: Deploy transaction is undefined or has 0 confirmations.');
    }
}

module.exports = utils;
