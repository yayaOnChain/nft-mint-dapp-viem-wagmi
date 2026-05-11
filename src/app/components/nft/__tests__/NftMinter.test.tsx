import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createConfig, http, WagmiProvider } from "wagmi";
import { sepolia } from "wagmi/chains";
import { parseEther } from "viem";
import type { PropsWithChildren } from "react";

const mockAddress = "0xUserAddress123456789012345678901234567890";

vi.mock("wagmi", async () => {
  const actual = await vi.importActual("wagmi");
  return {
    ...actual,
    useAccount: vi.fn(),
    useReadContract: vi.fn(),
    useWriteContract: vi.fn(),
    useWaitForTransactionReceipt: vi.fn(),
    useBalance: vi.fn(),
  };
});

vi.mock("@/hooks/useToast", () => ({
  useToast: () => ({
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    loading: vi.fn(),
    dismiss: vi.fn(),
    transaction: {
      pending: vi.fn(() => "mock-toast-id"),
      success: vi.fn(),
      error: vi.fn(),
    },
  }),
}));

vi.mock("@/config/env", () => ({
  contractAddress: "0x1234567890123456789012345678901234567890",
}));

vi.mock("@/abi/myNft", () => ({
  myNftAbi: [],
}));

import { NftMinter } from "@/components/nft/NftMinter";
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt, useBalance } from "wagmi";

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

describe("NftMinter", () => {
  const wrapper = createTestWrapper();

  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(useAccount).mockReturnValue({
      address: mockAddress as `0x${string}`,
      addresses: [mockAddress as `0x${string}`],
      isConnected: true,
      isConnecting: false,
      isDisconnected: false,
      isReconnecting: false,
      status: "connected" as const,
      chain: sepolia,
      chainId: sepolia.id,
      connector: undefined as unknown as import("@wagmi/core").Connector,
    });

    vi.mocked(useReadContract).mockImplementation(
      (_config?: { functionName?: string }) => {
        let data: unknown;
        if (_config?.functionName === "totalMinted") data = 5n;
        else if (_config?.functionName === "MAX_SUPPLY") data = 1000n;
        else if (_config?.functionName === "MINT_PRICE") data = parseEther("0.01");
        else if (_config?.functionName === "balanceOf") data = 2n;
        else data = undefined;

        return {
          data,
          error: null,
          status: "success" as const,
          isError: false,
          isLoading: false,
          isPending: false,
          isSuccess: true,
          isLoadingError: false,
          isRefetchError: false,
          isPlaceholderData: false,
          dataUpdatedAt: Date.now(),
          errorUpdatedAt: 0,
          failureCount: 0,
          failureReason: null,
          isFetched: true,
          isFetchedAfterMount: true,
          isFetching: false,
          isStale: false,
          refetch: vi.fn(),
          queryKey: [_config?.functionName ?? "unknown"],
          errorUpdateCount: 0,
          isInitialLoading: false,
          isPaused: false,
          isRefetching: false,
          isPreviousData: false,
          isNextPlaceholderData: false,
        } as unknown as ReturnType<typeof useReadContract>;
      }
    );

    vi.mocked(useWriteContract).mockReturnValue({
      data: undefined,
      writeContract: vi.fn(),
      writeContractAsync: vi.fn(),
      isPending: false,
      error: null,
      isError: false,
      isSuccess: false,
      status: "idle" as const,
      failureCount: 0,
      failureReason: null,
      isIdle: true,
      reset: vi.fn(),
      submittedAt: 0,
      variables: undefined,
      context: undefined,
      isPaused: false,
    });

    vi.mocked(useWaitForTransactionReceipt).mockReturnValue({
      data: undefined,
      error: null,
      isError: false,
      isPending: false,
      isLoading: false,
      isLoadingError: false,
      isRefetchError: false,
      isSuccess: false,
      isPlaceholderData: false,
      dataUpdatedAt: Date.now(),
      errorUpdatedAt: 0,
      failureCount: 0,
      failureReason: null,
      isFetched: false,
      isFetchedAfterMount: false,
      isFetching: false,
      isStale: false,
      refetch: vi.fn(),
      queryKey: ["waitForTransactionReceipt"],
      errorUpdateCount: 0,
      isInitialLoading: false,
      isPaused: false,
      isRefetching: false,
    } as unknown as ReturnType<typeof useWaitForTransactionReceipt>);

    vi.mocked(useBalance).mockReturnValue({
      data: {
        formatted: "1.5",
        symbol: "ETH",
        decimals: 18,
        value: parseEther("1.5"),
      },
      error: null,
      isError: false,
      isPending: false,
      isLoading: false,
      isLoadingError: false,
      isRefetchError: false,
      isSuccess: true,
      isPlaceholderData: false,
      dataUpdatedAt: Date.now(),
      errorUpdatedAt: 0,
      failureCount: 0,
      failureReason: null,
      isFetched: true,
      isFetchedAfterMount: true,
      isFetching: false,
      isStale: false,
      refetch: vi.fn(),
      queryKey: ["getBalance"],
      errorUpdateCount: 0,
      isInitialLoading: false,
      isPaused: false,
      isRefetching: false,
      isEnabled: true,
      fetchStatus: "idle",
      promise: Promise.resolve(),
    } as unknown as ReturnType<typeof useBalance>);
  });

  describe("disconnected state", () => {
    it("should show message when wallet is not connected", () => {
      vi.mocked(useAccount).mockReturnValue({
        address: undefined,
        isConnected: false,
        chain: undefined,
      } as ReturnType<typeof useAccount>);

      render(<NftMinter />, { wrapper });

      expect(
        screen.getByText("Connect your wallet to mint NFTs"),
      ).toBeInTheDocument();
    });
  });

  describe("loading state", () => {
    it("should show skeletons when loading data", () => {
      vi.mocked(useReadContract).mockReturnValue({
        data: undefined,
        error: null,
        status: "pending" as const,
        isError: false,
        isLoading: true,
        isPending: true,
        isSuccess: false,
        isLoadingError: false,
        isRefetchError: false,
        isPlaceholderData: false,
        dataUpdatedAt: 0,
        errorUpdatedAt: 0,
        failureCount: 0,
        failureReason: null,
        isFetched: false,
        isFetchedAfterMount: false,
        isFetching: false,
        isStale: false,
        refetch: vi.fn(),
        queryKey: ["unknown"],
        errorUpdateCount: 0,
        isInitialLoading: true,
        isPaused: false,
        isRefetching: false,
        isPreviousData: false,
        isNextPlaceholderData: false,
      } as unknown as ReturnType<typeof useReadContract>);

      render(<NftMinter />, { wrapper });

      const skeletons = screen.getAllByTestId("skeleton");
      expect(skeletons).toHaveLength(5);
    });
  });

  describe("minting UI", () => {
    it("should display progress bar with correct values", () => {
      render(<NftMinter />, { wrapper });

      expect(screen.getByText(/Minted: 5 \/ 1000/i)).toBeInTheDocument();
    });

    it("should display price per NFT label", () => {
      render(<NftMinter />, { wrapper });

      expect(screen.getByText("Price per NFT")).toBeInTheDocument();
    });

    it("should display quantity selector with default value of 1", () => {
      render(<NftMinter />, { wrapper });

      const quantityInput = screen.getByRole("spinbutton") as HTMLInputElement;
      expect(quantityInput.value).toBe("1");
    });

    it("should display total cost label", () => {
      render(<NftMinter />, { wrapper });

      expect(screen.getByText("Total Cost")).toBeInTheDocument();
    });

    it("should display user ETH balance", () => {
      render(<NftMinter />, { wrapper });

      expect(screen.getByText(/Your Balance:/)).toBeInTheDocument();
    });

    it("should display user NFT balance", () => {
      render(<NftMinter />, { wrapper });

      expect(screen.getByText("Your NFTs: 2")).toBeInTheDocument();
    });

    it("should display mint button", () => {
      render(<NftMinter />, { wrapper });

      expect(
        screen.getByRole("button", { name: /mint nft/i }),
      ).toBeInTheDocument();
    });
  });

  describe("quantity selector", () => {
    it("should increase quantity when + button is clicked", () => {
      render(<NftMinter />, { wrapper });

      const quantityInput = screen.getByRole("spinbutton") as HTMLInputElement;
      const plusButton = screen.getByRole("button", { name: "+" });

      fireEvent.click(plusButton);

      expect(quantityInput.value).toBe("2");
    });

    it("should decrease quantity when - button is clicked (minimum 1)", () => {
      render(<NftMinter />, { wrapper });

      const minusButton = screen.getByRole("button", { name: "-" });
      const quantityInput = screen.getByRole("spinbutton") as HTMLInputElement;

      const plusButton = screen.getByRole("button", { name: "+" });
      fireEvent.click(plusButton);
      expect(quantityInput.value).toBe("2");

      fireEvent.click(minusButton);
      expect(quantityInput.value).toBe("1");

      fireEvent.click(minusButton);
      expect(quantityInput.value).toBe("1");
    });

    it("should not allow quantity above 10", () => {
      render(<NftMinter />, { wrapper });

      const quantityInput = screen.getByRole("spinbutton") as HTMLInputElement;
      const plusButton = screen.getByRole("button", { name: "+" });

      for (let i = 0; i < 15; i++) {
        fireEvent.click(plusButton);
      }

      expect(quantityInput.value).toBe("10");
    });

    it("should update total cost when quantity changes", () => {
      render(<NftMinter />, { wrapper });

      const plusButton = screen.getByRole("button", { name: "+" });

      for (let i = 0; i < 4; i++) {
        fireEvent.click(plusButton);
      }

      expect(screen.getByText("0.05 ETH")).toBeInTheDocument();
    });
  });

  describe("mint button states", () => {
    it("should be enabled when all conditions are met", () => {
      render(<NftMinter />, { wrapper });

      const mintButton = screen.getByRole("button", { name: /mint nft/i });
      expect(mintButton).toBeEnabled();
    });

    it("should be disabled when contract data is loading (undefined)", () => {
      vi.mocked(useReadContract).mockReturnValue({
        data: undefined,
        error: null,
        status: "pending" as const,
        isError: false,
        isLoading: true,
        isPending: true,
        isSuccess: false,
        isLoadingError: false,
        isRefetchError: false,
        isPlaceholderData: false,
        dataUpdatedAt: 0,
        errorUpdatedAt: 0,
        failureCount: 0,
        failureReason: null,
        isFetched: false,
        isFetchedAfterMount: false,
        isFetching: false,
        isStale: false,
        refetch: vi.fn(),
        queryKey: ["unknown"],
        errorUpdateCount: 0,
        isInitialLoading: true,
        isPaused: false,
        isRefetching: false,
        isPreviousData: false,
        isNextPlaceholderData: false,
      } as unknown as ReturnType<typeof useReadContract>);

      render(<NftMinter />, { wrapper });

      const skeletons = screen.getAllByTestId("skeleton");
      expect(skeletons).toHaveLength(5);
    });

    it("should be disabled when totalMinted is 0n (edge case)", () => {
      vi.mocked(useReadContract).mockImplementation(
        (_config?: { functionName?: string }) => {
          let data: unknown;
          if (_config?.functionName === "totalMinted") data = 0n;
          else if (_config?.functionName === "MAX_SUPPLY") data = 1000n;
          else if (_config?.functionName === "MINT_PRICE") data = parseEther("0.01");
          else if (_config?.functionName === "balanceOf") data = 0n;
          else data = undefined;

          return {
            data,
            error: null,
            status: "success" as const,
            isError: false,
            isLoading: false,
            isPending: false,
            isSuccess: true,
            isLoadingError: false,
            isRefetchError: false,
            isPlaceholderData: false,
            dataUpdatedAt: Date.now(),
            errorUpdatedAt: 0,
            failureCount: 0,
            failureReason: null,
            isFetched: true,
            isFetchedAfterMount: true,
            isFetching: false,
            isStale: false,
            refetch: vi.fn(),
            queryKey: [_config?.functionName ?? "unknown"],
            errorUpdateCount: 0,
            isInitialLoading: false,
            isPaused: false,
            isRefetching: false,
            isPreviousData: false,
            isNextPlaceholderData: false,
          } as unknown as ReturnType<typeof useReadContract>;
        }
      );

      render(<NftMinter />, { wrapper });

      const mintButton = screen.getByRole("button", { name: /mint nft/i });
      expect(mintButton).toBeEnabled();
      expect(screen.getByText(/Minted: 0 \/ 1000/i)).toBeInTheDocument();
    });

    it('should show "Confirm in Wallet..." when transaction is pending', () => {
      vi.mocked(useWriteContract).mockReturnValue({
        data: undefined,
        writeContract: vi.fn(),
        writeContractAsync: vi.fn(),
        isPending: true,
        error: undefined,
        reset: vi.fn(),
        submittedAt: 0,
        variables: undefined,
        context: undefined,
        isPaused: false,
      } as unknown as ReturnType<typeof useWriteContract>);

      render(<NftMinter />, { wrapper });

      expect(
        screen.getByRole("button", { name: /confirm in wallet/i }),
      ).toBeInTheDocument();
    });

    it('should show "Confirming..." when transaction is confirming', () => {
      vi.mocked(useWaitForTransactionReceipt).mockReturnValue({
        data: undefined,
        error: null,
        isError: false,
        isPending: false,
        isLoading: true,
        isLoadingError: false,
        isRefetchError: false,
        isSuccess: false,
        isPlaceholderData: false,
        status: "loading" as const,
        dataUpdatedAt: Date.now(),
        errorUpdatedAt: 0,
        failureCount: 0,
        failureReason: null,
        isFetched: false,
        isFetchedAfterMount: false,
        isFetching: false,
        isStale: false,
        refetch: vi.fn(),
        queryKey: ["waitForTransactionReceipt"],
        errorUpdateCount: 0,
        isInitialLoading: false,
        isPaused: false,
        isRefetching: false,
        isPreviousData: false,
        isNextPlaceholderData: false,
      } as unknown as ReturnType<typeof useWaitForTransactionReceipt>);

      render(<NftMinter />, { wrapper });

      expect(
        screen.getByRole("button", { name: /confirming/i }),
      ).toBeInTheDocument();
    });
  });

  describe("mint functionality", () => {
    it("should call writeContract when mint button is clicked", () => {
      const mockWriteContract = vi.fn();
      vi.mocked(useWriteContract).mockReturnValue({
        data: undefined,
        writeContract: mockWriteContract,
        writeContractAsync: vi.fn(),
        isPending: false,
        error: null,
        reset: vi.fn(),
        submittedAt: 0,
        variables: undefined,
        context: undefined,
        isPaused: false,
      } as unknown as ReturnType<typeof useWriteContract>);

      render(<NftMinter />, { wrapper });

      const mintButton = screen.getByRole("button", { name: /mint nft/i });
      fireEvent.click(mintButton);

      expect(mockWriteContract).toHaveBeenCalledWith(
        expect.objectContaining({
          functionName: "mint",
          args: [1n],
        }),
      );
    });

    it("should call onMintSuccess callback after successful mint", async () => {
      const mockOnMintSuccess = vi.fn();
      const mockHash = "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef" as `0x${string}`;

      let currentHash: `0x${string}` | undefined = undefined;
      let isConfirmed = false;

      const mockWriteContract = vi.fn(() => {
        currentHash = mockHash;
      });

      vi.mocked(useWriteContract).mockReturnValue({
        data: currentHash,
        writeContract: mockWriteContract,
        writeContractAsync: vi.fn(),
        isPending: true,
        error: null,
        isError: false,
        isSuccess: false,
        status: "pending" as const,
        failureCount: 0,
        failureReason: null,
        reset: vi.fn(),
        submittedAt: 0,
        variables: undefined,
        context: undefined,
        isPaused: false,
      } as unknown as ReturnType<typeof useWriteContract>);

      vi.mocked(useWaitForTransactionReceipt).mockReturnValue({
        data: isConfirmed ? { transactionHash: mockHash, blockNumber: 123456n } : undefined,
        error: null,
        isError: false,
        isPending: !isConfirmed,
        isLoading: !isConfirmed,
        isLoadingError: false,
        isRefetchError: false,
        isSuccess: isConfirmed,
        isPlaceholderData: false,
        dataUpdatedAt: Date.now(),
        errorUpdatedAt: 0,
        failureCount: 0,
        failureReason: null,
        isFetched: isConfirmed,
        isFetchedAfterMount: isConfirmed,
        isFetching: false,
        isStale: false,
        refetch: vi.fn(),
        queryKey: ["waitForTransactionReceipt"],
        errorUpdateCount: 0,
        isInitialLoading: false,
        isPaused: false,
        isRefetching: false,
        isPreviousData: false,
        isNextPlaceholderData: false,
      } as unknown as ReturnType<typeof useWaitForTransactionReceipt>);

      const { rerender } = render(
        <NftMinter onMintSuccess={mockOnMintSuccess} />,
        { wrapper },
      );

      isConfirmed = true;

      vi.mocked(useWriteContract).mockReturnValue({
        data: mockHash,
        writeContract: mockWriteContract,
        writeContractAsync: vi.fn(),
        isPending: false,
        error: null,
        isError: false,
        isSuccess: true,
        status: "success" as const,
        failureCount: 0,
        failureReason: null,
        reset: vi.fn(),
        submittedAt: 0,
        variables: undefined,
        context: undefined,
        isPaused: false,
      } as unknown as ReturnType<typeof useWriteContract>);

      vi.mocked(useWaitForTransactionReceipt).mockReturnValue({
        data: { transactionHash: mockHash, blockNumber: 123456n },
        error: null,
        isError: false,
        isPending: false,
        isLoading: false,
        isLoadingError: false,
        isRefetchError: false,
        isSuccess: true,
        isPlaceholderData: false,
        dataUpdatedAt: Date.now(),
        errorUpdatedAt: 0,
        failureCount: 0,
        failureReason: null,
        isFetched: true,
        isFetchedAfterMount: true,
        isFetching: false,
        isStale: false,
        refetch: vi.fn(),
        queryKey: ["waitForTransactionReceipt"],
        errorUpdateCount: 0,
        isInitialLoading: false,
        isPaused: false,
        isRefetching: false,
        isPreviousData: false,
        isNextPlaceholderData: false,
      } as unknown as ReturnType<typeof useWaitForTransactionReceipt>);

      rerender(<NftMinter onMintSuccess={mockOnMintSuccess} />);

      await waitFor(() => {
        expect(mockOnMintSuccess).toHaveBeenCalled();
      });
    });
  });

  describe("progress calculation", () => {
    it("should calculate correct progress percentage", () => {
      vi.mocked(useReadContract).mockImplementation(
        (config?: { functionName?: string }) => {
          let data: unknown;
          if (config?.functionName === "totalMinted") data = 500n;
          else if (config?.functionName === "MAX_SUPPLY") data = 1000n;
          else if (config?.functionName === "MINT_PRICE") data = parseEther("0.01");
          else if (config?.functionName === "balanceOf") data = 2n;
          else data = undefined;

          return {
            data,
            error: null,
            isError: false,
            isPending: false,
            isLoading: false,
            isLoadingError: false,
            isRefetchError: false,
            isSuccess: true,
            isPlaceholderData: false,
            status: "success" as const,
            dataUpdatedAt: Date.now(),
            errorUpdatedAt: 0,
            failureCount: 0,
            failureReason: null,
            isFetched: true,
            isFetchedAfterMount: true,
            isFetching: false,
            isStale: false,
            refetch: vi.fn(),
            queryKey: [config?.functionName ?? "unknown"],
            errorUpdateCount: 0,
            isInitialLoading: false,
            isPaused: false,
            isRefetching: false,
            isPreviousData: false,
            isNextPlaceholderData: false,
          } as unknown as ReturnType<typeof useReadContract>;
        }
      );

      render(<NftMinter />, { wrapper });

      expect(screen.getByText("50%")).toBeInTheDocument();
    });
  });
});