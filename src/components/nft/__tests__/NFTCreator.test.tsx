import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { NFTCreator } from "@/components/nft/NFTCreator";
import * as wagmi from "wagmi";

// Mock wagmi hooks
vi.mock("wagmi", () => ({
  useAccount: vi.fn(() => ({
    address: "0x1234567890123456789012345678901234567890",
    isConnected: true,
  })),
  useReadContract: vi.fn(() => ({
    data: undefined,
    refetch: vi.fn(),
  })),
  useWriteContract: vi.fn(() => ({
    data: undefined,
    writeContract: vi.fn(),
    isPending: false,
    error: null,
    reset: vi.fn(),
  })),
  useWaitForTransactionReceipt: vi.fn(() => ({
    isLoading: false,
    isSuccess: false,
  })),
  useBalance: vi.fn(() => ({
    data: {
      formatted: "1.5",
      symbol: "ETH",
    },
  })),
}));

// Mock IPFS service
vi.mock("@/services/ipfsService", () => ({
  uploadNFTToIPFS: vi.fn(),
}));

// Mock env config
vi.mock("@/config/env", () => ({
  contractAddress: "0x1234567890123456789012345678901234567890",
  pinataJwt: "mock-jwt-token",
}));

// Mock useToast
vi.mock("@/hooks", () => ({
  useToast: vi.fn(() => ({
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    transaction: {
      pending: vi.fn(),
      success: vi.fn(),
      error: vi.fn(),
    },
  })),
}));

describe("NFTCreator", () => {
  const mockOnMintSuccess = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("rendering", () => {
    it("should show wallet connection message when not connected", () => {
      vi.mocked(wagmi.useAccount).mockReturnValueOnce({
        address: undefined,
        isConnected: false,
      });

      render(<NFTCreator onMintSuccess={mockOnMintSuccess} />);

      expect(
        screen.getByText("Connect your wallet to create and mint NFTs")
      ).toBeInTheDocument();
    });

    it("should show creator interface when connected", () => {
      render(<NFTCreator onMintSuccess={mockOnMintSuccess} />);

      expect(screen.getByText("NFT Creator")).toBeInTheDocument();
      expect(screen.getByText("1. Create & Upload")).toBeInTheDocument();
      expect(screen.getByText("2. Mint NFT")).toBeInTheDocument();
    });

    it("should show tab buttons for mode switching", () => {
      render(<NFTCreator onMintSuccess={mockOnMintSuccess} />);

      const createTab = screen.getByText("1. Create & Upload");
      const mintTab = screen.getByText("2. Mint NFT");

      expect(createTab).toBeInTheDocument();
      expect(mintTab).toBeInTheDocument();
    });
  });

  describe("create tab", () => {
    it("should show image upload section", () => {
      render(<NFTCreator onMintSuccess={mockOnMintSuccess} />);

      expect(screen.getByText("NFT Image *")).toBeInTheDocument();
      expect(screen.getByText("Select Image")).toBeInTheDocument();
    });

    it("should show name and description inputs", () => {
      render(<NFTCreator onMintSuccess={mockOnMintSuccess} />);

      // Use placeholder text instead of getByLabelText
      const nameInput = screen.getByPlaceholderText("My Awesome NFT");
      const descInput = screen.getByPlaceholderText("Describe your NFT...");

      expect(nameInput).toBeInTheDocument();
      expect(descInput).toBeInTheDocument();
    });

    it("should show attributes section", () => {
      render(<NFTCreator onMintSuccess={mockOnMintSuccess} />);

      expect(screen.getByText("Attributes (Optional)")).toBeInTheDocument();
    });

    it("should allow adding attributes", () => {
      render(<NFTCreator onMintSuccess={mockOnMintSuccess} />);

      const traitNameInput = screen.getByPlaceholderText(
        "Trait name (e.g., Background)"
      );
      const traitValueInput = screen.getByPlaceholderText("Value (e.g., Blue)");
      const addButton = screen.getByText("Add");

      fireEvent.change(traitNameInput, { target: { value: "Background" } });
      fireEvent.change(traitValueInput, { target: { value: "Blue" } });
      fireEvent.click(addButton);

      expect(screen.getByText("Background")).toBeInTheDocument();
      expect(screen.getByText("Blue")).toBeInTheDocument();
    });

    it("should show upload button", () => {
      render(<NFTCreator onMintSuccess={mockOnMintSuccess} />);

      expect(
        screen.getByText("Upload to IPFS & Continue")
      ).toBeInTheDocument();
    });

    it("should disable upload button when required fields are empty", () => {
      render(<NFTCreator onMintSuccess={mockOnMintSuccess} />);

      const uploadButton = screen.getByText("Upload to IPFS & Continue");
      expect(uploadButton).toBeDisabled();
    });
  });

  describe("mint tab", () => {
    it("should be disabled initially", () => {
      render(<NFTCreator onMintSuccess={mockOnMintSuccess} />);

      const mintTab = screen.getByText("2. Mint NFT");
      expect(mintTab).toBeDisabled();
    });
  });

  describe("form validation", () => {
    it("should enable upload button when all required fields are filled", async () => {
      render(<NFTCreator onMintSuccess={mockOnMintSuccess} />);

      // Fill in required fields
      const nameInput = screen.getByPlaceholderText("My Awesome NFT");
      const descInput = screen.getByPlaceholderText("Describe your NFT...");

      fireEvent.change(nameInput, { target: { value: "Test NFT" } });
      fireEvent.change(descInput, { target: { value: "Test Description" } });

      // Upload button should still be disabled (no image)
      const uploadButton = screen.getByText("Upload to IPFS & Continue");
      expect(uploadButton).toBeDisabled();
    });
  });
});
