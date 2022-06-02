//SPDX-License-Identifier: Unlicense
pragma solidity 0.8.9;

import 'hardhat/console.sol';

contract Vault {
    
    uint256 private administratorsCount;
    
    /**
     * Can be changed to [external] to optimize GAS USED
     */
    uint256 public sellPrice;
    uint256 public buyPrice;
    
    mapping(address => bool) private administrators;

    modifier onlyAdmin() {
        require(administrators[msg.sender], "User must be administrator to perform this operation");
        _;
    }

    modifier isValidAddress(address _address) {
        require(_address != address(0) && _address != address(this), "The provided address is not valid for an admin");
        _;
    } 

    constructor() {
        administratorsCount = 1;
        administrators[msg.sender] = true;
    }

    function isAContract() public pure returns (bool) {
        return true;
    }

    function isAdmin(address _admin) external view returns (bool) {
        return administrators[_admin];
    }

    function addAdmin(address _admin) external onlyAdmin isValidAddress(_admin) {
        require(!this.isAdmin(_admin), "Account is already an admin");
        administratorsCount += 1;
        administrators[_admin] = true;
    }

    function removeAdmin(address _admin) external onlyAdmin isValidAddress(_admin) {
        require(this.isAdmin(_admin), "Account is not an admin");
        require(administratorsCount > 1, "There must be at least one admin");
        administratorsCount -= 1;
        delete administrators[_admin];
    }

    function setSellPrice(uint256 _newSellPrice) external {
        require(_newSellPrice > 0, 'Sell price must be greater than 0');
        require(_newSellPrice > buyPrice, 'Sell price must be greater than buy price');
        sellPrice = _newSellPrice;
    }

    function setBuyPrice(uint256 _newBuyPrice) external {
        require(_newBuyPrice > 0, 'Buy price must be greater than 0');
        require(sellPrice > 0, 'Sell price must be set first');
        require(_newBuyPrice < sellPrice, 'Buy price must be lower than sell price');
        buyPrice = _newBuyPrice;
    }

    function sendToBurner(uint256 amount, address _burnerAddress) external isValidAddress(_burnerAddress) {
        uint256 halfAmount = _amount / 2;
        //payable(_burnerAddress).transfer(halfAmount * buyPrice);

        //Que la transacción falle si no hay ethers.
    }
}
