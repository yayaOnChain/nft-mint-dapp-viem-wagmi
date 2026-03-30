import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createConfig, http, WagmiProvider } from "wagmi";
import { sepolia } from "wagmi/chains";
import * as wagmi from "wagmi";
import { TransactionHistory } from "@/components/transaction/TransactionHistory";

// Mock the toast hook
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

// Mock Alchemy API service
vi.mock("../../../services/alchemyApi", () => ({
  getAlchemyApi: vi.fn(),
}));

// Mock contract address
vi.mock("../../../config/env", () => ({
  contractAddress: "0x1234567890123456789012345678901234567890",
}));

// Import mocked services
import { getAlchemyApi } from "../../../services/alchemyApi";
// import { useToast } from "../../../hooks/useToast";

// Create test providers
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

  return ({ children }: React.PropsWithChildren) => (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  );
};

describe("TransactionHistory", () => {
  let wrapper: React.ComponentType<React.PropsWithChildren>;
  let useAccountSpy: ReturnType<typeof vi.spyOn>;

  const mockAddress =
    "0xUserAddress123456789012345678901234567890" as `0x${string}`;
  const mockTxHash =
    "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef";

  const mockTransfers = [
    {
      tokenId: 1n,
      txHash: mockTxHash,
      timestamp: Math.floor(Date.now() / 1000),
      blockNum: "123456",
      from: "0x0000000000000000000000000000000000000000",
      to: mockAddress,
      type: "mint",
    },
    {
      tokenId: 2n,
      txHash: mockTxHash,
      timestamp: Math.floor(Date.now() / 1000),
      blockNum: "123457",
      from: mockAddress,
      to: "0xAnotherAddress123456789012345678901234567890",
      type: "transfer",
    },
  ];

  const mockAlchemyApi = {
    getAssetTransfers: vi.fn(),
    getBlockByNumber: vi.fn(),
  };

  beforeEach(() => {
    wrapper = createTestWrapper();

    // Mock useAccount
    useAccountSpy = vi.spyOn(wagmi, "useAccount").mockReturnValue({
      address: mockAddress,
      addresses: [mockAddress],
      isConnected: true,
      isConnecting: false,
      isDisconnected: false,
      isReconnecting: false,
      status: "connected",
      chain: sepolia,
      chainId: sepolia.id,
      connector: undefined as any,
    });

    // Setup Alchemy API mock
    vi.mocked(getAlchemyApi).mockReturnValue(mockAlchemyApi as any);
    mockAlchemyApi.getAssetTransfers.mockResolvedValue({
      transfers: mockTransfers,
      pageKey: undefined,
    });
    mockAlchemyApi.getBlockByNumber.mockResolvedValue(
      Math.floor(Date.now() / 1000),
    );
  });

  afterEach(() => {
    useAccountSpy.mockRestore();
    vi.restoreAllMocks();
  });

  describe("disconnected state", () => {
    it("should show 'Connect your wallet' message when not connected", () => {
      useAccountSpy.mockReturnValue({
        address: undefined,
        isConnected: false,
        chain: undefined,
      } as any);

      render(<TransactionHistory />, { wrapper });

      expect(
        screen.getByText("Connect your wallet to view transaction history"),
      ).toBeInTheDocument();
    });
  });

  describe("loading state", () => {
    it("should disable refresh button while loading", async () => {
      mockAlchemyApi.getAssetTransfers.mockImplementation(
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
      mockAlchemyApi.getAssetTransfers.mockRejectedValue(
        new Error("Network error"),
      );

      render(<TransactionHistory />, { wrapper });

      await waitFor(() => {
        expect(screen.getByText(/⚠️/i)).toBeInTheDocument();
      });

      expect(screen.getByText(/Network error/i)).toBeInTheDocument();
    });

    it("should show error with warning icon", async () => {
      mockAlchemyApi.getAssetTransfers.mockRejectedValue(
        new Error("Failed to fetch"),
      );

      render(<TransactionHistory />, { wrapper });

      await waitFor(() => {
        expect(screen.getByText(/⚠️ Failed to fetch/i)).toBeInTheDocument();
      });
    });
  });

  describe("empty state", () => {
    it("should show 'No transactions found' when no transactions", async () => {
      mockAlchemyApi.getAssetTransfers.mockResolvedValue({
        transfers: [],
        pageKey: undefined,
      });

      render(<TransactionHistory />, { wrapper });

      await waitFor(() => {
        expect(screen.getByText("No transactions found")).toBeInTheDocument();
      });
    });

    it("should display 📜 emoji in empty state", async () => {
      mockAlchemyApi.getAssetTransfers.mockResolvedValue({
        transfers: [],
        pageKey: undefined,
      });

      render(<TransactionHistory />, { wrapper });

      await waitFor(() => {
        expect(screen.getByText("📜")).toBeInTheDocument();
      });
    });

    it("should show 'Your mint history will appear here' message", async () => {
      mockAlchemyApi.getAssetTransfers.mockResolvedValue({
        transfers: [],
        pageKey: undefined,
      });

      render(<TransactionHistory />, { wrapper });

      await waitFor(() => {
        expect(
          screen.getByText("Your mint history will appear here"),
        ).toBeInTheDocument();
      });
    });
  });

  describe("success state", () => {
    it("should display transaction table when data exists", async () => {
      render(<TransactionHistory />, { wrapper });

      await waitFor(() => {
        // Check for transaction content by looking for Token IDs
        expect(screen.getByText("#1")).toBeInTheDocument();
        expect(screen.getByText("#2")).toBeInTheDocument();
      });
    });

    it("should render transaction rows correctly", async () => {
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
      mockAlchemyApi.getAssetTransfers.mockResolvedValue({
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
      mockAlchemyApi.getAssetTransfers.mockResolvedValue({
        transfers: mockTransfers,
        pageKey: "next-page-key",
      });

      render(<TransactionHistory />, { wrapper });

      await waitFor(() => {
        expect(
          screen.getByRole("button", { name: /load more/i }),
        ).toBeInTheDocument();
      });

      // Reset mock to track new calls
      mockAlchemyApi.getAssetTransfers.mockClear();
      mockAlchemyApi.getAssetTransfers.mockResolvedValue({
        transfers: mockTransfers,
        pageKey: undefined,
      });

      const loadMoreButton = screen.getByRole("button", { name: /load more/i });
      fireEvent.click(loadMoreButton);

      await waitFor(() => {
        expect(mockAlchemyApi.getAssetTransfers).toHaveBeenCalledWith(
          expect.objectContaining({
            pageKey: "next-page-key",
          }),
        );
      });
    });

    it("should show 'Showing all X transactions' when no more pages", async () => {
      mockAlchemyApi.getAssetTransfers.mockResolvedValue({
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

    it("should update pagination state correctly after loading more", async () => {
      // First page
      mockAlchemyApi.getAssetTransfers.mockResolvedValueOnce({
        transfers: mockTransfers,
        pageKey: "page-2-key",
      });

      render(<TransactionHistory />, { wrapper });

      await waitFor(() => {
        expect(screen.getByText(/2 shown/i)).toBeInTheDocument();
      });

      // Second page
      mockAlchemyApi.getAssetTransfers.mockResolvedValueOnce({
        transfers: mockTransfers,
        pageKey: undefined,
      });

      const loadMoreButton = screen.getByRole("button", { name: /load more/i });
      fireEvent.click(loadMoreButton);

      await waitFor(() => {
        expect(
          screen.getByText(/Showing all 4 transactions/i),
        ).toBeInTheDocument();
      });
    });
  });

  describe("refresh functionality", () => {
    it("should disable refresh button while loading", async () => {
      mockAlchemyApi.getAssetTransfers.mockImplementation(
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

    it("should trigger re-fetch when refreshKey prop changes", async () => {
      const { rerender } = render(<TransactionHistory refreshKey={0} />, {
        wrapper,
      });

      await waitFor(() => {
        expect(mockAlchemyApi.getAssetTransfers).toHaveBeenCalledTimes(1);
      });

      mockAlchemyApi.getAssetTransfers.mockClear();

      rerender(<TransactionHistory refreshKey={1} />);

      await waitFor(() => {
        expect(mockAlchemyApi.getAssetTransfers).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe("data fetching", () => {
    it("should fetch transactions on mount when connected", async () => {
      render(<TransactionHistory />, { wrapper });

      await waitFor(() => {
        expect(mockAlchemyApi.getAssetTransfers).toHaveBeenCalledWith(
          expect.objectContaining({
            address: mockAddress,
            contractAddress: "0x1234567890123456789012345678901234567890",
          }),
        );
      });
    });

    it("should clear transactions when wallet disconnects", async () => {
      const { rerender } = render(<TransactionHistory />, { wrapper });

      await waitFor(() => {
        expect(screen.getByText("#1")).toBeInTheDocument();
      });

      // Disconnect wallet
      useAccountSpy.mockReturnValue({
        address: undefined,
        isConnected: false,
        chain: undefined,
      } as any);

      rerender(<TransactionHistory />);

      expect(
        screen.getByText("Connect your wallet to view transaction history"),
      ).toBeInTheDocument();
    });

    it("should handle transactions with missing timestamps", async () => {
      const transfersWithMissingTimestamp = [
        {
          tokenId: 1n,
          txHash: mockTxHash,
          timestamp: 0, // Missing timestamp
          blockNum: "123456",
          from: "0x0000000000000000000000000000000000000000",
          to: mockAddress,
          type: "mint",
        },
      ];

      mockAlchemyApi.getAssetTransfers.mockResolvedValue({
        transfers: transfersWithMissingTimestamp,
        pageKey: undefined,
      });

      mockAlchemyApi.getBlockByNumber.mockResolvedValue(
        Math.floor(Date.now() / 1000),
      );

      render(<TransactionHistory />, { wrapper });

      await waitFor(() => {
        expect(mockAlchemyApi.getBlockByNumber).toHaveBeenCalledWith("123456");
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
        from: "0x0000000000000000000000000000000000000000",
        to: mockAddress,
        type: "transfer",
      };

      mockAlchemyApi.getAssetTransfers.mockResolvedValue({
        transfers: [mintTransfer],
        pageKey: undefined,
      });

      render(<TransactionHistory />, { wrapper });

      await waitFor(() => {
        expect(screen.getByText("MINT")).toBeInTheDocument();
      });
    });

    it("should classify mint transactions correctly (type=mint)", async () => {
      const mintTransfer = {
        tokenId: 1n,
        txHash: mockTxHash,
        timestamp: Math.floor(Date.now() / 1000),
        blockNum: "123456",
        from: mockAddress,
        to: mockAddress,
        type: "mint",
      };

      mockAlchemyApi.getAssetTransfers.mockResolvedValue({
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
        to: "0xAnotherAddress123456789012345678901234567890",
        type: "transfer",
      };

      mockAlchemyApi.getAssetTransfers.mockResolvedValue({
        transfers: [transferOnly],
        pageKey: undefined,
      });

      render(<TransactionHistory />, { wrapper });

      await waitFor(() => {
        expect(screen.getByText("TRANSFER")).toBeInTheDocument();
      });
    });
  });

  describe("refreshKey prop", () => {
    it("should trigger re-fetch when refreshKey prop changes", async () => {
      const { rerender } = render(<TransactionHistory refreshKey={0} />, {
        wrapper,
      });

      await waitFor(() => {
        expect(mockAlchemyApi.getAssetTransfers).toHaveBeenCalledTimes(1);
      });

      mockAlchemyApi.getAssetTransfers.mockClear();

      rerender(<TransactionHistory refreshKey={1} />);

      await waitFor(() => {
        expect(mockAlchemyApi.getAssetTransfers).toHaveBeenCalledTimes(1);
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

    it("should display card structure correctly", () => {
      const { container } = render(<TransactionHistory />, { wrapper });

      // Check for the card's distinctive classes
      expect(container.querySelector(".rounded-xl")).toBeInTheDocument();
    });
  });
});
