//SPDX-License-Identifier: Unlicense
pragma solidity 0.8.9;

import 'hardhat/console.sol';

contract TokenContract {
    string constant name = 'Niery token papa'; 
    string constant symbol = 'NTP';
    uint256 constant decimals = 18;
    uint256 public totalSupply; //puede ser external pero hay que ver como se llama a una propiedad o metodo extenal desde otro contrato.

    mapping(address => uint256) public balances;

    constructor() {
        totalSupply = 10000000;
    }

    function balanceOf(address _owner) external view returns (uint256) {
        return balances[_owner];
    }

    /**
     * @param _to address that will receive tokens
     * @param _value amount of tokens to transfer
     * @return true if the amount was trafsfered correctly
     */
    function transfer(address _to, uint256 _value) external returns (bool) {
        require(_to != address(0), "Receiver cannot be address(0)");
        require(_value > 0, "Amount must be positive");
        require(
            balances[msg.sender] >= _value,
            "Sender has insufficient tokens to transfer"
        );
        balances[msg.sender] -= _value;
        balances[_to] += _value;
        return true;
    }

    function transferFrom(
        address _from,
        address _to,
        uint256 _value
    ) external returns (bool) {}

    /**
    function approve(address _spender, uint256 _value) returns (bool) {}
    function allowance(address _owner, address _spender) returns (uint256) {}
    */
}
