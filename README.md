# 1. Description
This GitHub repository presents an implementation of a staking protocol using an ERC20 token named $NTP. The protocol allows users to exchange $NTP for ETH through a vault owned and managed by a group of administrators.

With this protocol, users can buy $NTP tokens by sending ETH to the Vault contract at a specific buy price, and the tokens will be credited to their balance accordingly. The Vault contract also accumulates ethers whenever tokens are bought using ETH.

Administrators play a crucial role in the protocol by overseeing its operations. They can withdraw earned ethers, but this requires approval from a majority of the administrators to ensure transparency and security.

For users, there is an additional incentive to participate in the protocol. They can be rewarded with a configurable APR % by the administrators for staking their tokens.

In summary, this staking protocol provides a secure and efficient way for users to swap $NTP tokens for ETH and earn rewards by staking their tokens. It is a valuable product that empowers users to engage with the protocol while ensuring the integrity of the system through administrator oversight.

# 2. Deployed protocol details
We deployed the protocol in Rinkeby testnet network and here are the contract addresses.

| Contract Name     | Contract Address |
| -------------:   | :-------------: |
| Vault             | 0xE28f717A4651a7b68840aCF4Ca54EabFD836ED10 |
| TokenContract     | 0x24A0C8c3aFc5A9C8c82683f4A31EFDd0Ce029c32 |
| Farm              | 0xfdfB1a80eaC3D99EaB7ecF829F62857257CA1840 |

# 3. Local environment setup
## Download required software
- Node.js v18.17.0 [download](https://nodejs.org/en/) Local environment to write & rune test cases. Also used for deploy our contracts to testnet and mainnet by running deploy scripts.
- Ganache [download](https://trufflesuite.com/ganache/) - Is a local blockchain used for development allowing data persistance.

## Install project dependencies
Since we already installed node, we also installed `npm`. So we just run: `npm i`
## Environment variables
We just need to create a file called `.env` in our root directory following `.env.example` file.

# 4. Hardhat commands
## Run tests
```shell
npx hardhat test
```

## Deploy contracts
```shell
npx hardhat run scripts/deploy.js --network <network-name>
```
Where `network-name` is the network name where we want to deploy our contracts. (Ex:. ganache, ethereum, rinkeby, etc).
Those networks must be configured in `hardhat.config.js` file.

Note: If we do not specify a network we will be deploying to the Hardhat Network locally.
```shell
npx hardhat run scripts/deploy.js
```

# 5. Project description

## Structure
The project is structured in the following way:

| Folder | Descripcion |
| ------------- | ------------- |
| `contracts/`  | It contains all smart contract files `.sol` as well as used interfaces inside `Interfaces/` directory |
| `Documents/`  | Here are the model and sequence uml diagrams made using `mermaid` library |
| `scripts/`    | Here are the deploy scripts and utils scripts |
| `test/`       | It contains the smart contracts tests having one suite per contract created |
| `.env`        | Environment variables file. Used by hardhat and deploy script |
| `.hardhat.config` | Hardhat configuration file |
| `.package.json`   | Node dependencies |

## Featured features

|  | Descripcion |
| ------------- | ------------- |
| Patron Ownable | This pattern indicates us that one or more than one address is owner of the protocol/contract. We made an implementation of it where multiple users can be administrators and consequently owners of it, allowing them to perform significantly impact actions |
| Github actions | We defined a GitHub workflow to automatically run tests every time a PR is opened. This file is located in [.gihub/workflows/run-tests.yml](/.github/workflows/run-tests.yml)

## UML Diagrams

[Model Diagram](Documents/Contracts.md)
[Sequence Diagram](Documents/SequenceDiagrams.md.md)