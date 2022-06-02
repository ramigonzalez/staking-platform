const { expect, use } = require('chai');
const { waffle, ethers } = require('hardhat');
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

    describe('setMaxPercentage()', async () => {
        describe('Ok scenarios', async () => {
            beforeEach(async () => {
                vaultContract = await deployContract(signer, VAULT_ABI);
            });

            it('Should set 1% as percentage correctly', async () => {
                await vaultContract.setMaxPercentage(1);
                expect(await vaultContract.percentageToWithdraw()).to.be.equal(1);
            });

            it('Should set 50% as percentage correctly', async () => {
                await vaultContract.setMaxPercentage(50);
                expect(await vaultContract.percentageToWithdraw()).to.be.equal(50);
            });
        });

        describe('Revert transaction', async () => {
            beforeEach(async () => {
                vaultContract = await deployContract(signer, VAULT_ABI);
            });

            it('Should revert transaction since percentage is greater than 50', async () => {
                await expect(vaultContract.setMaxPercentage(51)).to.be.revertedWith('Withdraw percentage must be lower or equals than 50%');
            });

            it('Should revert transaction since percentage is 0', async () => {
                await expect(vaultContract.setMaxPercentage(0)).to.be.revertedWith('Withdraw percentage must be greater than 0%');
            });
        });
    });

    describe('requestWithdraw()', async () => {
        let vaultContractFromEthers, accountSigner;

        beforeEach(async () => {
            // Get signer
            [accountSigner] = await ethers.getSigners();

            // Get Contracts to deploy
            const contractPath = 'contracts/' + contractName + '.sol:' + contractName;
            const contractFactory = await ethers.getContractFactory(contractPath, accountSigner);

            vaultContractFromEthers = await contractFactory.deploy({ value: ethers.utils.parseEther('100') });

            await vaultContractFromEthers.deployed();
        });

        describe('Ok scenarios', async () => {
            it('Should complete the withdraw request', async () => {
                const amountToWithdraw = 10;

                // Add a second administrator
                await vaultContractFromEthers.addAdmin(account2.address);

                await vaultContractFromEthers.requestWithdraw(amountToWithdraw);

                const adminCount = await vaultContractFromEthers.administratorsCount();
                const requestWithdraw = await vaultContractFromEthers._requestWithdrawDetails();

                const expectedAmountPerAdmin = amountToWithdraw / adminCount;

                expect(requestWithdraw.initialized).to.be.true;
                expect(requestWithdraw.amountPerAdmin).to.be.equal(ethers.utils.parseEther(expectedAmountPerAdmin.toString()));
                expect(requestWithdraw.requestAddress).to.be.equal(signer.address);
            });
        });

        describe('Revert transaction', async () => {
            it('Should revert transaction since already exists a request for withdraw', async () => {
                const amountToWithdraw = 10;
                await vaultContractFromEthers.addAdmin(account2.address);
                await vaultContractFromEthers.requestWithdraw(amountToWithdraw);
                await expect(vaultContractFromEthers.requestWithdraw(amountToWithdraw)).to.be.revertedWith('Already exists a pending withdraw request');
            });

            it('Should revert transaction since there is only one administrator in the contract list', async () => {
                const amountToWithdraw = 10;
                await expect(vaultContractFromEthers.requestWithdraw(amountToWithdraw)).to.be.revertedWith('Cannot initiate a request withdraw with less than 2 administrators');
            });

            it('Should revert transaction since the amount requested exeeds maximum percentage', async () => {
                const percentage = await vaultContractFromEthers.percentageToWithdraw();
                expect(percentage).to.be.equal(10);

                const contractEtherBalance = await ethers.utils.formatEther(await ethers.provider.getBalance(vaultContractFromEthers.address));
                const expectedETHBalance = await ethers.utils.formatEther(ethers.utils.parseEther('100'));

                expect(contractEtherBalance).to.be.equal(expectedETHBalance);

                // Add a second administrator
                await vaultContractFromEthers.addAdmin(account2.address);

                const exeededAmountToWithdraw = 11;
                await expect(vaultContractFromEthers.requestWithdraw(exeededAmountToWithdraw)).to.be.revertedWith('Amount exceeds maximum percentage');
            });

            // Deploy ccontract without ETH
            beforeEach(async () => {
                vaultContract = await deployContract(signer, VAULT_ABI);
            });
            it('Should revert transaction since the contract has insufficients balance', async () => {
                const amountToWithdraw = 10;
                await expect(vaultContract.requestWithdraw(amountToWithdraw)).to.be.revertedWith('There are insufficient funds to withdraw');
            });
        });
    });

    describe('approveWithdraw()', async () => {
        beforeEach(async () => {
            // Get Contracts to deploy
            const contractPath = 'contracts/' + contractName + '.sol:' + contractName;
            const contractFactory = await ethers.getContractFactory(contractPath, account1);

            vaultContract = await contractFactory.deploy({ value: ethers.utils.parseEther('100') });

            await vaultContract.deployed();
        });

        describe('Ok scenarios', async () => {
            it('Should approve withdraw request correctly', async () => {
                // Add a second administrator
                await vaultContract.addAdmin(account2.address);

                // Call the requestWithdraw with account 1
                await vaultContract.requestWithdraw(10);

                // Connect the contract to account 2 and call the approveWithdraw with it
                await vaultContract.connect(account2).approveWithdraw();

                // Act
                const maxWithdraw = await vaultContract.maxWithdraw();

                const maxWithdrawETH = ethers.utils.formatEther(maxWithdraw);
                const expectedETH = ethers.utils.formatEther(ethers.utils.parseEther('5'));

                // Assert
                expect(maxWithdrawETH).to.be.equal(expectedETH);
            });
        });

        describe('Revert transaction', async () => {
            it('Should revert transaction since there is no pending withdraw request', async () => {
                await expect(vaultContract.approveWithdraw()).to.be.revertedWith('There is no pending withdraw request for approve');
            });

            it('Should revert transaction since there is only one administrator in the contract list', async () => {
                // Add a second administrator
                await vaultContract.addAdmin(account2.address);

                // Call the requestWithdraw with account 1
                await vaultContract.requestWithdraw(10);

                await expect(vaultContract.approveWithdraw()).to.be.revertedWith('Cannot approve a withdraw with less than 2 administrators');
            });

            it('Should revert transaction since the approval withdraw admin must be different from who requested it', async () => {
                // Add a second administrator
                await vaultContract.addAdmin(account2.address);

                // Call the requestWithdraw with account 1
                await vaultContract.requestWithdraw(10);

                await expect(vaultContract.approveWithdraw()).to.be.revertedWith('Approval administrator must be different from admin who requested it');
            });
        });
    });
});
