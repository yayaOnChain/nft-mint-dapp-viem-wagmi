import type {
  AlchemyNFTResponse,
  AlchemyTransferResponse,
  BlockResponse,
  UserNFT,
} from "@/types";

interface GetNFTsParams {
  owner: string;
  contractAddress?: string;
  pageSize?: number;
  pageKey?: string;
}

interface GetAssetTransfersParams {
  address: string;
  contractAddress: string;
  limit: number;
  pageKey?: string;
}

const API_BASE = "/api/alchemy";

export class AlchemyApiClient {
  async getNFTs(params: GetNFTsParams): Promise<{
    nfts: UserNFT[];
    totalCount: number;
    pageKey?: string;
  }> {
    const { owner, contractAddress, pageSize = 100, pageKey } = params;

    const url = new URL(API_BASE, window.location.origin);
    url.searchParams.set("method", "alchemy_getNFTs");
    url.searchParams.set("params", JSON.stringify([
      {
        owner,
        contractAddresses: contractAddress ? [contractAddress] : [],
        pageSize,
        ...(pageKey && { pageKey }),
      }
    ]));

    const response = await fetch(url.toString());

    if (!response.ok) {
      throw new Error(`Alchemy API error: ${response.status}`);
    }

    const data = await response.json();

    if (data.error) {
      throw new Error(data.error.message || data.error);
    }

    const nfts: UserNFT[] = data.result.ownedNfts.map((nft: any) => ({
      tokenId: nft.id.tokenId,
      contractAddress: nft.contract.address as `0x${string}`,
      tokenUri: nft.tokenUri?.gateway,
      mintedAt: Date.now(),
    }));

    return {
      nfts,
      totalCount: data.result.totalCount,
      pageKey: data.result.pageKey,
    };
  }

  async getAssetTransfers(
    params: GetAssetTransfersParams,
  ): Promise<{
    transfers: Array<{
      tokenId: string;
      txHash: `0x${string}`;
      timestamp: number;
      blockNum: string;
      from: `0x${string}`;
      to: `0x${string}`;
      type: string;
    }>;
    pageKey?: string;
  }> {
    const { address, contractAddress, limit, pageKey } = params;

    const response = await fetch(API_BASE, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        method: "alchemy_getAssetTransfers",
        params: [
          {
            fromBlock: "0x0",
            toAddress: address,
            contractAddresses: [contractAddress],
            category: ["erc721"],
            withMetadata: true,
            maxCount: `0x${limit.toString(16)}`,
            ...(pageKey && { pageKey }),
          },
        ],
      }),
    });

    const data = await response.json();

    if (data.error) {
      throw new Error(data.error.message || data.error);
    }

    const transfers = data.result.transfers.map((tx: any) => {
      let timestamp = 0;
      if (tx.blockTimestamp) {
        const isoTime = Date.parse(tx.blockTimestamp);
        if (!isNaN(isoTime)) {
          timestamp = isoTime;
        } else if (tx.blockTimestamp.startsWith("0x")) {
          timestamp = parseInt(tx.blockTimestamp, 16) * 1000;
        }
      }

      return {
        tokenId: parseInt(tx.tokenId, 16).toString(),
        txHash: tx.hash as `0x${string}`,
        timestamp,
        blockNum: tx.blockNum,
        from: tx.from as `0x${string}`,
        to: tx.to as `0x${string}`,
        type: tx.type || "transfer",
      };
    });

    return {
      transfers,
      pageKey: data.result.pageKey,
    };
  }

  async getBlockByNumber(blockNum: string): Promise<number> {
    const response = await fetch(API_BASE, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        method: "eth_getBlockByNumber",
        params: [blockNum, false],
      }),
    });

    const data = await response.json();

    if (data.error) {
      throw new Error(data.error.message || data.error);
    }

    return parseInt(data.result.timestamp, 16) * 1000;
  }
}

let alchemyClientInstance: AlchemyApiClient | null = null;

export const getAlchemyClient = (): AlchemyApiClient => {
  if (!alchemyClientInstance) {
    alchemyClientInstance = new AlchemyApiClient();
  }
  return alchemyClientInstance;
};

export const setAlchemyClientInstance = (instance: AlchemyApiClient): void => {
  alchemyClientInstance = instance;
};

export const resetAlchemyClientInstance = (): void => {
  alchemyClientInstance = null;
};