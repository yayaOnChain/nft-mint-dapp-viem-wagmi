// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// Import standard OpenZeppelin ERC721 with URI storage support
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title MyNFT
 * @dev Implementation of a mintable ERC721 token with max supply, price control, and IPFS metadata support.
 * Uses ERC721URIStorage for flexible per-token metadata management.
 */
contract MyNFT is ERC721URIStorage, Ownable, ReentrancyGuard {
    // The maximum number of NFTs that can be minted
    uint256 public constant MAX_SUPPLY = 1000;

    // The price to mint one NFT (in Wei)
    uint256 public constant MINT_PRICE = 0.01 ether;
    
    // Base URI for token metadata (e.g., IPFS gateway URL)
    string private _baseTokenURI;
    
    // Counter for total minted tokens
    uint256 private _totalMintedCounter;

    // Event emitted when a new NFT is minted
    event NFTMinted(address indexed minter, uint256 indexed tokenId, string tokenURI);
    
    // Event emitted when base URI is updated
    event BaseURIUpdated(string newBaseURI);

    /**
     * @dev Constructor sets the initial owner and base URI.
     * @param initialOwner The address of the contract owner.
     * @param initialBaseURI The initial base URI for token metadata (e.g., IPFS gateway URL).
     */
    constructor(address initialOwner, string memory initialBaseURI) 
        ERC721("MyProjectNFT", "MPNFT") 
    {
        transferOwnership(initialOwner);
        _baseTokenURI = initialBaseURI;
        _totalMintedCounter = 0;
    }

    /**
     * @dev Allows users to mint NFTs.
     * Requirements:
     * - Total supply must not exceed MAX_SUPPLY.
     * - Sent value must match MINT_PRICE * quantity.
     */
    function mint(uint256 quantity) external payable nonReentrant {
        require(quantity > 0, "Mint quantity must be greater than 0");
        
        uint256 currentTotal = _totalMintedCounter;

        // Check if minting this quantity exceeds max supply
        require(currentTotal + quantity <= MAX_SUPPLY, "Max supply exceeded");

        // Check if the correct amount of ETH is sent
        require(msg.value >= MINT_PRICE * quantity, "Insufficient ETH sent");

        // Mint NFTs and set token URIs
        for (uint256 i = 0; i < quantity; i++) {
            _totalMintedCounter++;
            uint256 tokenId = _totalMintedCounter;
            _safeMint(msg.sender, tokenId);
            emit NFTMinted(msg.sender, tokenId, tokenURI(tokenId));
        }
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
        return _totalMintedCounter;
    }
    
    /**
     * @dev Sets the base URI for all token IDs.
     * @param baseURI The new base URI.
     */
    function setBaseURI(string memory baseURI) external onlyOwner {
        _baseTokenURI = baseURI;
        emit BaseURIUpdated(baseURI);
    }
    
    /**
     * @dev Sets the token URI for a specific token ID.
     * @param tokenId The token ID to update.
     * @param tokenURI The new token URI (e.g., IPFS URL).
     */
    function setTokenURI(uint256 tokenId, string memory tokenURI) external onlyOwner {
        require(_exists(tokenId), "Token does not exist");
        _setTokenURI(tokenId, tokenURI);
    }
    
    /**
     * @dev Returns the base URI for token metadata.
     */
    function baseTokenURI() external view returns (string memory) {
        return _baseTokenURI;
    }

    /**
     * @dev Override baseURI to use custom storage.
     */
    function _baseURI() internal view override returns (string memory) {
        return _baseTokenURI;
    }
    
    /**
     * @dev Returns whether the token exists.
     */
    function _exists(uint256 tokenId) internal view override returns (bool) {
        return _ownerOf(tokenId) != address(0);
    }
}
