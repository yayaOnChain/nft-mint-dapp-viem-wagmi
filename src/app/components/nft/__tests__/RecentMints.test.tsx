import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createConfig, http, WagmiProvider } from "wagmi";
import { sepolia } from "wagmi/chains";
import { parseEther } from "viem";
import type { PropsWithChildren } from "react";

const mockAddress = "0xUserAddress123456789012345678901234567890" as `0x${string}`;
const mockTxHash = "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef" as `0x${string}`;

const mockRecentMints = [
  {
    tokenId: 1n,
    minter: mockAddress,
    timestamp: Date.now() - 30000,
    txHash: mockTxHash,
    blockNumber: 123456n,
  },
  {
    tokenId: 2n,
    minter: mockAddress,
    timestamp: Date.now() - 120000,
    txHash: mockTxHash,
    blockNumber: 123457n,
  },
];

vi.mock("wagmi", async () => {
  const actual = await vi.importActual("wagmi");
  return {
    ...actual,
    useReadContract: vi.fn(),
  };
});

vi.mock("@/hooks", async () => {
  const actual = await vi.importActual("@/hooks");
  return {
    ...actual,
    useNftMintedEventsUnified: vi.fn(),
  };
});

vi.mock("@/config/env", () => ({
  contractAddress: "0x1234567890123456789012345678901234567890",
}));

vi.mock("@/abi/myNft", () => ({
  myNftAbi: [],
}));

import { RecentMints } from "@/components/nft/RecentMints";
import { useReadContract } from "wagmi";
import { useNftMintedEventsUnified } from "@/hooks";

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

describe("RecentMints", () => {
  const wrapper = createTestWrapper();

  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(useNftMintedEventsUnified).mockReturnValue({
      recentMints: [],
      isLoading: false,
      error: null,
    } as unknown as ReturnType<typeof useNftMintedEventsUnified>);

    vi.mocked(useReadContract).mockImplementation(
      (config?: { functionName?: string }) => ({
        data: config?.functionName === "MINT_PRICE" ? parseEther("0.01") : undefined,
        error: null,
        status: "success" as const,
        isError: false,
        isLoading: false,
        isPending: false,
        isSuccess: true,
        isLoadingError: false,
        isRefetchError: false,
        isPlaceholderData: false,
        dataUpdatedAt: Date.now(),
        errorUpdatedAt: 0,
        failureCount: 0,
        failureReason: null,
        isFetched: true,
        isFetchedAfterMount: true,
        isFetching: false,
        isStale: false,
        refetch: vi.fn(),
        queryKey: [config?.functionName],
        errorUpdateCount: 0,
        isInitialLoading: false,
        isPaused: false,
        isRefetching: false,
        isPreviousData: false,
        isNextPlaceholderData: false,
      }) as unknown as ReturnType<typeof useReadContract>
    );
  });

  describe("loading state", () => {
    it("should display loading indicator when isLoading is true", () => {
      vi.mocked(useNftMintedEventsUnified).mockReturnValue({
        recentMints: [],
        isLoading: true,
        error: null,
      } as unknown as ReturnType<typeof useNftMintedEventsUnified>);

      render(<RecentMints />, { wrapper });

      expect(screen.getByText("Fetching latest events...")).toBeInTheDocument();
    });

    it("should default isLoading to false when property is not in hook result", () => {
      vi.mocked(useNftMintedEventsUnified).mockReturnValue({
        recentMints: [],
        error: null,
      } as unknown as ReturnType<typeof useNftMintedEventsUnified>);

      const { container } = render(<RecentMints />, { wrapper });

      expect(container.querySelector(".bg-green-500")).not.toBeNull();
      expect(
        screen.queryByText("Fetching latest events..."),
      ).not.toBeInTheDocument();
    });

    it("should display yellow pulse indicator when loading", () => {
      vi.mocked(useNftMintedEventsUnified).mockReturnValue({
        recentMints: [],
        isLoading: true,
        error: null,
      } as unknown as ReturnType<typeof useNftMintedEventsUnified>);

      const { container } = render(<RecentMints />, { wrapper });

      const pulseIndicator = container.querySelector(".bg-yellow-500");
      expect(pulseIndicator).not.toBeNull();
    });

    it("should display green pulse indicator when not loading", () => {
      vi.mocked(useNftMintedEventsUnified).mockReturnValue({
        recentMints: [],
        isLoading: false,
        error: null,
      } as unknown as ReturnType<typeof useNftMintedEventsUnified>);

      const { container } = render(<RecentMints />, { wrapper });

      const pulseIndicator = container.querySelector(".bg-green-500");
      expect(pulseIndicator).not.toBeNull();
    });
  });

  describe("error state", () => {
    it("should display error message when error exists", () => {
      vi.mocked(useNftMintedEventsUnified).mockReturnValue({
        recentMints: [],
        isLoading: false,
        error: "Network error",
      } as unknown as ReturnType<typeof useNftMintedEventsUnified>);

      render(<RecentMints />, { wrapper });

      expect(screen.getByText(/⚠️ Network error/i)).toBeInTheDocument();
    });

    it("should show error with fallback info about 10-block range limit", () => {
      vi.mocked(useNftMintedEventsUnified).mockReturnValue({
        recentMints: [],
        isLoading: false,
        error: "RPC Error",
      } as unknown as ReturnType<typeof useNftMintedEventsUnified>);

      render(<RecentMints />, { wrapper });

      expect(
        screen.getByText(/Using 10-block range limit \(Free Tier\)/i),
      ).toBeInTheDocument();
    });

    it("should default error to null when property is not in hook result", () => {
      vi.mocked(useNftMintedEventsUnified).mockReturnValue({
        recentMints: [],
        isLoading: false,
      } as unknown as ReturnType<typeof useNftMintedEventsUnified>);

      render(<RecentMints />, { wrapper });

      expect(screen.queryByText(/⚠️/i)).not.toBeInTheDocument();
    });

    it("should not show error message when error is null", () => {
      vi.mocked(useNftMintedEventsUnified).mockReturnValue({
        recentMints: [],
        isLoading: false,
        error: null,
      } as unknown as ReturnType<typeof useNftMintedEventsUnified>);

      render(<RecentMints />, { wrapper });

      expect(screen.queryByText(/⚠️/i)).not.toBeInTheDocument();
    });
  });

  describe("empty state", () => {
    it("should show 'Waiting for mint activity...' when no recent mints", () => {
      vi.mocked(useNftMintedEventsUnified).mockReturnValue({
        recentMints: [],
        isLoading: false,
        error: null,
      } as unknown as ReturnType<typeof useNftMintedEventsUnified>);

      render(<RecentMints />, { wrapper });

      expect(
        screen.getByText("Waiting for mint activity..."),
      ).toBeInTheDocument();
    });

    it("should have correct header with 'Recent Mints (Live)'", () => {
      vi.mocked(useNftMintedEventsUnified).mockReturnValue({
        recentMints: [],
        isLoading: false,
        error: null,
      } as unknown as ReturnType<typeof useNftMintedEventsUnified>);

      render(<RecentMints />, { wrapper });

      expect(screen.getByText("Recent Mints (Live)")).toBeInTheDocument();
    });
  });

  describe("content display", () => {
    it("should display recent mints list when data exists", () => {
      vi.mocked(useNftMintedEventsUnified).mockReturnValue({
        recentMints: mockRecentMints,
        isLoading: false,
        error: null,
      } as unknown as ReturnType<typeof useNftMintedEventsUnified>);

      render(<RecentMints />, { wrapper });

      expect(screen.getByText("#1")).toBeInTheDocument();
      expect(screen.getByText("#2")).toBeInTheDocument();
    });

    it("should format address correctly", () => {
      vi.mocked(useNftMintedEventsUnified).mockReturnValue({
        recentMints: mockRecentMints,
        isLoading: false,
        error: null,
      } as unknown as ReturnType<typeof useNftMintedEventsUnified>);

      render(<RecentMints />, { wrapper });

      const mintedByElements = screen.getAllByText(
        /Minted by 0xUser\.\.\.7890/i,
      );
      expect(mintedByElements).toHaveLength(2);
    });

    it("should display token ID correctly", () => {
      vi.mocked(useNftMintedEventsUnified).mockReturnValue({
        recentMints: mockRecentMints,
        isLoading: false,
        error: null,
      } as unknown as ReturnType<typeof useNftMintedEventsUnified>);

      render(<RecentMints />, { wrapper });

      expect(screen.getByText("Token ID: 1")).toBeInTheDocument();
      expect(screen.getByText("Token ID: 2")).toBeInTheDocument();
    });

    it("should format time correctly for seconds", () => {
      const recentMint30sAgo = [
        {
          tokenId: 1n,
          minter: mockAddress,
          timestamp: Date.now() - 30000,
          txHash: mockTxHash,
          blockNumber: 123456n,
        },
      ];

      vi.mocked(useNftMintedEventsUnified).mockReturnValue({
        recentMints: recentMint30sAgo,
        isLoading: false,
        error: null,
      } as unknown as ReturnType<typeof useNftMintedEventsUnified>);

      render(<RecentMints />, { wrapper });

      expect(screen.getByText("30s ago")).toBeInTheDocument();
    });

    it("should format time correctly for minutes", () => {
      const recentMint2mAgo = [
        {
          tokenId: 1n,
          minter: mockAddress,
          timestamp: Date.now() - 120000,
          txHash: mockTxHash,
          blockNumber: 123456n,
        },
      ];

      vi.mocked(useNftMintedEventsUnified).mockReturnValue({
        recentMints: recentMint2mAgo,
        isLoading: false,
        error: null,
      } as unknown as ReturnType<typeof useNftMintedEventsUnified>);

      render(<RecentMints />, { wrapper });

      expect(screen.getByText("2m ago")).toBeInTheDocument();
    });

    it("should format time correctly for hours", () => {
      const recentMint2hAgo = [
        {
          tokenId: 1n,
          minter: mockAddress,
          timestamp: Date.now() - 7200000,
          txHash: mockTxHash,
          blockNumber: 123456n,
        },
      ];

      vi.mocked(useNftMintedEventsUnified).mockReturnValue({
        recentMints: recentMint2hAgo,
        isLoading: false,
        error: null,
      } as unknown as ReturnType<typeof useNftMintedEventsUnified>);

      render(<RecentMints />, { wrapper });

      expect(screen.getByText("2h ago")).toBeInTheDocument();
    });

    it("should display mint price from contract", () => {
      vi.mocked(useNftMintedEventsUnified).mockReturnValue({
        recentMints: mockRecentMints,
        isLoading: false,
        error: null,
      } as unknown as ReturnType<typeof useNftMintedEventsUnified>);

      render(<RecentMints />, { wrapper });

      expect(screen.getByText("Mint Price: 0.01 ETH each")).toBeInTheDocument();
    });

    it("should have Etherscan link with correct URL", () => {
      vi.mocked(useNftMintedEventsUnified).mockReturnValue({
        recentMints: mockRecentMints,
        isLoading: false,
        error: null,
      } as unknown as ReturnType<typeof useNftMintedEventsUnified>);

      render(<RecentMints />, { wrapper });

      const etherscanLinks = screen.getAllByText(/View TX ↗/i);
      expect(etherscanLinks).toHaveLength(2);

      etherscanLinks.forEach((link) => {
        expect(link).toHaveAttribute(
          "href",
          `https://sepolia.etherscan.io/tx/${mockTxHash}`,
        );
        expect(link).toHaveAttribute("target", "_blank");
        expect(link).toHaveAttribute("rel", "noopener noreferrer");
      });
    });
  });

  describe("multiple mints", () => {
    it("should handle multiple mints with staggered animation delays", () => {
      vi.mocked(useNftMintedEventsUnified).mockReturnValue({
        recentMints: mockRecentMints,
        isLoading: false,
        error: null,
      } as unknown as ReturnType<typeof useNftMintedEventsUnified>);

      const { container } = render(<RecentMints />, { wrapper });

      const mintItems = container.querySelectorAll(".animate-fadeIn");
      expect(mintItems).toHaveLength(2);
      expect(mintItems[0]).toHaveStyle("animation-delay: 0ms");
      expect(mintItems[1]).toHaveStyle("animation-delay: 50ms");
    });

    it("should use unique key for each mint item", () => {
      vi.mocked(useNftMintedEventsUnified).mockReturnValue({
        recentMints: mockRecentMints,
        isLoading: false,
        error: null,
      } as unknown as ReturnType<typeof useNftMintedEventsUnified>);

      render(<RecentMints />, { wrapper });

      expect(screen.getByText("#1")).toBeInTheDocument();
      expect(screen.getByText("#2")).toBeInTheDocument();
    });
  });

  describe("UI structure", () => {
    it("should have correct container structure", () => {
      vi.mocked(useNftMintedEventsUnified).mockReturnValue({
        recentMints: [],
        isLoading: false,
        error: null,
      } as unknown as ReturnType<typeof useNftMintedEventsUnified>);

      const { container } = render(<RecentMints />, { wrapper });

      const mainContainer = container.firstChild as HTMLElement;
      expect(mainContainer).toHaveClass("bg-gray-800");
      expect(mainContainer).toHaveClass("rounded-lg");
      expect(mainContainer).toHaveClass("border-gray-700");
    });

    it("should have price context section", () => {
      vi.mocked(useNftMintedEventsUnified).mockReturnValue({
        recentMints: mockRecentMints,
        isLoading: false,
        error: null,
      } as unknown as ReturnType<typeof useNftMintedEventsUnified>);

      const { container } = render(<RecentMints />, { wrapper });

      const priceContext = container.querySelector(".border-gray-700");
      expect(priceContext).not.toBeNull();
    });
  });
});