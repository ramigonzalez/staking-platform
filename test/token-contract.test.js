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
            tokenC = await deployContract(wallet, TokenContract_ABI, [INITIAL_AMOUNT]);
            expect(tokenC).to.be.emit(tokenC, 'Transfer').withArgs(ZERO_ADDRESS, wallet.address, INITIAL_AMOUNT);
        });
    });

    describe('2.2. Transfer from sender to other account', async () => {
        beforeEach(async () => {
            tokenContract = await deployContract(wallet, TokenContract_ABI, [INITIAL_AMOUNT]);
        });

        it('Successfully transfer balance check ok', async () => {
            await expect(() => tokenContract.transfer(walletTo.address, 200)).to.changeTokenBalances(tokenContract, [wallet, walletTo], [-200, 200]);
        });

        it('Transfer zero amount ok', async () => {
            await expect(() => tokenContract.transfer(walletTo.address, 0)).to.changeTokenBalances(tokenContract, [wallet, walletTo], [-0, 0]);
        });

        it('Transfer event is emitted ok', async () => {
            await expect(tokenContract.transfer(walletTo.address, 100)).to.be.emit(tokenContract, 'Transfer').withArgs(wallet.address, walletTo.address, 100);
        });

        it('Revert transfer to zero address account', async () => {
            await expect(tokenContract.transfer(ZERO_ADDRESS, 100)).to.be.revertedWith('Receiver cannot be address(0)');
        });

        it('Revert transfer from zero balance address', async () => {
            // Change msg.sender
            const tokenContractFromOtherWallet = tokenContract.connect(walletTo);
            await expect(tokenContractFromOtherWallet.transfer(ZERO_ADDRESS, 100)).to.be.revertedWith('Receiver cannot be address(0)');
        });
    });

    describe('TransferFrom functionallity', async () => {
        beforeEach(async () => {
            tokenContract = await deployContract(wallet, TokenContract_ABI, [INITIAL_AMOUNT]);
        });

        it('"from" cannot be zero address', async () => {
            await expect(tokenContract.transferFrom(ZERO_ADDRESS, wallet.address, 100)).to.be.revertedWith('_from cannot be adress(0)');
        });
        it('"to" cannot be zero address', async () => {
            await expect(tokenContract.transferFrom(wallet.address, ZERO_ADDRESS, 100)).to.be.revertedWith('_to cannot be adress(0)');
        });
        it('Msg.sender has insufficient amount allowed to transfer from _from behalf', async () => {
            // Assume that allowedWallet has 0 tokens approved to spend on wallet behalf
            const tokenContractAllowedWallet = tokenContract.connect(allowedWallet);
            await expect(tokenContractAllowedWallet.transferFrom(wallet.address, walletTo.address, 100)).to.be.revertedWith(
                "Tx signer is not allowed to transfer the desired amount on _from's behalf"
            );
        });
        it('"from" address has insufficient balance', async () => {
            const tokenContractAllowedWallet = tokenContract.connect(allowedWallet);
            await tokenContractAllowedWallet.approve(allowedWallet.address, 100);
            await expect(tokenContractAllowedWallet.transferFrom(allowedWallet.address, walletTo.address, 500)).to.be.revertedWith(
                "Tx signer is not allowed to transfer the desired amount on _from's behalf"
            );
        });
        it('Transfer tokens on "from" behalf', async () => {
            const tokenContractAllowedWallet = tokenContract.connect(allowedWallet);
            await tokenContractAllowedWallet.approve(allowedWallet.address, 100);
            await expect(tokenContractAllowedWallet.transferFrom(allowedWallet.address, walletTo.address, 10)).to.changeTokenBalances(tokenContract, [wallet, walletTo], [-0, 0]);
        });
        it('"from" address has insufficient balance', async () => {
            await tokenContract.approve(allowedWallet.address, 100);
            await expect(tokenContract.transferFrom(allowedWallet.address, walletTo.address, 500)).to.be.revertedWith("Tx signer is not allowed to transfer the desired amount on _from's behalf");
        });
        it('Transfer event is emitted successfully', async () => {});
    });

    describe('Approve amount to transfer', async () => {
        it('"spender" cannot be zero address');
        it('Approve event is emitted successfully');
        it('Approve operation was successfully done');
    });

    describe('Balance and allowance', async () => {
        it('Balance of unexistant address is zero');
        it('Balance of zero address is zero');
        it('Balance of address without tokens is zero');
        it('Allowance of unexistant spender is zero');
        it('Allowance of spender zero address is zero');
        it('Allowance of owner without tokens is zero');
        it('Allowance of unexistant owner is zero');
        it('Allowance of owner zero address is zero');
        it('Allowance of owner without tokens is zero');
    });
});
