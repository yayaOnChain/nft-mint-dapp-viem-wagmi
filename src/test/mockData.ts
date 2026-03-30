import type { UserNFT, TransactionHistoryItem } from '@/types';

export const mockUserNFTs: UserNFT[] = [
  {
    tokenId: '1',
    contractAddress: '0x1234567890123456789012345678901234567890',
    tokenUri: 'https://ipfs.io/ipfs/QmTest1',
    mintedAt: Date.now(),
  },
  {
    tokenId: '2',
    contractAddress: '0x1234567890123456789012345678901234567890',
    tokenUri: 'https://ipfs.io/ipfs/QmTest2',
    mintedAt: Date.now(),
  },
  {
    tokenId: '3',
    contractAddress: '0x1234567890123456789012345678901234567890',
    tokenUri: 'https://ipfs.io/ipfs/QmTest3',
    mintedAt: Date.now(),
  },
];

export const mockTransactions: TransactionHistoryItem[] = [
  {
    tokenId: '1',
    txHash: '0xabc123def456789012345678901234567890123456789012345678901234abcd',
    timestamp: Date.now() - 1000000,
    blockNum: '0x123456',
    status: 'success',
    action: 'mint',
    from: '0x0000000000000000000000000000000000000000',
    to: '0xUserAddress123456789012345678901234567890',
  },
  {
    tokenId: '2',
    txHash: '0xdef456789012345678901234567890123456789012345678901234567890abcd',
    timestamp: Date.now() - 2000000,
    blockNum: '0x123457',
    status: 'success',
    action: 'mint',
    from: '0x0000000000000000000000000000000000000000',
    to: '0xUserAddress123456789012345678901234567890',
  },
];

export const mockNFTMetadata = {
  name: 'Test NFT #1',
  description: 'A test NFT for unit testing',
  image: 'https://ipfs.io/ipfs/QmTestImage1',
  attributes: [
    { trait_type: 'Background', value: 'Blue' },
    { trait_type: 'Rarity', value: 'Common' },
  ],
};

export const mockAlchemyNFTResponse = {
  ownedNfts: mockUserNFTs.map((nft) => ({
    contract: { address: nft.contractAddress },
    id: { tokenId: nft.tokenId },
    tokenUri: { gateway: nft.tokenUri },
  })),
  totalCount: mockUserNFTs.length,
};

export const mockAlchemyTransferResponse = {
  result: {
    transfers: mockTransactions.map((tx) => ({
      tokenId: tx.tokenId,
      hash: tx.txHash,
      blockTimestamp: new Date(tx.timestamp).toISOString(),
      blockNum: tx.blockNum,
      from: tx.from,
      to: tx.to,
      type: tx.action,
    })),
  },
};

export const mockBlockResponse = {
  result: {
    timestamp: '0x12345678',
  },
};
