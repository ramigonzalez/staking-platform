const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Vault", function () {
  it("is a contract", async function () {
    const Vault = await ethers.getContractFactory("Vault");
    const contract = await Vault.deploy();
    await contract.deployed();

    expect(await contract.isAContract()).to.be.true;
  });
});
