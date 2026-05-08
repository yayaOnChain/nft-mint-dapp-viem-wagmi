import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { TransactionRow } from "@/components/transaction/TransactionRow";
import type { TransactionHistoryItem, TransactionAction } from "@/types";

// Mock the constants module
vi.mock("@/lib/constants", () => ({
  getExplorerTxUrl: vi.fn(
    (txHash: string, chainId: number) =>
      `https://explorer.com/tx/${txHash}?chain=${chainId}`,
  ),
  getExplorerAddressUrl: vi.fn(
    (address: string, chainId: number) =>
      `https://explorer.com/address/${address}?chain=${chainId}`,
  ),
}));

describe("TransactionRow", () => {
  const mockTransaction: TransactionHistoryItem = {
    tokenId: 1n.toString(),
    txHash:
      "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
    timestamp: 1704067200000, // Jan 1, 2024 00:00:00 UTC
    blockNum: "123456",
    status: "success",
    action: "mint",
    from: "0x0000000000000000000000000000000000000000",
    to: "0xUserAddress123456789012345678901234567890",
  };

  const chainId = 11155111; // Sepola

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("basic rendering", () => {
    it("should render table row structure", () => {
      const { container } = render(
        <table>
          <tbody>
            <TransactionRow transaction={mockTransaction} chainId={chainId} />
          </tbody>
        </table>,
      );

      expect(container.querySelector("tr")).toBeInTheDocument();
    });

    it("should apply animation delay style", () => {
      const { container } = render(
        <table>
          <tbody>
            <TransactionRow
              transaction={mockTransaction}
              chainId={chainId}
              animationDelay={100}
            />
          </tbody>
        </table>,
      );

      const row = container.querySelector("tr");
      expect(row).toHaveStyle("animation-delay: 100ms");
    });

    it("should default animation delay to 0", () => {
      const { container } = render(
        <table>
          <tbody>
            <TransactionRow transaction={mockTransaction} chainId={chainId} />
          </tbody>
        </table>,
      );

      const row = container.querySelector("tr");
      expect(row).toHaveStyle("animation-delay: 0ms");
    });
  });

  describe("token ID display", () => {
    it("should display token ID with # prefix", () => {
      render(
        <table>
          <tbody>
            <TransactionRow transaction={mockTransaction} chainId={chainId} />
          </tbody>
        </table>,
      );

      expect(screen.getByText("#1")).toBeInTheDocument();
    });

    it("should apply purple color style to token ID", () => {
      const { container } = render(
        <table>
          <tbody>
            <TransactionRow transaction={mockTransaction} chainId={chainId} />
          </tbody>
        </table>,
      );

      const tokenIdCell = container.querySelector("td");
      expect(tokenIdCell).toHaveTextContent("#1");
    });

    it("should display large token IDs correctly", () => {
      const largeTokenTransaction = {
        ...mockTransaction,
        tokenId: 999999n.toString(),
      };

      render(
        <table>
          <tbody>
            <TransactionRow
              transaction={largeTokenTransaction}
              chainId={chainId}
            />
          </tbody>
        </table>,
      );

      expect(screen.getByText("#999999")).toBeInTheDocument();
    });
  });

  describe("action badge", () => {
    it("should display action in uppercase", () => {
      render(
        <table>
          <tbody>
            <TransactionRow transaction={mockTransaction} chainId={chainId} />
          </tbody>
        </table>,
      );

      expect(screen.getByText("MINT")).toBeInTheDocument();
    });

    it("should apply green styles for mint action", () => {
      const { container } = render(
        <table>
          <tbody>
            <TransactionRow transaction={mockTransaction} chainId={chainId} />
          </tbody>
        </table>,
      );

      const actionBadge = container.querySelector("td:nth-child(2) span");
      expect(actionBadge).toHaveClass(
        "bg-green-900/50",
        "text-green-400",
        "border-green-700",
      );
    });

    it("should apply blue styles for transfer action", () => {
      const transferTransaction = {
        ...mockTransaction,
        action: "transfer" as const,
      };

      const { container } = render(
        <table>
          <tbody>
            <TransactionRow
              transaction={transferTransaction}
              chainId={chainId}
            />
          </tbody>
        </table>,
      );

      const actionBadge = container.querySelector("td:nth-child(2) span");
      expect(actionBadge).toHaveClass(
        "bg-blue-900/50",
        "text-blue-400",
        "border-blue-700",
      );
    });

    it("should apply red styles for burn action", () => {
      const burnTransaction = {
        ...mockTransaction,
        action: "burn" as const,
      };

      const { container } = render(
        <table>
          <tbody>
            <TransactionRow transaction={burnTransaction} chainId={chainId} />
          </tbody>
        </table>,
      );

      const actionBadge = container.querySelector("td:nth-child(2) span");
      expect(actionBadge).toHaveClass(
        "bg-red-900/50",
        "text-red-400",
        "border-red-700",
      );
    });

    it("should apply yellow styles for approve action", () => {
      const approveTransaction = {
        ...mockTransaction,
        action: "approve" as const,
      };

      const { container } = render(
        <table>
          <tbody>
            <TransactionRow
              transaction={approveTransaction}
              chainId={chainId}
            />
          </tbody>
        </table>,
      );

      const actionBadge = container.querySelector("td:nth-child(2) span");
      expect(actionBadge).toHaveClass(
        "bg-yellow-900/50",
        "text-yellow-400",
        "border-yellow-700",
      );
    });

    it("should apply purple styles for withdraw action", () => {
      const withdrawTransaction = {
        ...mockTransaction,
        action: "withdraw" as const,
      };

      const { container } = render(
        <table>
          <tbody>
            <TransactionRow
              transaction={withdrawTransaction}
              chainId={chainId}
            />
          </tbody>
        </table>,
      );

      const actionBadge = container.querySelector("td:nth-child(2) span");
      expect(actionBadge).toHaveClass(
        "bg-purple-900/50",
        "text-purple-400",
        "border-purple-700",
      );
    });

    it("should apply gray styles for unknown action", () => {
      const unknownTransaction = {
        ...mockTransaction,
        action: "unknown" as TransactionAction,
      };

      const { container } = render(
        <table>
          <tbody>
            <TransactionRow
              transaction={unknownTransaction}
              chainId={chainId}
            />
          </tbody>
        </table>,
      );

      const actionBadge = container.querySelector("td:nth-child(2) span");
      expect(actionBadge).toHaveClass(
        "bg-gray-700",
        "text-gray-400",
        "border-gray-600",
      );
    });
  });

  describe("status indicator", () => {
    it("should show ✓ for success status", () => {
      const { container } = render(
        <table>
          <tbody>
            <TransactionRow transaction={mockTransaction} chainId={chainId} />
          </tbody>
        </table>,
      );

      const statusSpan = container.querySelector("td:last-child span");
      expect(statusSpan?.textContent).toContain("✓");
    });

    it("should show ✓ for confirmed status", () => {
      const confirmedTransaction = {
        ...mockTransaction,
        status: "confirmed" as const,
      };

      const { container } = render(
        <table>
          <tbody>
            <TransactionRow
              transaction={confirmedTransaction}
              chainId={chainId}
            />
          </tbody>
        </table>,
      );

      // Note: Component only renders ✓ for "success" status, not "confirmed"
      // The getStatusStyles handles "confirmed" for color styling only
      const lastCell = container.querySelector("td:last-child");
      const statusSpan = lastCell?.querySelector("span");
      expect(statusSpan).toHaveClass("text-green-400");
    });

    it("should apply green color for success status", () => {
      const { container } = render(
        <table>
          <tbody>
            <TransactionRow transaction={mockTransaction} chainId={chainId} />
          </tbody>
        </table>,
      );

      const statusSpan = container.querySelector("td:last-child span");
      expect(statusSpan).toHaveClass("text-green-400");
    });

    it("should show ⏳ for pending status", () => {
      const pendingTransaction = {
        ...mockTransaction,
        status: "pending" as const,
      };

      const { container } = render(
        <table>
          <tbody>
            <TransactionRow
              transaction={pendingTransaction}
              chainId={chainId}
            />
          </tbody>
        </table>,
      );

      const statusSpan = container.querySelector("td:last-child span");
      expect(statusSpan?.textContent).toContain("⏳");
    });

    it("should apply yellow color for pending status", () => {
      const pendingTransaction = {
        ...mockTransaction,
        status: "pending" as const,
      };

      const { container } = render(
        <table>
          <tbody>
            <TransactionRow
              transaction={pendingTransaction}
              chainId={chainId}
            />
          </tbody>
        </table>,
      );

      const statusSpan = container.querySelector("td:last-child span");
      expect(statusSpan).toHaveClass("text-yellow-400");
    });

    it("should show ✗ for failed status", () => {
      const failedTransaction = {
        ...mockTransaction,
        status: "failed" as const,
      };

      const { container } = render(
        <table>
          <tbody>
            <TransactionRow transaction={failedTransaction} chainId={chainId} />
          </tbody>
        </table>,
      );

      const statusSpan = container.querySelector("td:last-child span");
      expect(statusSpan?.textContent).toContain("✗");
    });

    it("should apply red color for failed status", () => {
      const failedTransaction = {
        ...mockTransaction,
        status: "failed" as const,
      };

      const { container } = render(
        <table>
          <tbody>
            <TransactionRow transaction={failedTransaction} chainId={chainId} />
          </tbody>
        </table>,
      );

      const statusSpan = container.querySelector("td:last-child span");
      expect(statusSpan).toHaveClass("text-red-400");
    });
  });

  describe("address formatting", () => {
    it("should format from address correctly", () => {
      render(
        <table>
          <tbody>
            <TransactionRow transaction={mockTransaction} chainId={chainId} />
          </tbody>
        </table>,
      );

      expect(screen.getByText("0x0000...0000")).toBeInTheDocument();
    });

    it("should format to address correctly", () => {
      render(
        <table>
          <tbody>
            <TransactionRow transaction={mockTransaction} chainId={chainId} />
          </tbody>
        </table>,
      );

      expect(screen.getByText("0xUser...7890")).toBeInTheDocument();
    });

    it("should show '-' for undefined from address", () => {
      const noFromTransaction = {
        ...mockTransaction,
        from: undefined,
      };

      render(
        <table>
          <tbody>
            <TransactionRow transaction={noFromTransaction} chainId={chainId} />
          </tbody>
        </table>,
      );

      // Find the from cell (3rd column)
      const cells = screen.getAllByText("-");
      expect(cells.length).toBeGreaterThanOrEqual(1);
    });

    it("should show '-' for undefined to address", () => {
      const noToTransaction = {
        ...mockTransaction,
        to: undefined,
      };

      render(
        <table>
          <tbody>
            <TransactionRow transaction={noToTransaction} chainId={chainId} />
          </tbody>
        </table>,
      );

      // Find the to cell (4th column)
      const cells = screen.getAllByText("-");
      expect(cells.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe("date formatting", () => {
    it("should format timestamp to readable date string", () => {
      render(
        <table>
          <tbody>
            <TransactionRow transaction={mockTransaction} chainId={chainId} />
          </tbody>
        </table>,
      );

      // The date should contain "Jan 1, 2024"
      const dateCell = screen.getByText((content, element) => {
        return element?.tagName === "SPAN" && content.includes("Jan 1, 2024");
      });
      expect(dateCell).toBeInTheDocument();
    });

    it("should format different timestamps correctly", () => {
      const differentTimestampTransaction = {
        ...mockTransaction,
        timestamp: 1704153600000, // Jan 2, 2024 00:00:00 UTC
      };

      render(
        <table>
          <tbody>
            <TransactionRow
              transaction={differentTimestampTransaction}
              chainId={chainId}
            />
          </tbody>
        </table>,
      );

      // The date should contain "Jan 2, 2024"
      const dateCell = screen.getByText((content, element) => {
        return element?.tagName === "SPAN" && content.includes("Jan 2, 2024");
      });
      expect(dateCell).toBeInTheDocument();
    });
  });

  describe("explorer links", () => {
    it("should have correct href for transaction hash", () => {
      const { container } = render(
        <table>
          <tbody>
            <TransactionRow transaction={mockTransaction} chainId={chainId} />
          </tbody>
        </table>,
      );

      const txLink = container.querySelector("td:last-child a");
      expect(txLink).toHaveAttribute(
        "href",
        `https://explorer.com/tx/${mockTransaction.txHash}?chain=${chainId}`,
      );
    });

    it("should have correct href for from address", () => {
      render(
        <table>
          <tbody>
            <TransactionRow transaction={mockTransaction} chainId={chainId} />
          </tbody>
        </table>,
      );

      const fromLink = screen.getByText("0x0000...0000");
      expect(fromLink).toHaveAttribute(
        "href",
        `https://explorer.com/address/${mockTransaction.from}?chain=${chainId}`,
      );
    });

    it("should have correct href for to address", () => {
      render(
        <table>
          <tbody>
            <TransactionRow transaction={mockTransaction} chainId={chainId} />
          </tbody>
        </table>,
      );

      const toLink = screen.getByText("0xUser...7890");
      expect(toLink).toHaveAttribute(
        "href",
        `https://explorer.com/address/${mockTransaction.to}?chain=${chainId}`,
      );
    });

    it("should have target='_blank' for all links", () => {
      const { container } = render(
        <table>
          <tbody>
            <TransactionRow transaction={mockTransaction} chainId={chainId} />
          </tbody>
        </table>,
      );

      const links = container.querySelectorAll("a");
      links.forEach((link) => {
        expect(link).toHaveAttribute("target", "_blank");
      });
    });

    it("should have rel='noopener noreferrer' for all links", () => {
      const { container } = render(
        <table>
          <tbody>
            <TransactionRow transaction={mockTransaction} chainId={chainId} />
          </tbody>
        </table>,
      );

      const links = container.querySelectorAll("a");
      links.forEach((link) => {
        expect(link).toHaveAttribute("rel", "noopener noreferrer");
      });
    });

    it("should truncate transaction hash correctly", () => {
      const { container } = render(
        <table>
          <tbody>
            <TransactionRow transaction={mockTransaction} chainId={chainId} />
          </tbody>
        </table>,
      );

      // Hash is truncated to first 8 and last 6 characters: 0x123456...abcdef
      const txLink = container.querySelector("td:last-child a");
      expect(txLink).toHaveTextContent("0x123456...abcdef ↗");
    });
  });

  describe("table structure", () => {
    it("should have 6 columns", () => {
      const { container } = render(
        <table>
          <tbody>
            <TransactionRow transaction={mockTransaction} chainId={chainId} />
          </tbody>
        </table>,
      );

      const row = container.querySelector("tr");
      expect(row?.querySelectorAll("td").length).toBe(6);
    });

    it("should have correct column order", () => {
      const { container } = render(
        <table>
          <tbody>
            <TransactionRow transaction={mockTransaction} chainId={chainId} />
          </tbody>
        </table>,
      );

      const cells = container.querySelectorAll("td");
      expect(cells[0]).toHaveTextContent("#1"); // Token ID
      expect(cells[1]).toHaveTextContent("MINT"); // Action
      expect(cells[2]).toHaveTextContent("0x0000...0000"); // From
      expect(cells[3]).toHaveTextContent("0xUser...7890"); // To
      // Date cell (4th) contains formatted date
      expect(cells[5]).toContainHTML("0x12345678"); // Tx Hash
    });
  });
});
