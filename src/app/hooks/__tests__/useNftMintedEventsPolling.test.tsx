import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider, createConfig, http } from "wagmi";
import { sepolia } from "wagmi/chains";
import type { ReactNode } from "react";

const createTestConfig = () =>
  createConfig({
    chains: [sepolia],
    transports: {
      [sepolia.id]: http(),
    },
  });

const createTestWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  const config = createTestConfig();

  return ({ children }: { children: ReactNode }) => (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  );
};

const createMockPublicClient = () => ({
  getBlockNumber: vi.fn(),
  getLogs: vi.fn(),
});

let mockPublicClient = createMockPublicClient();
let publicClientValue: unknown = mockPublicClient;

vi.mock("wagmi", async () => {
  const actual = await vi.importActual("wagmi");
  return {
    ...actual,
    usePublicClient: () => publicClientValue,
  };
});

import { useNftMintedEventsPolling } from "@/hooks/useNftMintedEventsPolling";

interface MockLog {
  args: {
    minter?: `0x${string}`;
    tokenId?: bigint;
    tokenURI?: string;
  };
  transactionHash: `0x${string}`;
  blockNumber: bigint;
}

const createMockLog = (
  tokenId: number,
  minter?: string,
  blockOffset: number = 0,
): MockLog => ({
  args: {
    minter: (minter ?? "0x1111111111111111111111111111111111111111") as `0x${string}`,
    tokenId: BigInt(tokenId),
    tokenURI: `https://example.com/${tokenId}`,
  },
  transactionHash: `0x${tokenId.toString(16).padStart(64, "0")}` as `0x${string}`,
  blockNumber: BigInt(1000 + blockOffset),
});

describe("useNftMintedEventsPolling", () => {
  const mockContractAddress = "0x1234567890123456789012345678901234567890" as `0x${string}`;
  const wrapper = createTestWrapper();

  beforeEach(() => {
    vi.clearAllMocks();
    mockPublicClient = createMockPublicClient();
    publicClientValue = mockPublicClient;
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should initialize with empty recentMints array", async () => {
    mockPublicClient.getBlockNumber.mockResolvedValue(1000n);
    mockPublicClient.getLogs.mockResolvedValue([]);

    const { result } = renderHook(
      () => useNftMintedEventsPolling({ contractAddress: mockContractAddress, pollInterval: 0 }),
      { wrapper },
    );

    await vi.waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.recentMints).toEqual([]);
    expect(result.current.error).toBeNull();
  });

  it("should handle empty logs", async () => {
    mockPublicClient.getBlockNumber.mockResolvedValue(1000n);
    mockPublicClient.getLogs.mockResolvedValue([]);

    const { result } = renderHook(
      () => useNftMintedEventsPolling({ contractAddress: mockContractAddress, pollInterval: 0 }),
      { wrapper },
    );

    await vi.waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.recentMints).toEqual([]);
  });

  it("should return correct initial state", async () => {
    mockPublicClient.getBlockNumber.mockResolvedValue(1000n);
    mockPublicClient.getLogs.mockResolvedValue([]);

    const { result } = renderHook(
      () => useNftMintedEventsPolling({ contractAddress: mockContractAddress, pollInterval: 0 }),
      { wrapper },
    );

    expect(result.current.recentMints).toBeDefined();
    expect(result.current.isLoading).toBeDefined();
    expect(result.current.error).toBeDefined();
  });

  it("should accept custom pollInterval and maxRange parameters", async () => {
    mockPublicClient.getBlockNumber.mockResolvedValue(1000n);
    mockPublicClient.getLogs.mockResolvedValue([]);

    const { result } = renderHook(
      () =>
        useNftMintedEventsPolling({
          contractAddress: mockContractAddress,
          pollInterval: 1000,
          maxRange: 20,
        }),
      { wrapper },
    );

    expect(result.current.recentMints).toBeDefined();
    expect(result.current.isLoading).toBeDefined();
  });

  it("should process mint logs and populate recentMints", async () => {
    const mockLog = createMockLog(1);
    mockPublicClient.getLogs.mockResolvedValue([mockLog]);

    let callCount = 0;
    mockPublicClient.getBlockNumber.mockImplementation(() => {
      callCount++;
      return Promise.resolve(callCount === 1 ? 1000n : 1010n);
    });

    const { result } = renderHook(
      () => useNftMintedEventsPolling({ contractAddress: mockContractAddress, pollInterval: 0 }),
      { wrapper },
    );

    await vi.waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.recentMints).toHaveLength(1);
    expect(result.current.recentMints[0]).toMatchObject({
      minter: mockLog.args.minter,
      tokenId: mockLog.args.tokenId,
      txHash: mockLog.transactionHash,
      blockNumber: mockLog.blockNumber,
    });
    expect(result.current.error).toBeNull();
  });

  it("should filter out logs without minter or tokenId", async () => {
    const validLog = createMockLog(1);
    const noMinterLog: MockLog = {
      ...createMockLog(2),
      args: { ...createMockLog(2).args, minter: undefined },
    };
    const noTokenIdLog: MockLog = {
      ...createMockLog(3),
      args: { ...createMockLog(3).args, tokenId: undefined },
    };

    mockPublicClient.getLogs.mockResolvedValue([validLog, noMinterLog, noTokenIdLog]);

    let callCount = 0;
    mockPublicClient.getBlockNumber.mockImplementation(() => {
      callCount++;
      return Promise.resolve(callCount === 1 ? 1000n : 1010n);
    });

    const { result } = renderHook(
      () => useNftMintedEventsPolling({ contractAddress: mockContractAddress, pollInterval: 0 }),
      { wrapper },
    );

    await vi.waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.recentMints).toHaveLength(1);
    expect(result.current.recentMints[0].tokenId).toBe(1n);
  });

  it("should deduplicate mints by tokenId across poll cycles", async () => {
    let logCallCount = 0;
    mockPublicClient.getLogs.mockImplementation(() => {
      logCallCount++;
      if (logCallCount === 1) return Promise.resolve([createMockLog(1), createMockLog(2)]);
      return Promise.resolve([createMockLog(2), createMockLog(3)]);
    });

    let callCount = 0;
    mockPublicClient.getBlockNumber.mockImplementation(() => {
      callCount++;
      if (callCount === 1) return Promise.resolve(1000n);
      if (callCount === 2) return Promise.resolve(1010n);
      return Promise.resolve(1020n);
    });

    const { result } = renderHook(
      () => useNftMintedEventsPolling({ contractAddress: mockContractAddress, pollInterval: 0 }),
      { wrapper },
    );

    await vi.waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.recentMints).toHaveLength(3);
    const tokenIds = result.current.recentMints.map((m) => m.tokenId);
    expect(tokenIds).toEqual([2n, 3n, 1n]);
  });

  it("should limit mints to last 10", async () => {
    const logs = Array.from({ length: 12 }, (_, i) => createMockLog(i + 1));
    mockPublicClient.getLogs.mockResolvedValue(logs);

    let callCount = 0;
    mockPublicClient.getBlockNumber.mockImplementation(() => {
      callCount++;
      return Promise.resolve(callCount === 1 ? 1000n : 1010n);
    });

    const { result } = renderHook(
      () => useNftMintedEventsPolling({ contractAddress: mockContractAddress, pollInterval: 0 }),
      { wrapper },
    );

    await vi.waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.recentMints).toHaveLength(10);
  });

  it("should handle getBlockNumber error", async () => {
    mockPublicClient.getBlockNumber.mockRejectedValue(new Error("Network error"));
    mockPublicClient.getLogs.mockResolvedValue([]);

    const { result } = renderHook(
      () => useNftMintedEventsPolling({ contractAddress: mockContractAddress, pollInterval: 0 }),
      { wrapper },
    );

    await vi.waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBe("Network error");
  });

  it("should handle getBlockNumber error with non-Error type", async () => {
    mockPublicClient.getBlockNumber.mockRejectedValue("Some string error");
    mockPublicClient.getLogs.mockResolvedValue([]);

    const { result } = renderHook(
      () => useNftMintedEventsPolling({ contractAddress: mockContractAddress, pollInterval: 0 }),
      { wrapper },
    );

    await vi.waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBe("Unknown error occurred");
  });

  it("should handle getLogs error in fetchEventsInRange", async () => {
    let callCount = 0;
    mockPublicClient.getBlockNumber.mockImplementation(() => {
      callCount++;
      return Promise.resolve(callCount === 1 ? 1000n : 1010n);
    });
    mockPublicClient.getLogs.mockRejectedValue(new Error("RPC error"));

    const { result } = renderHook(
      () => useNftMintedEventsPolling({ contractAddress: mockContractAddress, pollInterval: 0 }),
      { wrapper },
    );

    await vi.waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBe("RPC error");
  });

  it("should handle null publicClient", async () => {
    publicClientValue = undefined;

    const { result } = renderHook(
      () => useNftMintedEventsPolling({ contractAddress: mockContractAddress, pollInterval: 0 }),
      { wrapper },
    );

    await vi.waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.recentMints).toEqual([]);
    expect(result.current.error).toBeNull();
  });

  it("should handle unmount before async operation completes", async () => {
    let resolveBlockNumber!: (val: bigint) => void;
    mockPublicClient.getBlockNumber.mockReturnValue(
      new Promise<bigint>((resolve) => {
        resolveBlockNumber = resolve;
      }),
    );
    mockPublicClient.getLogs.mockResolvedValue([]);

    const { result, unmount } = renderHook(
      () => useNftMintedEventsPolling({ contractAddress: mockContractAddress, pollInterval: 0 }),
      { wrapper },
    );

    expect(result.current.isLoading).toBe(true);

    unmount();
    resolveBlockNumber(1000n);

    await vi.waitFor(() => {
      expect(mockPublicClient.getBlockNumber).toHaveBeenCalled();
    });
  });

  it("should fire polling interval when pollInterval > 0", async () => {
    vi.useFakeTimers();

    mockPublicClient.getBlockNumber.mockResolvedValue(1000n);
    mockPublicClient.getLogs.mockResolvedValue([]);

    const { result } = renderHook(
      () =>
        useNftMintedEventsPolling({
          contractAddress: mockContractAddress,
          pollInterval: 1000,
        }),
      { wrapper },
    );

    await vi.waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const callsBefore = mockPublicClient.getBlockNumber.mock.calls.length;
    expect(callsBefore).toBeGreaterThanOrEqual(1);

    vi.advanceTimersByTime(1000);

    await vi.waitFor(() => {
      expect(mockPublicClient.getBlockNumber.mock.calls.length).toBeGreaterThan(callsBefore);
    });

    vi.useRealTimers();
  });

  it("should handle multiple block range chunks with delay", async () => {
    vi.useFakeTimers();

    const logs1 = [createMockLog(1), createMockLog(2)];
    const logs2 = [createMockLog(3), createMockLog(4)];

    let getLogsCallCount = 0;
    mockPublicClient.getLogs.mockImplementation(() => {
      getLogsCallCount++;
      return Promise.resolve(getLogsCallCount === 1 ? logs1 : logs2);
    });

    let callCount = 0;
    mockPublicClient.getBlockNumber.mockImplementation(() => {
      callCount++;
      return Promise.resolve(callCount === 1 ? 1000n : 1020n);
    });

    const { result } = renderHook(
      () =>
        useNftMintedEventsPolling({
          contractAddress: mockContractAddress,
          pollInterval: 0,
          maxRange: 10,
        }),
      { wrapper },
    );

    await vi.waitFor(() => {
      expect(mockPublicClient.getLogs.mock.calls.length).toBeGreaterThanOrEqual(1);
    });

    vi.advanceTimersByTime(1000);

    await vi.waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(mockPublicClient.getLogs).toHaveBeenCalledTimes(2);
    expect(result.current.recentMints).toHaveLength(4);

    vi.useRealTimers();
  });

  it("should handle getBlockNumber timeout", async () => {
    mockPublicClient.getBlockNumber.mockReturnValue(new Promise<bigint>(() => {}));
    mockPublicClient.getLogs.mockResolvedValue([]);

    const { result } = renderHook(
      () =>
        useNftMintedEventsPolling({
          contractAddress: mockContractAddress,
          pollInterval: 0,
          requestTimeout: 100,
        }),
      { wrapper },
    );

    expect(result.current.isLoading).toBe(true);

    await vi.waitFor(
      () => {
        expect(result.current.isLoading).toBe(false);
      },
      { timeout: 5000 },
    );

    expect(result.current.error).toContain("timed out");
  }, 10000);

  it("should handle getLogs timeout in fetchEventsInRange", async () => {
    let callCount = 0;
    mockPublicClient.getBlockNumber.mockImplementation(() => {
      callCount++;
      return Promise.resolve(callCount === 1 ? 1000n : 1010n);
    });
    mockPublicClient.getLogs.mockReturnValue(new Promise(() => {}));

    const { result } = renderHook(
      () =>
        useNftMintedEventsPolling({
          contractAddress: mockContractAddress,
          pollInterval: 0,
          maxRange: 10,
          requestTimeout: 100,
        }),
      { wrapper },
    );

    await vi.waitFor(
      () => {
        expect(result.current.error).toContain("timed out");
      },
      { timeout: 5000 },
    );
  }, 10000);
});
