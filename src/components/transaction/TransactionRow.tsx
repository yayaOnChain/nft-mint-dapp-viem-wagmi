import type { TransactionHistoryItem } from "../../types";
import { getExplorerTxUrl, getExplorerAddressUrl } from "../../lib/constants";

interface TransactionRowProps {
  transaction: TransactionHistoryItem;
  chainId: number;
  animationDelay?: number;
}

/**
 * Individual transaction row component
 * Displays single transaction with links to explorer
 */
export const TransactionRow = ({
  transaction,
  chainId,
  animationDelay = 0,
}: TransactionRowProps) => {
  const formatAddress = (addr: `0x${string}` | undefined): string => {
    if (!addr) return "-";
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const formatTime = (timestamp: number): string => {
    return new Date(timestamp).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getActionStyles = (action: TransactionHistoryItem["action"]) => {
    switch (action) {
      case "mint":
        return "bg-green-900/50 text-green-400 border-green-700";
      case "transfer":
        return "bg-blue-900/50 text-blue-400 border-blue-700";
      case "burn":
        return "bg-red-900/50 text-red-400 border-red-700";
      case "approve":
        return "bg-yellow-900/50 text-yellow-400 border-yellow-700";
      case "withdraw":
        return "bg-purple-900/50 text-purple-400 border-purple-700";
      default:
        return "bg-gray-700 text-gray-400 border-gray-600";
    }
  };

  const getStatusStyles = (status: TransactionHistoryItem["status"]) => {
    switch (status) {
      case "success":
      case "confirmed":
        return "text-green-400";
      case "pending":
        return "text-yellow-400";
      case "failed":
        return "text-red-400";
      default:
        return "text-gray-400";
    }
  };

  const explorerUrl = getExplorerTxUrl(transaction.txHash, chainId);
  const fromUrl = transaction.from
    ? getExplorerAddressUrl(transaction.from, chainId)
    : null;
  const toUrl = transaction.to
    ? getExplorerAddressUrl(transaction.to, chainId)
    : null;

  return (
    <tr
      className="border-b border-gray-700/50 hover:bg-gray-800/50 transition-colors animate-fadeIn"
      style={{ animationDelay: `${animationDelay}ms` }}
    >
      {/* Token ID */}
      <td className="py-3">
        <span className="font-mono text-purple-400">
          #{transaction.tokenId}
        </span>
      </td>

      {/* Action */}
      <td className="py-3">
        <span
          className={`px-2 py-1 rounded text-xs font-semibold border ${getActionStyles(transaction.action)}`}
        >
          {transaction.action.toUpperCase()}
        </span>
      </td>

      {/* From */}
      <td className="py-3">
        {fromUrl ? (
          <a
            href={fromUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-400 hover:text-purple-400 transition-colors"
          >
            {formatAddress(transaction.from)}
          </a>
        ) : (
          <span className="text-gray-500">-</span>
        )}
      </td>

      {/* To */}
      <td className="py-3">
        {toUrl ? (
          <a
            href={toUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-400 hover:text-purple-400 transition-colors"
          >
            {formatAddress(transaction.to)}
          </a>
        ) : (
          <span className="text-gray-500">-</span>
        )}
      </td>

      {/* Date */}
      <td className="py-3">
        <span className="text-gray-400">
          {formatTime(transaction.timestamp)}
        </span>
      </td>

      {/* Transaction Hash */}
      <td className="py-3">
        <div className="flex items-center gap-2">
          <a
            href={explorerUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-purple-400 hover:text-purple-300 transition-colors font-mono text-xs"
          >
            {transaction.txHash.slice(0, 8)}...{transaction.txHash.slice(-6)} ↗
          </a>
          <span className={`text-xs ${getStatusStyles(transaction.status)}`}>
            {transaction.status === "success" && "✓"}
            {transaction.status === "pending" && "⏳"}
            {transaction.status === "failed" && "✗"}
          </span>
        </div>
      </td>
    </tr>
  );
};
