import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { useNftMintedEventsPolling } from "@/hooks/useNftMintedEventsPolling";
import * as wagmi from "wagmi";
import { createConfig, http, usePublicClient } from "wagmi";
import { sepolia } from "wagmi/chains";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider } from "wagmi";
import type { PropsWithChildren } from "react";

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

  return ({ children }: PropsWithChildren) => (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </WagmiProvider>
  );
};

// Mock PublicClient type
type MockPublicClient = {
  getBlockNumber: ReturnType<typeof vi.fn>;
  getLogs: ReturnType<typeof vi.fn>;
};

const createMockPublicClient = (
  getBlockNumberImpl: ReturnType<typeof vi.fn>,
  getLogsImpl: ReturnType<typeof vi.fn>,
): MockPublicClient => ({
  getBlockNumber: getBlockNumberImpl,
  getLogs: getLogsImpl,
});

describe("useNftMintedEventsPolling", () => {
  const mockContractAddress = "0x1234567890123456789012345678901234567890" as `0x${string}`;
  const wrapper = createTestWrapper();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("initialization", () => {
    it("should initialize with empty recentMints array", async () => {
      let blockNumber = 1000n;
      const mockPublicClient = createMockPublicClient(
        vi.fn().mockImplementation(() => Promise.resolve(blockNumber++)),
        vi.fn().mockResolvedValue([]),
      );
      vi.spyOn(wagmi, "usePublicClient").mockReturnValue(
        mockPublicClient as unknown as ReturnType<typeof usePublicClient>,
      );

      const { result } = renderHook(
        () => useNftMintedEventsPolling({ contractAddress: mockContractAddress }),
        { wrapper },
      );

      // Wait for initial fetch to complete
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.recentMints).toEqual([]);
      expect(result.current.error).toBeNull();
    });

    it("should call usePublicClient", () => {
      const usePublicClientSpy = vi.spyOn(wagmi, "usePublicClient");
      usePublicClientSpy.mockReturnValue(
        createMockPublicClient(
          vi.fn().mockResolvedValue(1000n),
          vi.fn().mockResolvedValue([]),
        ) as unknown as ReturnType<typeof usePublicClient>,
      );

      renderHook(
        () => useNftMintedEventsPolling({ contractAddress: mockContractAddress }),
        { wrapper },
      );

      expect(usePublicClientSpy).toHaveBeenCalled();
    });
  });

  describe("event processing", () => {
    it("should process mint events and add to recentMints", async () => {
      let blockNumber = 1000n;
      const mockLogs = [
        {
          args: {
            minter: "0xMinterAddress12345678901234567890123456789" as `0x${string}`,
            tokenId: 1n,
          },
          transactionHash: "0xTxHash123" as `0x${string}`,
          blockNumber: blockNumber,
        },
      ];

      const mockPublicClient = createMockPublicClient(
        vi.fn().mockImplementation(() => Promise.resolve(blockNumber++)),
        vi.fn().mockResolvedValue(mockLogs),
      );

      vi.spyOn(wagmi, "usePublicClient").mockReturnValue(
        mockPublicClient as unknown as ReturnType<typeof usePublicClient>,
      );

      const { result } = renderHook(
        () => useNftMintedEventsPolling({ contractAddress: mockContractAddress }),
        { wrapper },
      );

      await waitFor(
        () => {
          expect(result.current.recentMints).toHaveLength(1);
        },
        { timeout: 10000 },
      );

      expect(result.current.recentMints[0].tokenId).toBe(1n);
      expect(result.current.recentMints[0].minter).toBe(
        "0xMinterAddress12345678901234567890123456789",
      );
    });

    it("should filter out logs with missing minter or tokenId", async () => {
      let blockNumber = 1000n;
      const mockLogs = [
        {
          args: { minter: undefined, tokenId: 1n },
          transactionHash: "0xTxHash1" as `0x${string}`,
          blockNumber: blockNumber,
        },
        {
          args: { minter: "0xMinter" as `0x${string}`, tokenId: undefined },
          transactionHash: "0xTxHash2" as `0x${string}`,
          blockNumber: blockNumber,
        },
        {
          args: { minter: "0xMinter" as `0x${string}`, tokenId: 3n },
          transactionHash: "0xTxHash3" as `0x${string}`,
          blockNumber: blockNumber,
        },
      ];

      const mockPublicClient = createMockPublicClient(
        vi.fn().mockImplementation(() => Promise.resolve(blockNumber++)),
        vi.fn().mockResolvedValue(mockLogs),
      );

      vi.spyOn(wagmi, "usePublicClient").mockReturnValue(
        mockPublicClient as unknown as ReturnType<typeof usePublicClient>,
      );

      const { result } = renderHook(
        () => useNftMintedEventsPolling({ contractAddress: mockContractAddress }),
        { wrapper },
      );

      await waitFor(
        () => {
          expect(result.current.recentMints).toHaveLength(1);
        },
        { timeout: 10000 },
      );

      expect(result.current.recentMints[0].tokenId).toBe(3n);
    });

    it("should handle empty NFT list", async () => {
      let blockNumber = 1000n;
      const mockPublicClient = createMockPublicClient(
        vi.fn().mockImplementation(() => Promise.resolve(blockNumber++)),
        vi.fn().mockResolvedValue([]),
      );

      vi.spyOn(wagmi, "usePublicClient").mockReturnValue(
        mockPublicClient as unknown as ReturnType<typeof usePublicClient>,
      );

      const { result } = renderHook(
        () => useNftMintedEventsPolling({ contractAddress: mockContractAddress }),
        { wrapper },
      );

      await waitFor(
        () => {
          expect(result.current.isLoading).toBe(false);
        },
        { timeout: 10000 },
      );

      expect(result.current.recentMints).toEqual([]);
    });
  });

  describe("error handling", () => {
    it("should set error state when getBlockNumber fails", async () => {
      const mockPublicClient = createMockPublicClient(
        vi.fn().mockRejectedValue(new Error("Network error")),
        vi.fn(),
      );

      vi.spyOn(wagmi, "usePublicClient").mockReturnValue(
        mockPublicClient as unknown as ReturnType<typeof usePublicClient>,
      );

      const { result } = renderHook(
        () => useNftMintedEventsPolling({ contractAddress: mockContractAddress }),
        { wrapper },
      );

      await waitFor(
        () => {
          expect(result.current.error).toBe("Network error");
        },
        { timeout: 10000 },
      );
    });

    it("should set error state when getLogs fails", async () => {
      let blockNumber = 1000n;
      const mockPublicClient = createMockPublicClient(
        vi.fn().mockImplementation(() => Promise.resolve(blockNumber++)),
        vi.fn().mockRejectedValue(new Error("Logs fetch error")),
      );

      vi.spyOn(wagmi, "usePublicClient").mockReturnValue(
        mockPublicClient as unknown as ReturnType<typeof usePublicClient>,
      );

      const { result } = renderHook(
        () => useNftMintedEventsPolling({ contractAddress: mockContractAddress }),
        { wrapper },
      );

      await waitFor(
        () => {
          expect(result.current.error).toBe("Logs fetch error");
        },
        { timeout: 10000 },
      );
    });

    it("should handle error when publicClient is not available", async () => {
      vi.spyOn(wagmi, "usePublicClient").mockReturnValue(null as unknown as ReturnType<typeof usePublicClient>);

      const { result } = renderHook(
        () => useNftMintedEventsPolling({ contractAddress: mockContractAddress }),
        { wrapper },
      );

      await waitFor(
        () => {
          expect(result.current.isLoading).toBe(false);
        },
        { timeout: 10000 },
      );

      // Should not fetch when publicClient is null
      expect(result.current.recentMints).toEqual([]);
    });
  });

  describe("cleanup", () => {
    it("should clear interval on unmount", async () => {
      let blockNumber = 1000n;
      const getBlockNumberSpy = vi.fn().mockImplementation(() => Promise.resolve(blockNumber++));
      const getLogsSpy = vi.fn().mockResolvedValue([]);

      const mockPublicClient = createMockPublicClient(getBlockNumberSpy, getLogsSpy);

      vi.spyOn(wagmi, "usePublicClient").mockReturnValue(
        mockPublicClient as unknown as ReturnType<typeof usePublicClient>,
      );

      const { unmount } = renderHook(
        () =>
          useNftMintedEventsPolling({
            contractAddress: mockContractAddress,
            pollInterval: 1000, // Short interval for testing
          }),
        { wrapper },
      );

      // Wait for initial fetch
      await waitFor(() => {
        expect(getBlockNumberSpy).toHaveBeenCalledTimes(1);
      });

      const initialCallCount = getBlockNumberSpy.mock.calls.length;

      // Unmount immediately
      unmount();

      // Wait a bit longer than the poll interval
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 2000));
      });

      // After unmount, should not continue polling
      // Allow for 1-2 additional calls due to timing
      expect(getBlockNumberSpy.mock.calls.length).toBeLessThanOrEqual(initialCallCount + 1);
    });
  });
});
