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

// Faucet whose whitelist lives off-chain as a Merkle tree.
// Only the 32-byte root is stored on-chain; callers prove membership with a proof.
contract FaucetMerkle is Owned, Pausable {
    uint256 public constant WITHDRAW_AMOUNT = 0.01 ether; // max per withdrawal
    uint256 public constant COOLDOWN_BLOCKS = 20;

    bytes32 public merkleRoot;

    mapping(address => uint256) public windowStart;
    mapping(address => uint256) public withdrawCount;

    function setMerkleRoot(bytes32 root) external onlyOwner {
        merkleRoot = root;
    }

    receive() external payable {}

    // True if `account` is in the whitelist tree for the given proof.
    function isWhitelisted(address account, bytes32[] calldata proof) public view returns (bool) {
        return _verify(proof, keccak256(abi.encodePacked(account)));
    }

    // Non-whitelisted callers pass an empty proof and get 1 withdrawal per window.
    // Callers with a valid proof get 2 withdrawals per window.
    function withdraw(bytes32[] calldata proof) external whenNotPaused {
        require(address(this).balance >= WITHDRAW_AMOUNT, "faucet empty");

        bool whitelisted = _verify(proof, keccak256(abi.encodePacked(msg.sender)));
        uint256 limit = whitelisted ? 2 : 1;

        if (block.number >= windowStart[msg.sender] + COOLDOWN_BLOCKS) {
            windowStart[msg.sender] = block.number;
            withdrawCount[msg.sender] = 1;
        } else {
            require(withdrawCount[msg.sender] < limit, "cooldown active");
            withdrawCount[msg.sender] += 1;
        }

        payable(msg.sender).transfer(WITHDRAW_AMOUNT);
    }

    // Sorted-pair Merkle proof verification (compatible with merkletreejs sortPairs).
    function _verify(bytes32[] calldata proof, bytes32 leaf) internal view returns (bool) {
        bytes32 computed = leaf;
        for (uint256 i = 0; i < proof.length; i++) {
            bytes32 p = proof[i];
            computed = computed <= p
                ? keccak256(abi.encodePacked(computed, p))
                : keccak256(abi.encodePacked(p, computed));
        }
        return computed == merkleRoot;
    }
}
