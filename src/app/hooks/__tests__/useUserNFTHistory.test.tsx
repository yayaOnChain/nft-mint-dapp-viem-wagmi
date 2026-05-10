import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { createConfig, http } from 'wagmi';
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

// Mock the hooks and services
const mockUseAccount = vi.fn();
const mockAlchemyApiInstance = {
  getNFTs: vi.fn(),
};

// Mock wagmi module
vi.mock('wagmi', async () => {
  const actual = await vi.importActual('wagmi');
  return {
    ...actual,
    useAccount: () => mockUseAccount(),
  };
});

// Mock the AlchemyApiClient
vi.mock('@/lib/services/alchemyApiClient', () => ({
  getAlchemyClient: vi.fn(() => mockAlchemyApiInstance),
  AlchemyApiClient: vi.fn(),
  setAlchemyClientInstance: vi.fn(),
  resetAlchemyClientInstance: vi.fn(),
}));

// Import after mocks
// import { getAlchemyClient } from '@/lib/services/alchemyApiClient';
import { useUserNFTHistory } from '@/hooks/useUserNFTHistory';

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
  let wrapper: React.ComponentType<PropsWithChildren>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAccount.mockReturnValue({
      address: '0xUserAddress123456789012345678901234567890' as `0x${string}`,
      isConnected: true,
      chain: sepolia,
    });
    mockAlchemyApiInstance.getNFTs.mockResolvedValue({
      nfts: mockUserNFTs,
      totalCount: mockUserNFTs.length,
    });
    wrapper = createTestWrapper();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('initial load', () => {
    it('should fetch NFTs on mount', async () => {
      const { result } = renderHook(() => useUserNFTHistory(), {
        wrapper,
      });

      await waitFor(() => {
        expect(result.current.nfts).toHaveLength(mockUserNFTs.length);
      });

      expect(mockAlchemyApiInstance.getNFTs).toHaveBeenCalledWith({
        owner: '0xUserAddress123456789012345678901234567890',
        contractAddress: undefined,
        pageSize: 10,
        pageKey: undefined,
      });
    });

    it('should use contractAddress filter when provided', async () => {
      const contractAddress = '0x1234567890123456789012345678901234567890';

      renderHook(
        () =>
          useUserNFTHistory({
            contractAddress,
          }),
        { wrapper },
      );

      await waitFor(() => {
        expect(mockAlchemyApiInstance.getNFTs).toHaveBeenCalledWith(
          expect.objectContaining({
            contractAddress,
          }),
        );
      });
    });

    it('should handle empty NFT list', async () => {
      mockAlchemyApiInstance.getNFTs.mockResolvedValue({
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
      mockAlchemyApiInstance.getNFTs.mockRejectedValue(new Error('API Error'));

      const { result } = renderHook(() => useUserNFTHistory(), { wrapper });

      await waitFor(() => {
        expect(result.current.error).toBe('API Error');
      });
    });
  });

  describe('pagination', () => {
    it('should load initial NFTs (up to 10)', async () => {
      const initialNFTs = generateMockNFTs(10);
      mockAlchemyApiInstance.getNFTs.mockResolvedValue({
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

      mockAlchemyApiInstance.getNFTs
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

      expect(mockAlchemyApiInstance.getNFTs).toHaveBeenCalledTimes(2);
      expect(mockAlchemyApiInstance.getNFTs).toHaveBeenNthCalledWith(2, {
        owner: '0xUserAddress123456789012345678901234567890',
        contractAddress: undefined,
        pageSize: 10,
        pageKey: 'page-2-key',
      });
    });

    it('should set hasMore to false when no more pageKey', async () => {
      mockAlchemyApiInstance.getNFTs.mockResolvedValue({
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
      mockAlchemyApiInstance.getNFTs.mockResolvedValue({
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

      expect(mockAlchemyApiInstance.getNFTs).toHaveBeenCalledTimes(1);
    });

    it('should not load more when already loading', async () => {
      const initialNFTs = generateMockNFTs(10);
      let resolveLoad: (value: unknown) => void;

      mockAlchemyApiInstance.getNFTs.mockImplementation(() => {
        return new Promise((resolve) => {
          resolveLoad = resolve;
        }) as ReturnType<typeof mockAlchemyApiInstance.getNFTs>;
      });

      const { result } = renderHook(() => useUserNFTHistory(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(true);
      });

      await act(async () => {
        const loadMorePromise1 = result.current.loadMore();
        const loadMorePromise2 = result.current.loadMore();
        resolveLoad!({ nfts: initialNFTs, totalCount: 50, pageKey: 'page-2-key' });
        await Promise.all([loadMorePromise1, loadMorePromise2]);
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(mockAlchemyApiInstance.getNFTs).toHaveBeenCalledTimes(1);
    });
  });

  describe('loading state', () => {
    it('should set isLoading to true during fetch', async () => {
      let resolvePromise: (value: unknown) => void;

      mockAlchemyApiInstance.getNFTs.mockImplementation(
        () => new Promise((resolve) => { resolvePromise = resolve; }) as ReturnType<typeof mockAlchemyApiInstance.getNFTs>
      );

      const { result } = renderHook(() => useUserNFTHistory(), { wrapper });

      expect(result.current.isLoading).toBe(true);

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
      mockUseAccount.mockReturnValue({
        address: undefined,
        isConnected: false,
        chain: undefined,
      });

      renderHook(() => useUserNFTHistory(), { wrapper });

      await waitFor(() => {
        expect(mockAlchemyApiInstance.getNFTs).not.toHaveBeenCalled();
      });
    });
  });

  describe('refreshKey', () => {
    it('should refetch when refreshKey changes', async () => {
      const mockNFTs1 = generateMockNFTs(5);
      const mockNFTs2 = generateMockNFTs(5);
      let callCount = 0;

      mockAlchemyApiInstance.getNFTs.mockImplementation(async () => {
        callCount++;
        return {
          nfts: callCount === 1 ? mockNFTs1 : mockNFTs2,
          totalCount: 5,
        };
      });

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

      const { result, rerender } = renderHook(
        ({ refreshKey }) => useUserNFTHistory({ refreshKey }),
        {
          wrapper: isolatedWrapper,
          initialProps: { refreshKey: 0 },
        },
      );

      await waitFor(
        () => {
          expect(result.current.nfts).toHaveLength(5);
        },
        { timeout: 3000 },
      );

      expect(mockAlchemyApiInstance.getNFTs).toHaveBeenCalledTimes(1);

      rerender({ refreshKey: 1 });

      await waitFor(
        () => {
          expect(mockAlchemyApiInstance.getNFTs).toHaveBeenCalledTimes(2);
        },
        { timeout: 3000 },
      );

      await waitFor(
        () => {
          expect(result.current.nfts).toHaveLength(5);
        },
        { timeout: 3000 },
      );
    });
  });
});