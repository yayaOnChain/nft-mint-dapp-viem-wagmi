import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider, createConfig, http } from "wagmi";
import { sepolia } from "wagmi/chains";
import type { PropsWithChildren } from "react";

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

// Mock callback storage - defined as module-level variables
let onLogsCallback: ((logs: Array<{
  args: { minter?: `0x${string}`; tokenId?: bigint };
  transactionHash: `0x${string}`;
  blockNumber: bigint;
}>) => void) | null = null;
let onErrorCallback: ((error: Error) => void) | null = null;

// Mock wagmi module
vi.mock("wagmi", async () => {
  const actual = await vi.importActual("wagmi");

  const mockUseWatchContractEvent = vi.fn().mockImplementation((params: {
    address: `0x${string}`;
    abi: unknown;
    eventName: string;
    onLogs?: (logs: unknown[]) => void;
    onError?: (error: Error) => void;
  }) => {
    if (params.onLogs) {
      onLogsCallback = params.onLogs as typeof onLogsCallback;
    }
    if (params.onError) {
      onErrorCallback = params.onError as typeof onErrorCallback;
    }
    return undefined;
  });

  return {
    ...actual,
    useWatchContractEvent: mockUseWatchContractEvent,
  };
});

// Import hook after mock
import { useNftMintedEvents } from "@/hooks/useNftMintedEvents";

describe("useNftMintedEvents", () => {
  const mockContractAddress = "0x1234567890123456789012345678901234567890" as `0x${string}`;
  const wrapper = createTestWrapper();

  beforeEach(() => {
    vi.clearAllMocks();
    onLogsCallback = null;
    onErrorCallback = null;
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

    it("should call useWatchContractEvent with correct parameters", async () => {
      const { useWatchContractEvent } = await import("wagmi");

      renderHook(
        () => useNftMintedEvents({ contractAddress: mockContractAddress }),
        { wrapper },
      );

      expect(useWatchContractEvent).toHaveBeenCalledWith(
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
      const { result } = renderHook(
        () => useNftMintedEvents({ contractAddress: mockContractAddress }),
        { wrapper },
      );

      const mockLogs = [
        {
          args: {
            minter: "0xMinterAddress12345678901234567890123456789" as `0x${string}`,
            tokenId: 1n,
          },
          transactionHash: "0xTxHash123456789012345678901234567890123456789012345678901234567890" as `0x${string}`,
          blockNumber: 12345678n,
        },
      ];

      act(() => {
        onLogsCallback?.(mockLogs);
      });

      await waitFor(() => {
        expect(result.current.recentMints).toHaveLength(1);
      });

      expect(result.current.recentMints[0]).toMatchObject({
        minter: "0xMinterAddress12345678901234567890123456789",
        tokenId: 1n,
      });
      expect(result.current.recentMints[0].timestamp).toBeDefined();
    });

    it("should keep only last 10 mints", async () => {
      const { result } = renderHook(
        () => useNftMintedEvents({ contractAddress: mockContractAddress }),
        { wrapper },
      );

      act(() => {
        for (let i = 0; i < 15; i++) {
          onLogsCallback?.([
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

      expect(result.current.recentMints[0].tokenId).toBe(14n);
      expect(result.current.recentMints[9].tokenId).toBe(5n);
    });

    it("should call onNewMint callback when provided", async () => {
      const onNewMintMock = vi.fn();

      renderHook(
        () =>
          useNftMintedEvents({
            contractAddress: mockContractAddress,
            onNewMint: onNewMintMock,
          }),
        { wrapper },
      );

      const mockLogs = [
        {
          args: {
            minter: "0xMinterAddress12345678901234567890123456789" as `0x${string}`,
            tokenId: 42n,
          },
          transactionHash: "0xTxHash123456789012345678901234567890123456789012345678901234567890" as `0x${string}`,
          blockNumber: 12345678n,
        },
      ];

      act(() => {
        onLogsCallback?.(mockLogs);
      });

      await waitFor(() => {
        expect(onNewMintMock).toHaveBeenCalledTimes(1);
      });

      expect(onNewMintMock).toHaveBeenCalledWith(
        expect.objectContaining({
          minter: "0xMinterAddress12345678901234567890123456789",
          tokenId: 42n,
          timestamp: expect.any(Number),
        })
      );
    });

    it("should default blockNumber to BigInt(0) when not provided", async () => {
      const onNewMintMock = vi.fn();

      renderHook(
        () =>
          useNftMintedEvents({
            contractAddress: mockContractAddress,
            onNewMint: onNewMintMock,
          }),
        { wrapper },
      );

      act(() => {
        onLogsCallback?.([
          {
            args: { minter: "0xMinter" as `0x${string}`, tokenId: 1n },
            transactionHash: "0xTxHash" as `0x${string}`,
            blockNumber: undefined as unknown as bigint,
          },
        ]);
      });

      await waitFor(() => {
        expect(onNewMintMock).toHaveBeenCalledWith(
          expect.objectContaining({ blockNumber: BigInt(0) })
        );
      });
    });

    it("should handle multiple logs in single event", async () => {
      const { result } = renderHook(
        () => useNftMintedEvents({ contractAddress: mockContractAddress }),
        { wrapper },
      );

      const mockLogs = [
        {
          args: { minter: "0xMinter1" as `0x${string}`, tokenId: 1n },
          transactionHash: "0xTxHash1" as `0x${string}`,
          blockNumber: 12345678n,
        },
        {
          args: { minter: "0xMinter2" as `0x${string}`, tokenId: 2n },
          transactionHash: "0xTxHash2" as `0x${string}`,
          blockNumber: 12345678n,
        },
        {
          args: { minter: "0xMinter3" as `0x${string}`, tokenId: 3n },
          transactionHash: "0xTxHash3" as `0x${string}`,
          blockNumber: 12345678n,
        },
      ];

      act(() => {
        onLogsCallback?.(mockLogs);
      });

      await waitFor(() => {
        expect(result.current.recentMints).toHaveLength(3);
      });

      expect(result.current.recentMints[0].tokenId).toBe(3n);
      expect(result.current.recentMints[1].tokenId).toBe(2n);
      expect(result.current.recentMints[2].tokenId).toBe(1n);
    });

    it("should ignore logs with missing minter or tokenId", async () => {
      const { result } = renderHook(
        () => useNftMintedEvents({ contractAddress: mockContractAddress }),
        { wrapper },
      );

      const mockLogs = [
        { args: { minter: undefined, tokenId: 1n }, transactionHash: "0xTxHash1" as `0x${string}`, blockNumber: 12345678n },
        { args: { minter: "0xMinter2" as `0x${string}`, tokenId: undefined }, transactionHash: "0xTxHash2" as `0x${string}`, blockNumber: 12345678n },
        { args: { minter: "0xMinter3" as `0x${string}`, tokenId: 3n }, transactionHash: "0xTxHash3" as `0x${string}`, blockNumber: 12345678n },
      ];

      act(() => {
        onLogsCallback?.(mockLogs);
      });

      await waitFor(() => {
        expect(result.current.recentMints).toHaveLength(1);
      });

      expect(result.current.recentMints[0].tokenId).toBe(3n);
    });
  });

  describe("error handling", () => {
    it("should log error when onError is triggered", () => {
      const consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

      renderHook(
        () => useNftMintedEvents({ contractAddress: mockContractAddress }),
        { wrapper },
      );

      const mockError = new Error("WebSocket disconnected");

      act(() => {
        onErrorCallback?.(mockError);
      });

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining("[useNftMintedEvents] Event subscription error")
      );
    });

    it("should silently ignore filter not found errors", () => {
      const consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

      renderHook(
        () => useNftMintedEvents({ contractAddress: mockContractAddress }),
        { wrapper },
      );

      act(() => {
        onErrorCallback?.(new Error("filter not found"));
      });

      expect(consoleWarnSpy).not.toHaveBeenCalled();
    });

    it("should stop warning after exceeding maxErrors", () => {
      const consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

      renderHook(
        () => useNftMintedEvents({ contractAddress: mockContractAddress }),
        { wrapper },
      );

      for (let i = 0; i < 4; i++) {
        act(() => {
          onErrorCallback?.(new Error("RPC error"));
        });
      }

      expect(consoleWarnSpy).toHaveBeenCalledTimes(3);
    });
  });

  describe("cleanup", () => {
    it("should clear recentMints when contractAddress changes", async () => {
      const { result, rerender } = renderHook(
        ({ address }) => useNftMintedEvents({ contractAddress: address }),
        {
          wrapper,
          initialProps: { address: mockContractAddress },
        },
      );

      act(() => {
        onLogsCallback?.([
          {
            args: { minter: "0xMinter" as `0x${string}`, tokenId: 1n },
            transactionHash: "0xTxHash" as `0x${string}`,
            blockNumber: 12345678n,
          },
        ]);
      });

      await waitFor(() => {
        expect(result.current.recentMints).toHaveLength(1);
      });

      const newAddress = "0xNewContractAddress123456789012345678901234567" as `0x${string}`;
      rerender({ address: newAddress });

      await waitFor(() => {
        expect(result.current.recentMints).toHaveLength(0);
      });
    });
  });
});