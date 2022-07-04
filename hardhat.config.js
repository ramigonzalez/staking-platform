require('dotenv').config();
require('@nomiclabs/hardhat-ethers');
require("@nomicfoundation/hardhat-chai-matchers")

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
    solidity: '0.8.9',
    networks: {
      ganache: {
      chainId: 1337,
      timeout: 20000,
      gasPrice: 8000000000,
      gas: "auto",
      url: process.env.GANACHE_ACCESSPOINT_URL,
      from: process.env.GANACHE_ACCOUNT,
      accounts: [process.env.GANACHE_PRIVATE_KEY]
    },
    
        hardhat: {
            chainId: 31337,
            gasPrice: 'auto',
            gas: 'auto',
            value: 10000,
        },
    },
};
