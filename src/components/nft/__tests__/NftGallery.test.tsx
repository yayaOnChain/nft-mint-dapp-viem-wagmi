import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { mockUserNFTs } from '../../../test/mockData';

// Generate consistent mock NFTs
const generateMockNFTs = (count: number) => {
  return Array.from({ length: count }, (_, i) => ({
    tokenId: String(i + 1),
    contractAddress: '0x1234567890123456789012345678901234567890' as `0x${string}`,
    tokenUri: `https://ipfs.io/ipfs/QmTest${i + 1}`,
    mintedAt: Date.now(),
  }));
};

// Mock the useUserNFTHistory hook - must be before component import
vi.mock('../../../hooks/useUserNFTHistory', () => ({
  useUserNFTHistory: vi.fn(),
}));

// Mock env config
vi.mock('../../../config/env', () => ({
  contractAddress: '0x1234567890123456789012345678901234567890',
}));

// Mock NftCard component
vi.mock('../NftCard', () => ({
  NftCard: ({ nft }: { nft: { tokenId: string } }) => (
    <div data-testid="nft-card">NFT #{nft.tokenId}</div>
  ),
}));

// Mock UI components
vi.mock('../../ui', () => ({
  NFTCardSkeleton: () => <div data-testid="skeleton">Loading...</div>,
}));

// Now import after mocks
import { useUserNFTHistory } from '../../../hooks/useUserNFTHistory';
import { NftGallery } from '../NftGallery';

describe('NftGallery', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('loading state', () => {
    it('should show skeletons when loading initial data', () => {
      vi.mocked(useUserNFTHistory).mockReturnValue({
        nfts: [],
        isLoading: true,
        error: null,
        totalCount: 0,
        hasMore: false,
        loadMore: vi.fn(),
      });

      render(<NftGallery />);

      expect(screen.getAllByTestId('skeleton')).toHaveLength(4);
      expect(screen.getAllByText('Loading...')).toHaveLength(5);
    });
  });

  describe('error state', () => {
    it('should show error message when fetch fails', () => {
      vi.mocked(useUserNFTHistory).mockReturnValue({
        nfts: [],
        isLoading: false,
        error: 'Failed to fetch NFTs',
        totalCount: 0,
        hasMore: false,
        loadMore: vi.fn(),
      });

      render(<NftGallery />);

      expect(screen.getByText(/⚠️ Failed to fetch NFTs/i)).toBeInTheDocument();
    });
  });

  describe('empty state', () => {
    it('should show empty state when no NFTs owned', () => {
      vi.mocked(useUserNFTHistory).mockReturnValue({
        nfts: [],
        isLoading: false,
        error: null,
        totalCount: 0,
        hasMore: false,
        loadMore: vi.fn(),
      });

      render(<NftGallery />);

      expect(screen.getByText('No NFTs owned yet')).toBeInTheDocument();
      expect(
        screen.getByText('Mint your first NFT to see it here!'),
      ).toBeInTheDocument();
      expect(screen.getByText('🖼️')).toBeInTheDocument();
    });
  });

  describe('displaying NFTs', () => {
    it('should render NFT cards when NFTs are available', () => {
      vi.mocked(useUserNFTHistory).mockReturnValue({
        nfts: mockUserNFTs,
        isLoading: false,
        error: null,
        totalCount: mockUserNFTs.length,
        hasMore: false,
        loadMore: vi.fn(),
      });

      render(<NftGallery />);

      expect(screen.getAllByTestId('nft-card')).toHaveLength(
        mockUserNFTs.length,
      );
    });

    it('should show correct count in header', () => {
      vi.mocked(useUserNFTHistory).mockReturnValue({
        nfts: mockUserNFTs,
        isLoading: false,
        error: null,
        totalCount: 5,
        hasMore: false,
        loadMore: vi.fn(),
      });

      render(<NftGallery />);

      expect(screen.getByText('3 of 5 NFTs owned')).toBeInTheDocument();
    });

    it('should show singular "NFT" when count is 1', () => {
      vi.mocked(useUserNFTHistory).mockReturnValue({
        nfts: [mockUserNFTs[0]],
        isLoading: false,
        error: null,
        totalCount: 1,
        hasMore: false,
        loadMore: vi.fn(),
      });

      render(<NftGallery />);

      expect(screen.getByText('1 of 1 NFT owned')).toBeInTheDocument();
    });
  });

  describe('pagination', () => {
    it('should show Load More button when hasMore is true', () => {
      vi.mocked(useUserNFTHistory).mockReturnValue({
        nfts: generateMockNFTs(10),
        isLoading: false,
        error: null,
        totalCount: 25,
        hasMore: true,
        loadMore: vi.fn(),
      });

      render(<NftGallery />);

      const loadMoreButton = screen.getByRole('button', { name: /load more/i });
      expect(loadMoreButton).toBeInTheDocument();
    });

    it('should not show Load More button when hasMore is false', () => {
      vi.mocked(useUserNFTHistory).mockReturnValue({
        nfts: mockUserNFTs,
        isLoading: false,
        error: null,
        totalCount: mockUserNFTs.length,
        hasMore: false,
        loadMore: vi.fn(),
      });

      render(<NftGallery />);

      expect(screen.queryByRole('button', { name: /load more/i })).not.toBeInTheDocument();
    });

    it('should show "All loaded" message when all NFTs are loaded', () => {
      vi.mocked(useUserNFTHistory).mockReturnValue({
        nfts: mockUserNFTs,
        isLoading: false,
        error: null,
        totalCount: 3,
        hasMore: false,
        loadMore: vi.fn(),
      });

      render(<NftGallery />);

      expect(screen.getByText(/All 3 NFTs loaded/i)).toBeInTheDocument();
    });

    it('should call loadMore when Load More button is clicked', async () => {
      const loadMoreMock = vi.fn();
      vi.mocked(useUserNFTHistory).mockReturnValue({
        nfts: generateMockNFTs(10),
        isLoading: false,
        error: null,
        totalCount: 25,
        hasMore: true,
        loadMore: loadMoreMock,
      });

      render(<NftGallery />);

      const loadMoreButton = screen.getByRole('button', { name: /load more/i });
      fireEvent.click(loadMoreButton);

      await waitFor(() => {
        expect(loadMoreMock).toHaveBeenCalledTimes(1);
      });
    });

    it('should disable Load More button while loading', () => {
      vi.mocked(useUserNFTHistory).mockReturnValue({
        nfts: generateMockNFTs(10),
        isLoading: true,
        error: null,
        totalCount: 25,
        hasMore: true,
        loadMore: vi.fn(),
      });

      render(<NftGallery />);

      const loadMoreButton = screen.getByRole('button', { name: /load more/i });
      expect(loadMoreButton).toBeDisabled();
    });
  });

  describe('animation', () => {
    it('should apply staggered animation delay to NFT cards', () => {
      vi.mocked(useUserNFTHistory).mockReturnValue({
        nfts: mockUserNFTs,
        isLoading: false,
        error: null,
        totalCount: mockUserNFTs.length,
        hasMore: false,
        loadMore: vi.fn(),
      });

      const { container } = render(<NftGallery />);

      const cards = container.querySelectorAll('.animate-fadeIn');
      expect(cards).toHaveLength(mockUserNFTs.length);

      // Check animation delays
      expect(cards[0]).toHaveStyle('animation-delay: 0ms');
      expect(cards[1]).toHaveStyle('animation-delay: 100ms');
      expect(cards[2]).toHaveStyle('animation-delay: 200ms');
    });
  });

  describe('refreshKey prop', () => {
    it('should pass refreshKey to useUserNFTHistory hook', () => {
      vi.mocked(useUserNFTHistory).mockReturnValue({
        nfts: mockUserNFTs,
        isLoading: false,
        error: null,
        totalCount: mockUserNFTs.length,
        hasMore: false,
        loadMore: vi.fn(),
      });

      render(<NftGallery refreshKey={5} />);

      expect(useUserNFTHistory).toHaveBeenCalledWith({
        contractAddress: '0x1234567890123456789012345678901234567890',
        refreshKey: 5,
      });
    });
  });
});
