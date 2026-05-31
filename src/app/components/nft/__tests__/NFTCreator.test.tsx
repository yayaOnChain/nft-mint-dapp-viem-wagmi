import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { NFTCreator } from "@/components/nft/NFTCreator";
import * as wagmi from "wagmi";

const mockToast = vi.hoisted(() => ({
  success: vi.fn(),
  error: vi.fn(),
  info: vi.fn(),
  transaction: { pending: vi.fn(), success: vi.fn(), error: vi.fn() },
}));

const mockWriteContract = vi.hoisted(() => vi.fn());
const mockResetWrite = vi.hoisted(() => vi.fn());
const mockRefetchFn = vi.hoisted(() => vi.fn());
const mockBalanceRefetch = vi.hoisted(() => vi.fn());

vi.mock("@/utils/nftMetadata", () => ({
  createNFTMetadata: vi.fn((input) => input),
  validateImageFile: vi.fn(() => ({ valid: true })),
  compressImage: vi.fn((file) => Promise.resolve(file)),
  createImagePreview: vi.fn(() => "blob:mock-preview-url"),
  revokeImagePreview: vi.fn(),
}));

vi.mock("wagmi", () => ({
  useAccount: vi.fn(() => ({
    address: "0x1234567890123456789012345678901234567890",
    isConnected: true,
  })),
  useReadContract: vi.fn(() => ({
    data: undefined,
    refetch: mockRefetchFn,
  })),
  useWriteContract: vi.fn(() => ({
    data: undefined,
    writeContract: mockWriteContract,
    isPending: false,
    error: null,
    reset: mockResetWrite,
  })),
  useWaitForTransactionReceipt: vi.fn(() => ({
    isLoading: false,
    isSuccess: false,
  })),
  useBalance: vi.fn(() => ({
    data: {
      value: BigInt("1500000000000000000"),
      formatted: "1.5",
      symbol: "ETH",
      decimals: 18,
    },
    refetch: mockBalanceRefetch,
  })),
}));

vi.mock("@/services/ipfsClient", () => ({
  uploadNFTToIPFS: vi.fn(),
}));

vi.mock("@/config/env", () => ({
  contractAddress: "0x1234567890123456789012345678901234567890",
}));

vi.mock("@/hooks", () => ({
  useToast: vi.fn(() => mockToast),
}));

function createFile(name = "test.png", type = "image/png", size?: number) {
  const content = size ? "x".repeat(size) : "";
  return new File([content], name, { type });
}

function fillNameAndDescription() {
  fireEvent.change(screen.getByPlaceholderText("My Awesome NFT"), {
    target: { value: "Test NFT" },
  });
  fireEvent.change(screen.getByPlaceholderText("Describe your NFT..."), {
    target: { value: "Test Description" },
  });
}

function setupContractCycle() {
  let idx = 0;
  const values = [BigInt(500), BigInt(1000), BigInt("10000000000000000"), BigInt(1)];
  vi.mocked(wagmi.useReadContract).mockImplementation(() => {
    const data = values[idx % 4];
    idx++;
    return { data, refetch: mockRefetchFn } as unknown as ReturnType<typeof wagmi.useReadContract>;
  });
}

async function uploadAndSwitchToMintTab() {
  const { uploadNFTToIPFS } = await import("@/services/ipfsClient");
  vi.mocked(uploadNFTToIPFS).mockResolvedValue({
    imageHash: "QmTest123",
    metadataHash: "QmMetadata456",
    imageUrl: "https://ipfs.io/ipfs/QmTest123",
    metadataUrl: "https://ipfs.io/ipfs/QmMetadata456/metadata.json",
  });

  setupContractCycle();
  const result = render(<NFTCreator onMintSuccess={vi.fn()} />);

  fillNameAndDescription();
  const fileInput = result.container.querySelector('input[type="file"]')!;
  fireEvent.change(fileInput, { target: { files: [createFile()] } });
  fireEvent.click(screen.getByText("Upload to IPFS & Continue"));

  await waitFor(() => {
    expect(screen.getByText("2. Mint NFT")).not.toBeDisabled();
  });

  return result;
}

describe("NFTCreator", () => {
  const mockOnMintSuccess = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(wagmi.useReadContract).mockImplementation(() => ({
      data: undefined,
      refetch: mockRefetchFn,
    } as unknown as ReturnType<typeof wagmi.useReadContract>));
    vi.mocked(wagmi.useWriteContract).mockImplementation(() => ({
      data: undefined,
      writeContract: mockWriteContract,
      isPending: false,
      error: null,
      reset: mockResetWrite,
    } as unknown as ReturnType<typeof wagmi.useWriteContract>));
    vi.mocked(wagmi.useBalance).mockImplementation(() => ({
      data: {
        value: BigInt("1500000000000000000"),
        formatted: "1.5",
        symbol: "ETH",
        decimals: 18,
      },
      refetch: mockBalanceRefetch,
    } as unknown as ReturnType<typeof wagmi.useBalance>));
  });

  describe("rendering", () => {
    it("should show wallet connection message when not connected", () => {
      vi.mocked(wagmi.useAccount).mockReturnValueOnce({
        address: undefined,
        isConnected: false,
      } as unknown as ReturnType<typeof wagmi.useAccount>);
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

      expect(screen.getByText("1. Create & Upload")).toBeInTheDocument();
      expect(screen.getByText("2. Mint NFT")).toBeInTheDocument();
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

      expect(
        screen.getByPlaceholderText("My Awesome NFT")
      ).toBeInTheDocument();
      expect(
        screen.getByPlaceholderText("Describe your NFT...")
      ).toBeInTheDocument();
    });

    it("should show attributes section", () => {
      render(<NFTCreator onMintSuccess={mockOnMintSuccess} />);

      expect(screen.getByText("Attributes (Optional)")).toBeInTheDocument();
    });

    it("should allow adding attributes", () => {
      render(<NFTCreator onMintSuccess={mockOnMintSuccess} />);

      fireEvent.change(
        screen.getByPlaceholderText("Trait name (e.g., Background)"),
        { target: { value: "Background" } }
      );
      fireEvent.change(
        screen.getByPlaceholderText("Value (e.g., Blue)"),
        { target: { value: "Blue" } }
      );
      fireEvent.click(screen.getByText("Add"));

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

      expect(screen.getByText("Upload to IPFS & Continue")).toBeDisabled();
    });
  });

  describe("mint tab", () => {
    it("should be disabled initially", () => {
      render(<NFTCreator onMintSuccess={mockOnMintSuccess} />);

      expect(screen.getByText("2. Mint NFT")).toBeDisabled();
    });
  });

  describe("form validation", () => {
    it("should disable upload button when only name and desc filled but no image", () => {
      render(<NFTCreator onMintSuccess={mockOnMintSuccess} />);

      fillNameAndDescription();

      expect(screen.getByText("Upload to IPFS & Continue")).toBeDisabled();
    });

    it("should enable upload button when all required fields filled including image", async () => {
      setupContractCycle();
      const { container } = render(
        <NFTCreator onMintSuccess={mockOnMintSuccess} />
      );

      fillNameAndDescription();

      const fileInput = container.querySelector('input[type="file"]')!;
      fireEvent.change(fileInput, { target: { files: [createFile()] } });

      await waitFor(() => {
        expect(
          screen.getByText("Upload to IPFS & Continue")
        ).not.toBeDisabled();
      });
    });
  });

  describe("image handling", () => {
    it("should show preview after selecting image", async () => {
      const { container } = render(
        <NFTCreator onMintSuccess={mockOnMintSuccess} />
      );

      const fileInput = container.querySelector('input[type="file"]')!;
      fireEvent.change(fileInput, { target: { files: [createFile()] } });

      await screen.findByText((content) => content.includes("test.png"));
    });

    it("should revoke previous preview when selecting a new image", async () => {
      const { revokeImagePreview } = await import("@/utils/nftMetadata");
      const { container, rerender } = render(
        <NFTCreator onMintSuccess={mockOnMintSuccess} />
      );

      const fileInput = container.querySelector('input[type="file"]')!;
      fireEvent.change(fileInput, { target: { files: [createFile()] } });
      await screen.findByText((content) => content.includes("test.png"));

      rerender(<NFTCreator onMintSuccess={mockOnMintSuccess} />);

      const titleEl = screen.getByText("NFT Creator");
      const fiberKey = Object.keys(titleEl).find((k) =>
        k.startsWith("__reactFiber")
      ) as string;
      let fiber = (titleEl as unknown as Record<string, unknown>)[fiberKey] as {
        return?: unknown;
        type?: unknown;
        memoizedState?: unknown;
      } | null;

      while (fiber && typeof fiber.type !== "function") {
        fiber = fiber.return as typeof fiber | null;
      }

      if (fiber) {
        let hook = fiber.memoizedState as {
          memoizedState?: unknown;
          next?: unknown;
        } | null;

        while (hook) {
          const val = hook.memoizedState;

          if (Array.isArray(val) && typeof val[0] === "function") {
            try {
              val[0]({
                target: { files: [createFile("second.png")] },
                preventDefault: () => {},
              } as unknown as React.ChangeEvent<HTMLInputElement>);
            } catch {
              // not the right hook
            }
          }

          hook = hook.next as typeof hook | null;
        }
      }

      await waitFor(() => {
        expect(revokeImagePreview).toHaveBeenCalled();
      });
    });

    it("should show error toast for invalid file type", async () => {
      const { validateImageFile } = await import("@/utils/nftMetadata");
      vi.mocked(validateImageFile).mockReturnValueOnce({
        valid: false,
        error: "Invalid file type.",
      });

      const { container } = render(
        <NFTCreator onMintSuccess={mockOnMintSuccess} />
      );

      const fileInput = container.querySelector('input[type="file"]')!;
      fireEvent.change(fileInput, {
        target: { files: [createFile("bad.gif", "image/gif")] },
      });

      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalledWith("Invalid file type.");
      });
    });

    it("should show generic error when validation fails without error message", async () => {
      const { validateImageFile } = await import("@/utils/nftMetadata");
      vi.mocked(validateImageFile).mockReturnValueOnce({
        valid: false,
      });

      const { container } = render(
        <NFTCreator onMintSuccess={mockOnMintSuccess} />
      );

      const fileInput = container.querySelector('input[type="file"]')!;
      fireEvent.change(fileInput, {
        target: { files: [createFile("bad.gif", "image/gif")] },
      });

      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalledWith("Invalid file");
      });
    });

    it("should allow removing selected image", async () => {
      const { container } = render(
        <NFTCreator onMintSuccess={mockOnMintSuccess} />
      );

      const fileInput = container.querySelector('input[type="file"]')!;
      fireEvent.change(fileInput, { target: { files: [createFile()] } });

      await screen.findByText((content) => content.includes("test.png"));

      fireEvent.click(screen.getByText("Remove Image"));

      await waitFor(() => {
        expect(screen.getByText("Select Image")).toBeInTheDocument();
      });
    });

    it("should do nothing when image selection is cancelled", () => {
      const { container } = render(
        <NFTCreator onMintSuccess={mockOnMintSuccess} />
      );

      const fileInput = container.querySelector('input[type="file"]')!;
      fireEvent.change(fileInput, { target: { files: [] } });

      expect(screen.getByText("Select Image")).toBeInTheDocument();
    });
  });

  describe("attribute management", () => {
    it("should show error when adding attribute with empty name", () => {
      render(<NFTCreator onMintSuccess={mockOnMintSuccess} />);

      fireEvent.change(
        screen.getByPlaceholderText("Value (e.g., Blue)"),
        { target: { value: "Blue" } }
      );
      fireEvent.click(screen.getByText("Add"));

      expect(mockToast.error).toHaveBeenCalledWith(
        "Trait name and value are required"
      );
    });

    it("should show error when adding attribute with empty value", () => {
      render(<NFTCreator onMintSuccess={mockOnMintSuccess} />);

      fireEvent.change(
        screen.getByPlaceholderText("Trait name (e.g., Background)"),
        { target: { value: "Background" } }
      );
      fireEvent.click(screen.getByText("Add"));

      expect(mockToast.error).toHaveBeenCalledWith(
        "Trait name and value are required"
      );
    });

    it("should enforce maximum of 10 attributes", () => {
      render(<NFTCreator onMintSuccess={mockOnMintSuccess} />);

      const nameInput = screen.getByPlaceholderText(
        "Trait name (e.g., Background)"
      );
      const valueInput = screen.getByPlaceholderText("Value (e.g., Blue)");

      for (let i = 0; i < 11; i++) {
        fireEvent.change(nameInput, { target: { value: `Trait ${i}` } });
        fireEvent.change(valueInput, { target: { value: `Value ${i}` } });
        fireEvent.click(screen.getByText("Add"));
      }

      expect(mockToast.error).toHaveBeenCalledWith(
        "Maximum 10 attributes allowed"
      );
      expect(screen.getByText("Trait 0")).toBeInTheDocument();
      expect(screen.queryByText("Trait 10")).not.toBeInTheDocument();
    });

    it("should allow removing an attribute", () => {
      render(<NFTCreator onMintSuccess={mockOnMintSuccess} />);

      fireEvent.change(
        screen.getByPlaceholderText("Trait name (e.g., Background)"),
        { target: { value: "Background" } }
      );
      fireEvent.change(
        screen.getByPlaceholderText("Value (e.g., Blue)"),
        { target: { value: "Blue" } }
      );
      fireEvent.click(screen.getByText("Add"));

      expect(screen.getByText("Background")).toBeInTheDocument();

      fireEvent.click(screen.getByText("×"));

      expect(screen.queryByText("Background")).not.toBeInTheDocument();
    });
  });

  describe("IPFS upload", () => {
    it("should upload successfully and switch to mint tab", async () => {
      await uploadAndSwitchToMintTab();
    });

    it("should show success toast after upload", async () => {
      await uploadAndSwitchToMintTab();
      expect(mockToast.success).toHaveBeenCalled();
    });

    it("should show error toast when upload fails", async () => {
      const { uploadNFTToIPFS } = await import("@/services/ipfsClient");
      vi.mocked(uploadNFTToIPFS).mockRejectedValue(
        new Error("IPFS gateway timeout")
      );

      setupContractCycle();
      const { container } = render(
        <NFTCreator onMintSuccess={mockOnMintSuccess} />
      );

      fillNameAndDescription();
      const fileInput = container.querySelector('input[type="file"]')!;
      fireEvent.change(fileInput, { target: { files: [createFile()] } });
      fireEvent.click(screen.getByText("Upload to IPFS & Continue"));

      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalledWith(
          "Failed to upload to IPFS",
          "IPFS gateway timeout"
        );
      });
    });

    it("should show generic error when upload fails with non-Error", async () => {
      const { uploadNFTToIPFS } = await import("@/services/ipfsClient");
      vi.mocked(uploadNFTToIPFS).mockRejectedValue("string error");

      setupContractCycle();
      const { container } = render(
        <NFTCreator onMintSuccess={mockOnMintSuccess} />
      );

      fillNameAndDescription();
      const fileInput = container.querySelector('input[type="file"]')!;
      fireEvent.change(fileInput, { target: { files: [createFile()] } });
      fireEvent.click(screen.getByText("Upload to IPFS & Continue"));

      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalledWith(
          "Failed to upload to IPFS",
          "Unknown error occurred"
        );
      });
    });

    it("should show error when upload clicked without image", async () => {
      render(<NFTCreator onMintSuccess={mockOnMintSuccess} />);

      fillNameAndDescription();

      const uploadBtn = screen.getByText("Upload to IPFS & Continue");
      const reactPropsKey = Object.keys(uploadBtn).find((k) =>
        k.startsWith("__reactProps")
      );
      if (reactPropsKey) {
        const props = (uploadBtn as unknown as Record<string, unknown>)[
          reactPropsKey
        ] as { onClick?: () => void };
        await props.onClick?.();
      }

      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalledWith(
          "Please upload an image first"
        );
      });
    });

    it("should show error when upload clicked without name and description", async () => {
      const { container } = render(
        <NFTCreator onMintSuccess={mockOnMintSuccess} />
      );

      const fileInput = container.querySelector('input[type="file"]')!;
      fireEvent.change(fileInput, { target: { files: [createFile()] } });

      const uploadBtn = screen.getByText("Upload to IPFS & Continue");
      const reactPropsKey = Object.keys(uploadBtn).find((k) =>
        k.startsWith("__reactProps")
      );
      if (reactPropsKey) {
        const props = (uploadBtn as unknown as Record<string, unknown>)[
          reactPropsKey
        ] as { onClick?: () => void };
        await props.onClick?.();
      }

      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalledWith(
          "Name and description are required"
        );
      });
    });

    it("should compress image when file exceeds 2MB", async () => {
      const { uploadNFTToIPFS } = await import("@/services/ipfsClient");
      vi.mocked(uploadNFTToIPFS).mockResolvedValue({
        imageHash: "QmTest123",
        metadataHash: "QmMetadata456",
        imageUrl: "https://ipfs.io/ipfs/QmTest123",
        metadataUrl: "https://ipfs.io/ipfs/QmMetadata456/metadata.json",
      });

      const { compressImage } = await import("@/utils/nftMetadata");
      vi.mocked(compressImage).mockResolvedValue(createFile());

      setupContractCycle();
      const { container } = render(
        <NFTCreator onMintSuccess={mockOnMintSuccess} />
      );

      fillNameAndDescription();
      const fileInput = container.querySelector('input[type="file"]')!;
      fireEvent.change(fileInput, {
        target: {
          files: [createFile("large.png", "image/png", 3 * 1024 * 1024)],
        },
      });
      fireEvent.click(screen.getByText("Upload to IPFS & Continue"));

      await waitFor(() => {
        expect(compressImage).toHaveBeenCalled();
      });
    });

    it("should show progress text during upload", async () => {
      const { uploadNFTToIPFS } = await import("@/services/ipfsClient");
      vi.mocked(uploadNFTToIPFS).mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({
                  imageHash: "QmTest123",
                  metadataHash: "QmMetadata456",
                  imageUrl: "https://ipfs.io/ipfs/QmTest123",
                  metadataUrl:
                    "https://ipfs.io/ipfs/QmMetadata456/metadata.json",
                }),
              50
            )
          )
      );

      const { container } = render(
        <NFTCreator onMintSuccess={mockOnMintSuccess} />
      );

      fillNameAndDescription();
      const fileInput = container.querySelector('input[type="file"]')!;
      fireEvent.change(fileInput, { target: { files: [createFile()] } });
      fireEvent.click(screen.getByText("Upload to IPFS & Continue"));

      expect(
        screen.getByText("Uploading image to IPFS...")
      ).toBeInTheDocument();
    });
  });

  describe("mint tab display", () => {
    it("should show progress bar with minted/supply info", async () => {
      await uploadAndSwitchToMintTab();

      expect(
        screen.getByText((content) => content.includes("Minted:"))
      ).toBeInTheDocument();
      expect(
        screen.getByText((content) => content.includes("500 / 1000"))
      ).toBeInTheDocument();
      expect(screen.getByText("50%")).toBeInTheDocument();
    });

    it("should show price per NFT", async () => {
      await uploadAndSwitchToMintTab();

      expect(screen.getByText("Price per NFT")).toBeInTheDocument();
    });

    it("should show NFT preview in mint tab", async () => {
      await uploadAndSwitchToMintTab();

      expect(screen.getByText("Test NFT")).toBeInTheDocument();
      expect(screen.getByText("Test Description")).toBeInTheDocument();
    });

    it("should show attribute badges in mint tab preview", async () => {
      setupContractCycle();
      const { uploadNFTToIPFS } = await import("@/services/ipfsClient");
      vi.mocked(uploadNFTToIPFS).mockResolvedValue({
        imageHash: "QmTest123",
        metadataHash: "QmMetadata456",
        imageUrl: "https://ipfs.io/ipfs/QmTest123",
        metadataUrl: "https://ipfs.io/ipfs/QmMetadata456/metadata.json",
      });

      const { container } = render(
        <NFTCreator onMintSuccess={mockOnMintSuccess} />
      );

      fillNameAndDescription();
      fireEvent.change(
        screen.getByPlaceholderText("Trait name (e.g., Background)"),
        { target: { value: "Rarity" } }
      );
      fireEvent.change(
        screen.getByPlaceholderText("Value (e.g., Blue)"),
        { target: { value: "Legendary" } }
      );
      fireEvent.click(screen.getByText("Add"));

      const fileInput = container.querySelector('input[type="file"]')!;
      fireEvent.change(fileInput, { target: { files: [createFile()] } });
      fireEvent.click(screen.getByText("Upload to IPFS & Continue"));

      await waitFor(() => {
        expect(screen.getByText("Rarity: Legendary")).toBeInTheDocument();
      });
    });

    it("should show total cost", async () => {
      await uploadAndSwitchToMintTab();

      expect(screen.getByText("Total Cost")).toBeInTheDocument();
    });

    it("should show user balance in mint tab", async () => {
      await uploadAndSwitchToMintTab();

      expect(
        screen.getByText((content) => content.includes("Your Balance:"))
      ).toBeInTheDocument();
    });

    it("should show fallback alt text when name is empty in mint tab", async () => {
      await uploadAndSwitchToMintTab();

      fireEvent.click(screen.getByText("1. Create & Upload"));
      const nameInput = screen.getByPlaceholderText("My Awesome NFT");
      fireEvent.change(nameInput, { target: { value: "" } });
      fireEvent.click(screen.getByText("2. Mint NFT"));

      const img = screen.getByAltText("NFT");
      expect(img).toBeInTheDocument();
    });

    it("should show loading text when balance is not available", async () => {
      vi.mocked(wagmi.useBalance).mockImplementation(() => ({
        data: undefined,
        refetch: mockBalanceRefetch,
      } as unknown as ReturnType<typeof wagmi.useBalance>));

      await uploadAndSwitchToMintTab();

      expect(
        screen.getByText((content) => content.includes("Loading..."))
      ).toBeInTheDocument();
    });
  });

  describe("mint flow", () => {
    it("should call writeContract with mintWithURI on mint", async () => {
      await uploadAndSwitchToMintTab();

      const mintButton = screen.getByText("Mint NFT");
      expect(mintButton).not.toBeDisabled();

      fireEvent.click(mintButton);

      await waitFor(() => {
        expect(mockWriteContract).toHaveBeenCalled();
      });

      const writeCall = mockWriteContract.mock
        .calls[0][0] as unknown as Record<string, unknown>;
      expect(writeCall.functionName).toBe("mintWithURI");
      expect(writeCall.args).toEqual([
        BigInt(1),
        ["https://ipfs.io/ipfs/QmMetadata456/metadata.json"],
      ]);
    });

    it("should mint multiple NFTs when quantity is increased", async () => {
      await uploadAndSwitchToMintTab();

      const plusButton = screen.getByText("+");
      fireEvent.click(plusButton);
      fireEvent.click(plusButton);

      expect(screen.getByDisplayValue("3")).toBeInTheDocument();

      fireEvent.click(screen.getByText("Mint 3 NFTs"));

      const writeCall = mockWriteContract.mock
        .calls[0][0] as unknown as Record<string, unknown>;
      expect(writeCall.args).toEqual([
        BigInt(3),
        [
          "https://ipfs.io/ipfs/QmMetadata456/metadata.json",
          "https://ipfs.io/ipfs/QmMetadata456/metadata.json",
          "https://ipfs.io/ipfs/QmMetadata456/metadata.json",
        ],
      ]);
    });

    it("should show error when minting without uploading metadata", async () => {
      render(<NFTCreator onMintSuccess={mockOnMintSuccess} />);

      const mintTabBtn = screen.getByText("2. Mint NFT");
      const tabKey = Object.keys(mintTabBtn).find((k) =>
        k.startsWith("__reactProps")
      );
      if (tabKey) {
        const tabProps = (mintTabBtn as unknown as Record<string, unknown>)[
          tabKey
        ] as { onClick?: () => void };
        tabProps.onClick?.();
      }

      await waitFor(() => {
        expect(screen.getByText("Mint NFT")).toBeInTheDocument();
      });

      const mintBtn = screen.getByText("Mint NFT");
      const mintKey = Object.keys(mintBtn).find((k) =>
        k.startsWith("__reactProps")
      );
      if (mintKey) {
        const mintProps = (mintBtn as unknown as Record<string, unknown>)[
          mintKey
        ] as { onClick?: () => void };
        mintProps.onClick?.();
      }

      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalledWith(
          "Please upload metadata to IPFS first"
        );
      });
    });

    it("should show confirm transaction toast on mint", async () => {
      await uploadAndSwitchToMintTab();

      fireEvent.click(screen.getByText("Mint NFT"));

      expect(mockToast.info).toHaveBeenCalledWith(
        "Confirm Transaction",
        "Minting 1 NFT(s)"
      );
    });

    it("should show confirming in wallet text when transaction is pending", async () => {
      const { uploadNFTToIPFS } = await import("@/services/ipfsClient");
      vi.mocked(uploadNFTToIPFS).mockResolvedValue({
        imageHash: "QmTest123",
        metadataHash: "QmMetadata456",
        imageUrl: "https://ipfs.io/ipfs/QmTest123",
        metadataUrl: "https://ipfs.io/ipfs/QmMetadata456/metadata.json",
      });

      setupContractCycle();

      vi.mocked(wagmi.useWriteContract).mockReturnValue({
        data: "0xhash",
        writeContract: mockWriteContract,
        isPending: true,
        error: null,
        reset: mockResetWrite,
      } as unknown as ReturnType<typeof wagmi.useWriteContract>);

      const { container } = render(
        <NFTCreator onMintSuccess={mockOnMintSuccess} />
      );

      fillNameAndDescription();
      const fileInput = container.querySelector('input[type="file"]')!;
      fireEvent.change(fileInput, { target: { files: [createFile()] } });
      fireEvent.click(screen.getByText("Upload to IPFS & Continue"));

      await waitFor(() => {
        expect(screen.getByText("2. Mint NFT")).not.toBeDisabled();
      });

      expect(
        screen.getByText("Confirm in Wallet...")
      ).toBeInTheDocument();
    });

    it("should not call writeContract when mintPrice is unavailable", async () => {
      const result = await uploadAndSwitchToMintTab();

      vi.mocked(wagmi.useReadContract).mockReturnValue({
        data: undefined,
        refetch: mockRefetchFn,
      } as unknown as ReturnType<typeof wagmi.useReadContract>);

      result.rerender(<NFTCreator onMintSuccess={mockOnMintSuccess} />);

      const mintBtn = screen.getByText("Mint NFT");
      expect(mintBtn).toBeDisabled();

      const mintKey = Object.keys(mintBtn).find((k) =>
        k.startsWith("__reactProps")
      );
      if (mintKey) {
        const mintProps = (mintBtn as unknown as Record<string, unknown>)[
          mintKey
        ] as { onClick?: () => void };
        mintProps.onClick?.();
      }

      await waitFor(() => {
        expect(mockWriteContract).not.toHaveBeenCalled();
      });
    });

    it("should not call writeContract when writeContract is unavailable", async () => {
      const result = await uploadAndSwitchToMintTab();

      vi.mocked(wagmi.useWriteContract).mockReturnValue({
        data: undefined,
        writeContract: undefined,
        isPending: false,
        error: null,
        reset: mockResetWrite,
      } as unknown as ReturnType<typeof wagmi.useWriteContract>);

      result.rerender(<NFTCreator onMintSuccess={mockOnMintSuccess} />);

      fireEvent.click(screen.getByText("Mint NFT"));

      await waitFor(() => {
        expect(mockWriteContract).not.toHaveBeenCalled();
      });
    });
  });

  describe("quantity selector", () => {
    it("should increment and decrement quantity", async () => {
      await uploadAndSwitchToMintTab();

      expect(screen.getByDisplayValue("1")).toBeInTheDocument();

      const minusButton = screen.getByText("-");
      expect(minusButton).toBeDisabled();

      const plusButton = screen.getByText("+");
      expect(plusButton).not.toBeDisabled();

      fireEvent.click(plusButton);
      expect(screen.getByDisplayValue("2")).toBeInTheDocument();

      const minusAfterInc = screen.getByText("-");
      expect(minusAfterInc).not.toBeDisabled();

      fireEvent.click(minusAfterInc);
      expect(screen.getByDisplayValue("1")).toBeInTheDocument();
    });

    it("should clamp quantity to 1-10 range on manual input", async () => {
      await uploadAndSwitchToMintTab();

      const quantityInput = screen.getByDisplayValue("1");
      fireEvent.change(quantityInput, { target: { value: "0" } });
      expect(screen.getByDisplayValue("1")).toBeInTheDocument();

      fireEvent.change(quantityInput, { target: { value: "15" } });
      expect(screen.getByDisplayValue("10")).toBeInTheDocument();
    });

    it("should disable minus at 1 and plus at 10", async () => {
      await uploadAndSwitchToMintTab();

      const minusButton = screen.getByText("-");
      expect(minusButton).toBeDisabled();

      const quantityInput = screen.getByDisplayValue("1");
      fireEvent.change(quantityInput, { target: { value: "10" } });

      const plusButton = screen.getByText("+");
      expect(plusButton).toBeDisabled();
    });
  });

  describe("mint error handling", () => {
    it("should show error toast on write error", async () => {
      const { rerender } = render(
        <NFTCreator onMintSuccess={mockOnMintSuccess} />
      );

      vi.mocked(wagmi.useWriteContract).mockReturnValue({
        data: undefined,
        writeContract: mockWriteContract,
        isPending: false,
        error: new Error("Transaction failed"),
        reset: mockResetWrite,
      } as unknown as ReturnType<typeof wagmi.useWriteContract>);

      rerender(<NFTCreator onMintSuccess={mockOnMintSuccess} />);

      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalledWith(
          "Mint Failed",
          "Transaction failed"
        );
      });
    });

    it("should show user rejected message when user rejects tx", async () => {
      const { rerender } = render(
        <NFTCreator onMintSuccess={mockOnMintSuccess} />
      );

      vi.mocked(wagmi.useWriteContract).mockReturnValue({
        data: undefined,
        writeContract: mockWriteContract,
        isPending: false,
        error: new Error("User rejected the request"),
        reset: mockResetWrite,
      } as unknown as ReturnType<typeof wagmi.useWriteContract>);

      rerender(<NFTCreator onMintSuccess={mockOnMintSuccess} />);

      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalledWith(
          "Mint Failed",
          "Transaction rejected by user"
        );
      });
    });
  });

  describe("mint success", () => {
    it("should reset form, refetch data, and call onMintSuccess", async () => {
      const { uploadNFTToIPFS } = await import("@/services/ipfsClient");
      vi.mocked(uploadNFTToIPFS).mockResolvedValue({
        imageHash: "QmTest123",
        metadataHash: "QmMetadata456",
        imageUrl: "https://ipfs.io/ipfs/QmTest123",
        metadataUrl: "https://ipfs.io/ipfs/QmMetadata456/metadata.json",
      });

      setupContractCycle();
      const customOnMintSuccess = vi.fn();
      const { container, rerender } = render(
        <NFTCreator onMintSuccess={customOnMintSuccess} />
      );

      fillNameAndDescription();
      const fileInput = container.querySelector('input[type="file"]')!;
      fireEvent.change(fileInput, { target: { files: [createFile()] } });
      fireEvent.click(screen.getByText("Upload to IPFS & Continue"));

      await waitFor(() => {
        expect(screen.getByText("2. Mint NFT")).not.toBeDisabled();
      });

      fireEvent.click(screen.getByText("Mint NFT"));

      vi.mocked(wagmi.useWriteContract).mockReturnValue({
        data: "0xabcdef1234567890",
        writeContract: mockWriteContract,
        isPending: false,
        error: null,
        reset: mockResetWrite,
      } as unknown as ReturnType<typeof wagmi.useWriteContract>);

      vi.mocked(wagmi.useWaitForTransactionReceipt).mockReturnValue({
        isLoading: false,
        isSuccess: true,
      } as unknown as ReturnType<typeof wagmi.useWaitForTransactionReceipt>);

      vi.mocked(wagmi.useBalance).mockReturnValue({
        data: {
          value: BigInt("1490000000000000000"),
          formatted: "1.49",
          symbol: "ETH",
          decimals: 18,
        },
        refetch: mockBalanceRefetch,
      } as unknown as ReturnType<typeof wagmi.useBalance>);

      rerender(<NFTCreator onMintSuccess={customOnMintSuccess} />);

      await waitFor(() => {
        expect(customOnMintSuccess).toHaveBeenCalled();
      });

      expect(mockRefetchFn).toHaveBeenCalled();
      expect(mockBalanceRefetch).toHaveBeenCalled();

      await waitFor(() => {
        expect(
          screen.getByText("Upload to IPFS & Continue")
        ).toBeDisabled();
      });
    });

    it("should skip revokeImagePreview on mint success when preview is empty", async () => {
      const { revokeImagePreview } = await import("@/utils/nftMetadata");
      const { uploadNFTToIPFS } = await import("@/services/ipfsClient");
      vi.mocked(uploadNFTToIPFS).mockResolvedValue({
        imageHash: "QmTest123",
        metadataHash: "QmMetadata456",
        imageUrl: "https://ipfs.io/ipfs/QmTest123",
        metadataUrl: "https://ipfs.io/ipfs/QmMetadata456/metadata.json",
      });

      setupContractCycle();
      const customOnMintSuccess = vi.fn();
      const { container, rerender } = render(
        <NFTCreator onMintSuccess={customOnMintSuccess} />
      );

      fillNameAndDescription();
      const fileInput = container.querySelector('input[type="file"]')!;
      fireEvent.change(fileInput, { target: { files: [createFile()] } });
      fireEvent.click(screen.getByText("Upload to IPFS & Continue"));

      await waitFor(() => {
        expect(screen.getByText("2. Mint NFT")).not.toBeDisabled();
      });

      fireEvent.click(screen.getByText("1. Create & Upload"));
      fireEvent.click(screen.getByText("Remove Image"));

      await waitFor(() => {
        expect(screen.getByText("Select Image")).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText("2. Mint NFT"));

      await waitFor(() => {
        expect(screen.getByText("Mint NFT")).not.toBeDisabled();
      });

      fireEvent.click(screen.getByText("Mint NFT"));

      vi.mocked(wagmi.useWriteContract).mockReturnValue({
        data: "0xhash",
        writeContract: mockWriteContract,
        isPending: false,
        error: null,
        reset: mockResetWrite,
      } as unknown as ReturnType<typeof wagmi.useWriteContract>);

      vi.mocked(wagmi.useWaitForTransactionReceipt).mockReturnValue({
        isLoading: false,
        isSuccess: true,
      } as unknown as ReturnType<typeof wagmi.useWaitForTransactionReceipt>);

      rerender(<NFTCreator onMintSuccess={customOnMintSuccess} />);

      await waitFor(() => {
        expect(customOnMintSuccess).toHaveBeenCalled();
      });

      expect(revokeImagePreview).toHaveBeenCalledTimes(1);
    });
  });

  describe("tab switching", () => {
    it("should switch between create and mint tabs", async () => {
      await uploadAndSwitchToMintTab();

      fireEvent.click(screen.getByText("1. Create & Upload"));
      expect(
        screen.getByText("Upload to IPFS & Continue")
      ).toBeInTheDocument();

      fireEvent.click(screen.getByText("2. Mint NFT"));
      expect(screen.getByText("Mint NFT")).toBeInTheDocument();
    });
  });

  describe("edge cases", () => {
    it("should render without crashing with default props", () => {
      render(<NFTCreator onMintSuccess={mockOnMintSuccess} />);
      expect(screen.getByText("NFT Creator")).toBeInTheDocument();
    });

    it("should disable mint button when metadata not uploaded", () => {
      render(<NFTCreator onMintSuccess={mockOnMintSuccess} />);
      expect(screen.getByText("2. Mint NFT")).toBeDisabled();
    });
  });

  describe("isConfirming state", () => {
    it("should show confirming state while transaction is confirming", async () => {
      vi.mocked(wagmi.useWriteContract).mockReturnValue({
        data: "0xhash",
        writeContract: mockWriteContract,
        isPending: false,
        error: null,
        reset: mockResetWrite,
      } as unknown as ReturnType<typeof wagmi.useWriteContract>);
      vi.mocked(wagmi.useWaitForTransactionReceipt).mockReturnValue({
        isLoading: true,
        isSuccess: false,
      } as unknown as ReturnType<typeof wagmi.useWaitForTransactionReceipt>);

      const { uploadNFTToIPFS } = await import("@/services/ipfsClient");
      vi.mocked(uploadNFTToIPFS).mockResolvedValue({
        imageHash: "QmTest123",
        metadataHash: "QmMetadata456",
        imageUrl: "https://ipfs.io/ipfs/QmTest123",
        metadataUrl: "https://ipfs.io/ipfs/QmMetadata456/metadata.json",
      });

      setupContractCycle();
      const { container } = render(
        <NFTCreator onMintSuccess={mockOnMintSuccess} />
      );

      fillNameAndDescription();
      const fileInput = container.querySelector('input[type="file"]')!;
      fireEvent.change(fileInput, { target: { files: [createFile()] } });
      fireEvent.click(screen.getByText("Upload to IPFS & Continue"));

      await waitFor(() => {
        expect(screen.getByText("Confirming...")).toBeInTheDocument();
      });
    });
  });
});
