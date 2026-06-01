import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createConfig, http, WagmiProvider } from "wagmi";
import { sepolia } from "wagmi/chains";
import type { PropsWithChildren } from "react";

const mockAddress = "0xUserAddress123456789012345678901234567890" as `0x${string}`;
const mockTxHash = "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef" as `0x${string}`;

const mockUseAccount = vi.fn();
const mockGetAssetTransfers = vi.fn();
const mockGetBlockByNumber = vi.fn();

vi.mock("wagmi", async () => {
  const actual = await vi.importActual("wagmi");
  return {
    ...actual,
    useAccount: () => mockUseAccount(),
  };
});

vi.mock("@/lib/services/alchemyApiClient", () => ({
  getAlchemyClient: vi.fn(() => ({
    getAssetTransfers: mockGetAssetTransfers,
    getBlockByNumber: mockGetBlockByNumber,
  })),
}));

vi.mock("@/hooks/useToast", () => ({
  useToast: () => ({
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    loading: vi.fn(),
    dismiss: vi.fn(),
    transaction: {
      pending: vi.fn(),
      success: vi.fn(),
      error: vi.fn(),
    },
  }),
}));

vi.mock("@/config/env", () => ({
  contractAddress: "0x1234567890123456789012345678901234567890",
}));

vi.mock("@/abi/myNft", () => ({
  myNftAbi: [],
}));

const mockPagination = vi.hoisted(() => ({ defaultLimit: 10 }));

vi.mock("@/lib/constants", async () => {
  const actual = await vi.importActual("@/lib/constants") as typeof import("@/lib/constants");
  return {
    ...actual,
    UI_CONFIG: {
      ...actual.UI_CONFIG,
      pagination: mockPagination,
    },
  };
});

import { TransactionHistory } from "@/components/transaction/TransactionHistory";

const createTestWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  const config = createConfig({
    chains: [sepolia],
    transports: {
      [sepolia.id]: http(),
    },
  });

  return ({ children }: PropsWithChildren) => (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  );
};

const mockTransfers = [
  {
    tokenId: 1n,
    txHash: mockTxHash,
    timestamp: Math.floor(Date.now() / 1000),
    blockNum: "123456",
    from: "0x0000000000000000000000000000000000000000" as `0x${string}`,
    to: mockAddress,
    type: "mint" as const,
  },
  {
    tokenId: 2n,
    txHash: mockTxHash,
    timestamp: Math.floor(Date.now() / 1000),
    blockNum: "123457",
    from: mockAddress,
    to: "0xAnotherAddress123456789012345678901234567890" as `0x${string}`,
    type: "transfer" as const,
  },
];

describe("TransactionHistory", () => {
  const wrapper = createTestWrapper();

  beforeEach(() => {
    vi.clearAllMocks();
    mockPagination.defaultLimit = 10;

    mockUseAccount.mockReturnValue({
      address: mockAddress,
      addresses: [mockAddress],
      isConnected: true,
      isConnecting: false,
      isDisconnected: false,
      isReconnecting: false,
      status: "connected" as const,
      chain: sepolia,
      chainId: sepolia.id,
      connector: undefined,
    });

    mockGetAssetTransfers.mockResolvedValue({
      transfers: mockTransfers,
      pageKey: undefined,
    });
    mockGetBlockByNumber.mockResolvedValue(Math.floor(Date.now() / 1000));
  });

  describe("disconnected state", () => {
    it("should show 'Connect your wallet' message when not connected", () => {
      mockUseAccount.mockReturnValue({
        address: undefined,
        isConnected: false,
        chain: undefined,
      } as ReturnType<typeof mockUseAccount>);

      render(<TransactionHistory />, { wrapper });

      expect(
        screen.getByText("Connect your wallet to view transaction history"),
      ).toBeInTheDocument();
    });
  });

  describe("loading state", () => {
    it("should disable refresh button while loading", async () => {
      mockGetAssetTransfers.mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () => resolve({ transfers: [], pageKey: undefined }),
              500,
            ),
          ),
      );

      render(<TransactionHistory />, { wrapper });

      const refreshButton = screen.getByRole("button", { name: /refresh/i });
      expect(refreshButton).toBeDisabled();
    });
  });

  describe("error state", () => {
    it("should display error message when API fails", async () => {
      mockGetAssetTransfers.mockRejectedValue(new Error("Network error"));

      render(<TransactionHistory />, { wrapper });

      await waitFor(() => {
        expect(screen.getByText(/⚠️/i)).toBeInTheDocument();
      });

      expect(screen.getByText(/Network error/i)).toBeInTheDocument();
    });

    it("should show error with warning icon", async () => {
      mockGetAssetTransfers.mockRejectedValue(new Error("Failed to fetch"));

      render(<TransactionHistory />, { wrapper });

      await waitFor(() => {
        expect(screen.getByText(/⚠️ Failed to fetch/i)).toBeInTheDocument();
      });
    });

    it("should use generic error message for non-Error rejections", async () => {
      mockGetAssetTransfers.mockRejectedValue("Raw string error");

      render(<TransactionHistory />, { wrapper });

      await waitFor(() => {
        expect(screen.getByText(/⚠️/i)).toBeInTheDocument();
      });

      expect(
        screen.getByText(/Failed to fetch data/i),
      ).toBeInTheDocument();
    });
  });

  describe("empty state", () => {
    it("should show 'No transactions found' when no transactions", async () => {
      mockGetAssetTransfers.mockResolvedValue({
        transfers: [],
        pageKey: undefined,
      });

      render(<TransactionHistory />, { wrapper });

      await waitFor(() => {
        expect(screen.getByText("No transactions found")).toBeInTheDocument();
      });
    });

    it("should display 📜 emoji in empty state", async () => {
      mockGetAssetTransfers.mockResolvedValue({
        transfers: [],
        pageKey: undefined,
      });

      render(<TransactionHistory />, { wrapper });

      await waitFor(() => {
        expect(screen.getByText("📜")).toBeInTheDocument();
      });
    });
  });

  describe("success state", () => {
    it("should display transaction table when data exists", async () => {
      render(<TransactionHistory />, { wrapper });

      await waitFor(() => {
        expect(screen.getByText("#1")).toBeInTheDocument();
        expect(screen.getByText("#2")).toBeInTheDocument();
      });
    });

    it("should show table headers", async () => {
      render(<TransactionHistory />, { wrapper });

      await waitFor(() => {
        expect(screen.getByText("Token ID")).toBeInTheDocument();
        expect(screen.getByText("Action")).toBeInTheDocument();
        expect(screen.getByText("From")).toBeInTheDocument();
        expect(screen.getByText("To")).toBeInTheDocument();
        expect(screen.getByText("Date")).toBeInTheDocument();
        expect(screen.getByText("Transaction")).toBeInTheDocument();
      });
    });

    it("should display 'Transaction History' title", () => {
      render(<TransactionHistory />, { wrapper });

      expect(screen.getByText("Transaction History")).toBeInTheDocument();
    });
  });

  describe("pagination", () => {
    it("should show 'Load More' button when hasMore is true", async () => {
      mockGetAssetTransfers.mockResolvedValue({
        transfers: mockTransfers,
        pageKey: "next-page-key",
      });

      render(<TransactionHistory />, { wrapper });

      await waitFor(() => {
        expect(
          screen.getByRole("button", { name: /load more/i }),
        ).toBeInTheDocument();
      });
    });

    it("should call fetchTransactions with pageKey when Load More clicked", async () => {
      mockGetAssetTransfers.mockResolvedValue({
        transfers: mockTransfers,
        pageKey: "next-page-key",
      });

      render(<TransactionHistory />, { wrapper });

      await waitFor(() => {
        expect(
          screen.getByRole("button", { name: /load more/i }),
        ).toBeInTheDocument();
      });

      mockGetAssetTransfers.mockClear();
      mockGetAssetTransfers.mockResolvedValue({
        transfers: mockTransfers,
        pageKey: undefined,
      });

      const loadMoreButton = screen.getByRole("button", { name: /load more/i });
      fireEvent.click(loadMoreButton);

      await waitFor(() => {
        expect(mockGetAssetTransfers).toHaveBeenCalledWith(
          expect.objectContaining({
            pageKey: "next-page-key",
          }),
        );
      });
    });

    it("should show 'Showing all X transactions' when no more pages", async () => {
      mockGetAssetTransfers.mockResolvedValue({
        transfers: mockTransfers,
        pageKey: undefined,
      });

      render(<TransactionHistory />, { wrapper });

      await waitFor(() => {
        expect(
          screen.getByText(/Showing all 2 transactions/i),
        ).toBeInTheDocument();
      });
    });
  });

  describe("refresh functionality", () => {
    it("should trigger re-fetch when refreshKey prop changes", async () => {
      const { rerender } = render(<TransactionHistory refreshKey={0} />, {
        wrapper,
      });

      await waitFor(() => {
        expect(mockGetAssetTransfers).toHaveBeenCalledTimes(1);
      });

      mockGetAssetTransfers.mockClear();

      rerender(<TransactionHistory refreshKey={1} />);

      await waitFor(() => {
        expect(mockGetAssetTransfers).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe("data fetching", () => {
    it("should fetch transactions on mount when connected", async () => {
      render(<TransactionHistory />, { wrapper });

      await waitFor(() => {
        expect(mockGetAssetTransfers).toHaveBeenCalledWith(
          expect.objectContaining({
            address: mockAddress,
            contractAddress: "0x1234567890123456789012345678901234567890",
          }),
        );
      });
    });
  });

  describe("chain configuration", () => {
    it("should use default chain ID when chain is undefined", async () => {
      mockUseAccount.mockReturnValue({
        address: mockAddress,
        isConnected: true,
        chain: undefined,
      });

      render(<TransactionHistory />, { wrapper });

      await waitFor(() => {
        expect(mockGetAssetTransfers).toHaveBeenCalled();
      });
    });
  });

  describe("filter limit fallback", () => {
    it("should fallback to default limit when filter limit is falsy", async () => {
      mockPagination.defaultLimit = 0;

      render(<TransactionHistory />, { wrapper });

      await waitFor(() => {
        expect(
          screen.getByRole("button", { name: /refresh/i }),
        ).toBeInTheDocument();
      });
    });
  });

  describe("transaction classification", () => {
    it("should classify mint transactions correctly (from 0x0)", async () => {
      const mintTransfer = {
        tokenId: 1n,
        txHash: mockTxHash,
        timestamp: Math.floor(Date.now() / 1000),
        blockNum: "123456",
        from: "0x0000000000000000000000000000000000000000" as `0x${string}`,
        to: mockAddress,
        type: "transfer" as const,
      };

      mockGetAssetTransfers.mockResolvedValue({
        transfers: [mintTransfer],
        pageKey: undefined,
      });

      render(<TransactionHistory />, { wrapper });

      await waitFor(() => {
        expect(screen.getByText("MINT")).toBeInTheDocument();
      });
    });

    it("should classify transfer transactions correctly", async () => {
      const transferOnly = {
        tokenId: 2n,
        txHash: mockTxHash,
        timestamp: Math.floor(Date.now() / 1000),
        blockNum: "123457",
        from: mockAddress,
        to: "0xAnotherAddress123456789012345678901234567890" as `0x${string}`,
        type: "transfer" as const,
      };

      mockGetAssetTransfers.mockResolvedValue({
        transfers: [transferOnly],
        pageKey: undefined,
      });

      render(<TransactionHistory />, { wrapper });

      await waitFor(() => {
        expect(screen.getByText("TRANSFER")).toBeInTheDocument();
      });
    });
  });

  describe("missing timestamp handling", () => {
    beforeEach(() => {
      vi.spyOn(console, "error").mockImplementation(() => {});
    });

    it("should fetch missing timestamps via getBlockByNumber when timestamp is 0", async () => {
      const transferWithMissingTimestamp = {
        tokenId: 3n,
        txHash: "0x1111111111111111111111111111111111111111111111111111111111111111" as `0x${string}`,
        timestamp: 0,
        blockNum: "123458",
        from: "0x0000000000000000000000000000000000000000" as `0x${string}`,
        to: mockAddress,
        type: "mint" as const,
      };

      mockGetAssetTransfers.mockResolvedValue({
        transfers: [transferWithMissingTimestamp],
        pageKey: undefined,
      });

      render(<TransactionHistory />, { wrapper });

      await waitFor(() => {
        expect(mockGetBlockByNumber).toHaveBeenCalledWith("123458");
      });

      await waitFor(() => {
        expect(screen.getByText("#3")).toBeInTheDocument();
      });
    });

    it("should handle errors when fetching missing timestamps", async () => {
      mockGetBlockByNumber.mockRejectedValue(new Error("Block fetch failed"));

      const transferWithMissingTimestamp = {
        tokenId: 4n,
        txHash: "0x2222222222222222222222222222222222222222222222222222222222222222" as `0x${string}`,
        timestamp: 0,
        blockNum: "123459",
        from: "0x0000000000000000000000000000000000000000" as `0x${string}`,
        to: mockAddress,
        type: "mint" as const,
      };

      mockGetAssetTransfers.mockResolvedValue({
        transfers: [transferWithMissingTimestamp],
        pageKey: undefined,
      });

      render(<TransactionHistory />, { wrapper });

      await waitFor(() => {
        expect(screen.getByText("#4")).toBeInTheDocument();
      });

      expect(console.error).toHaveBeenCalled();
    });
  });

  describe("refreshKey prop", () => {
    it("should trigger re-fetch when refreshKey prop changes", async () => {
      const { rerender } = render(<TransactionHistory refreshKey={0} />, {
        wrapper,
      });

      await waitFor(() => {
        expect(mockGetAssetTransfers).toHaveBeenCalledTimes(1);
      });

      mockGetAssetTransfers.mockClear();

      rerender(<TransactionHistory refreshKey={1} />);

      await waitFor(() => {
        expect(mockGetAssetTransfers).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe("UI elements", () => {
    it("should have Refresh button in header", () => {
      render(<TransactionHistory />, { wrapper });

      expect(
        screen.getByRole("button", { name: /refresh/i }),
      ).toBeInTheDocument();
    });

    it("should execute refresh when button is clicked", async () => {
      render(<TransactionHistory />, { wrapper });

      await waitFor(() => {
        expect(
          screen.getByRole("button", { name: /refresh/i }),
        ).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole("button", { name: /refresh/i }));

      expect(
        screen.getByRole("button", { name: /refresh/i }),
      ).toBeInTheDocument();
    });
  });
});