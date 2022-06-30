const { expect } = require('chai');
const { ZERO_ADDRESS, contractABI, deployContract, providers, max_initialAmount } = require('./utils');

const contractName = 'TokenContract';
const TOKEN_CONTRACT_ABI = contractABI(contractName);

const VAULT_ABI = contractABI('Vault');

let wallet, walletTo, allowedWallet, contractSimulation, david;

describe(contractName, async () => {
    before(async () => {
        console.log('------------------------------------------------------------------------------------');
        console.log('------------------------', contractName, 'Contract Test Start', '-------------------------');
        console.log('------------------------------------------------------------------------------------');

        [wallet, walletTo, allowedWallet, contractSimulation, david] = await providers();
    });
    // Constants
    const TOKEN_NAME = 'Niery Token Papa';
    const TOKEN_SYMBOL = 'NTP';
    const TOKEN_DECIMAL = 18;
    const INITIAL_AMOUNT = 10000000;

    let tokenContract;

    describe('Deployment', async () => {
        // Before execute the test suit will deploy the contract once.
        before(async () => {
            tokenContract = await deployContract(wallet, TOKEN_CONTRACT_ABI, [INITIAL_AMOUNT]);
        });

        it(`Token name should be: "${TOKEN_NAME}"`, async () => {
            const tokenName = await tokenContract.name();
            expect(tokenName).to.equal(TOKEN_NAME);
        });

        it(`Token symbol should be: "${TOKEN_SYMBOL}"`, async () => {
            const tokenSymbol = await tokenContract.symbol();
            expect(tokenSymbol).to.equal(TOKEN_SYMBOL);
        });

        it(`Token decimals should be: ${TOKEN_DECIMAL}`, async () => {
            const tokenDecimal = await tokenContract.decimals();
            expect(tokenDecimal).to.equal(TOKEN_DECIMAL);
        });

        it('Token total supply should be equal to initial amount', async () => {
            const tokenTotalSupply = await tokenContract.totalSupply();
            expect(tokenTotalSupply).to.equal(INITIAL_AMOUNT);
        });
    });

    describe('constructor()', async () => {
        beforeEach(async () => {
            tokenContract = await deployContract(wallet, TOKEN_CONTRACT_ABI, [INITIAL_AMOUNT]);
        });

        it('Should revert with initial amount less than zero', async () => {
            const initialAmount = 0;
            await expect(deployContract(wallet, TOKEN_CONTRACT_ABI, [initialAmount])).to.be.revertedWith('Initial amount must be greater than zero');
        });

        it('Should assign initial amount to the transation signer', async () => {
            const walletDeployerBalance = await tokenContract.balanceOf(wallet.address);
            expect(walletDeployerBalance).to.equal(INITIAL_AMOUNT);
        });

        it('Should emit Transfer event with proper parameters', async () => {
            const eventName = 'Transfer';

            const eventArguments = {
                _from: ZERO_ADDRESS,
                _to: wallet.address,
                _value: INITIAL_AMOUNT,
            };

            const tx = await tokenContract.deployTransaction.wait();
            const events = tx.events;
            const event = events.filter((e) => e.event === eventName)[0];

            const eventArgs = event ? event.args : [];

            const [transferFrom, transferTo, transferValue] = eventArgs;

            expect(event).to.be.not.null;
            expect(eventArgs).to.be.not.empty;
            expect(eventArgs.length).to.be.equal(3);
            expect(transferFrom).to.be.equal(eventArguments._from);
            expect(transferTo).to.be.equal(eventArguments._to);
            expect(transferValue).to.be.equal(eventArguments._value);
        });
    });

    describe('transfer()', async () => {
        describe('Ok scenarios', async () => {
            beforeEach(async () => {
                tokenContract = await deployContract(wallet, TOKEN_CONTRACT_ABI, [INITIAL_AMOUNT]);
            });

            it('Should transfer requested amount and modify both balances', async () => {
                await expect(() => tokenContract.transfer(walletTo.address, 200)).to.changeTokenBalances(tokenContract, [wallet, walletTo], [-200, 200]);
            });

            it('Should execute zero amount transfer with as normal transfer', async () => {
                await expect(() => tokenContract.transfer(walletTo.address, 0)).to.changeTokenBalances(tokenContract, [wallet, walletTo], [-0, 0]);
            });

            it('Should emit Transfer event with proper parameters', async () => {
                await expect(tokenContract.transfer(walletTo.address, 100)).to.emit(tokenContract, 'Transfer').withArgs(wallet.address, walletTo.address, 100);
            });
        });

        describe('Reverted transactions', async () => {
            beforeEach(async () => {
                tokenContract = await deployContract(wallet, TOKEN_CONTRACT_ABI, [INITIAL_AMOUNT]);
            });

            it('Should revert transactions since "_to" is ZERO_ADDRESS', async () => {
                await expect(tokenContract.transfer(ZERO_ADDRESS, 100)).to.be.revertedWith('Receiver cannot be address(0)');
            });

            it('Should revert transactions since "sender" has 0 balance', async () => {
                // Change msg.sender
                const tokenContractFromOtherWallet = tokenContract.connect(walletTo);
                await expect(tokenContractFromOtherWallet.transfer(wallet.address, 100)).to.be.revertedWith('Sender has insufficient tokens to transfer');
            });
        });
    });

    describe('transferFrom()', async () => {
        describe('Ok scenarios', async () => {
            beforeEach(async () => {
                tokenContract = await deployContract(wallet, TOKEN_CONTRACT_ABI, [INITIAL_AMOUNT]);
            });

            it('Should transfer tokens on "_from" behalf', async () => {
                await tokenContract.approve(allowedWallet.address, 100);
                const tokenContractAllowedWallet = tokenContract.connect(allowedWallet);
                const amountToTransfer = 10;
                await expect(() => tokenContractAllowedWallet.transferFrom(wallet.address, walletTo.address, amountToTransfer)).to.changeTokenBalances(
                    tokenContract,
                    [wallet, walletTo],
                    [-amountToTransfer, amountToTransfer]
                );
            });

            it('Should substract "msg.signer" allowed token amount after transfer', async () => {
                const approveValue = 100;
                const amountToTransfer = 10;

                await tokenContract.approve(allowedWallet.address, approveValue);

                const tokenContractAllowedWallet = tokenContract.connect(allowedWallet);
                await tokenContractAllowedWallet.transferFrom(wallet.address, walletTo.address, amountToTransfer);

                const allowance = await tokenContract.allowance(wallet.address, allowedWallet.address);

                expect(allowance).to.equal(approveValue - amountToTransfer);
            });

            it('Should emit Transfer event with proper parameters', async () => {
                await tokenContract.approve(allowedWallet.address, 100);
                const tokenContractAllowedWallet = tokenContract.connect(allowedWallet);
                const amountToTransfer = 10;

                await expect(tokenContractAllowedWallet.transferFrom(wallet.address, walletTo.address, amountToTransfer))
                    .to.emit(tokenContractAllowedWallet, 'Transfer')
                    .withArgs(wallet.address, walletTo.address, amountToTransfer);
            });
        });

        describe('Reverted transactions', async () => {
            beforeEach(async () => {
                tokenContract = await deployContract(wallet, TOKEN_CONTRACT_ABI, [INITIAL_AMOUNT]);
            });

            it('Should revert transaction since "_from" cannot be zero address', async () => {
                await expect(tokenContract.transferFrom(ZERO_ADDRESS, wallet.address, 100)).to.be.revertedWith('_from cannot be adress(0)');
            });
            it('Should revert transaction since "_to" cannot be zero address', async () => {
                await expect(tokenContract.transferFrom(wallet.address, ZERO_ADDRESS, 100)).to.be.revertedWith('_to cannot be adress(0)');
            });
            it('Should revert transaction since "msg.sender" has insufficient amount allowed to transfer from "_from" behalf', async () => {
                const tokenContractAllowedWallet = tokenContract.connect(allowedWallet);
                // Assume that allowedWallet has 0 tokens approved to spend on wallet behalf
                await expect(tokenContractAllowedWallet.transferFrom(wallet.address, walletTo.address, 100)).to.be.revertedWith(
                    "Tx signer is not allowed to transfer the desired amount on _from's behalf"
                );
            });
            it('Should revert transaction since "msg.sender" has insufficient amount allowed to transfer from "_from" behalf', async () => {
                // 1. wallet allow allowedWallet to spend 100 tokens
                await tokenContract.approve(allowedWallet.address, 100);

                // 2. connect allowedWallet to the contract
                const tokenContractAllowedWallet = tokenContract.connect(allowedWallet);

                // Assert
                await expect(tokenContractAllowedWallet.transferFrom(wallet.address, walletTo.address, 101)).to.be.revertedWith(
                    "Tx signer is not allowed to transfer the desired amount on _from's behalf"
                );
            });
            it('Should revert transaction since "_from" address has insufficient allowance', async () => {
                // 1. wallet allow allowedWallet to spend ALL tokens
                await tokenContract.approve(allowedWallet.address, INITIAL_AMOUNT);

                // 2. connect allowedWallet to the contract
                const tokenContractAllowedWallet = tokenContract.connect(allowedWallet);

                // Assert
                await expect(tokenContractAllowedWallet.transferFrom(wallet.address, walletTo.address, INITIAL_AMOUNT + 100)).to.be.revertedWith(
                    'Tx signer is not allowed to transfer the desired amount on _from\'s behalf'
                );
            });

            it('Should revert transaction since "_from" address has insufficient balance', async () => {
                // 1. wallet allow allowedWallet to spend ALL tokens
                await tokenContract.approve(allowedWallet.address, INITIAL_AMOUNT);

                // 2. connect allowedWallet to the contract
                const tokenContractAllowedWallet = tokenContract.connect(allowedWallet);

                // 3. add allowance
                await tokenContract.approve(allowedWallet.address, ethers.utils.parseEther('100'));

                // Assert
                await expect(tokenContractAllowedWallet.transferFrom(wallet.address, walletTo.address, INITIAL_AMOUNT + 100)).to.be.revertedWith(
                    '_from has insufficient tokens to transfer'
                );
            });
        });
    });

    describe('approve()', async () => {
        beforeEach(async () => {
            tokenContract = await deployContract(wallet, TOKEN_CONTRACT_ABI, [INITIAL_AMOUNT]);
        });

        describe('Ok scenarios', async () => {
            it('Should assign requested amount to "msg.signer" allowed balance', async () => {
                await tokenContract.approve(allowedWallet.address, 100);
                const allowance = await tokenContract.allowance(wallet.address, allowedWallet.address);
                await expect(allowance).to.be.equal(100);
            });
            it('Should emit Approve event with proper parameters', async () => {
                const allowedAmount = 100;
                await expect(tokenContract.approve(allowedWallet.address, allowedAmount))
                    .to.emit(tokenContract, 'Approval')
                    .withArgs(wallet.address, allowedWallet.address, allowedAmount);
            });
        });
        describe('Reverted transactions', async () => {
            it('Should revert transaction since "spender" cannot be zero address', async () => {
                await expect(tokenContract.approve(ZERO_ADDRESS, 100)).to.be.revertedWith('_spender cannot be adress(0)');
            });
        });
    });

    describe('balanceOf()', async () => {
        beforeEach(async () => {
            tokenContract = await deployContract(wallet, TOKEN_CONTRACT_ABI, [INITIAL_AMOUNT]);
        });

        describe('Ok scenarios', async () => {
            it('Balance of zero address is zero', async () => {
                expect(await tokenContract.balanceOf(ZERO_ADDRESS)).to.be.equal(0);
            });

            it('Balance of address without tokens is zero', async () => {
                expect(await tokenContract.balanceOf(allowedWallet.address)).to.be.equal(0);
            });
        });
    });

    describe('allowance()', async () => {
        beforeEach(async () => {
            tokenContract = await deployContract(wallet, TOKEN_CONTRACT_ABI, [INITIAL_AMOUNT]);
        });

        describe('Ok scenarios', async () => {
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

    describe('burn()', async () => {
        beforeEach(async () => {
                tokenContract = await deployContract(wallet, TOKEN_CONTRACT_ABI, [INITIAL_AMOUNT]);
                vaultContract = await deployContract(wallet, VAULT_ABI);
            });
        describe('Ok scenarios', async () => {
            it('Should burn tokens on "sender" behalf', async () => {
                await tokenContract.setVaultAddress(contractSimulation.address);
                const tokenContractAllowedWallet = tokenContract.connect(contractSimulation);
                const amount = 20;
                const expectedAmount = INITIAL_AMOUNT - amount

                await expect(() => tokenContractAllowedWallet.burn(amount,wallet.address)).to.changeTokenBalances(tokenContract, [wallet.address], [-amount]);
                expect(await tokenContract.totalSupply()).to.be.equal(expectedAmount);
            });

            it('Should emit Transfer event with proper parameters', async () => {
                await tokenContract.setVaultAddress(contractSimulation.address);
                const tokenContractAllowedWallet = tokenContract.connect(contractSimulation);
                const amount = 20;
                await expect(tokenContractAllowedWallet.burn(amount,wallet.address)).to.emit(tokenContract, 'Transfer').withArgs(wallet.address, ZERO_ADDRESS, amount);
            });
        });

        describe('Reverted transactions', async () => {
            it('Should revert transaction when function is called by an address other than the Vault address ', async () => {
                const amount = 100;
                await tokenContract.setVaultAddress(contractSimulation.address);
                await expect(tokenContract.burn(amount,wallet.address)).to.be.revertedWith('Only Vault can call this function');
            });

            it('Should revert transaction when sender address has insufficient balance', async () => {
                let tokenContract1 = await deployContract(wallet, TOKEN_CONTRACT_ABI, [50]);
                await tokenContract1.setVaultAddress(walletTo.address);
                const tokenContractAllowedWallet = tokenContract1.connect(walletTo);
                const amount = 100;
                await expect(tokenContractAllowedWallet.burn(amount,wallet.address)).to.be.revertedWith(
                    '_amount cannot be greater than sender balance'
                );
            });
        });
    });

    describe('mint()', async () => {
        beforeEach(async () => {
                tokenContract = await deployContract(wallet, TOKEN_CONTRACT_ABI, [INITIAL_AMOUNT]);
            });

        describe('Ok scenarios', async () => {
            it('Should mint tokens on "vault" behalf', async () => {
                await tokenContract.setVaultAddress(walletTo.address);
                const tokenContractAllowedWallet = tokenContract.connect(walletTo);
                const amount = 20;
                const expectedAmount = amount

                await expect(() => tokenContractAllowedWallet.mint(amount)).to.changeTokenBalances(tokenContract, [walletTo], [expectedAmount]);
                expect(await tokenContract.totalSupply()).to.be.equal(INITIAL_AMOUNT + expectedAmount);
            });

            it('Should emit Transfer event with proper parameters', async () => {
                await tokenContract.setVaultAddress(walletTo.address);
                const tokenContractAllowedWallet = tokenContract.connect(walletTo);
                const amount = 20;
                const expectedAmount = amount

                await expect(tokenContractAllowedWallet.mint(amount)).to.emit(tokenContractAllowedWallet, 'Transfer').withArgs(ZERO_ADDRESS, walletTo.address, expectedAmount);
            });
        });

        describe('Reverted transactions', async () => {
            it('Should revert transaction since "_amount" cannot be zero', async () => {
                await tokenContract.setVaultAddress(walletTo.address);
                const tokenContractAllowedWallet = tokenContract.connect(walletTo);
                const amount = 0;

                await expect(tokenContractAllowedWallet.mint(amount)).to.be.revertedWith('_amount must be greater than 0');
            });

            it('Should revert transaction since mint is called from an address different than Vault address', async () => {
                await tokenContract.setVaultAddress(david.address);
                const amount = 30;

                await expect(tokenContract.mint(amount)).to.be.revertedWith('Only Vault can call this function');
            });
        });
    });
});
