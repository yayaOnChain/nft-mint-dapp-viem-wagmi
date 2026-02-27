import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { TransactionRowSkeleton } from "./ui/Skeleton";
import type { TransactionHistoryItem } from "../types/nft";

const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS as `0x${string}`;
const ALCHEMY_API_KEY = import.meta.env.VITE_ALCHEMY_API_KEY;

/**
 * Display user's transaction history in table format
 * Note: This uses Alchemy's getAssetTransfers API for detailed history
 */
export const TransactionHistoryTable = () => {
  const { address, isConnected } = useAccount();
  const [transactions, setTransactions] = useState<TransactionHistoryItem[]>(
    [],
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const fetchTransactions = async () => {
      if (!isConnected || !address || !ALCHEMY_API_KEY) {
        setTransactions([]);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        // Alchemy getAssetTransfers API
        const baseUrl = `https://eth-sepolia.g.alchemy.com/v2/${ALCHEMY_API_KEY}`;

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
                contractAddresses: [CONTRACT_ADDRESS],
                category: ["erc721"], // Only ERC721 transfers
                withMetadata: true,
              },
            ],
          }),
        });

        const data = await response.json();

        if (data.error) {
          throw new Error(data.error.message);
        }

        if (mounted) {
          // Transform to our TransactionHistoryItem type
          const txHistory: TransactionHistoryItem[] = data.result.transfers.map(
            (tx: any) => ({
              tokenId: parseInt(tx.tokenId, 16),
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
            }),
          );

          setTransactions(txHistory.slice(0, 10)); // Show latest 10 transactions
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
          setError(
            err instanceof Error ? err.message : "Failed to fetch transactions",
          );
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
  }, [address, isConnected]);

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="mt-8 p-6 bg-gray-800 rounded-lg border border-gray-700">
      <h3 className="text-lg font-semibold mb-4">Transaction History</h3>

      {isLoading && (
        <div className="mt-8 p-6 bg-gray-800 rounded-lg border border-gray-700">
          <h3 className="text-lg font-semibold mb-4">Transaction History</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-700 text-left">
                  <th className="pb-3 text-gray-400 font-medium">Token ID</th>
                  <th className="pb-3 text-gray-400 font-medium">Action</th>
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
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-900/30 border border-red-500/30 rounded-lg text-red-400 text-sm">
          ⚠️ {error}
        </div>
      )}

      {!isLoading && !error && transactions.length === 0 && (
        <div className="text-center py-8 text-gray-400">
          No transactions found
        </div>
      )}

      {!isLoading && !error && transactions.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-700 text-left">
                <th className="pb-3 text-gray-400 font-medium">Token ID</th>
                <th className="pb-3 text-gray-400 font-medium">Action</th>
                <th className="pb-3 text-gray-400 font-medium">Date</th>
                <th className="pb-3 text-gray-400 font-medium">Transaction</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((tx) => (
                <tr key={tx.txHash} className="border-b border-gray-700/50">
                  <td className="py-3 font-mono">#{tx.tokenId}</td>
                  <td className="py-3">
                    <span
                      className={`px-2 py-1 rounded text-xs font-semibold ${
                        tx.action === "mint"
                          ? "bg-green-900/50 text-green-400"
                          : "bg-blue-900/50 text-blue-400"
                      }`}
                    >
                      {tx.action.toUpperCase()}
                    </span>
                  </td>
                  <td className="py-3 text-gray-400">
                    {formatTime(tx.timestamp)}
                  </td>
                  <td className="py-3">
                    <a
                      href={`https://sepolia.etherscan.io/tx/${tx.txHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-purple-400 hover:text-purple-300 transition-colors"
                    >
                      {tx.txHash.slice(0, 8)}...{tx.txHash.slice(-6)} ↗
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
