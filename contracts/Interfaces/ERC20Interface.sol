//SPDX-License-Identifier: Unlicense
pragma solidity 0.8.9;

interface ERC20Interface {

    function decimals() external pure returns (uint8);
    function balanceOf(address _owner) external view returns (uint256);
    function transfer(address _to, uint256 _value) external returns (bool);
    function transferFrom(address _from, address _to, uint256 _value) external returns (bool);
    function approve(address _spender, uint256 _value) external returns (bool);
    function allowance(address _owner, address _spender) external view returns (uint256);
    function burn(uint256 _amount, address _burner) external returns (bool);
    function mint(uint256 _amount) external;
}