const { expect, use } = require('chai');
const { waffle } = require('hardhat');
const { deployContract, provider, solidity } = waffle;
const { ZERO_ADDRESS } = require('./constants');

const TokenContract_ABI = require('../artifacts/contracts/TokenContract.sol/TokenContract.json');

use(solidity);

const [wallet, walletTo, allowedWallet] = provider.getWallets();

// Constants
const TOKEN_NAME = 'Niery token papa';
const TOKEN_SYMBOL = 'NTP';
const TOKEN_DECIMAL = 18;
const INITIAL_AMOUNT = 10000000;

let tokenContract;

describe('1. TokenContract information', async () => {
    // Before execute the test suit will deploy the contract once.
    before(async () => {
        tokenContract = await deployContract(wallet, TokenContract_ABI, [INITIAL_AMOUNT]);
    });

    it(`Token name is: "${TOKEN_NAME}"`, async () => {
        const tokenName = await tokenContract.name();
        expect(tokenName).to.equal(TOKEN_NAME);
    });

    it(`Token symbol is: "${TOKEN_SYMBOL}"`, async () => {
        const tokenSymbol = await tokenContract.symbol();
        expect(tokenSymbol).to.equal(TOKEN_SYMBOL);
    });

    it(`Token decimals is: ${TOKEN_DECIMAL}`, async () => {
        const tokenDecimal = await tokenContract.decimals();
        expect(tokenDecimal).to.equal(TOKEN_DECIMAL);
    });

    it('Token total supply is setted on contract init', async () => {
        const tokenTotalSupply = await tokenContract.totalSupply();
        expect(tokenTotalSupply).to.equal(INITIAL_AMOUNT);
    });
});

describe('2. Token contract behaviour', async () => {
    describe('2.1. Initial behaviour', async () => {
        beforeEach(async () => {
            tokenContract = await deployContract(wallet, TokenContract_ABI, [INITIAL_AMOUNT]);
        });

        it('Contract constructor fails with initial amount less than zero', async () => {
            const initialAmount = 0;
            await expect(deployContract(wallet, TokenContract_ABI, [initialAmount])).to.be.revertedWith('Initial amount must be greater than zero');
        });

        it('Contract constructor initial amount to wallet deployer', async () => {
            const walletDeployerBalance = await tokenContract.balanceOf(wallet.address);
            expect(walletDeployerBalance).to.equal(INITIAL_AMOUNT);
        });

        it('Contract constructor emit Transfer event', async () => {
            const deployedContract = await deployContract(wallet, TokenContract_ABI, [INITIAL_AMOUNT]);
            //await expect(deployedContract).to.emit(deployedContract, 'Transfer').withArgs(ZERO_ADDRESS, wallet.address, INITIAL_AMOUNT);

            expect(false).to.be.true;

            // await expect(tokenContract).to.emit(tokenContract, 'Transfer').withArgs(ZERO_ADDRESS, wallet.address, INITIAL_AMOUNT);
        });
    });

    describe('2.2. Transfer from sender to other account', async () => {
        describe('Successfully transfer()', async () => {
            beforeEach(async () => {
                tokenContract = await deployContract(wallet, TokenContract_ABI, [INITIAL_AMOUNT]);
            });

            it('Transfer sufficient amount', async () => {
                await expect(() => tokenContract.transfer(walletTo.address, 200)).to.changeTokenBalances(tokenContract, [wallet, walletTo], [-200, 200]);
            });

            it('Transfer zero amount ok', async () => {
                await expect(() => tokenContract.transfer(walletTo.address, 0)).to.changeTokenBalances(tokenContract, [wallet, walletTo], [-0, 0]);
            });

            it('Transfer event is emitted', async () => {
                await expect(tokenContract.transfer(walletTo.address, 100)).to.be.emit(tokenContract, 'Transfer').withArgs(wallet.address, walletTo.address, 100);
            });
        });

        describe('Reverted transaction transfer()', async () => {
            beforeEach(async () => {
                tokenContract = await deployContract(wallet, TokenContract_ABI, [INITIAL_AMOUNT]);
            });

            it('Transfer to zero address account', async () => {
                await expect(tokenContract.transfer(ZERO_ADDRESS, 100)).to.be.revertedWith('Receiver cannot be address(0)');
            });

            it('Transfer from address with 0 balance', async () => {
                // Change msg.sender
                const tokenContractFromOtherWallet = tokenContract.connect(walletTo);
                await expect(tokenContractFromOtherWallet.transfer(wallet.address, 100)).to.be.revertedWith('Sender has insufficient tokens to transfer');
            });
        });
    });

    describe('2.3. TransferFrom functionallity', async () => {
        describe('Successfully transferFrom() transaction.', async () => {
            beforeEach(async () => {
                tokenContract = await deployContract(wallet, TokenContract_ABI, [INITIAL_AMOUNT]);
            });

            it('Transfer of tokens by allowed wallet on "_from" behalf', async () => {
                await tokenContract.approve(allowedWallet.address, 100);
                const tokenContractAllowedWallet = tokenContract.connect(allowedWallet);
                const amountToTransfer = 10;
                await expect(() => tokenContractAllowedWallet.transferFrom(wallet.address, walletTo.address, amountToTransfer)).to.changeTokenBalances(
                    tokenContract,
                    [wallet, walletTo],
                    [-amountToTransfer, amountToTransfer]
                );
            });

            it('Allowance is substracted', async () => {
                const approveValue = 100;
                const amountToTransfer = 10;

                await tokenContract.approve(allowedWallet.address, approveValue);

                const tokenContractAllowedWallet = tokenContract.connect(allowedWallet);
                await tokenContractAllowedWallet.transferFrom(wallet.address, walletTo.address, amountToTransfer);

                const allowance = await tokenContract.allowance(wallet.address, allowedWallet.address);

                expect(allowance).to.equal(approveValue - amountToTransfer);
            });

            it('Transfer event is emitted successfully', async () => {
                await tokenContract.approve(allowedWallet.address, 100);
                const tokenContractAllowedWallet = tokenContract.connect(allowedWallet);
                const amountToTransfer = 10;

                await expect(tokenContractAllowedWallet.transferFrom(wallet.address, walletTo.address, amountToTransfer))
                    .to.emit(tokenContractAllowedWallet, 'Transfer')
                    .withArgs(wallet.address, walletTo.address, amountToTransfer);
            });
        });

        describe('Reverted transaction transferFrom()', async () => {
            beforeEach(async () => {
                tokenContract = await deployContract(wallet, TokenContract_ABI, [INITIAL_AMOUNT]);
            });

            it('"_from" cannot be zero address', async () => {
                await expect(tokenContract.transferFrom(ZERO_ADDRESS, wallet.address, 100)).to.be.revertedWith('_from cannot be adress(0)');
            });
            it('"_to" cannot be zero address', async () => {
                await expect(tokenContract.transferFrom(wallet.address, ZERO_ADDRESS, 100)).to.be.revertedWith('_to cannot be adress(0)');
            });
            it('"Msg.sender" has insufficient amount allowed to transfer from "_from" behalf', async () => {
                const tokenContractAllowedWallet = tokenContract.connect(allowedWallet);
                // Assume that allowedWallet has 0 tokens approved to spend on wallet behalf
                await expect(tokenContractAllowedWallet.transferFrom(wallet.address, walletTo.address, 100)).to.be.revertedWith(
                    "Tx signer is not allowed to transfer the desired amount on _from's behalf"
                );
            });
            it('"Msg.sender" has insufficient amount allowed to transfer from "_from" behalf', async () => {
                // 1. wallet allow allowedWallet to spend 100 tokens
                await tokenContract.approve(allowedWallet.address, 100);

                // 2. connect allowedWallet to the contract
                const tokenContractAllowedWallet = tokenContract.connect(allowedWallet);

                // Assert
                await expect(tokenContractAllowedWallet.transferFrom(wallet.address, walletTo.address, 101)).to.be.revertedWith(
                    "Tx signer is not allowed to transfer the desired amount on _from's behalf"
                );
            });
            it('"_from" address has insufficient balance', async () => {
                // 1. wallet allow allowedWallet to spend ALL tokens
                await tokenContract.approve(allowedWallet.address, INITIAL_AMOUNT);

                // 2. connect allowedWallet to the contract
                const tokenContractAllowedWallet = tokenContract.connect(allowedWallet);

                // Assert
                await expect(tokenContractAllowedWallet.transferFrom(wallet.address, walletTo.address, INITIAL_AMOUNT + 100)).to.be.revertedWith(
                    '_from has insufficient tokens to transfer'
                );
            });
        });
    });

    describe('2.4. Approve amount to transfer', async () => {
        beforeEach(async () => {
            tokenContract = await deployContract(wallet, TokenContract_ABI, [INITIAL_AMOUNT]);
        });

        it('"spender" cannot be zero address', async () => {
            await expect(tokenContract.approve(ZERO_ADDRESS, 100)).to.be.revertedWith('_spender cannot be adress(0)');
        });

        it('Approve operation was successfully done', async () => {
            await tokenContract.approve(allowedWallet.address, 100);
            const allowance = await tokenContract.allowance(wallet.address, allowedWallet.address);
            await expect(allowance).to.be.equal(100);
        });

        it('Approve event is emitted successfully', async () => {
            const allowedAmount = 100;
            await expect(tokenContract.approve(allowedWallet.address, allowedAmount))
                .to.emit(tokenContract, 'Approval')
                .withArgs(wallet.address, allowedWallet.address, allowedAmount);
        });
    });

    describe('2.5. Balance and allowance', async () => {
        beforeEach(async () => {
            tokenContract = await deployContract(wallet, TokenContract_ABI, [INITIAL_AMOUNT]);
        });

        it('Balance of zero address is zero', async () => {
            expect(await tokenContract.balanceOf(ZERO_ADDRESS)).to.be.equal(0);
        });

        it('Balance of address without tokens is zero', async () => {
            expect(await tokenContract.balanceOf(allowedWallet.address)).to.be.equal(0);
        });

        it('Allowance of spender zero address is zero', async () => {
            expect(await tokenContract.allowance(wallet.address, ZERO_ADDRESS)).to.be.equal(0);
        });

        it('Allowance of owner zero address is zero', async () => {
            expect(await tokenContract.allowance(ZERO_ADDRESS, wallet.address)).to.be.equal(0);
        });

        it('Allowance of owner without tokens is zero', async () => {
            expect(await tokenContract.allowance(allowedWallet.address, wallet.address)).to.be.equal(0);
        });
    });
});
