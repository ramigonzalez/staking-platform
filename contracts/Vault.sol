//SPDX-License-Identifier: Unlicense
pragma solidity 0.8.9;

import 'hardhat/console.sol';

contract Vault {
    uint8 private constant decimal = 18;

    uint256 public administratorsCount;

    /**
     * Can be changed to [external] to optimize GAS USED
     */
    uint256 public sellPrice;
    uint256 public buyPrice;

    mapping(address => bool) private administrators;

    /**
     * @dev percentage defined by administrators up to 50% for gains withdraw
     * Percentage is set to 10% by default.
     */
    uint256 public percentageToWithdraw = 10;

    /**
     * @dev maximum amount of ethers for withdraw per admin
     */
    uint256 public maxWithdraw;

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
    RequestWithdrawDetails public _requestWithdrawDetails;

    modifier onlyAdmin() {
        require(administrators[msg.sender], 'User must be administrator to perform this operation');
        _;
    }

    modifier isValidAddress(address _address) {
        require(_address != address(0) && _address != address(this), 'The provided address is not valid for an admin');
        _;
    }

    constructor() payable {
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
        delete withdrawals[_admin]; // To return GAS
    }

    function setSellPrice(uint256 _newSellPrice) external onlyAdmin {
        require(_newSellPrice > 0, 'Sell price must be greater than 0');
        require(_newSellPrice > buyPrice, 'Sell price must be greater than buy price');
        sellPrice = _newSellPrice;
    }

    function setBuyPrice(uint256 _newBuyPrice) external onlyAdmin {
        require(_newBuyPrice > 0, 'Buy price must be greater than 0');
        require(sellPrice > 0, 'Sell price must be set first');
        require(_newBuyPrice < sellPrice, 'Buy price must be lower than sell price');
        buyPrice = _newBuyPrice;
    }

    /**
     * @dev This method is used to set the maximum percentage that could be withdrawn by a group of administrators
     * @param _maxPercentage must be an unsigned int between 0 and 50
     */
    function setMaxPercentage(uint8 _maxPercentage) external onlyAdmin {
        require(_maxPercentage <= 50, 'Withdraw percentage must be lower or equals than 50%');
        require(_maxPercentage > 0, 'Withdraw percentage must be greater than 0%');

        percentageToWithdraw = _maxPercentage;
    }

    /**
     * @dev An amount of ETH is requested to be withdrawn by the actual amount of administrators.
     * @ prerequisits:
     * 1. No previous request withdraws may exists.
     * 2. Number of administrators must be 2 or more.
     * 3. The amount must be less or equals than the percentage to withdrawn set of the current contract ETH balance.
     * 4. The contract ETH balance must be greater or equals than the amount requested.
     */
    function requestWithdraw(uint256 _amount) external onlyAdmin {
        // console.log('_amount', _amount);

        require(!_requestWithdrawDetails.initialized, 'Already exists a pending withdraw request');
        require(administratorsCount >= 2, 'Cannot initiate a request withdraw with less than 2 administrators');

        uint256 _amountToWithdraw = toDecimals(_amount);
        // console.log('_amountToWithdraw', _amountToWithdraw);

        uint256 _contractBalance = address(this).balance;
        // console.log('_contractBalance', _contractBalance);

        // console.log('percentageToWithdraw', percentageToWithdraw, '%');
        require(checkMaximumAmountToWithdraw(_amountToWithdraw), 'Amount exceeds maximum percentage');

        require(_contractBalance >= _amountToWithdraw, 'There are insufficient funds to withdraw');

        uint256 _amountPerAdmin = _amountToWithdraw / administratorsCount;
        // console.log('_amountPerAdmin', _amountPerAdmin);

        _requestWithdrawDetails.initialized = true;
        _requestWithdrawDetails.amountPerAdmin = _amountPerAdmin;
        _requestWithdrawDetails.requestAddress = msg.sender;
    }

    /**
     * @dev this method validates if the amount requested to withdraw is less or equals than
     * the contract balance * maximumPercentage allowed.
     *
     * Example:
     * - contract balance: 100 ETH
     * - maximum percentage: 10%
     * - administratorsCounts: 2
     * @param _requestedAmount cannot be greater than 10 ETH (maxWithdraw [5] * administratorsCounts [2])
     *
     * note: if administrators are added/removed, the algorithm will be restrictive in terms of allowance.
     * This means that the maximum amount to withdraw will be favorable to the contract:
     *
     * 1. requestWithdraw(10) => maxAmountToWithdraw = 10 ETH.
     * 2. apporveWithdraw()
     * 3. addAdministrator(admin_1) => administratorsCounts: 3
     * 4. requestWithdraw(9) => maxAmountToWithdraw = 8.5 ETH
     *      => (contractBalance [100] - (maxWithdraw [5] * administratorsCounts [3])) * 10% = 8.5 ETH
     */
    function checkMaximumAmountToWithdraw(uint256 _requestedAmount) public view returns (bool) {
        uint256 _allowedBalance = address(this).balance - (maxWithdraw * administratorsCount);
        // console.log('_allowedBalance', _allowedBalance);

        uint256 _maximumAmountToWithdraw = (_allowedBalance * percentageToWithdraw) / 100;

        // console.log('_maximumAmountToWithdraw', _maximumAmountToWithdraw);

        return _requestedAmount <= _maximumAmountToWithdraw;
    }

    function approveWithdraw() external onlyAdmin {
        require(_requestWithdrawDetails.initialized, 'There is no pending withdraw request for approve');
        require(administratorsCount >= 2, 'Cannot approve a withdraw with less than 2 administrators');
        require(msg.sender != _requestWithdrawDetails.requestAddress, 'Approval administrator must be different from admin who requested it');

        maxWithdraw += _requestWithdrawDetails.amountPerAdmin;

        this.clearRequestWithdrawDetails();
    }

    function rejectWithdraw() external onlyAdmin {
        require(_requestWithdrawDetails.initialized, 'There is no pending withdraw request for reject');
        require(msg.sender != _requestWithdrawDetails.requestAddress, 'Rejector administrator must be different from admin who requested it');

        this.clearRequestWithdrawDetails();
    }

    /**
     * @dev Reset struct informaton.
     * THIS WONT NEVER RELEASE MEMORY SLOT
     */
    function clearRequestWithdrawDetails() external {
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
        withdrawals[msg.sender] += withdrawAmount;
    }

    function withdrawnAmount() external view onlyAdmin returns (uint256) {
        return withdrawals[msg.sender];
    }

    function toDecimals(uint256 _number) public pure returns (uint256) {
        return _number * 10**decimal;
    }
}
