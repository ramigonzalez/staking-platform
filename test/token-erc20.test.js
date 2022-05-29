const { expect, use } = require('chai');
const { waffle } = require('hardhat');
const { deployContract, provider, solidity } = waffle;

const TokenERC20_ABI = require('../artifacts/contracts/TokenERC20.sol/TokenERC20.json');

use(solidity);

let token;
const [wallet, walletTo] = provider.getWallets();

describe('xxx', async () => {
    beforeEach(async () => {
        token = await deployContract(wallet, TokenERC20_ABI, [1000]);
    });

    it('Assigns initial balance', async () => {
        const balanceOfDeployer = await token.balanceOf(wallet.address);
        expect(balanceOfDeployer).to.equal(1000);
    });

    it('revert with text', async () => {
        await expect(token.isAContract()).to.be.revertedWith('un texto');
    });

    it('revert', async () => {
        await expect(token.isAContract()).to.be.reverted;
    });

    it('emit', async () => {
        await expect(token.isAContractWithEmit()).to.be.emit(token, 'Deposit');
    });
});
