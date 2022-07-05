const { ethers } = require('hardhat');
const { contractABI, deployContract, toEthers, waitTransactionConfirmations } = require('./utils');

// Contract to deploy
const contractName = {
    tokenContract: 'TokenContract',
    vault: 'Vault',
    farm: 'Farm',
};

const protocolDeploy = {
    tokenContractAbi: contractABI(contractName.tokenContract),
    vaultAbi: contractABI(contractName.vault),
    farmAbi: contractABI(contractName.farm),
};

const INITIAL_AMOUNT = toEthers(10);

async function main() {
    // Get provider for testnet
    const accessPoint_URL = process.env.RINKEBY_ACCESSPOINT_URL;
    const provider = new ethers.providers.JsonRpcProvider(accessPoint_URL);

    // Get signer
    const [deployer] = await ethers.getSigners();

    console.log('Deploying protocol with the account:', deployer.address);

    let deployerBalance = ethers.utils.formatEther(await deployer.getBalance());
    console.log('---------------------------------------------------------------------------------------');
    console.log('-- Signer address:\t', deployer.address);
    console.log('-- Signer balance:\t', deployerBalance);
    console.log('---------------------------------------------------------------------------------------');

    // Get Contracts to deploy
    const vaultContract = await deployContract(deployer, protocolDeploy.vaultAbi);
    await waitTransactionConfirmations(vaultContract, contractName.vault, provider);

    console.log('---------------------------------------------------------------------------------------');
    console.log('-- Deployed contract:\t', contractName.vault);
    console.log('-- Contract address:\t', vaultContract.address);
    console.log('---------------------------------------------------------------------------------------');

    const tokenContract = await deployContract(deployer, protocolDeploy.tokenContractAbi, [INITIAL_AMOUNT, vaultContract.address]);
    await waitTransactionConfirmations(tokenContract, contractName.tokenContract, provider);

    console.log('---------------------------------------------------------------------------------------');
    console.log('-- Deployed contract:\t', contractName.tokenContract);
    console.log('-- Contract address:\t', tokenContract.address);
    console.log('---------------------------------------------------------------------------------------');

    const farmContract = await deployContract(deployer, protocolDeploy.farmAbi, [tokenContract.address, vaultContract.address]);
    await waitTransactionConfirmations(farmContract, contractName.farm, provider);

    console.log('---------------------------------------------------------------------------------------');
    console.log('-- Deployed contract:\t', contractName.farm);
    console.log('-- Contract address:\t', farmContract.address);
    console.log('---------------------------------------------------------------------------------------');

    console.log('');
    console.log('---------------------------------------------------------------------------------------');
    console.log('-- Token name:\t', await tokenContract.name());
    console.log('-- Token decimals:\t', await tokenContract.decimals());
    console.log('---------------------------------------------------------------------------------------');
    console.log('-- Successfully protocol deploy');
    console.log('---------------------------------------------------------------------------------------');

    console.log('');
    deployerBalance = ethers.utils.formatEther(await deployer.getBalance());
    console.log('---------------------------------------------------------------------------------------');
    console.log('-- Signer address:\t', deployer.address);
    console.log('-- Signer balance:\t', deployerBalance);
    console.log('---------------------------------------------------------------------------------------');

    console.log('');
    console.log('---------------------------------------------------------------------------------------');
    console.log('-- Protocol setup variables');

    let tx;
    console.log('-- Set sell price:\t', 2 * 10 ** 18);
    tx = await vaultContract.setSellPrice(toEthers(2));
    await tx.wait();

    console.log('-- Set buy price:\t', 1 * 10 ** 18);
    tx = await vaultContract.setBuyPrice(toEthers(1));
    await tx.wait();

    tx = await vaultContract.setMaxAmountToTransfer(toEthers(100));
    await tx.wait();

    console.log('-- Set transfer account (tokenContract):\t', tokenContract.address);
    tx = await vaultContract.setTransferAccount(tokenContract.address);
    await tx.wait();

    console.log('-- Set farm address:\t', farmContract.address);
    tx = await vaultContract.setFarmAddress(farmContract.address);
    await tx.wait();

    console.log('---------------------------------------------------------------------------------------');

    console.log('');
    deployerBalance = ethers.utils.formatEther(await deployer.getBalance());
    console.log('---------------------------------------------------------------------------------------');
    console.log('-- Signer address:\t', deployer.address);
    console.log('-- Signer balance:\t', deployerBalance);
    console.log('---------------------------------------------------------------------------------------');
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
