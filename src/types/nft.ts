/**
 * Represents a minted NFT owned by the user
 */
export interface UserNFT {
  tokenId: string;
  contractAddress: `0x${string}`;
  tokenUri?: string;
  mintedAt?: number; // Timestamp when minted
  transactionHash?: `0x${string}`;
}

/**
 * Response from Alchemy NFT API
 */
export interface AlchemyNFTResponse {
  ownedNfts: Array<{
    contract: { address: string };
    id: { tokenId: string };
    tokenUri?: { gateway?: string };
  }>;
  totalCount: number;
  blockHash?: string;
}

/**
 * Transaction history item for UI display
 */
export interface TransactionHistoryItem {
  tokenId: string;
  txHash: `0x${string}`;
  timestamp: number;
  blockNum: string;
  status: "success" | "pending" | "failed";
  action: "mint" | "transfer" | "burn";
}
