//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "hardhat/console.sol";

contract Vault {
    uint256 private administratorsCount;
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
}
