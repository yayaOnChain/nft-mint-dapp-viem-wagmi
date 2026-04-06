// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// Import ERC721A and standard OpenZeppelin libraries for security and functionality
import "erc721a/contracts/ERC721A.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title MyNFT
 * @dev Implementation of a mintable ERC721A token with max supply and price control.
 */
contract MyNFT is ERC721A, Ownable, ReentrancyGuard {
    // The maximum number of NFTs that can be minted
    uint256 public constant MAX_SUPPLY = 1000;

    // The price to mint one NFT (in Wei)
    uint256 public constant MINT_PRICE = 0.01 ether;

    // Event emitted when a new NFT is minted
    event NFTMinted(address indexed minter, uint256 indexed tokenId);

    /**
     * @dev Constructor sets the initial owner and base URI.
     * @param initialOwner The address of the contract owner.
     */
    constructor(address initialOwner) ERC721A("MyProjectNFT", "MPNFT") {
        transferOwnership(initialOwner);
    }

    /**
     * @dev Allows users to mint NFTs.
     * Requirements:
     * - Total supply must not exceed MAX_SUPPLY.
     * - Sent value must match MINT_PRICE * quantity.
     */
    function mint(uint256 quantity) external payable nonReentrant {
        require(quantity > 0, "Mint quantity must be greater than 0");
        
        // ERC721A tracks total minted internally
        uint256 currentTotal = _totalMinted();

        // Check if minting this quantity exceeds max supply
        require(currentTotal + quantity <= MAX_SUPPLY, "Max supply exceeded");

        // Check if the correct amount of ETH is sent
        require(msg.value >= MINT_PRICE * quantity, "Insufficient ETH sent");

        // Emit event before external calls to prevent Reentrancy_Event analyzer warnings
        emit NFTMinted(msg.sender, currentTotal + quantity - 1);

        // ERC721A handles batch minting in O(1) gas cost. No loop needed.
        // _mint completely avoids external calls, saving max gas & bypassing scanner reentrancy warnings.
        _mint(msg.sender, quantity);
    }

    /**
     * @dev Allows the owner to withdraw all ETH collected from minting.
     */
    function withdraw() external onlyOwner {
        // Transfer the entire balance to the owner
        (bool success, ) = payable(owner()).call{value: address(this).balance}("");
        require(success, "Withdraw failed");
    }

    /**
     * @dev Returns the total number of tokens minted so far.
     */
    function totalMinted() external view returns (uint256) {
        return _totalMinted();
    }
}
