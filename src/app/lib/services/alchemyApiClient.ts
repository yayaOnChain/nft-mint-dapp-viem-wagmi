import type {
  AlchemyNFTResponse,
  AlchemyTransferResponse,
  BlockResponse,
} from "@/types";
import type { UserNFT } from "@/types/nft";
import type { TransferredAsset } from "@/types/transaction";

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

const handleApiError = (error: unknown): never => {
  if (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof (error as Record<string, unknown>).message === "string"
  ) {
    throw new Error((error as { message: string }).message);
  }
  throw new Error("Unknown API error");
};

export class AlchemyApiClient {
  async getNFTs(params: GetNFTsParams): Promise<{
    nfts: UserNFT[];
    totalCount: number;
    pageKey?: string;
  }> {
    const { owner, contractAddress, pageSize = 100, pageKey } = params;

    const url = new URL(API_BASE, window.location.origin);
    url.searchParams.set("method", "alchemy_getNFTs");
    url.searchParams.set("owner", owner);
    if (contractAddress) {
      url.searchParams.set("contractAddress", contractAddress);
    }
    url.searchParams.set("pageSize", pageSize.toString());
    if (pageKey) {
      url.searchParams.set("pageKey", pageKey);
    }

    const response = await fetch(url.toString());

    if (!response.ok) {
      throw new Error(`Alchemy API error: ${response.status}`);
    }

    const data = await response.json() as AlchemyNFTResponse & { pageKey?: string; error?: { message: string } };

    if (data.error) {
      handleApiError(data.error);
    }

    const nfts: UserNFT[] = (data.ownedNfts || []).map((nft) => ({
      tokenId: nft.id.tokenId,
      contractAddress: nft.contract.address as `0x${string}`,
      tokenUri: nft.tokenUri?.gateway,
      mintedAt: Date.now(),
    }));

    return {
      nfts,
      totalCount: data.totalCount || 0,
      pageKey: data.pageKey,
    };
  }

  async getAssetTransfers(
    params: GetAssetTransfersParams,
  ): Promise<{
    transfers: TransferredAsset[];
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

    const data = await response.json() as AlchemyTransferResponse & { error?: { message: string } };

    if (data.error) {
      handleApiError(data.error);
    }

    const transfers: TransferredAsset[] = data.result.transfers.map((tx) => {
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

    const data = await response.json() as BlockResponse & { error?: { message: string } };

    if (data.error) {
      handleApiError(data.error);
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
