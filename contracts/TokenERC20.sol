pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "hardhat/console.sol";

contract TokenERC20 is ERC20 {
    event Deposit(
        address indexed _from,
        address indexed _contractAddress,
        string _value
    );

    constructor(uint256 initialBalance) ERC20("Token", "TKN") {
        _mint(msg.sender, initialBalance);
    }

    function isAContract() public pure returns (bool) {
        require(false, "un texto");
        return false;
    }

    function isAContractWithEmit() public returns (bool) {
        console.log(address(this));
        emit Deposit(msg.sender, address(this), "hola");
        return false;
    }

    
}
