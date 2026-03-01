import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { useToast } from "../../hooks";
import { Card, CardHeader, CardTitle, CardContent } from "../ui";
import { Button } from "../ui/Button";
import { TransactionRow } from "./TransactionRow";
import type { TransactionHistoryItem, TransactionFilter } from "../../types";
import { TransactionRowSkeleton } from "../ui";
import {
  contractAddress,
  alchemyApiKey,
  alchemyNetwork,
} from "../../config/env";
import { CHAIN_IDS, UI_CONFIG, ERROR_MESSAGES } from "../../lib/constants";

interface TransactionHistoryProps {
  refreshKey?: number; // Optional prop to trigger re-fetching transactions
}

/**
 * Transaction history table component
 * Displays user's mint and transfer history from Alchemy API
 */
export const TransactionHistory = ({
  refreshKey = 0,
}: TransactionHistoryProps) => {
  const { address, isConnected, chain } = useAccount();
  const toast = useToast();
  const [transactions, setTransactions] = useState<TransactionHistoryItem[]>(
    [],
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<TransactionFilter>({
    limit: UI_CONFIG.pagination.defaultLimit,
  });
  const [pagination, setPagination] = useState({
    page: 1,
    total: 0,
    hasMore: false,
  });
  // Store the pageKey from Alchemy API for pagination
  const [pageKey, setPageKey] = useState<string | undefined>(undefined);

  /**
   * Fetch transactions from Alchemy API
   * @param nextPageKey - Optional pageKey for loading subsequent pages
   * @param append - Whether to append results to existing transactions (for pagination)
   */
  const fetchTransactions = async (
    nextPageKey?: string,
    append: boolean = false,
  ) => {
    if (!isConnected || !address || !alchemyApiKey) {
      setTransactions([]);
      setPagination((prev) => ({ ...prev, total: 0, hasMore: false }));
      setPageKey(undefined);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const baseUrl = `https://${alchemyNetwork}.g.alchemy.com/v2/${alchemyApiKey}`;

      const defaultLimit = filter.limit || UI_CONFIG.pagination.defaultLimit;

      // Build request params - include pageKey if fetching next page
      const params: any = {
        fromBlock: "0x0",
        toAddress: address,
        contractAddresses: [contractAddress],
        category: ["erc721"],
        withMetadata: true,
        maxCount: `0x${defaultLimit.toString(16)}`,
      };

      // Add pageKey for pagination if available
      if (nextPageKey) {
        params.pageKey = nextPageKey;
      }

      const response = await fetch(baseUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: 1,
          method: "alchemy_getAssetTransfers",
          params: [params],
        }),
      });

      const data = await response.json();

      if (data.error) {
        console.error("RPC Error:", data.error.message);
        throw new Error(data.error.message);
      }

      const txHistory: TransactionHistoryItem[] = data.result.transfers.map(
        (tx: any) => ({
          tokenId: parseInt(tx.tokenId, 16), // tx.erc721TokenId || tx.tokenId,
          txHash: tx.hash as `0x${string}`,
          timestamp: tx.blockTimestamp
            ? new Date(tx.blockTimestamp).getTime()
            : 0,
          blockNum: tx.blockNum,
          status: "success" as const,
          action:
            tx.from === "0x0000000000000000000000000000000000000000" ||
            tx.type === "mint"
              ? "mint"
              : "transfer",
          from: tx.from as `0x${string}`,
          to: tx.to as `0x${string}`,
          // blockNumber: BigInt(tx.blockNum),
        }),
      );

      // Append new transactions or replace existing ones
      if (append) {
        setTransactions((prev) => [...prev, ...txHistory]);
      } else {
        setTransactions(txHistory);
      }

      // Update pagination state with new total and hasMore flag
      const newTotal = append
        ? pagination.total + txHistory.length
        : txHistory.length;

      setPagination((prev) => ({
        ...prev,
        total: newTotal,
        hasMore: !!data.result.pageKey,
        page: append ? prev.page + 1 : 1,
      }));

      // Store pageKey for next pagination request
      setPageKey(data.result.pageKey);

      // Fetch missing timestamps for transactions
      const txsWithMissingTimestamp = txHistory.filter(
        (tx) => tx.timestamp === 0,
      );
      if (txsWithMissingTimestamp.length > 0) {
        const timestamps = await Promise.all(
          txsWithMissingTimestamp.map(async (tx: any) => {
            const res = await fetch(baseUrl, {
              method: "POST",
              body: JSON.stringify({
                jsonrpc: "2.0",
                id: 1,
                method: "eth_getBlockByNumber",
                params: [tx.blockNum, false],
              }),
            });
            const data = await res.json();
            return {
              txHash: tx.txHash,
              timestamp: parseInt(data.result.timestamp, 16) * 1000,
            };
          }),
        );
        setTransactions((prev) =>
          prev.map((tx) => {
            const found = timestamps.find((t) => t.txHash === tx.txHash);
            return found ? { ...tx, timestamp: found.timestamp } : tx;
          }),
        );
      }
    } catch (err) {
      console.error("[TransactionHistory] Error:", err);
      const errorMsg =
        err instanceof Error ? err.message : ERROR_MESSAGES.apiError;
      setError(errorMsg);
      toast.error("Failed to load transactions", errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  // Initial fetch when component mounts or wallet changes
  useEffect(() => {
    fetchTransactions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address, isConnected, refreshKey]);

  /**
   * Handle Load More button click - fetch next page of transactions
   */
  const handleLoadMore = () => {
    if (pageKey) {
      fetchTransactions(pageKey, true);
    }
  };

  const handleRefresh = () => {
    setFilter((prev) => ({ ...prev }));
    toast.info("Refreshing transactions...");
  };

  if (!isConnected) {
    return (
      <Card>
        <p className="text-center text-gray-400 py-8">
          Connect your wallet to view transaction history
        </p>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Transaction History</CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            isLoading={isLoading}
            disabled={isLoading}
          >
            Refresh
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        {isLoading && transactions.length === 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-700 text-left">
                  <th className="pb-3 text-gray-400 font-medium">Token ID</th>
                  <th className="pb-3 text-gray-400 font-medium">Action</th>
                  <th className="pb-3 text-gray-400 font-medium">From</th>
                  <th className="pb-3 text-gray-400 font-medium">To</th>
                  <th className="pb-3 text-gray-400 font-medium">Date</th>
                  <th className="pb-3 text-gray-400 font-medium">
                    Transaction
                  </th>
                </tr>
              </thead>
              <tbody>
                {[...Array(5)].map((_, i) => (
                  <TransactionRowSkeleton key={i} />
                ))}
              </tbody>
            </table>
          </div>
        ) : error ? (
          <div className="p-4 bg-red-900/30 border border-red-500/30 rounded-lg text-red-400 text-sm">
            ⚠️ {error}
          </div>
        ) : transactions.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-4xl mb-3">📜</div>
            <p className="text-gray-400">No transactions found</p>
            <p className="text-sm text-gray-500 mt-1">
              Your mint history will appear here
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-700 text-left">
                    <th className="pb-3 text-gray-400 font-medium">Token ID</th>
                    <th className="pb-3 text-gray-400 font-medium">Action</th>
                    <th className="pb-3 text-gray-400 font-medium">From</th>
                    <th className="pb-3 text-gray-400 font-medium">To</th>
                    <th className="pb-3 text-gray-400 font-medium">Date</th>
                    <th className="pb-3 text-gray-400 font-medium">
                      Transaction
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((tx, index) => (
                    <TransactionRow
                      key={`${tx.txHash}-${tx.tokenId}`}
                      transaction={tx}
                      chainId={chain?.id || CHAIN_IDS.sepolia}
                      animationDelay={index * 50}
                    />
                  ))}
                </tbody>
              </table>
            </div>

            {pagination.hasMore && (
              <div className="mt-4 text-center">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLoadMore}
                  isLoading={isLoading}
                  disabled={isLoading}
                >
                  Load More ({pagination.total} shown)
                </Button>
              </div>
            )}

            {!pagination.hasMore && pagination.total > 0 && (
              <div className="mt-4 text-center text-sm text-gray-500">
                Showing all {pagination.total} transactions
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};
