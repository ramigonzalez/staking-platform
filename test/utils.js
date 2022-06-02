module.exports = {
    ZERO_ADDRESS: '0x0000000000000000000000000000000000000000',
};

module.exports.contractABI = (contractName) => {
    return require(`../artifacts/contracts/${contractName}.sol/${contractName}.json`);
};
