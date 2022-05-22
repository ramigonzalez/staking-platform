const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("TokenContract", function () {
  it("is a contract", async function () {
    const TokenContract = await ethers.getContractFactory("TokenContract");
    const contract = await TokenContract.deploy();
    await contract.deployed();

    expect(await contract.isAContract()).to.be.true;
  });
});
