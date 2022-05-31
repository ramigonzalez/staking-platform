const { expect, use } = require('chai');
const { deployContract, provider, solidity } = waffle;
const { ZERO_ADDRESS, contractABI } = require('./utils');

use(solidity);

// Constant
const contractName = 'Vault';
const VAULT_ABI = contractABI(contractName);

// Contract instance variable
let signer, account1, account2, vaultContract;

describe(contractName, () => {
    before(async () => {
        console.log('------------------------------------------------------------------------------------');
        console.log('----------------------------', contractName, 'Contract Test Start', '----------------------------');
        console.log('------------------------------------------------------------------------------------');

        // Get signers
        [signer, account1, account2] = provider.getWallets();

        // Deploy contract
        vaultContract = await deployContract(signer, VAULT_ABI);
    });

    describe('Admin features', async () => {
        it('Deployer is admin', async () => {
            const isAdmin = await vaultContract.isAdmin(signer.address);
            expect(isAdmin).to.be.true;
        });

        it('Non admin cannot add another admin', async () => {
            const operation = vaultContract.connect(account1).addAdmin(account2.address);
            await expect(operation).to.be.revertedWith('User must be administrator to perform this operation');
        });

        it('One Admin can set another user as admin', async () => {
            await vaultContract.connect(signer).addAdmin(account1.address);

            const isAdmin = await vaultContract.isAdmin(account1.address);
            expect(isAdmin).to.be.true;
        });

        it('Admin cannot add an admin again', async () => {
            await expect(vaultContract.addAdmin(signer.address)).to.be.revertedWith('Account is already an admin');
        });

        it('0x0 cannot be added as admin', async () => {
            await expect(vaultContract.addAdmin(ZERO_ADDRESS)).to.be.revertedWith('The provided address is not valid for an admin');
        });

        it('Non admin cannot remove admin', async () => {
            const operation = vaultContract.connect(account2).removeAdmin(signer.address);
            await expect(operation).to.be.revertedWith('User must be administrator to perform this operation');
        });

        it('Trying to remove non admin reverses', async () => {
            const operation = vaultContract.connect(account1).removeAdmin(account2.address);
            await expect(operation).to.be.revertedWith('Account is not an admin');
        });

        it('Admin can remove another admin', async () => {
            await vaultContract.connect(account1).removeAdmin(signer.address);

            const isAdmin = await vaultContract.isAdmin(signer.address);
            expect(isAdmin).to.be.false;
        });

        it('Admin cannot remove himself if he is the only admin', async () => {
            await expect(vaultContract.connect(account1).removeAdmin(account1.address)).to.be.revertedWith('There must be at least one admin');
        });

        it('Removing 0x0 from admin fails', async () => {
            await expect(vaultContract.connect(account1).removeAdmin(ZERO_ADDRESS)).to.be.revertedWith('The provided address is not valid for an admin');
        });
    });

    describe('sellPrice()', async () => {
        describe('Ok scenarios', async () => {
            beforeEach(async () => {
                vaultContract = await deployContract(signer, VAULT_ABI);
            });

            it('Should accept sell price', async () => {
                const sellPriceAmount = 100;
                await vaultContract.setSellPrice(sellPriceAmount);
                expect(await vaultContract.sellPrice()).to.be.equal(sellPriceAmount);
            });
        });
        describe('Revert transaction', async () => {
            beforeEach(async () => {
                vaultContract = await deployContract(signer, VAULT_ABI);
            });

            it('Should revert sellPrice() transaction since amount is zero.', async () => {
                await expect(vaultContract.setSellPrice(0)).to.be.revertedWith('Sell price must be greater than 0');
            });

            it('Should revert sellPrice() transaction sell price amount is lower than buy price', async () => {
                await vaultContract.setSellPrice(100);
                await vaultContract.setBuyPrice(10);
                await expect(vaultContract.setSellPrice(9)).to.be.revertedWith('Sell price must be greater than buy price');
            });

            it('Should revert sellPrice() transaction sell price amount is equal than buy price', async () => {
                await vaultContract.setSellPrice(100);
                await vaultContract.setBuyPrice(10);
                await expect(vaultContract.setSellPrice(10)).to.be.revertedWith('Sell price must be greater than buy price');
            });
        });
    });

    describe('buyPrice()', async () => {
        describe('Ok scenarios', async () => {
            beforeEach(async () => {
                vaultContract = await deployContract(signer, VAULT_ABI);
            });

            it('Should accept buy price', async () => {
                const buyPriceAmount = 99;
                await vaultContract.setSellPrice(100);
                await vaultContract.setBuyPrice(buyPriceAmount);
                expect(await vaultContract.buyPrice()).to.be.equal(buyPriceAmount);
            });
        });
        describe('Revert transaction', async () => {
            beforeEach(async () => {
                vaultContract = await deployContract(signer, VAULT_ABI);
            });

            it('Should revert buyPrice() transaction since amount is zero', async () => {
                await expect(vaultContract.setBuyPrice(0)).to.be.revertedWith('Sell price must be greater than 0');
            });

            it('Should revert buyPrice() transaction since sell price is not set', async () => {
                await expect(vaultContract.setBuyPrice(100)).to.be.revertedWith('Sell price must be greater than 0');
            });

            it('Should revert buyPrice() transaction sell price amount is greater than sell price', async () => {
                await vaultContract.setSellPrice(100);
                await expect(vaultContract.setBuyPrice(101)).to.be.revertedWith('Buy price must be lower than sell price');
            });

            it('Should revert buyPrice() transaction sell price amount is equal than sell price', async () => {
                await vaultContract.setSellPrice(100);
                await expect(vaultContract.setBuyPrice(100)).to.be.revertedWith('Buy price must be lower than sell price');
            });
        });
    });
});
