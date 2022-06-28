//SPDX-License-Identifier: Unlicense
pragma solidity 0.8.9;

import 'hardhat/console.sol';

contract TestContract {

    address private _vaultAddress;
    /**
     * @dev Contract constructor with Vault addresses
     */
    constructor(address _vaultContractAddress) {
        _vaultAddress = _vaultContractAddress;
    }

    function callToBurn(uint256 _amount) external {
        bytes memory  methodToCall = abi.encodeWithSignature('burn(uint256)', _amount);
        (bool _success, bytes memory _returnData) =_vaultAddress.call(methodToCall);
        require(_success, getRevertMessage(_returnData));
    }

    // extracted of https://ethereum.stackexchange.com/questions/83528/how-can-i-get-the-revert-reason-of-a-call-in-solidity-so-that-i-can-use-it-in-th
    function getRevertMessage(bytes memory _returnData) internal pure returns (string memory) {
        if (_returnData.length < 68) return 'Transaction reverted silently';

        assembly {
            _returnData := add(_returnData, 0x04)
        }
        return abi.decode(_returnData, (string));
    }

}