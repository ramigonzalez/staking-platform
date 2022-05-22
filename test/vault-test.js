const { expect, use } = require("chai");
const { ethers } = require("hardhat");
const { solidity } = require("ethereum-waffle");

use(solidity);

// Contract instance variable
let provider, signer, account1, account2, deployedContractInstance;

// Constant
const contractName              = "Vault";

describe(contractName, function () {
  before(async() => {
    console.log("------------------------------------------------------------------------------------");
    console.log("--", contractName, "Contract Test Start");
    console.log("------------------------------------------------------------------------------------"); 

    // Get provider and Signer
    provider = ethers.provider;
    [signer, account1, account2] = await ethers.getSigners();

    // Deploy contract
    const contractPath          = "contracts/" + contractName + ".sol:" + contractName;
    const contractFactory       = await ethers.getContractFactory(contractPath, signer, );
    deployedContractInstance    = await contractFactory.deploy();
  });

  it("Deployer is admin", async() => {
    const isAdmin = await deployedContractInstance.isAdmin(signer.address);
    expect(isAdmin).to.be.true;
  });

  it("Non admin cannot add another admin", async() => {
    const operation = deployedContractInstance.connect(account1).addAdmin(account2.address);
    await expect(operation).to.be.revertedWith('User must be administrator to perform this operation');
  });

  it("One Admin can set another user as admin", async() => {
    await deployedContractInstance.connect(signer).addAdmin(account1.address);

    const isAdmin = await deployedContractInstance.isAdmin(account1.address);
    expect(isAdmin).to.be.true;
  });

  it("Admin cannot add an admin again", async() => {
    await expect(deployedContractInstance.addAdmin(signer.address)).to.be.revertedWith('Account is already an admin');
  });

  it("Non admin cannot remove admin", async() => {
    const operation = deployedContractInstance.connect(account2).removeAdmin(signer.address);
    await expect(operation).to.be.revertedWith('User must be administrator to perform this operation');
  });

  it("Trying to remove non admin reverses", async() => {
    const operation = deployedContractInstance.connect(account1).removeAdmin(account2.address);
    await expect(operation).to.be.revertedWith('Account is not an admin');
  });

  it("Admin can remove another admin", async() => {
    await deployedContractInstance.connect(account1).removeAdmin(signer.address);
    
    const isAdmin = await deployedContractInstance.isAdmin(signer.address);
    expect(isAdmin).to.be.false;
  });

  it("Admin cannot remove himself if he is the only admin", async() => {
    await expect(deployedContractInstance.connect(account1).removeAdmin(account1.address))
      .to.be.revertedWith('There must be at least one admin');
  });
});
