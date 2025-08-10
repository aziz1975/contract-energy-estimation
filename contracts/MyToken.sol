// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

contract MyToken is Initializable, ERC20Upgradeable {
    /// @notice Initialize name, symbol, and mint initial supply to deployer
    function initialize(
      string memory name_, 
      string memory symbol_, 
      uint256 initialSupply_
    ) public initializer {
        __ERC20_init(name_, symbol_);
        _mint(msg.sender, initialSupply_);
    }

    /// @notice Mint new tokens
    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }

    /// @notice Burn tokens from an address
    function burn(address from, uint256 amount) external {
        _burn(from, amount);
    }
}
