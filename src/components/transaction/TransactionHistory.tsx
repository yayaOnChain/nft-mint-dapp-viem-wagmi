import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { useToast } from "../../hooks";
import { Card, CardHeader, CardTitle, CardContent } from "../ui";
import { Button } from "../ui/Button";
import { TransactionRow } from "./TransactionRow";
import type {
  TransactionHistoryItem,
  TransactionFilter,
  TransactionPagination,
} from "../../types";
import { TransactionRowSkeleton } from "../ui";
import {
  contractAddress,
  alchemyApiKey,
  alchemyNetwork,
} from "../../config/env";
import { CHAIN_IDS, UI_CONFIG, ERROR_MESSAGES } from "../../lib/constants";

/**
 * Transaction history table component
 * Displays user's mint and transfer history from Alchemy API
 */
export const TransactionHistory = () => {
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

  useEffect(() => {
    let mounted = true;

    const fetchTransactions = async () => {
      if (!isConnected || !address || !alchemyApiKey) {
        setTransactions([]);
        setPagination((prev) => ({ ...prev, total: 0, hasMore: false }));
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const baseUrl = `https://${alchemyNetwork}.g.alchemy.com/v2/${alchemyApiKey}`;

        const defaultLimit = filter.limit || UI_CONFIG.pagination.defaultLimit;
        const response = await fetch(baseUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            jsonrpc: "2.0",
            id: 1,
            method: "alchemy_getAssetTransfers",
            params: [
              {
                fromBlock: "0x0",
                toAddress: address,
                contractAddresses: [contractAddress],
                category: ["erc721"],
                withMetadata: true,
                maxCount: `0x${defaultLimit.toString(16)}`,
              },
            ],
          }),
        });

        const data = await response.json();

        if (data.error) {
          console.error("RPC Error:", data.error.message);
          throw new Error(data.error.message);
        }

        if (mounted) {
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

          setTransactions(txHistory);
          setPagination((prev) => ({
            ...prev,
            total: data.result.transfers.length,
            hasMore: !!data.result.pageKey,
          }));
          // setTransactions(txHistory.slice(-10));

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
        }
      } catch (err) {
        console.error("[TransactionHistory] Error:", err);
        if (mounted) {
          const errorMsg =
            err instanceof Error ? err.message : ERROR_MESSAGES.apiError;
          setError(errorMsg);
          toast.error("Failed to load transactions", errorMsg);
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    fetchTransactions();

    return () => {
      mounted = false;
    };
    // }, [address, isConnected, filter.limit, toast]);
  }, [address, isConnected]);

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
                <Button variant="outline" size="sm">
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
