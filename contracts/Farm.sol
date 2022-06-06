//SPDX-License-Identifier: Unlicense
pragma solidity 0.8.9;

import 'hardhat/console.sol';
import './Interfaces/ERC20Interface.sol';

contract Farm {
    uint8 private _currentAPR = 20;

    /**
     * @dev Account Stakes
     */
    mapping(address => uint256) _accounts;
    AccountStake[] stakes;
    struct AccountStake {
        uint256 staked;
        uint256 lastChangeTimestamp;
        uint256 yieldStored;
    }

    /**
     * @dev information about all Farm
     */
    uint256 private _totalStake = 0;
    uint256 private _totalYieldPaid = 0;

    // Inmutables
    uint256 private constant milisecondsPerYear = 60 * 60 * 24 * 365;
    address private _tokenAddress;
    address private _vaultAddress;
    ERC20Interface private _tokenContract;

    event Stake(address indexed _address, uint256 _value);
    event Unstake(address indexed _address, uint256 _value);
    event WithdrawYield(address indexed _address, uint256 _value);

    /**
     * @dev Contract constructor with both TokenContract and Vault addresses
     */
    constructor(address _tokenContractAddress, address _vaultContractAddress) {
        // TODO: Ask david if we have to set it like this or we can add a setter
        _tokenAddress = _tokenContractAddress;
        _tokenContract = ERC20Interface(_tokenContractAddress);
        _vaultAddress = _vaultContractAddress;

        stakes.push();
    }

    function stake(uint256 _amount) external {
        require(_amount > 0, 'Cannot stake nothing');
        // In token contract must exists a record that indicates that Farm.sol (contract) is allowed to spend certain value (_amount) on user's (msg.sender) behalf.
        require(_tokenContract.allowance(msg.sender, address(this)) > _amount, 'Insufficient allowance');
        require(_tokenContract.balanceOf(msg.sender) > _amount, 'Insufficient balance');

        // Move address's tokens to Farm's balance
        _tokenContract.transferFrom(msg.sender, address(this), _amount);
        _totalStake += _amount;

        // Get or create sender staking info
        AccountStake memory stakeData;
        uint256 stakeIndex;
        if (_accounts[msg.sender] == 0) {
            stakeData = AccountStake(0, 0 ,0);
            stakes.push(stakeData);
            stakeIndex = stakes.length - 1;
            _accounts[msg.sender] = stakeIndex;
        } else {
            stakeIndex = _accounts[msg.sender];
            stakeData = stakes[stakeIndex];

            // Update generated yields
            uint256 stakeYield = getYield(stakeData.staked, stakeData.lastChangeTimestamp);
            stakeData.yieldStored += stakeYield;
        }

        // Update amount, and timestamp
        stakeData.staked += _amount;
        stakeData.lastChangeTimestamp = block.timestamp;
        stakes[stakeIndex] = stakeData;
        emit Stake(address(msg.sender), _amount);
    }

    function unstake(uint256 _amount) external {
        require(_accounts[msg.sender] != 0, "Account doesn't have any deposit");
        require(_amount > 0, 'Cannot unstake nothing');
        require(stakes[_accounts[msg.sender]].staked >= _amount, 'Cannot unstake more than the staked amount');
        require(_tokenContract.balanceOf(address(this)) >= _amount, 'Insufficient liquidity');

        // Get address staking info
        AccountStake memory stakeData = stakes[_accounts[msg.sender]];

        // Calculate generated yield
        uint256 stakeYield = getYield(stakeData.staked, stakeData.lastChangeTimestamp);

        // Update account staking info
        stakeData.staked -= _amount;
        stakeData.yieldStored += stakeYield;
        stakeData.lastChangeTimestamp = block.timestamp;
        stakes[_accounts[msg.sender]] = stakeData;
        _totalStake -= _amount;

        // Send tokens to address
        _tokenContract.transfer(msg.sender, _amount);
        emit Unstake(address(msg.sender), _amount);
    }

    function withdrawYield() external {
        require(_accounts[msg.sender] != 0, "Account doesn't have any deposit");

        // Get address staking info
        AccountStake memory stakeData = stakes[_accounts[msg.sender]];

        // Calculate generated yield
        uint256 stakeYield = getYield(stakeData.staked, stakeData.lastChangeTimestamp);
        uint256 yield = stakeYield + stakeData.yieldStored;

        // Check for Farm liquidity
        require(_tokenContract.balanceOf(address(this)) >= yield, 'Insufficient liquidity');

        // Update account staking info
        stakeData.yieldStored = 0;
        stakeData.lastChangeTimestamp = block.timestamp;
        stakes[_accounts[msg.sender]] = stakeData;
        _totalYieldPaid += yield;

        // Send yield to address
        _tokenContract.transfer(msg.sender, yield);
        emit WithdrawYield(msg.sender, yield);
    }

    function getYield() external view returns (uint256) {
        if (_accounts[msg.sender] == 0) {
            return 0;
        }
        // Get address staking info
        AccountStake memory stakeData = stakes[_accounts[msg.sender]];

        // Calculate generated yield
        uint256 stakeYield = getYield(stakeData.staked, stakeData.lastChangeTimestamp);
        uint256 yield = stakeYield + stakeData.yieldStored;

        return yield;
    }

    function getStake() external view returns (uint256) {
        AccountStake memory accountStake = stakes[_accounts[msg.sender]];
        return accountStake.staked;
    }

    function getTotalStake() external view returns (uint256) {
        return _totalStake;
    }

    function getTotalYieldPaid() external view returns (uint256) {
        return _totalYieldPaid;
    }

    function getAPR() external view returns (uint256) {
        return _currentAPR;
    }

    function getYield(uint256 _staked, uint256 _lastChange) private view returns (uint256) {
        uint256 interest = (_currentAPR * (block.timestamp - _lastChange) * 10**5) / milisecondsPerYear;
        return (_staked * interest) / (100 * 10**5);
    }
}
