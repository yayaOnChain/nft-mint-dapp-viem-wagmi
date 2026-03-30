import type {
  AlchemyNFTResponse,
  AlchemyTransferResponse,
  BlockResponse,
  UserNFT,
} from "@/types";

interface AlchemyConfig {
  apiKey: string;
  network: string;
}

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

/**
 * Alchemy API service layer
 * Centralizes all Alchemy API calls for easy mocking in tests
 */
export class AlchemyApi {
  private baseUrl: string;
  private apiKey: string;

  constructor(config: AlchemyConfig) {
    this.baseUrl = `https://${config.network}.g.alchemy.com`;
    this.apiKey = config.apiKey;
  }

  /**
   * Get NFTs owned by an address
   */
  async getNFTs(params: GetNFTsParams): Promise<{
    nfts: UserNFT[];
    totalCount: number;
    pageKey?: string;
  }> {
    const { owner, contractAddress, pageSize = 100, pageKey } = params;

    const url = new URL(`${this.baseUrl}/nft/v2/${this.apiKey}/getNFTs`);
    url.searchParams.set("owner", owner);
    url.searchParams.set("pageSize", pageSize.toString());

    if (contractAddress) {
      url.searchParams.set("contractAddresses[]", contractAddress);
    }

    if (pageKey) {
      url.searchParams.set("pageKey", pageKey);
    }

    const response = await fetch(url.toString());

    if (!response.ok) {
      throw new Error(`Alchemy API error: ${response.status}`);
    }

    const data: AlchemyNFTResponse & { pageKey?: string } = await response.json();

    const nfts: UserNFT[] = data.ownedNfts.map((nft) => ({
      tokenId: nft.id.tokenId,
      contractAddress: nft.contract.address as `0x${string}`,
      tokenUri: nft.tokenUri?.gateway,
      mintedAt: Date.now(),
    }));

    return {
      nfts,
      totalCount: data.totalCount,
      pageKey: data.pageKey,
    };
  }

  /**
   * Get asset transfers (transaction history)
   */
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

    const requestBody = {
      jsonrpc: "2.0",
      id: 1,
      method: "alchemy_getAssetTransfers",
      params: [
        {
          fromBlock: "0x0",
          toAddress: address,
          contractAddresses: [contractAddress],
          category: ["erc721"] as const,
          withMetadata: true,
          maxCount: `0x${limit.toString(16)}`,
          ...(pageKey && { pageKey }),
        },
      ],
    };

    const response = await fetch(`${this.baseUrl}/v2/${this.apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody),
    });

    const data: AlchemyTransferResponse = await response.json();

    if (data.error) {
      throw new Error(data.error.message);
    }

    const transfers = data.result.transfers.map((tx) => {
      // Parse timestamp - can be ISO string or hex
      let timestamp = 0;
      if (tx.blockTimestamp) {
        // Try parsing as ISO string first
        const isoTime = Date.parse(tx.blockTimestamp);
        if (!isNaN(isoTime)) {
          timestamp = isoTime;
        } else if (tx.blockTimestamp.startsWith("0x")) {
          // If hex, convert to timestamp
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

  /**
   * Get block by number to fetch timestamp
   */
  async getBlockByNumber(blockNum: string): Promise<number> {
    const requestBody = {
      jsonrpc: "2.0",
      id: 1,
      method: "eth_getBlockByNumber",
      params: [blockNum, false],
    };

    const response = await fetch(`${this.baseUrl}/v2/${this.apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody),
    });

    const data: BlockResponse & { error?: { message: string } } =
      await response.json();

    if (data.error) {
      throw new Error(data.error.message);
    }

    return parseInt(data.result.timestamp, 16) * 1000;
  }
}

// Singleton instance with config from env
let alchemyApiInstance: AlchemyApi | null = null;

export const getAlchemyApi = (): AlchemyApi => {
  if (!alchemyApiInstance) {
    const apiKey = import.meta.env.VITE_ALCHEMY_API_KEY;
    const network = import.meta.env.VITE_ALCHEMY_NETWORK || "eth-sepolia";

    if (!apiKey) {
      throw new Error("Missing VITE_ALCHEMY_API_KEY environment variable");
    }

    alchemyApiInstance = new AlchemyApi({ apiKey, network });
  }

  return alchemyApiInstance;
};

// Export for testing purposes
export const setAlchemyApiInstance = (instance: AlchemyApi): void => {
  alchemyApiInstance = instance;
};

export const resetAlchemyApiInstance = (): void => {
  alchemyApiInstance = null;
};
