// SPDX-License-Identifier: MIT
// Compatible with OpenZeppelin Contracts ^4.9.0
pragma solidity ^0.8.20;

// Import standard OpenZeppelin libraries for security and functionality
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title MyNFT
 * @dev Implementation of a mintable ERC721 token with max supply and price control.
 */
contract MyNFT is ERC721, Ownable, ReentrancyGuard {
    // The maximum number of NFTs that can be minted
    uint256 public constant MAX_SUPPLY = 1000;
    
    // The price to mint one NFT (in Wei)
    uint256 public constant MINT_PRICE = 0.01 ether;
    
    // Counter to track the total number of minted tokens
    uint256 private _totalMinted;

    // Event emitted when a new NFT is minted
    event NFTMinted(address indexed minter, uint256 indexed tokenId);

    /**
     * @dev Constructor sets the initial owner and base URI.
     * @param initialOwner The address of the contract owner.
     */
    constructor(address initialOwner) ERC721("MyProjectNFT", "MPNFT") {
        transferOwnership(initialOwner);
        _totalMinted = 0;
    }

    /**
     * @dev Allows users to mint NFTs.
     * Requirements:
     * - Total supply must not exceed MAX_SUPPLY.
     * - Sent value must match MINT_PRICE * quantity.
     */
    function mint(uint256 quantity) external payable nonReentrant {
        // Check if minting this quantity exceeds max supply
        require(_totalMinted + quantity <= MAX_SUPPLY, "Max supply exceeded");
        
        // Check if the correct amount of ETH is sent
        require(msg.value >= MINT_PRICE * quantity, "Insufficient ETH sent");

        // Loop to mint each token individually
        for (uint256 i = 0; i < quantity; i++) {
            // SafeMint is preferred over mint to prevent locking tokens in contracts
            _safeMint(msg.sender, _totalMinted);
            _totalMinted++;
        }

        emit NFTMinted(msg.sender, _totalMinted - 1);
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
        return _totalMinted;
    }
}