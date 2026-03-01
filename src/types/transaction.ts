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
 * Alchemy transfer item from API response
 */
export interface AlchemyTransfer {
  tokenId: string;
  hash: string;
  blockTimestamp?: string;
  blockNum: string;
  from: string;
  to?: string;
  type?: string;
}

/**
 * Alchemy getAssetTransfers API response structure
 */
export interface AlchemyTransferResponse {
  result: {
    transfers: AlchemyTransfer[];
    pageKey?: string;
  };
  error?: {
    message: string;
  };
}

/**
 * Block response from eth_getBlockByNumber
 */
export interface BlockResponse {
  result: {
    timestamp: string;
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
