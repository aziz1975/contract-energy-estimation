// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

contract Proxy {
    // address of the current implementation
    address public implementation;

    constructor(address _impl, bytes memory _initData) payable {
        implementation = _impl;
        if(_initData.length > 0) {
            (bool ok, ) = _impl.delegatecall(_initData);
            require(ok, "Initialization failed");
        }
    }

    fallback() external payable {
        address impl = implementation;
        assembly {
            calldatacopy(0, 0, calldatasize())
            let result := delegatecall(gas(), impl, 0, calldatasize(), 0, 0)
            returndatacopy(0, 0, returndatasize())
            switch result
            case 0 { revert(0, returndatasize()) }
            default { return(0, returndatasize()) }
        }
    }

    receive() external payable {}
}
