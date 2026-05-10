import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider, createConfig, http } from "wagmi";
import { sepolia } from "wagmi/chains";
import type { PropsWithChildren } from "react";

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

  return ({ children }: PropsWithChildren) => (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  );
};

const mockPublicClient = {
  getBlockNumber: vi.fn().mockResolvedValue(1000n),
  getLogs: vi.fn().mockResolvedValue([]),
};

vi.mock("wagmi", async () => {
  const actual = await vi.importActual("wagmi");
  return {
    ...actual,
    usePublicClient: () => mockPublicClient,
  };
});

import { useNftMintedEventsPolling } from "@/hooks/useNftMintedEventsPolling";

describe("useNftMintedEventsPolling", () => {
  const mockContractAddress = "0x1234567890123456789012345678901234567890" as `0x${string}`;
  const wrapper = createTestWrapper();

  beforeEach(() => {
    vi.clearAllMocks();
    mockPublicClient.getBlockNumber = vi.fn().mockResolvedValue(1000n);
    mockPublicClient.getLogs = vi.fn().mockResolvedValue([]);
  });

  it("should initialize with empty recentMints array", async () => {
    const { result } = renderHook(
      () => useNftMintedEventsPolling({ contractAddress: mockContractAddress, pollInterval: 0 }),
      { wrapper },
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    }, { timeout: 3000 });

    expect(result.current.recentMints).toEqual([]);
    expect(result.current.error).toBeNull();
  });

  it("should handle empty logs", async () => {
    mockPublicClient.getLogs = vi.fn().mockResolvedValue([]);

    const { result } = renderHook(
      () => useNftMintedEventsPolling({ contractAddress: mockContractAddress, pollInterval: 0 }),
      { wrapper },
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    }, { timeout: 3000 });

    expect(result.current.recentMints).toEqual([]);
  });

  it("should return correct initial state", async () => {
    const { result } = renderHook(
      () => useNftMintedEventsPolling({ contractAddress: mockContractAddress, pollInterval: 0 }),
      { wrapper },
    );

    // Check initial state before data loads
    expect(result.current.recentMints).toBeDefined();
    expect(result.current.isLoading).toBeDefined();
    expect(result.current.error).toBeDefined();
  });
});