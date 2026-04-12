// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// Combines O(1) gas efficiency of ERC721A with the flexibility of IPFS Metadata
import "erc721a/contracts/ERC721A.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title MyNFT
 * @dev Implementation of a mintable ERC721A token with max supply, price control, and IPFS metadata support.
 */
contract MyNFT is ERC721A, Ownable, ReentrancyGuard {
    // The maximum number of NFTs that can be minted
    uint256 public constant MAX_SUPPLY = 1000;

    // The price to mint one NFT (in Wei)
    uint256 public constant MINT_PRICE = 0.01 ether;
    
    // Base URI for token metadata (e.g., IPFS gateway URL)
    string private _baseTokenURI;
    
    // Mapping for individual token URIs (replaces OpenZeppelin's ERC721URIStorage)
    mapping(uint256 => string) private _tokenURIs;

    // Event emitted when a new NFT is minted
    event NFTMinted(address indexed minter, uint256 indexed tokenId, string tokenURI);
    
    // Event emitted when base URI is updated
    event BaseURIUpdated(string newBaseURI);

    /**
     * @dev Constructor sets the initial owner and base URI.
     */
    constructor(address initialOwner, string memory initialBaseURI) 
        ERC721A("MyProjectNFT", "MPNFT") 
    {
        transferOwnership(initialOwner);
        _baseTokenURI = initialBaseURI;
    }

    /**
     * @dev Allows users to mint NFTs.
     */
    function mint(uint256 quantity) external payable nonReentrant {
        require(quantity > 0, "Mint quantity must be greater than 0");
        
        uint256 currentTotal = _totalMinted();

        // Check if minting this quantity exceeds max supply
        require(currentTotal + quantity <= MAX_SUPPLY, "Max supply exceeded");

        // Check if the correct amount of ETH is sent
        require(msg.value >= MINT_PRICE * quantity, "Insufficient ETH sent");

        // O(1) BATCH MINTING USING ERC721A: ONLY 1 STATE UPDATE (HIGHLY GAS EFFICIENT!)
        _mint(msg.sender, quantity);

        // This loop is now ONLY used to emit Event logs for the frontend
        // Gas for emitting Events is exponentially cheaper than State Modifications.
        for (uint256 i = 0; i < quantity; ) {
            uint256 tokenId = currentTotal + i;
            emit NFTMinted(msg.sender, tokenId, tokenURI(tokenId));
            
            // Unchecked ++i saves extra gas at the Opcode level
            unchecked { ++i; }
        }
    }

    /**
     * @dev Allows the owner to withdraw all ETH collected from minting.
     */
    function withdraw() external onlyOwner {
        (bool success, ) = payable(owner()).call{value: address(this).balance}("");
        require(success, "Withdraw failed");
    }

    /**
     * @dev Returns the total number of tokens minted so far.
     */
    function totalMinted() external view returns (uint256) {
        return _totalMinted();
    }
    
    /**
     * @dev Sets the base URI for all token IDs.
     */
    function setBaseURI(string memory baseURI) external onlyOwner {
        _baseTokenURI = baseURI;
        emit BaseURIUpdated(baseURI);
    }
    
    /**
     * @dev Sets the token URI for a specific token ID (Individual IPFS Mapping).
     */
    function setTokenURI(uint256 tokenId, string memory _tokenURI) external onlyOwner {
        require(_exists(tokenId), "Token does not exist");
        _tokenURIs[tokenId] = _tokenURI;
    }
    
    function baseTokenURI() external view returns (string memory) {
        return _baseTokenURI;
    }

    function _baseURI() internal view override returns (string memory) {
        return _baseTokenURI;
    }
    
    /**
     * @dev Combines the Contract's Base URI with the Token's Specific URI
     */
    function tokenURI(uint256 tokenId) public view virtual override returns (string memory) {
        require(_exists(tokenId), "URI query for nonexistent token");

        string memory _tokenURI = _tokenURIs[tokenId];
        string memory base = _baseURI();

        // If there is no Base URI, return the Specific URI directly
        if (bytes(base).length == 0) {
            return _tokenURI;
        }
        
        // If both are present, concatenate: Base_URI + Specific_URI
        if (bytes(_tokenURI).length > 0) {
            return string(abi.encodePacked(base, _tokenURI));
        }
        
        // If there is a Base_URI but NO Specific_URI, concatenate: Base_URI + token_id
        return string(abi.encodePacked(base, _toString(tokenId)));
    }
}
