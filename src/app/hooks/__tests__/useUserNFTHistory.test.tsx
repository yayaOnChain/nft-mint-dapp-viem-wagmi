import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useUserNFTHistory } from '@/hooks/useUserNFTHistory';
import * as wagmi from 'wagmi';
import {
  AlchemyApi,
  setAlchemyApiInstance,
  resetAlchemyApiInstance,
} from '@/services/alchemyApi';
import { createConfig, http, useAccount } from 'wagmi';
import { sepolia } from 'wagmi/chains';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider } from 'wagmi';
import type { PropsWithChildren } from 'react';

// Generate mock NFTs for pagination testing
const generateMockNFTs = (count: number) => {
  return Array.from({ length: count }, (_, i) => ({
    tokenId: String(i + 1),
    contractAddress: '0x1234567890123456789012345678901234567890' as `0x${string}`,
    tokenUri: `https://ipfs.io/ipfs/QmTest${i + 1}`,
    mintedAt: Date.now(),
  }));
};

const mockUserNFTs = generateMockNFTs(3);

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

describe('useUserNFTHistory', () => {
  let mockAlchemyApi: AlchemyApi;
  let wrapper: React.ComponentType<PropsWithChildren>;
  let useAccountSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    // Mock useAccount hook
    useAccountSpy = vi.spyOn(wagmi, 'useAccount').mockReturnValue({
      address: '0xUserAddress123456789012345678901234567890' as `0x${string}`,
      isConnected: true,
      chain: sepolia,
    } as unknown as ReturnType<typeof useAccount>);

    mockAlchemyApi = new AlchemyApi({
      apiKey: 'test-key',
      network: 'eth-sepolia',
    });
    setAlchemyApiInstance(mockAlchemyApi);
    wrapper = createTestWrapper();
  });

  afterEach(() => {
    resetAlchemyApiInstance();
    useAccountSpy.mockRestore();
    vi.restoreAllMocks();
  });

  describe('initial load', () => {
    it('should fetch NFTs on mount', async () => {
      const getNFTsMock = vi.spyOn(mockAlchemyApi, 'getNFTs').mockResolvedValue({
        nfts: mockUserNFTs,
        totalCount: mockUserNFTs.length,
      });

      const { result } = renderHook(() => useUserNFTHistory(), {
        wrapper,
      });

      await waitFor(() => {
        expect(result.current.nfts).toHaveLength(mockUserNFTs.length);
      });

      expect(getNFTsMock).toHaveBeenCalledWith({
        owner: '0xUserAddress123456789012345678901234567890',
        contractAddress: undefined,
        pageSize: 10,
        pageKey: undefined,
      });
    });

    it('should use contractAddress filter when provided', async () => {
      const getNFTsMock = vi.spyOn(mockAlchemyApi, 'getNFTs').mockResolvedValue({
        nfts: mockUserNFTs,
        totalCount: mockUserNFTs.length,
      });

      const contractAddress = '0x1234567890123456789012345678901234567890';

      renderHook(
        () =>
          useUserNFTHistory({
            contractAddress,
          }),
        { wrapper },
      );

      await waitFor(() => {
        expect(getNFTsMock).toHaveBeenCalledWith(
          expect.objectContaining({
            contractAddress,
          }),
        );
      });
    });

    it('should handle empty NFT list', async () => {
      vi.spyOn(mockAlchemyApi, 'getNFTs').mockResolvedValue({
        nfts: [],
        totalCount: 0,
      });

      const { result } = renderHook(() => useUserNFTHistory(), { wrapper });

      await waitFor(() => {
        expect(result.current.nfts).toHaveLength(0);
        expect(result.current.totalCount).toBe(0);
      });
    });

    it('should handle API error', async () => {
      vi.spyOn(mockAlchemyApi, 'getNFTs').mockRejectedValue(
        new Error('API Error'),
      );

      const { result } = renderHook(() => useUserNFTHistory(), { wrapper });

      await waitFor(() => {
        expect(result.current.error).toBe('API Error');
      });
    });
  });

  describe('pagination', () => {
    it('should load initial NFTs (up to 10)', async () => {
      const initialNFTs = generateMockNFTs(10);
      vi.spyOn(mockAlchemyApi, 'getNFTs').mockResolvedValue({
        nfts: initialNFTs,
        totalCount: 25,
        pageKey: 'page-2-key',
      });

      const { result } = renderHook(() => useUserNFTHistory(), { wrapper });

      await waitFor(() => {
        expect(result.current.nfts).toHaveLength(10);
        expect(result.current.hasMore).toBe(true);
      });
    });

    it('should load more NFTs when loadMore is called', async () => {
      const initialNFTs = generateMockNFTs(10);
      const moreNFTs = generateMockNFTs(15);

      vi.spyOn(mockAlchemyApi, 'getNFTs')
        .mockResolvedValueOnce({
          nfts: initialNFTs,
          totalCount: 25,
          pageKey: 'page-2-key',
        })
        .mockResolvedValueOnce({
          nfts: moreNFTs,
          totalCount: 25,
          pageKey: undefined,
        });

      const { result } = renderHook(() => useUserNFTHistory(), { wrapper });

      await waitFor(() => {
        expect(result.current.nfts).toHaveLength(10);
      });

      await act(async () => {
        await result.current.loadMore();
      });

      await waitFor(() => {
        expect(result.current.nfts).toHaveLength(25);
      });

      expect(mockAlchemyApi.getNFTs).toHaveBeenCalledTimes(2);
      expect(mockAlchemyApi.getNFTs).toHaveBeenNthCalledWith(2, {
        owner: '0xUserAddress123456789012345678901234567890',
        contractAddress: undefined,
        pageSize: 10,
        pageKey: 'page-2-key',
      });
    });

    it('should set hasMore to false when no more pageKey', async () => {
      vi.spyOn(mockAlchemyApi, 'getNFTs').mockResolvedValue({
        nfts: mockUserNFTs,
        totalCount: mockUserNFTs.length,
        pageKey: undefined,
      });

      const { result } = renderHook(() => useUserNFTHistory(), { wrapper });

      await waitFor(() => {
        expect(result.current.hasMore).toBe(false);
      });
    });

    it('should not load more when hasMore is false', async () => {
      vi.spyOn(mockAlchemyApi, 'getNFTs').mockResolvedValue({
        nfts: mockUserNFTs,
        totalCount: mockUserNFTs.length,
        pageKey: undefined,
      });

      const { result } = renderHook(() => useUserNFTHistory(), { wrapper });

      await waitFor(() => {
        expect(result.current.hasMore).toBe(false);
      });

      await act(async () => {
        await result.current.loadMore();
      });

      expect(mockAlchemyApi.getNFTs).toHaveBeenCalledTimes(1);
    });

    it('should not load more when already loading', async () => {
      const initialNFTs = generateMockNFTs(10);
      let resolveLoad: (value: unknown) => void;
      const loadPromise = new Promise((resolve) => {
        resolveLoad = resolve;
      });

      vi.spyOn(mockAlchemyApi, 'getNFTs').mockImplementation(() => {
        return loadPromise as Promise<{ nfts: never[]; totalCount: number; pageKey?: string }>;
      });

      const { result } = renderHook(() => useUserNFTHistory(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(true);
      });

      // Call loadMore twice rapidly while first load is pending
      await act(async () => {
        const loadMorePromise1 = result.current.loadMore();
        const loadMorePromise2 = result.current.loadMore();
        resolveLoad!({ nfts: initialNFTs, totalCount: 50, pageKey: 'page-2-key' });
        await Promise.all([loadMorePromise1, loadMorePromise2]);
      });

      // Wait for isLoading to be false after the fetch completes
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Should only have called getNFTs once (initial load)
      // The loadMore calls should be ignored because isLoading was true and hasMore was false
      expect(mockAlchemyApi.getNFTs).toHaveBeenCalledTimes(1);
    });
  });

  describe('loading state', () => {
    it('should set isLoading to true during fetch', async () => {
      let resolvePromise: (value: unknown) => void;
      const promise = new Promise((resolve) => {
        resolvePromise = resolve;
      });

      vi.spyOn(mockAlchemyApi, 'getNFTs').mockImplementation(
        () => promise as Promise<{ nfts: never[]; totalCount: number }>,
      );

      const { result } = renderHook(() => useUserNFTHistory(), { wrapper });

      // Should be loading initially
      expect(result.current.isLoading).toBe(true);

      // Resolve the promise
      act(() => {
        resolvePromise!({ nfts: [], totalCount: 0 });
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });
  });

  describe('disconnected state', () => {
    it('should not fetch NFTs when not connected', async () => {
      // Mock disconnected state
      useAccountSpy.mockReturnValue({
        address: undefined,
        isConnected: false,
        chain: undefined,
      });

      const getNFTsMock = vi.spyOn(mockAlchemyApi, 'getNFTs');

      renderHook(() => useUserNFTHistory(), { wrapper });

      await waitFor(() => {
        expect(getNFTsMock).not.toHaveBeenCalled();
      });
    });
  });

  describe('refreshKey', () => {
    it('should refetch when refreshKey changes', async () => {
      const mockNFTs1 = generateMockNFTs(5);
      const mockNFTs2 = generateMockNFTs(5);
      let callCount = 0;

      const getNFTsMock = vi
        .spyOn(mockAlchemyApi, 'getNFTs')
        .mockImplementation(async () => {
          callCount++;
          return {
            nfts: callCount === 1 ? mockNFTs1 : mockNFTs2,
            totalCount: 5,
          };
        });

      // Create a new wrapper with isolated query client for this test
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

      const isolatedWrapper = ({ children }: PropsWithChildren) => (
        <WagmiProvider config={config}>
          <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
        </WagmiProvider>
      );

      // Initial render with refreshKey 0
      const { result, rerender } = renderHook(
        ({ refreshKey }) => useUserNFTHistory({ refreshKey }),
        {
          wrapper: isolatedWrapper,
          initialProps: { refreshKey: 0 },
        },
      );

      // Wait for initial fetch
      await waitFor(
        () => {
          expect(result.current.nfts).toHaveLength(5);
        },
        { timeout: 3000 },
      );

      expect(getNFTsMock).toHaveBeenCalledTimes(1);

      // Change refresh key to trigger refetch
      rerender({ refreshKey: 1 });

      // Wait for refetch to complete
      await waitFor(
        () => {
          expect(getNFTsMock).toHaveBeenCalledTimes(2);
        },
        { timeout: 3000 },
      );

      // Verify data was refetched
      await waitFor(
        () => {
          expect(result.current.nfts).toHaveLength(5);
        },
        { timeout: 3000 },
      );
    });
  });
});
