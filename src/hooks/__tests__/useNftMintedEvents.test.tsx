import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { useNftMintedEvents } from "@/hooks/useNftMintedEvents";
import * as wagmi from "wagmi";
import { createConfig, http } from "wagmi";
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
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  );
};

// Type for the mock log that matches what the hook processes
type MockLog = {
  args: {
    minter?: `0x${string}`;
    tokenId?: bigint;
  };
  transactionHash: `0x${string}`;
  blockNumber: bigint;
};

describe("useNftMintedEvents", () => {
  const mockContractAddress =
    "0x1234567890123456789012345678901234567890" as `0x${string}`;
  const wrapper = createTestWrapper();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("initialization", () => {
    it("should initialize with empty recentMints array", () => {
      const { result } = renderHook(
        () => useNftMintedEvents({ contractAddress: mockContractAddress }),
        { wrapper },
      );

      expect(result.current.recentMints).toEqual([]);
    });

    it("should useWatchContractEvent with correct parameters", () => {
      const useWatchContractEventSpy = vi.spyOn(wagmi, "useWatchContractEvent");

      renderHook(
        () => useNftMintedEvents({ contractAddress: mockContractAddress }),
        { wrapper },
      );

      expect(useWatchContractEventSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          address: mockContractAddress,
          abi: expect.any(Array),
          eventName: "NFTMinted",
          onLogs: expect.any(Function),
          onError: expect.any(Function),
        })
      );
    });
  });

  describe("event handling", () => {
    it("should add new mint to recentMints when event is triggered", async () => {
      let onLogsCallback: (logs: MockLog[]) => void;

      vi.spyOn(wagmi, "useWatchContractEvent").mockImplementation((...args) => {
        const params = args[0];
        if (params && typeof params === "object" && "onLogs" in params) {
          onLogsCallback = params.onLogs as unknown as (logs: MockLog[]) => void;
        }
        return vi.fn();
      });

      const { result } = renderHook(
        () => useNftMintedEvents({ contractAddress: mockContractAddress }),
        { wrapper },
      );

      const mockLogs: MockLog[] = [
        {
          args: {
            minter:
              "0xMinterAddress12345678901234567890123456789" as `0x${string}`,
            tokenId: 1n,
          },
          transactionHash:
            "0xTxHash123456789012345678901234567890123456789012345678901234567890",
          blockNumber: 12345678n,
        },
      ];

      act(() => {
        onLogsCallback!(mockLogs);
      });

      await waitFor(() => {
        expect(result.current.recentMints).toHaveLength(1);
      });

      expect(result.current.recentMints[0]).toMatchObject({
        minter: "0xMinterAddress12345678901234567890123456789",
        tokenId: 1n,
      });
      expect(result.current.recentMints[0].timestamp).toBeDefined();
      // expect(result.current.recentMints[0].txHash).toBe(
      //   "0xTxHash123456789012345678901234567890123456789012345678901234567890",
      // );
    });

    it("should keep only last 10 mints", async () => {
      let onLogsCallback: (logs: MockLog[]) => void;

      vi.spyOn(wagmi, "useWatchContractEvent").mockImplementation((...args) => {
        const params = args[0];
        if (params && typeof params === "object" && "onLogs" in params) {
          onLogsCallback = params.onLogs as unknown as (logs: MockLog[]) => void;
        }
        return vi.fn();
      });

      const { result } = renderHook(
        () => useNftMintedEvents({ contractAddress: mockContractAddress }),
        { wrapper },
      );

      // Add 15 mints
      act(() => {
        for (let i = 0; i < 15; i++) {
          onLogsCallback!([
            {
              args: {
                minter: `0xMinter${i}` as `0x${string}`,
                tokenId: BigInt(i),
              },
              transactionHash: `0xTxHash${i}` as `0x${string}`,
              blockNumber: BigInt(12345678 + i),
            },
          ]);
        }
      });

      await waitFor(() => {
        expect(result.current.recentMints).toHaveLength(10);
      });

      // Should have the last 10 mints (5-14)
      expect(result.current.recentMints[0].tokenId).toBe(14n);
      expect(result.current.recentMints[9].tokenId).toBe(5n);
    });

    it("should call onNewMint callback when provided", async () => {
      const onNewMintMock = vi.fn();
      let onLogsCallback: (logs: MockLog[]) => void;

      vi.spyOn(wagmi, "useWatchContractEvent").mockImplementation((...args) => {
        const params = args[0];
        if (params && typeof params === "object" && "onLogs" in params) {
          onLogsCallback = params.onLogs as unknown as (logs: MockLog[]) => void;
        }
        return vi.fn();
      });

      renderHook(
        () =>
          useNftMintedEvents({
            contractAddress: mockContractAddress,
            onNewMint: onNewMintMock,
          }),
        { wrapper },
      );

      const mockLogs: MockLog[] = [
        {
          args: {
            minter:
              "0xMinterAddress12345678901234567890123456789" as `0x${string}`,
            tokenId: 42n,
          },
          transactionHash:
            "0xTxHash123456789012345678901234567890123456789012345678901234567890",
          blockNumber: 12345678n,
        },
      ];

      act(() => {
        onLogsCallback!(mockLogs);
      });

      await waitFor(() => {
        expect(onNewMintMock).toHaveBeenCalledTimes(1);
      });

      expect(onNewMintMock).toHaveBeenCalledWith({
        minter: "0xMinterAddress12345678901234567890123456789",
        tokenId: 42n,
        timestamp: expect.any(Number),
        txHash:
          "0xTxHash123456789012345678901234567890123456789012345678901234567890",
        blockNumber: 12345678n,
      });
    });

    it("should handle multiple logs in single event", async () => {
      let onLogsCallback: (logs: MockLog[]) => void;

      vi.spyOn(wagmi, "useWatchContractEvent").mockImplementation((...args) => {
        const params = args[0];
        if (params && typeof params === "object" && "onLogs" in params) {
          onLogsCallback = params.onLogs as unknown as (logs: MockLog[]) => void;
        }
        return vi.fn();
      });

      const { result } = renderHook(
        () => useNftMintedEvents({ contractAddress: mockContractAddress }),
        { wrapper },
      );

      const mockLogs: MockLog[] = [
        {
          args: {
            minter: "0xMinter1" as `0x${string}`,
            tokenId: 1n,
          },
          transactionHash: "0xTxHash1" as `0x${string}`,
          blockNumber: 12345678n,
        },
        {
          args: {
            minter: "0xMinter2" as `0x${string}`,
            tokenId: 2n,
          },
          transactionHash: "0xTxHash2" as `0x${string}`,
          blockNumber: 12345678n,
        },
        {
          args: {
            minter: "0xMinter3" as `0x${string}`,
            tokenId: 3n,
          },
          transactionHash: "0xTxHash3" as `0x${string}`,
          blockNumber: 12345678n,
        },
      ];

      act(() => {
        onLogsCallback!(mockLogs);
      });

      await waitFor(() => {
        expect(result.current.recentMints).toHaveLength(3);
      });

      expect(result.current.recentMints[0].tokenId).toBe(3n);
      expect(result.current.recentMints[1].tokenId).toBe(2n);
      expect(result.current.recentMints[2].tokenId).toBe(1n);
    });

    it("should ignore logs with missing minter or tokenId", async () => {
      let onLogsCallback: (logs: MockLog[]) => void;

      vi.spyOn(wagmi, "useWatchContractEvent").mockImplementation((...args) => {
        const params = args[0];
        if (params && typeof params === "object" && "onLogs" in params) {
          onLogsCallback = params.onLogs as unknown as (logs: MockLog[]) => void;
        }
        return vi.fn();
      });

      const { result } = renderHook(
        () => useNftMintedEvents({ contractAddress: mockContractAddress }),
        { wrapper },
      );

      const mockLogs: MockLog[] = [
        {
          args: {
            minter: undefined,
            tokenId: 1n,
          },
          transactionHash: "0xTxHash1" as `0x${string}`,
          blockNumber: 12345678n,
        },
        {
          args: {
            minter: "0xMinter2" as `0x${string}`,
            tokenId: undefined,
          },
          transactionHash: "0xTxHash2" as `0x${string}`,
          blockNumber: 12345678n,
        },
        {
          args: {
            minter: "0xMinter3" as `0x${string}`,
            tokenId: 3n,
          },
          transactionHash: "0xTxHash3" as `0x${string}`,
          blockNumber: 12345678n,
        },
      ];

      act(() => {
        onLogsCallback!(mockLogs);
      });

      await waitFor(() => {
        expect(result.current.recentMints).toHaveLength(1);
      });

      expect(result.current.recentMints[0].tokenId).toBe(3n);
    });
  });

  describe("error handling", () => {
    it("should log error when onError is triggered", () => {
      const consoleWarnSpy = vi
        .spyOn(console, "warn")
        .mockImplementation(() => {});
      let onErrorCallback: (error: Error) => void;

      vi.spyOn(wagmi, "useWatchContractEvent").mockImplementation((...args) => {
        const params = args[0];
        if (params && typeof params === "object" && "onError" in params) {
          onErrorCallback = params.onError as unknown as (error: Error) => void;
        }
        return vi.fn();
      });

      renderHook(
        () => useNftMintedEvents({ contractAddress: mockContractAddress }),
        { wrapper },
      );

      const mockError = new Error("WebSocket disconnected");

      act(() => {
        onErrorCallback!(mockError);
      });

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining("[useNftMintedEvents] Event subscription error"),
      );
    });
  });

  describe("cleanup", () => {
    it("should clear recentMints when contractAddress changes", async () => {
      let onLogsCallback: (logs: MockLog[]) => void;

      vi.spyOn(wagmi, "useWatchContractEvent").mockImplementation((...args) => {
        const params = args[0];
        if (params && typeof params === "object" && "onLogs" in params) {
          onLogsCallback = params.onLogs as unknown as (logs: MockLog[]) => void;
        }
        return vi.fn();
      });

      const { result, rerender } = renderHook(
        ({ address }) => useNftMintedEvents({ contractAddress: address }),
        {
          wrapper,
          initialProps: { address: mockContractAddress },
        },
      );

      // Add a mint
      act(() => {
        onLogsCallback!([
          {
            args: {
              minter: "0xMinter" as `0x${string}`,
              tokenId: 1n,
            },
            transactionHash: "0xTxHash" as `0x${string}`,
            blockNumber: 12345678n,
          },
        ]);
      });

      await waitFor(() => {
        expect(result.current.recentMints).toHaveLength(1);
      });

      // Change contract address
      const newAddress = "0xNewContractAddress123456789012345678901234567";
      rerender({ address: newAddress });

      await waitFor(() => {
        expect(result.current.recentMints).toHaveLength(0);
      });
    });
  });
});
