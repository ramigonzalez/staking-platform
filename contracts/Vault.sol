//SPDX-License-Identifier: Unlicense
pragma solidity 0.8.9;

import 'hardhat/console.sol';

contract Vault {
    uint256 private administratorsCount;
    mapping(address => bool) private administrators;

    /**
     * @dev percentage defined by administrators up to 50% for gains withdraw
     */
    uint256 private pecentageToWithdraw;

    /**
     * @dev maximum amount of ethers for withdraw per admin
     */
    uint256 private maxWithdraw;

    /**
     * @dev amount of ethers withdrwan by admin
     */
    mapping(address => uint256) private withdrawals;

    /**
     * @dev structure to represent request withdraw details.
     * [initialized]: is used represent if the structure is being use or not
     */
    struct RequestWithdrawDetails {
        uint256 amountPerAdmin;
        address requestAddress; // Address who request withdraw
        bool initialized;
    }

    /**
     * @dev structure to hold request withdraw details.
     */
    RequestWithdrawDetails _requestWithdrawDetails;

    modifier onlyAdmin() {
        require(administrators[msg.sender], 'User must be administrator to perform this operation');
        _;
    }

    modifier isValidAddress(address _address) {
        require(_address != address(0) && _address != address(this), 'The provided address is not valid for an admin');
        _;
    }

    constructor() {
        administratorsCount = 1;
        administrators[msg.sender] = true;
    }

    function isAdmin(address _admin) external view returns (bool) {
        return administrators[_admin];
    }

    function addAdmin(address _admin) external onlyAdmin isValidAddress(_admin) {
        require(!this.isAdmin(_admin), 'Account is already an admin');
        administratorsCount += 1;
        administrators[_admin] = true;
        withdrawals[_admin] = maxWithdraw; // This line does not allow an administrator to withdraw more ethers that what was expected
    }

    function removeAdmin(address _admin) external onlyAdmin isValidAddress(_admin) {
        require(this.isAdmin(_admin), 'Account is not an admin');
        require(administratorsCount > 1, 'There must be at least one admin');
        administratorsCount -= 1;
        delete administrators[_admin];
    }

    function setMaxPercentage(uint8 _maxPercentage) external onlyAdmin {
        require(_maxPercentage <= 50, 'Withdraw percentage must be lower or equals than 50%');
        pecentageToWithdraw = _maxPercentage;
    }

    function requestWithdraw(uint256 _amount) external onlyAdmin {
        require(_requestWithdrawDetails.initialized == false, 'Already exists a pending withdraw request');

        uint256 _amountToWithdraw = _amount * pecentageToWithdraw;

        require(address(this).balance > _amountToWithdraw, 'There are insufficient funds to withdraw');

        _requestWithdrawDetails.initialized == true;
        _requestWithdrawDetails.amountPerAdmin = _amountToWithdraw;
        _requestWithdrawDetails.requestAddress = msg.sender;
    }

    function approveWithdraw() external onlyAdmin {
        require(_requestWithdrawDetails.initialized == true, 'There is no pending withdraw request for approve');
        require(msg.sender != _requestWithdrawDetails.requestAddress, 'Approval administrator must be different from admin who requested it');
      
        maxWithdraw += _requestWithdrawDetails.amountPerAdmin;

        this.clearRequestWithdrawDetails();
    }

    function rejectWithdraw() external onlyAdmin {
        require(_requestWithdrawDetails.initialized == true, 'There is no pending withdraw request for reject');
        require(msg.sender != _requestWithdrawDetails.requestAddress, 'Rejector administrator must be different from admin who requested it');
        
        this.clearRequestWithdrawDetails();
    }

    /**
     * @dev Reset struct informaton. 
     * THIS WONT NEVER RELEASE MEMORY SLOT 
     */
    function clearRequestWithdrawDetails() public {
        _requestWithdrawDetails.initialized = false;
        _requestWithdrawDetails.amountPerAdmin = 0;
        _requestWithdrawDetails.requestAddress = address(0);
    }

    /**
     * @dev The withdraw is the difference between (maxWithdraw) and (withdrawals[msg.sender]).
     * Amount already withdrawn is hold in withdrawals[] array. 
     * This structure is initialized whenever an admin is added with (maxWithdraw) value.
     */
    function withdraw() external onlyAdmin {
        uint256 withdrawAmount = maxWithdraw - withdrawals[msg.sender];
        payable(msg.sender).transfer(withdrawAmount);
    }
}
