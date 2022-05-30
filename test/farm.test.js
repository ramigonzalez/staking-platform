const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Farm", function () {
  it("is a contract", async function () {
    const Farm = await ethers.getContractFactory("Farm");
    const contract = await Farm.deploy();
    await contract.deployed();

    expect(await contract.isAContract()).to.be.true;
  });
});
