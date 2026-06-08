// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract Owned {
    address public owner;

    constructor() {
        owner = msg.sender;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "not owner");
        _;
    }
}

contract Pausable is Owned {
    bool public paused;

    modifier whenNotPaused() {
        require(!paused, "paused");
        _;
    }

    function pause() external onlyOwner {
        paused = true;
    }

    function unpause() external onlyOwner {
        paused = false;
    }
}

contract Faucet is Owned, Pausable {
    uint256 public constant WITHDRAW_AMOUNT = 0.01 ether; // max per withdrawal
    uint256 public constant COOLDOWN_BLOCKS = 20;

    mapping(address => bool) public whitelisted;
    mapping(address => uint256) public windowStart;
    mapping(address => uint256) public withdrawCount;

    receive() external payable {}

    function setWhitelisted(address user, bool status) external onlyOwner {
        whitelisted[user] = status;
    }

    function withdraw() external whenNotPaused {
        require(address(this).balance >= WITHDRAW_AMOUNT, "faucet empty");

        // whitelisted addresses get 2 withdrawals per window, others get 1
        uint256 limit = whitelisted[msg.sender] ? 2 : 1;

        if (block.number >= windowStart[msg.sender] + COOLDOWN_BLOCKS) {
            windowStart[msg.sender] = block.number;
            withdrawCount[msg.sender] = 1;
        } else {
            require(withdrawCount[msg.sender] < limit, "cooldown active");
            withdrawCount[msg.sender] += 1;
        }

        payable(msg.sender).transfer(WITHDRAW_AMOUNT);
    }
}
