const { expect, use } = require('chai');
const { waffle } = require('hardhat');
const { deployContract, provider, solidity } = waffle;
const { ZERO_ADDRESS } = require('./constants');

const TokenContract_ABI = require('../artifacts/contracts/TokenContract.sol/TokenContract.json');

use(solidity);

const [wallet, walletTo] = provider.getWallets();

// Constants
const TOKEN_NAME = 'Niery token papa';
const TOKEN_SYMBOL = 'NTP';
const TOKEN_DECIMAL = 18;
const INITIAL_AMOUNT = 10000000;

let tokenContract;

describe('TokenContract information', async () => {
    // Before execute the test suit will deploy the contract once.
    before(async () => {
        tokenContract = await deployContract(wallet, TokenContract_ABI, [INITIAL_AMOUNT]);
    });

    it(`Token name is: "${TOKEN_NAME}"`, async () => {
        //Arrange

        //Act
        const tokenName = await tokenContract.name();

        //Assert
        expect(tokenName).equal(TOKEN_NAME);
    });

    it(`Token symbol is: "${TOKEN_SYMBOL}"`, async () => {
        const tokenSymbol = await tokenContract.symbol();
        expect(tokenSymbol).equal(TOKEN_SYMBOL);
    });

    it(`Token decimals is: ${TOKEN_DECIMAL}`, async () => {
        const tokenDecimal = await tokenContract.decimals();
        expect(tokenDecimal).equal(TOKEN_DECIMAL);
    });

    it('Token total supply is setted on contract init', async () => {
        const tokenTotalSupply = await tokenContract.totalSupply();
        expect(tokenTotalSupply).equal(INITIAL_AMOUNT);
    });
});

describe('Token contract behaviour', async () => {
    describe('Initial behaviour', async () => {
        beforeEach(async () => {
            tokenContract = await deployContract(wallet, TokenContract_ABI, [INITIAL_AMOUNT]);
        });

        it('Contract constructor fails with initial amount less than zero', async () => {
            const initialAmount = 0;
            await expect(deployContract(wallet, TokenContract_ABI, [initialAmount])).to.be.revertedWith('Initial amount must be greater than zero');
        });

        it('Contract constructor initial amount to wallet deployer', async () => {
            const walletDeployerBalance = await tokenContract.balanceOf(wallet.address);
            expect(walletDeployerBalance).equal(INITIAL_AMOUNT);
        });

        it('Contract constructor emit Transfer event', async () => {
            tokenContract = await deployContract(wallet, TokenContract_ABI, [INITIAL_AMOUNT]);
            expect(tokenContract).to.be.emit(tokenContract, 'Transfer').withArgs(ZERO_ADDRESS, wallet.address, INITIAL_AMOUNT);
        });
    });

    describe('Transfer from sender to other account', async () => {
        it('Transfer to zero address account');
        it('Transfer from zero balance address');
        it('Successfully transfer balance check');
        it('Transfer event is emitted successfully');
    });

    describe('TransferFrom functionallity', async () => {
        it('"from" cannot be zero address');
        it('"to" cannot be zero address');
        it('Msg.sender has insufficient allowance amount to transfer from');
        it('"from" address has insufficient balance');
        it('Transfer event is emitted successfully');
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
