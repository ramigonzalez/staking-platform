const { expect, use } = require('chai');
const { waffle, ethers } = require('hardhat');
const { deployContract, provider, solidity } = waffle;
const { ZERO_ADDRESS, contractABI, toEthers } = require('./utils');

use(solidity);

// Constant
const contractName = 'Vault';
const VAULT_ABI = contractABI(contractName);

// Contract instance variable
let signer, account1, account2, account3, account4, accountNotAdmin, vaultContract;

describe(contractName, () => {
    before(async () => {
        console.log('------------------------------------------------------------------------------------');
        console.log('----------------------------', contractName, 'Contract Test Start', '----------------------------');
        console.log('------------------------------------------------------------------------------------');

        // Get signers
        [signer, account1, account2, account3, account4, accountNotAdmin] = provider.getWallets();

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

            it('Should revert sellPrice() transaction since msg.sender is not an admin', async () => {
                await expect(vaultContract.connect(accountNotAdmin).setSellPrice(100)).to.be.revertedWith('User must be administrator to perform this operation');
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

            it('Should revert buyPrice() transaction since msg.sender is not an admin', async () => {
                await expect(vaultContract.connect(accountNotAdmin).setSellPrice(100)).to.be.revertedWith('User must be administrator to perform this operation');
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

            it('Should revert setMaxPercentage() transaction since msg.sender is not an admin', async () => {
                await expect(vaultContract.connect(accountNotAdmin).setMaxPercentage(50)).to.be.revertedWith('User must be administrator to perform this operation');
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

            it('Should allow the requested amount after addAdmin() happens decreasing the virtual contract balance', async () => {
                await vaultContractFromEthers.addAdmin(account2.address);
                await vaultContractFromEthers.requestWithdraw(10); // maximum amount to request is 10
                await vaultContractFromEthers.connect(account2).approveWithdraw();
                await vaultContractFromEthers.addAdmin(account3.address);
                await vaultContractFromEthers.requestWithdraw(8);

                const requestWithdraw = await vaultContractFromEthers._requestWithdrawDetails();
                expect(requestWithdraw.initialized).to.be.true;
            });
        });

        describe('Revert transaction', async () => {
            it('Should revert requestWithdraw() transaction since msg.sender is not an admin', async () => {
                await expect(vaultContract.connect(accountNotAdmin).requestWithdraw(10)).to.be.revertedWith('User must be administrator to perform this operation');
            });

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

            it('Should not allow the requested amount to exceed the maximum amount to withdraw when addAdmin() happens', async () => {
                await vaultContractFromEthers.addAdmin(account2.address);
                await vaultContractFromEthers.requestWithdraw(10); // maximum amount to request is 10
                await vaultContractFromEthers.connect(account2).approveWithdraw();
                await vaultContractFromEthers.addAdmin(account3.address);
                await expect(vaultContractFromEthers.requestWithdraw(9)).to.be.revertedWith('Amount exceeds maximum percentage');
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
            it('Should revert approveWithdraw() transaction since msg.sender is not an admin', async () => {
                await expect(vaultContract.connect(accountNotAdmin).approveWithdraw()).to.be.revertedWith('User must be administrator to perform this operation');
            });

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

    describe('rejectWithdraw()', async () => {
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

                // Connect the contract to account 2 and call the rejectWithdraw with it
                await vaultContract.connect(account2).rejectWithdraw();

                // Act
                const maxWithdraw = await vaultContract.maxWithdraw();
                const requestWithdraw = await vaultContract._requestWithdrawDetails();

                const maxWithdrawETH = ethers.utils.formatEther(maxWithdraw);
                const expectedETH = ethers.utils.formatEther(ethers.utils.parseEther('0'));

                // Assert
                expect(maxWithdrawETH).to.be.equal(expectedETH);
                expect(requestWithdraw.initialized).to.be.false;
                expect(requestWithdraw.amountPerAdmin).to.be.equal(ethers.utils.parseEther('0'));
                expect(requestWithdraw.requestAddress).to.be.equal(ZERO_ADDRESS);
            });
        });

        describe('Revert transaction', async () => {
            it('Should revert rejectWithdraw() transaction since msg.sender is not an admin', async () => {
                await expect(vaultContract.connect(accountNotAdmin).rejectWithdraw()).to.be.revertedWith('User must be administrator to perform this operation');
            });

            it('Should revert transaction since there is no pending withdraw request', async () => {
                await expect(vaultContract.rejectWithdraw()).to.be.revertedWith('There is no pending withdraw request for reject');
            });

            it('Should revert transaction since the approval withdraw admin must be different from who requested it', async () => {
                // Add a second administrator
                await vaultContract.addAdmin(account2.address);

                // Call the requestWithdraw with account 1
                await vaultContract.requestWithdraw(10);

                await expect(vaultContract.rejectWithdraw()).to.be.revertedWith('Rejector administrator must be different from admin who requested it');
            });
        });
    });

    describe('withdraw()', async () => {
        beforeEach(async () => {
            // Get Contracts to deploy
            const contractPath = 'contracts/' + contractName + '.sol:' + contractName;
            const contractFactory = await ethers.getContractFactory(contractPath, account4);

            vaultContract = await contractFactory.deploy({ value: ethers.utils.parseEther('100') });

            await vaultContract.deployed();
        });

        describe('Ok scenarios', async () => {
            it('Should withdraw the correspondant amount assigned to the admin', async () => {
                // Add 4 administrators
                await vaultContract.addAdmin(account1.address);
                await vaultContract.addAdmin(account2.address);
                await vaultContract.addAdmin(account3.address);

                // Call the requestWithdraw with account 1
                await vaultContract.requestWithdraw(10);

                // Connect the contract to account 1 and call the approveWithdraw with it
                await vaultContract.connect(account1).approveWithdraw();

                // Act
                const maxWithdraw = await vaultContract.maxWithdraw();
                const withdrawnAmount_before = ethers.utils.formatEther(await vaultContract.withdrawnAmount());

                const maxWithdrawETH = ethers.utils.formatEther(maxWithdraw);
                const expectedETH = ethers.utils.formatEther(ethers.utils.parseEther('2.5'));

                // const account_2_before = await ethers.utils.formatEther(await ethers.provider.getBalance(account2.address));

                // Pre-requisits asserts
                expect(withdrawnAmount_before).to.be.equal(ethers.utils.formatEther(ethers.utils.parseEther('0')));
                expect(maxWithdrawETH).to.be.equal(expectedETH);
                // expect(account_2_before).to.be.equal(ethers.utils.formatEther(ethers.utils.parseEther('9999.999602665484148645')));

                await vaultContract.withdraw();

                // Act
                const withdrawnAmount_after = ethers.utils.formatEther(await vaultContract.withdrawnAmount());

                // Assert
                expect(withdrawnAmount_after).to.be.equal(ethers.utils.formatEther(ethers.utils.parseEther('2.5')));
                // const account_2_after = await ethers.utils.formatEther(await ethers.provider.getBalance(account2.address));
                // expect(account_2_after).to.be.equal(ethers.utils.formatEther(ethers.utils.parseEther('10002.5')));
            });

            it('Should allow every participant to withdraw their part', async () => {
                // Add 4 administrators
                await vaultContract.addAdmin(account1.address);
                await vaultContract.addAdmin(account2.address);
                await vaultContract.addAdmin(account3.address);

                // Call the requestWithdraw with account 1
                await vaultContract.requestWithdraw(10);

                // Connect the contract to account 1 and call the approveWithdraw with it
                await vaultContract.connect(account1).approveWithdraw();

                // Act
                const maxWithdraw = await vaultContract.maxWithdraw();
                const maxWithdrawETH = ethers.utils.formatEther(maxWithdraw);
                const expectedETH = ethers.utils.formatEther(ethers.utils.parseEther('2.5'));

                const withdrawnAmount_account_1_before = ethers.utils.formatEther(await vaultContract.connect(account1).withdrawnAmount());
                const withdrawnAmount_account_2_before = ethers.utils.formatEther(await vaultContract.connect(account2).withdrawnAmount());
                const withdrawnAmount_account_3_before = ethers.utils.formatEther(await vaultContract.connect(account3).withdrawnAmount());
                const withdrawnAmount_account_4_before = ethers.utils.formatEther(await vaultContract.connect(account4).withdrawnAmount());

                // Pre-requisits asserts
                expect(maxWithdrawETH).to.be.equal(expectedETH);
                expect(withdrawnAmount_account_1_before).to.be.equal(ethers.utils.formatEther(ethers.utils.parseEther('0')));
                expect(withdrawnAmount_account_2_before).to.be.equal(ethers.utils.formatEther(ethers.utils.parseEther('0')));
                expect(withdrawnAmount_account_3_before).to.be.equal(ethers.utils.formatEther(ethers.utils.parseEther('0')));
                expect(withdrawnAmount_account_4_before).to.be.equal(ethers.utils.formatEther(ethers.utils.parseEther('0')));

                // Act
                await vaultContract.connect(account1).withdraw();
                await vaultContract.connect(account2).withdraw();
                await vaultContract.connect(account3).withdraw();
                await vaultContract.connect(account4).withdraw();

                const withdrawnAmount_account_1_after = ethers.utils.formatEther(await vaultContract.connect(account1).withdrawnAmount());
                const withdrawnAmount_account_2_after = ethers.utils.formatEther(await vaultContract.connect(account2).withdrawnAmount());
                const withdrawnAmount_account_3_after = ethers.utils.formatEther(await vaultContract.connect(account3).withdrawnAmount());
                const withdrawnAmount_account_4_after = ethers.utils.formatEther(await vaultContract.connect(account4).withdrawnAmount());

                // Assert
                expect(withdrawnAmount_account_1_after).to.be.equal(ethers.utils.formatEther(ethers.utils.parseEther('2.5')));
                expect(withdrawnAmount_account_2_after).to.be.equal(ethers.utils.formatEther(ethers.utils.parseEther('2.5')));
                expect(withdrawnAmount_account_3_after).to.be.equal(ethers.utils.formatEther(ethers.utils.parseEther('2.5')));
                expect(withdrawnAmount_account_4_after).to.be.equal(ethers.utils.formatEther(ethers.utils.parseEther('2.5')));
            });

            it('Should NOT allow an admin to withdraw more ETH than what was requested', async () => {
                // Add 4 administrators
                await vaultContract.addAdmin(account1.address);
                await vaultContract.addAdmin(account2.address);
                await vaultContract.addAdmin(account3.address);

                // Call the requestWithdraw with account 1
                await vaultContract.requestWithdraw(10);

                // Connect the contract to account 1 and call the approveWithdraw with it
                await vaultContract.connect(account1).approveWithdraw();

                // Act
                const maxWithdraw = await vaultContract.maxWithdraw();
                const maxWithdrawETH = ethers.utils.formatEther(maxWithdraw);
                const expectedETH = ethers.utils.formatEther(ethers.utils.parseEther('2.5'));

                const withdrawnAmount_account_1_before = ethers.utils.formatEther(await vaultContract.connect(account1).withdrawnAmount());
                const withdrawnAmount_account_2_before = ethers.utils.formatEther(await vaultContract.connect(account2).withdrawnAmount());
                const withdrawnAmount_account_3_before = ethers.utils.formatEther(await vaultContract.connect(account3).withdrawnAmount());
                const withdrawnAmount_account_4_before = ethers.utils.formatEther(await vaultContract.connect(account4).withdrawnAmount());

                // Pre-requisits asserts
                expect(maxWithdrawETH).to.be.equal(expectedETH);
                expect(withdrawnAmount_account_1_before).to.be.equal(ethers.utils.formatEther(ethers.utils.parseEther('0')));
                expect(withdrawnAmount_account_2_before).to.be.equal(ethers.utils.formatEther(ethers.utils.parseEther('0')));
                expect(withdrawnAmount_account_3_before).to.be.equal(ethers.utils.formatEther(ethers.utils.parseEther('0')));
                expect(withdrawnAmount_account_4_before).to.be.equal(ethers.utils.formatEther(ethers.utils.parseEther('0')));

                await vaultContract.connect(account1).withdraw();
                await vaultContract.connect(account2).withdraw();
                await vaultContract.connect(account3).withdraw();
                await vaultContract.connect(account4).withdraw();

                const withdrawnAmount_account_1_after = ethers.utils.formatEther(await vaultContract.connect(account1).withdrawnAmount());
                const withdrawnAmount_account_2_after = ethers.utils.formatEther(await vaultContract.connect(account2).withdrawnAmount());
                const withdrawnAmount_account_3_after = ethers.utils.formatEther(await vaultContract.connect(account3).withdrawnAmount());
                const withdrawnAmount_account_4_after = ethers.utils.formatEther(await vaultContract.connect(account4).withdrawnAmount());

                expect(withdrawnAmount_account_1_after).to.be.equal(ethers.utils.formatEther(ethers.utils.parseEther('2.5')));
                expect(withdrawnAmount_account_2_after).to.be.equal(ethers.utils.formatEther(ethers.utils.parseEther('2.5')));
                expect(withdrawnAmount_account_3_after).to.be.equal(ethers.utils.formatEther(ethers.utils.parseEther('2.5')));
                expect(withdrawnAmount_account_4_after).to.be.equal(ethers.utils.formatEther(ethers.utils.parseEther('2.5')));

                // Act: try to withdraw
                await vaultContract.connect(account4).withdraw();

                // Assert
                const withdrawnAmount_account_4_after_two_withdraws = ethers.utils.formatEther(await vaultContract.connect(account4).withdrawnAmount());
                expect(withdrawnAmount_account_4_after_two_withdraws).to.be.equal(ethers.utils.formatEther(ethers.utils.parseEther('2.5')));
            });
        });

        describe('Revert transactions', async () => {
            it('Should revert withdraw() transaction since msg.sender is not an admin', async () => {
                await expect(vaultContract.connect(accountNotAdmin).withdraw()).to.be.revertedWith('User must be administrator to perform this operation');
            });
        });
    });

    describe('withdrawnAmount()', async () => {
        beforeEach(async () => {
            // Get Contracts to deploy
            const contractPath = 'contracts/' + contractName + '.sol:' + contractName;
            const contractFactory = await ethers.getContractFactory(contractPath, account1);

            vaultContract = await contractFactory.deploy({ value: ethers.utils.parseEther('100') });

            await vaultContract.deployed();
        });

        it('Should retrieve zero (0) withdrawals for signer account', async () => {
            const withdrawnAmount = ethers.utils.formatEther(await vaultContract.withdrawnAmount());
            expect(withdrawnAmount).to.be.equal(ethers.utils.formatEther(ethers.utils.parseEther('0')));
        });

        it('Should retrieve 5 ETH withdrawn for signer account since exists only 2 administrators, 10% percentage and 10 ETH were requested', async () => {
            await vaultContract.addAdmin(account2.address);
            await vaultContract.requestWithdraw(10);
            await vaultContract.connect(account2).approveWithdraw();
            await vaultContract.connect(account1).withdraw();
            const withdrawnAmount = ethers.utils.formatEther(await vaultContract.withdrawnAmount());
            expect(withdrawnAmount).to.be.equal(ethers.utils.formatEther(ethers.utils.parseEther('5')));
        });

        it('Should revert withdrawnAmount() transaction since msg.sender is not an admin', async () => {
            await expect(vaultContract.connect(accountNotAdmin).withdrawnAmount()).to.be.revertedWith('User must be administrator to perform this operation');
        });
    });

    describe('checkMaximumAmountToWithdraw()', async () => {
        beforeEach(async () => {
            // Get Contracts to deploy
            const contractPath = 'contracts/' + contractName + '.sol:' + contractName;
            const contractFactory = await ethers.getContractFactory(contractPath, account1);

            vaultContract = await contractFactory.deploy({ value: ethers.utils.parseEther('100') });

            await vaultContract.deployed();
        });

        it('Should allow the requested value', async () => {
            const percentage = await vaultContract.percentageToWithdraw();
            expect(percentage).to.be.equal(10);

            const contractEtherBalance = await ethers.utils.formatEther(await ethers.provider.getBalance(vaultContract.address));
            expect(parseInt(contractEtherBalance)).to.be.greaterThan(parseInt(await ethers.utils.formatEther('0')));

            const result = await vaultContract.checkMaximumAmountToWithdraw(ethers.utils.parseEther('10'));
            expect(result).to.be.true;
        });

        it('Should NOT allow the requested value since the amount exeeds the amount allowed to withdraw', async () => {
            const percentage = await vaultContract.percentageToWithdraw();
            expect(percentage).to.be.equal(10);

            const contractEtherBalance = await ethers.utils.formatEther(await ethers.provider.getBalance(vaultContract.address));
            expect(parseInt(contractEtherBalance)).to.be.greaterThan(parseInt(await ethers.utils.formatEther('0')));

            const result = await vaultContract.checkMaximumAmountToWithdraw(ethers.utils.parseEther('11'));
            expect(result).to.be.false;
        });

        it('Should NOT allow the requested since the contract has no funds', async () => {
            vaultContract = await deployContract(signer, VAULT_ABI);

            const percentage = await vaultContract.percentageToWithdraw();
            expect(percentage).to.be.equal(10);

            const contractEtherBalance = await ethers.utils.formatEther(await ethers.provider.getBalance(vaultContract.address));
            expect(parseInt(contractEtherBalance)).to.be.equal(parseInt(await ethers.utils.formatEther('0')));

            const result = await vaultContract.checkMaximumAmountToWithdraw(ethers.utils.parseEther('5'));
            expect(result).to.be.false;
        });
    });
});
