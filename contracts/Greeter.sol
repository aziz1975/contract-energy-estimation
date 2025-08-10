// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

contract Greeter {
    string public greeting;

    event GreetingChanged(string newGreeting);

    constructor(string memory _greeting) {
        require(bytes(_greeting).length > 0, "Empty greeting");
        greeting = _greeting;
        emit GreetingChanged(_greeting);
    }

    function setGreeting(string memory _greeting) external {
        require(bytes(_greeting).length > 0, "Empty greeting");
        greeting = _greeting;
        emit GreetingChanged(_greeting);
    }
}
