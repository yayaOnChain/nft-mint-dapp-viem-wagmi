import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { NftCard } from "@/components/nft/NftCard";
import type { UserNFT } from "@/types";

describe("NftCard", () => {
  const mockNFT: UserNFT = {
    tokenId: "123",
    contractAddress: "0x1234567890123456789012345678901234567890",
    tokenUri: "https://ipfs.io/ipfs/QmTest123",
    mintedAt: Date.now(),
  };

  const mockMetadata = {
    name: "Test NFT #123",
    image: "https://ipfs.io/ipfs/QmImage123",
    description: "A test NFT",
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("rendering", () => {
    it("should render NFT card with token ID", async () => {
      // Mock fetch to return empty metadata (no image)
      global.fetch = vi.fn().mockResolvedValue({
        json: async () => ({}),
        ok: true,
      });

      render(<NftCard nft={mockNFT} />);

      // Wait for component to render - use getAllBy to handle multiple matches
      await waitFor(() => {
        expect(screen.getAllByText(/#123/i)).toHaveLength(2);
      });
    });

    it("should render contract address (truncated)", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        json: async () => ({}),
        ok: true,
      });

      render(<NftCard nft={mockNFT} />);

      await waitFor(() => {
        expect(screen.getByText(/0x1234.*7890/i)).toBeInTheDocument();
      });
    });

    it("should render placeholder when no image", () => {
      const nftWithoutUri: UserNFT = {
        ...mockNFT,
        tokenUri: undefined,
      };
      render(<NftCard nft={nftWithoutUri} />);
      expect(screen.getByText("🎨")).toBeInTheDocument();
    });
  });

  describe("metadata fetching", () => {
    it("should fetch and display metadata from tokenUri", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        json: async () => mockMetadata,
        ok: true,
      });

      render(<NftCard nft={mockNFT} />);

      await waitFor(() => {
        expect(screen.getByText("Test NFT #123")).toBeInTheDocument();
      });
    });

    it("should handle IPFS URIs", async () => {
      const ipfsNFT: UserNFT = {
        ...mockNFT,
        tokenUri: "ipfs://QmTest123",
      };

      global.fetch = vi.fn().mockResolvedValue({
        json: async () => mockMetadata,
        ok: true,
      });

      render(<NftCard nft={ipfsNFT} />);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          "https://ipfs.io/ipfs/QmTest123",
        );
      });
    });

    it("should handle metadata fetch error gracefully", async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error("Fetch failed"));

      const { container } = render(<NftCard nft={mockNFT} />);

      // Should still render the card even if metadata fetch fails
      await waitFor(() => {
        expect(container).toBeInTheDocument();
        expect(screen.getAllByText(/#123/i)).toHaveLength(2);
      });
    });

    it("should handle invalid JSON response", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        json: async () => {
          throw new Error("Invalid JSON");
        },
        ok: true,
      });

      const { container } = render(<NftCard nft={mockNFT} />);

      // Should not crash, should still render
      await waitFor(() => {
        expect(container).toBeInTheDocument();
      });
    });
  });

  describe("image handling", () => {
    it("should display metadata image when available", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        json: async () => mockMetadata,
        ok: true,
      });

      render(<NftCard nft={mockNFT} />);

      await waitFor(() => {
        const img = screen.getByAltText(/NFT #123/i) as HTMLImageElement;
        expect(img.src).toBe("https://ipfs.io/ipfs/QmImage123");
      });
    });

    it("should handle image load error", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        json: async () => mockMetadata,
        ok: true,
      });

      render(<NftCard nft={mockNFT} />);

      await waitFor(() => {
        const img = screen.getByAltText(/NFT #123/i) as HTMLImageElement;
        // Trigger error
        fireEvent.error(img);
      });

      // Should show placeholder after error
      await waitFor(
        () => {
          expect(screen.getByText("🎨")).toBeInTheDocument();
        },
        { timeout: 2000 },
      );
    });

    it("should use tokenUri as fallback image", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        json: async () => ({ name: "Test" }), // No image in metadata
        ok: true,
      });

      render(<NftCard nft={mockNFT} />);

      await waitFor(() => {
        const img = screen.getByAltText(/NFT #123/i) as HTMLImageElement;
        expect(img.src).toBe("https://ipfs.io/ipfs/QmTest123");
      });
    });
  });

  describe("Etherscan link", () => {
    it("should have Etherscan link", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        json: async () => ({}),
        ok: true,
      });

      render(<NftCard nft={mockNFT} />);

      await waitFor(() => {
        const link = screen.getByText(/View Details/i).closest("a");
        expect(link).toHaveAttribute(
          "href",
          "https://sepolia.etherscan.io/token/0x1234567890123456789012345678901234567890?a=123",
        );
      });
    });

    it("should have correct link attributes", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        json: async () => ({}),
        ok: true,
      });

      render(<NftCard nft={mockNFT} />);

      await waitFor(() => {
        const link = screen.getByText(/View Details/i).closest("a");
        expect(link).toHaveAttribute("target", "_blank");
        expect(link).toHaveAttribute("rel", "noopener noreferrer");
      });
    });

    it("should show link on hover", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        json: async () => ({}),
        ok: true,
      });

      render(<NftCard nft={mockNFT} />);

      await waitFor(() => {
        const overlay = screen.getByText(/View Details/i);
        expect(overlay).toBeInTheDocument();
      });
    });
  });

  describe("token ID formatting", () => {
    it("should format token ID with # prefix", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        json: async () => ({}),
        ok: true,
      });

      render(<NftCard nft={mockNFT} />);

      await waitFor(() => {
        expect(screen.getByText("#123")).toBeInTheDocument();
      });
    });

    it("should handle large token IDs", async () => {
      const largeTokenIdNFT: UserNFT = {
        ...mockNFT,
        tokenId: "999999999",
      };

      global.fetch = vi.fn().mockResolvedValue({
        json: async () => ({}),
        ok: true,
      });

      render(<NftCard nft={largeTokenIdNFT} />);

      await waitFor(() => {
        expect(screen.getByText("#999999999")).toBeInTheDocument();
      });
    });
  });
});
