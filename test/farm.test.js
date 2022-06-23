const { expect, use } = require('chai');
const { ZERO_ADDRESS, contractABI, toEthers, increaseOneYear, increaseTwoYears, deployContract, providers } = require('./utils');

const contractName = 'Farm';
const FARM_ABI = contractABI(contractName);

let wallet, walletTo, anotherWallet;

describe(contractName, async () => {
    before(async () => {
        console.log('------------------------------------------------------------------------------------');
        console.log('------------------------', contractName, 'Contract Test Start', '-------------------------');
        console.log('------------------------------------------------------------------------------------');

        [wallet, walletTo, anotherWallet] = await providers();
    });
    // Constants
    const INITIAL_AMOUNT = toEthers(10);

    let farmContract;
    let tokenContract;

    describe('Deployment', async () => {
        // Before execute the test suit will deploy the contract once.
        before(async () => {
            const vaultContract = await deployContract(wallet, contractABI('Vault'));

            tokenContract = await deployContract(wallet, contractABI('TokenContract'), [INITIAL_AMOUNT]);

            farmContract = await deployContract(wallet, FARM_ABI, [tokenContract.address, vaultContract.address]);
        });

        it(`APR should be 20`, async () => {
            const apr = await farmContract.getAPR();
            expect(apr).to.equal(20);
        });

        it(`Total Stake should be 0`, async () => {
            const apr = await farmContract.getTotalStake();
            expect(apr).to.equal(0);
        });

        it(`Total Yield Paid should be 0`, async () => {
            const apr = await farmContract.getTotalYieldPaid();
            expect(apr).to.equal(0);
        });
    });

    describe('stake()', async () => {
        describe('Ok scenarios', async () => {
            beforeEach(async () => {
                const vaultContract = await deployContract(wallet, contractABI('Vault'), []);
                tokenContract = await deployContract(wallet, contractABI('TokenContract'), [INITIAL_AMOUNT]);
                farmContract = await deployContract(wallet, FARM_ABI, [tokenContract.address, vaultContract.address]);

                await tokenContract.approve(farmContract.address, INITIAL_AMOUNT);
            });

            it('Should transfer balance from Sender', async () => {
                await expect(() => farmContract.stake(100)).to.changeTokenBalances(tokenContract, [wallet, farmContract], [-100, 100]);
            });

            it('Should emit Stake event with proper parameters', async () => {
                await expect(farmContract.stake(150)).to.emit(farmContract, 'Stake').withArgs(wallet.address, 150);
            });
        });

        describe('Reverted transactions', async () => {
            beforeEach(async () => {
                const vaultContract = await deployContract(wallet, contractABI('Vault'), []);
                tokenContract = await deployContract(wallet, contractABI('TokenContract'), [INITIAL_AMOUNT]);
                farmContract = await deployContract(wallet, FARM_ABI, [tokenContract.address, vaultContract.address]);

                await tokenContract.approve(farmContract.address, INITIAL_AMOUNT);
            });

            it('Should revert transactions since "_amount" is 0', async () => {
                await expect(farmContract.stake(0)).to.be.revertedWith('Cannot stake nothing');
            });

            it('Should revert transactions since "allowance" is not enough', async () => {
                const bigNumber = toEthers(100);
                await expect(farmContract.stake(bigNumber)).to.be.revertedWith('Insufficient allowance');
            });

            it('Should revert transactions since "sender" has 0 balance', async () => {
                // Change msg.sender
                const farmContractFromOtherWallet = farmContract.connect(walletTo);
                await tokenContract.connect(walletTo).approve(farmContract.address, 1000);

                await expect(farmContractFromOtherWallet.stake(100)).to.be.revertedWith('Insufficient balance');
            });
        });
    });

    describe('unstake()', async () => {
        describe('Ok scenarios', async () => {
            beforeEach(async () => {
                const vaultContract = await deployContract(wallet, contractABI('Vault'), []);
                tokenContract = await deployContract(wallet, contractABI('TokenContract'), [INITIAL_AMOUNT]);
                farmContract = await deployContract(wallet, FARM_ABI, [tokenContract.address, vaultContract.address]);

                await tokenContract.approve(farmContract.address, INITIAL_AMOUNT);
                await farmContract.stake(150);
            });

            it('Should transfer balance from Farm to Sender', async () => {
                await farmContract.stake(150);
                await expect(() => farmContract.unstake(100)).to.changeTokenBalances(tokenContract, [wallet, farmContract], [100, -100]);
            });

            it('Should emit Stake event with proper parameters', async () => {
                await expect(farmContract.unstake(150)).to.emit(farmContract, 'Unstake').withArgs(wallet.address, 150);
            });
        });

        describe('Reverted transactions', async () => {
            beforeEach(async () => {
                const vaultContract = await deployContract(wallet, contractABI('Vault'), []);
                tokenContract = await deployContract(wallet, contractABI('TokenContract'), [INITIAL_AMOUNT]);
                farmContract = await deployContract(wallet, FARM_ABI, [tokenContract.address, vaultContract.address]);

                await tokenContract.approve(farmContract.address, INITIAL_AMOUNT);
            });

            it('Should revert transactions since "sender" has no staking', async () => {
                // Change msg.sender
                const farmContractFromOtherWallet = farmContract.connect(walletTo);
                await expect(farmContractFromOtherWallet.unstake(100)).to.be.revertedWith("Account doesn't have any deposit");
            });

            it('Should revert transactions since "_amount" is 0', async () => {
                await farmContract.stake(toEthers(1));
                await expect(farmContract.unstake(0)).to.be.revertedWith('Cannot unstake nothing');
            });

            it('Should revert transactions since "allowance" is not enough', async () => {
                const bigNumber = toEthers(100);
                await farmContract.stake(toEthers(1));
                await expect(farmContract.unstake(bigNumber)).to.be.revertedWith('Cannot unstake more than the staked amount');
            });
        });
    });

    describe('withdrawYield()', async () => {
        describe('Ok scenarios', async () => {
            beforeEach(async () => {
                const vaultContract = await deployContract(wallet, contractABI('Vault'), []);
                tokenContract = await deployContract(wallet, contractABI('TokenContract'), [INITIAL_AMOUNT]);
                farmContract = await deployContract(wallet, FARM_ABI, [tokenContract.address, vaultContract.address]);

                await tokenContract.approve(farmContract.address, INITIAL_AMOUNT);
                await farmContract.stake(100);
            });

            it('Should transfer balance from Farm to Sender', async () => {
                // Increase network by 1 year
                await increaseOneYear(network);

                await expect(farmContract.withdrawYield()).to.changeTokenBalances(tokenContract, [wallet, farmContract], [20, -20]);
            });

            it('Should emit Stake event with proper parameters', async () => {
                // Increase network by 2 years
                await increaseTwoYears(network);

                await expect(farmContract.withdrawYield()).to.emit(farmContract, 'WithdrawYield').withArgs(wallet.address, 40);
            });
        });

        describe('Reverted transactions', async () => {
            beforeEach(async () => {
                const vaultContract = await deployContract(wallet, contractABI('Vault'), []);
                tokenContract = await deployContract(wallet, contractABI('TokenContract'), [INITIAL_AMOUNT]);
                farmContract = await deployContract(wallet, FARM_ABI, [tokenContract.address, vaultContract.address]);

                await tokenContract.approve(farmContract.address, INITIAL_AMOUNT);
            });

            it('Should revert transactions since "sender" has no staking', async () => {
                // Change msg.sender
                const farmContractFromOtherWallet = farmContract.connect(walletTo);
                await expect(farmContractFromOtherWallet.withdrawYield()).to.be.revertedWith("Account doesn't have any deposit");
            });
        });
    });

    describe('getYield()', async () => {
        describe('Ok scenarios', async () => {
            beforeEach(async () => {
                const vaultContract = await deployContract(wallet, contractABI('Vault'), []);
                tokenContract = await deployContract(wallet, contractABI('TokenContract'), [INITIAL_AMOUNT]);
                farmContract = await deployContract(wallet, FARM_ABI, [tokenContract.address, vaultContract.address]);

                await tokenContract.approve(farmContract.address, INITIAL_AMOUNT);
                await farmContract.stake(100);
            });

            it('Yield starts at 0', async () => {
                expect(await farmContract.getYield()).to.eq(0);
            });

            it('Yield increases to 20 after 1 year with APR 20', async () => {
                // Increase network by 1 year
                await increaseOneYear(network);

                expect(await farmContract.getYield()).to.eq(20);
            });

            it('Yield of unstaked account is 0 always', async () => {
                const farmContractFromOtherWallet = farmContract.connect(walletTo);
                expect(await farmContractFromOtherWallet.getYield()).to.eq(0);

                // Increase network by 2 years
                await increaseTwoYears(network);
                expect(await farmContractFromOtherWallet.getYield()).to.eq(0);
            });

            it("Yield doesn't increase if unstaked", async () => {
                await increaseOneYear(network);
                expect(await farmContract.getYield()).to.eq(20);

                await farmContract.unstake(100);

                await increaseOneYear(network);
                expect(await farmContract.getYield()).to.eq(20);
            });
        });
    });

    describe('getStake()', async () => {
        describe('Ok scenarios', async () => {
            beforeEach(async () => {
                const vaultContract = await deployContract(wallet, contractABI('Vault'), []);
                tokenContract = await deployContract(wallet, contractABI('TokenContract'), [INITIAL_AMOUNT]);
                farmContract = await deployContract(wallet, FARM_ABI, [tokenContract.address, vaultContract.address]);

                await tokenContract.approve(farmContract.address, INITIAL_AMOUNT);
            });

            it('Stake starts at 0', async () => {
                expect(await farmContract.getStake()).to.eq(0);
            });

            it('Stake increases correctly', async () => {
                await farmContract.stake(100);
                expect(await farmContract.getStake()).to.eq(100);
            });

            it('Stake of unstaked account is 0', async () => {
                const farmContractFromOtherWallet = farmContract.connect(walletTo);
                expect(await farmContractFromOtherWallet.getStake()).to.eq(0);
            });
        });
    });

    describe('getTotalStake()', async () => {
        describe('Ok scenarios', async () => {
            beforeEach(async () => {
                const vaultContract = await deployContract(wallet, contractABI('Vault'), []);
                tokenContract = await deployContract(wallet, contractABI('TokenContract'), [INITIAL_AMOUNT]);
                farmContract = await deployContract(wallet, FARM_ABI, [tokenContract.address, vaultContract.address]);

                await tokenContract.approve(farmContract.address, INITIAL_AMOUNT);

                await tokenContract.transfer(anotherWallet.address, 100);
                const tokenContractFromOtherWallet = tokenContract.connect(anotherWallet);
                await tokenContractFromOtherWallet.approve(farmContract.address, INITIAL_AMOUNT);
            });

            it('Total Stake starts at 0', async () => {
                expect(await farmContract.getTotalStake()).to.eq(0);
            });

            it('Total Stake increases correctly', async () => {
                await farmContract.stake(100);

                expect(await farmContract.getTotalStake()).to.eq(100);
            });

            it('Total Stake increases correctly with stakes from 2 wallets', async () => {
                await farmContract.stake(100);

                expect(await farmContract.getTotalStake()).to.eq(100);

                const farmContractFromOtherWallet = farmContract.connect(anotherWallet);
                await farmContractFromOtherWallet.stake(50);

                expect(await farmContract.getTotalStake()).to.eq(150);
            });

            it('Total Stake decreases with unstaking', async () => {
                await farmContract.stake(100);

                expect(await farmContract.getTotalStake()).to.eq(100);

                await farmContract.unstake(20);

                expect(await farmContract.getTotalStake()).to.eq(80);
            });
        });
    });

    describe('getTotalYieldPaid()', async () => {
        describe('Ok scenarios', async () => {
            beforeEach(async () => {
                const vaultContract = await deployContract(wallet, contractABI('Vault'), []);
                tokenContract = await deployContract(wallet, contractABI('TokenContract'), [INITIAL_AMOUNT]);
                farmContract = await deployContract(wallet, FARM_ABI, [tokenContract.address, vaultContract.address]);

                await tokenContract.approve(farmContract.address, INITIAL_AMOUNT);

                await tokenContract.transfer(anotherWallet.address, 100);
                const tokenContractFromOtherWallet = tokenContract.connect(anotherWallet);
                await tokenContractFromOtherWallet.approve(farmContract.address, INITIAL_AMOUNT);
            });

            it('Total Yield Paid starts at 0', async () => {
                expect(await farmContract.getTotalYieldPaid()).to.eq(0);
            });

            it('Total Yield Paid increases correctly', async () => {
                await farmContract.stake(100);
                await increaseTwoYears(network);

                await farmContract.withdrawYield();

                expect(await farmContract.getTotalYieldPaid()).to.eq(40);
            });

            it('Total Yield Paid increases correctly from 2 wallets', async () => {
                await farmContract.stake(100);
                await increaseTwoYears(network);

                await farmContract.withdrawYield();

                expect(await farmContract.getTotalYieldPaid()).to.eq(40);

                const farmContractFromOtherWallet = farmContract.connect(anotherWallet);
                await farmContractFromOtherWallet.stake(50);
                await increaseOneYear(network);

                await farmContractFromOtherWallet.withdrawYield();

                expect(await farmContract.getTotalYieldPaid()).to.eq(50);
            });
        });
    });
});
