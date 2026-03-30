import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useNftMintedEventsUnified } from "@/hooks/useNftMintedEventsUnified";
import { createConfig, http } from "wagmi";
import { sepolia } from "wagmi/chains";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider } from "wagmi";
import type { PropsWithChildren } from "react";

// Mock the dependent hooks
vi.mock("../useNftMintedEvents", () => ({
  useNftMintedEvents: vi.fn(),
}));

vi.mock("../useNftMintedEventsPolling", () => ({
  useNftMintedEventsPolling: vi.fn(),
}));

import { useNftMintedEvents } from "../useNftMintedEvents";
import { useNftMintedEventsPolling } from "../useNftMintedEventsPolling";

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

describe("useNftMintedEventsUnified", () => {
  const mockContractAddress = "0x1234567890123456789012345678901234567890";
  const wrapper = createTestWrapper();
  const mockOnNewMint = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("hooks invocation", () => {
    it("should call both useNftMintedEvents and useNftMintedEventsPolling", () => {
      const mockWebSocketResult = { recentMints: [] };
      const mockPollingResult = { recentMints: [], isLoading: false, error: null };

      vi.mocked(useNftMintedEvents).mockReturnValue(mockWebSocketResult as any);
      vi.mocked(useNftMintedEventsPolling).mockReturnValue(mockPollingResult as any);

      renderHook(
        () =>
          useNftMintedEventsUnified({
            contractAddress: mockContractAddress,
            onNewMint: mockOnNewMint,
          }),
        { wrapper },
      );

      // Both hooks should be called to maintain consistent hook order
      expect(useNftMintedEvents).toHaveBeenCalledWith({
        contractAddress: mockContractAddress,
        onNewMint: mockOnNewMint,
      });

      expect(useNftMintedEventsPolling).toHaveBeenCalledWith({
        contractAddress: mockContractAddress,
        pollInterval: 60000,
      });
    });

    it("should call both hooks on every render to maintain hook order", () => {
      const mockWebSocketResult = { recentMints: [] };
      const mockPollingResult = { recentMints: [], isLoading: false, error: null };

      vi.mocked(useNftMintedEvents).mockReturnValue(mockWebSocketResult as any);
      vi.mocked(useNftMintedEventsPolling).mockReturnValue(mockPollingResult as any);

      const { rerender } = renderHook(
        () =>
          useNftMintedEventsUnified({
            contractAddress: mockContractAddress,
          }),
        { wrapper },
      );

      // Both hooks should be called
      expect(useNftMintedEvents).toHaveBeenCalledTimes(1);
      expect(useNftMintedEventsPolling).toHaveBeenCalledTimes(1);

      // Rerender - both hooks should be called again
      rerender();

      expect(useNftMintedEvents).toHaveBeenCalledTimes(2);
      expect(useNftMintedEventsPolling).toHaveBeenCalledTimes(2);
    });
  });

  describe("return values", () => {
    it("should return polling result (default mode)", () => {
      const mockWebSocketResult = { recentMints: [] };
      const mockPollingResult = {
        recentMints: [{ tokenId: 2n }],
        isLoading: true,
        error: null,
      };

      vi.mocked(useNftMintedEvents).mockReturnValue(mockWebSocketResult as any);
      vi.mocked(useNftMintedEventsPolling).mockReturnValue(mockPollingResult as any);

      const { result } = renderHook(
        () =>
          useNftMintedEventsUnified({
            contractAddress: mockContractAddress,
          }),
        { wrapper },
      );

      // In default mode (no WebSocket), should return polling result
      expect(result.current).toEqual({
        recentMints: [{ tokenId: 2n }],
        isLoading: true,
        error: null,
      });
    });

    it("should return polling result with all properties", () => {
      const mockWebSocketResult = { recentMints: [] };
      const mockPollingResult = {
        recentMints: [{ tokenId: 1n }],
        isLoading: false,
        error: "Test error",
      };

      vi.mocked(useNftMintedEvents).mockReturnValue(mockWebSocketResult as any);
      vi.mocked(useNftMintedEventsPolling).mockReturnValue(mockPollingResult as any);

      const { result } = renderHook(
        () =>
          useNftMintedEventsUnified({
            contractAddress: mockContractAddress,
          }),
        { wrapper },
      );

      expect(result.current).toEqual({
        recentMints: [{ tokenId: 1n }],
        isLoading: false,
        error: "Test error",
      });
    });
  });

  describe("parameter passing", () => {
    it("should pass contractAddress to both hooks", () => {
      const mockWebSocketResult = { recentMints: [] };
      const mockPollingResult = { recentMints: [], isLoading: false, error: null };

      vi.mocked(useNftMintedEvents).mockReturnValue(mockWebSocketResult as any);
      vi.mocked(useNftMintedEventsPolling).mockReturnValue(mockPollingResult as any);

      renderHook(
        () =>
          useNftMintedEventsUnified({
            contractAddress: mockContractAddress,
          }),
        { wrapper },
      );

      expect(useNftMintedEvents).toHaveBeenCalledWith(
        expect.objectContaining({
          contractAddress: mockContractAddress,
        }),
      );
      expect(useNftMintedEventsPolling).toHaveBeenCalledWith(
        expect.objectContaining({
          contractAddress: mockContractAddress,
        }),
      );
    });

    it("should pass onNewMint to useNftMintedEvents", () => {
      const mockWebSocketResult = { recentMints: [] };
      const mockPollingResult = { recentMints: [], isLoading: false, error: null };

      vi.mocked(useNftMintedEvents).mockReturnValue(mockWebSocketResult as any);
      vi.mocked(useNftMintedEventsPolling).mockReturnValue(mockPollingResult as any);

      renderHook(
        () =>
          useNftMintedEventsUnified({
            contractAddress: mockContractAddress,
            onNewMint: mockOnNewMint,
          }),
        { wrapper },
      );

      expect(useNftMintedEvents).toHaveBeenCalledWith(
        expect.objectContaining({
          onNewMint: mockOnNewMint,
        }),
      );
    });

    it("should use default pollInterval of 60000 for polling hook", () => {
      const mockWebSocketResult = { recentMints: [] };
      const mockPollingResult = { recentMints: [], isLoading: false, error: null };

      vi.mocked(useNftMintedEvents).mockReturnValue(mockWebSocketResult as any);
      vi.mocked(useNftMintedEventsPolling).mockReturnValue(mockPollingResult as any);

      renderHook(
        () =>
          useNftMintedEventsUnified({
            contractAddress: mockContractAddress,
          }),
        { wrapper },
      );

      expect(useNftMintedEventsPolling).toHaveBeenCalledWith(
        expect.objectContaining({
          pollInterval: 60000,
        }),
      );
    });
  });
});
