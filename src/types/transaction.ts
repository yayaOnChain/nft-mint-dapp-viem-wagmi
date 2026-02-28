/**
 * Transaction status enumeration
 */
export type TransactionStatus = "pending" | "success" | "failed" | "confirmed";

/**
 * Transaction action types
 */
export type TransactionAction =
  | "mint"
  | "transfer"
  | "burn"
  | "approve"
  | "withdraw";

/**
 * Transaction history item for UI display
 */
export interface TransactionHistoryItem {
  tokenId: string;
  txHash: `0x${string}`;
  timestamp: number;
  blockNum: string;
  status: TransactionStatus;
  action: TransactionAction;
  from?: `0x${string}`;
  to?: `0x${string}`;
  value?: string;
  blockNumber?: bigint;
}

/**
 * Alchemy getAssetTransfers API response structure
 */
export interface AlchemyTransferResponse {
  jsonrpc: string;
  id: number;
  result: {
    transfers: Array<{
      uniqueId: string;
      category: string;
      tokenId: string;
      asset: string;
      from: string;
      to: string;
      value: string | null;
      erc721TokenId?: string;
      erc1155Metadata?: Array<{ tokenId: string; value: string }>;
      rawContract: {
        value: string | null;
        address: string;
        decimal: string | null;
      };
      blockNum: string;
      transaction: {
        hash: string;
        timestamp: string;
        blockNumber: number;
        from: string;
        to: string;
        value: number | string;
        gas: number;
        gasPrice: number;
      };
    }>;
    pageKey?: string;
  };
}

/**
 * Pending transaction state for optimistic UI
 */
export interface PendingTransaction {
  hash: `0x${string}`;
  tokenId?: string;
  action: TransactionAction;
  timestamp: number;
  status: "pending";
}

/**
 * Transaction filter options
 */
export interface TransactionFilter {
  action?: TransactionAction;
  status?: TransactionStatus;
  fromDate?: Date;
  toDate?: Date;
  limit?: number;
}

/**
 * Paginated transaction response
 */
export interface TransactionPagination {
  items: TransactionHistoryItem[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}
