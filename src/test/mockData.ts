import type { UserNFT } from "@/types/nft";

export const mockUserNFTs: UserNFT[] = [
  {
    tokenId: "1",
    contractAddress: "0x1234567890123456789012345678901234567890" as `0x${string}`,
    tokenUri: "https://ipfs.io/ipfs/QmTest1",
    mintedAt: Date.now(),
  },
  {
    tokenId: "2",
    contractAddress: "0x1234567890123456789012345678901234567890" as `0x${string}`,
    tokenUri: "https://ipfs.io/ipfs/QmTest2",
    mintedAt: Date.now(),
  },
  {
    tokenId: "3",
    contractAddress: "0x1234567890123456789012345678901234567890" as `0x${string}`,
    tokenUri: "https://ipfs.io/ipfs/QmTest3",
    mintedAt: Date.now(),
  },
];