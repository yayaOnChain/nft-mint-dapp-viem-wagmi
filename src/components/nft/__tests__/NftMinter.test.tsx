import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createConfig, http, WagmiProvider } from "wagmi";
import { sepolia } from "wagmi/chains";
import { parseEther } from "viem";
import * as wagmi from "wagmi";
import type {
  UseAccountReturnType,
  UseReadContractReturnType,
  UseWriteContractReturnType,
  UseWaitForTransactionReceiptReturnType,
  UseBalanceReturnType,
} from "wagmi";
import type { Connector } from "@wagmi/core";
import { NftMinter } from "@/components/nft/NftMinter";

// Mock the toast hook
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

// Mock contract address
vi.mock("../../../config/env", () => ({
  contractAddress: "0x1234567890123456789012345678901234567890",
}));

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

  return ({ children }: React.PropsWithChildren) => (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  );
};

describe("NftMinter", () => {
  let wrapper: React.ComponentType<React.PropsWithChildren>;
  let useAccountSpy: ReturnType<typeof vi.spyOn>;
  let useReadContractSpy: ReturnType<typeof vi.spyOn>;
  let useWriteContractSpy: ReturnType<typeof vi.spyOn>;
  let useWaitForTransactionReceiptSpy: ReturnType<typeof vi.spyOn>;
  let useBalanceSpy: ReturnType<typeof vi.spyOn>;

  const mockAddress = "0xUserAddress123456789012345678901234567890";

  beforeEach(() => {
    wrapper = createTestWrapper();

    // Mock useAccount
    useAccountSpy = vi.spyOn(wagmi, "useAccount").mockReturnValue({
      address: mockAddress as `0x${string}`,
      addresses: [mockAddress as `0x${string}`],
      isConnected: true,
      isConnecting: false,
      isDisconnected: false,
      isReconnecting: false,
      status: "connected",
      chain: sepolia,
      chainId: sepolia.id,
      connector: undefined as unknown as Connector,
    } as UseAccountReturnType);

    // Mock useReadContract
    useReadContractSpy = vi.spyOn(wagmi, "useReadContract").mockImplementation(
      (_config?: { functionName?: string }) =>
        ({
          data: (() => {
            if (_config?.functionName === "totalMinted") return 5n;
            if (_config?.functionName === "MAX_SUPPLY") return 1000n;
            if (_config?.functionName === "MINT_PRICE") return parseEther("0.01");
            if (_config?.functionName === "balanceOf") return 2n;
            return undefined;
          })(),
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
        }) as unknown as UseReadContractReturnType,
    );

    // Mock useWriteContract
    useWriteContractSpy = vi.spyOn(wagmi, "useWriteContract").mockReturnValue({
      data: undefined,
      writeContract: vi.fn(),
      isPending: false,
      error: null,
      isError: false,
      isSuccess: false,
      status: "idle",
      failureCount: 0,
      failureReason: null,
      isIdle: true,
      reset: vi.fn(),
      submittedAt: 0,
      variables: undefined,
      context: undefined,
      isPaused: false,
    } as unknown as UseWriteContractReturnType);

    // Mock useWaitForTransactionReceipt
    useWaitForTransactionReceiptSpy = vi
      .spyOn(wagmi, "useWaitForTransactionReceipt")
      .mockReturnValue({
        data: undefined,
        error: null,
        isError: false,
        isPending: false,
        isLoading: false,
        isLoadingError: false,
        isRefetchError: false,
        isSuccess: false,
        isPlaceholderData: false,
        status: "idle",
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
      } as unknown as UseWaitForTransactionReceiptReturnType);

    // Mock useBalance
    useBalanceSpy = vi.spyOn(wagmi, "useBalance").mockReturnValue({
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
      queryKey: ["getBalance"],
      errorUpdateCount: 0,
      isInitialLoading: false,
      isPaused: false,
      isRefetching: false,
      isPreviousData: false,
      isNextPlaceholderData: false,
    } as unknown as UseBalanceReturnType);
  });

  afterEach(() => {
    useAccountSpy.mockRestore();
    useReadContractSpy.mockRestore();
    useWriteContractSpy.mockRestore();
    useWaitForTransactionReceiptSpy.mockRestore();
    useBalanceSpy.mockRestore();
    vi.restoreAllMocks();
  });

  describe("disconnected state", () => {
    it("should show message when wallet is not connected", () => {
      useAccountSpy.mockReturnValue({
        address: undefined,
        isConnected: false,
        chain: undefined,
      } as Partial<UseAccountReturnType>);

      render(<NftMinter />, { wrapper });

      expect(
        screen.getByText("Connect your wallet to mint NFTs"),
      ).toBeInTheDocument();
    });
  });

  describe("loading state", () => {
    it("should show skeletons when loading data", () => {
      useReadContractSpy.mockImplementation(
        () =>
          ({
            data: undefined,
            refetch: vi.fn(),
            isLoading: true,
          }) as unknown as UseReadContractReturnType,
      );

      render(<NftMinter />, { wrapper });

      // Check for skeleton elements by their CSS class
      const skeletons = screen.getAllByTestId("skeleton");
      expect(skeletons).toHaveLength(5);
    });
  });

  describe("minting UI", () => {
    it("should display progress bar with correct values", () => {
      render(<NftMinter />, { wrapper });

      expect(screen.getByText(/Minted: 5 \/ 1000/i)).toBeInTheDocument();
      expect(screen.getByText(/0%|Minted/i)).toBeInTheDocument();
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
      expect(screen.queryByText(/Loading\.\.\./)).not.toBeInTheDocument();
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

      // Set to 2 first
      const plusButton = screen.getByRole("button", { name: "+" });
      fireEvent.click(plusButton);
      expect(quantityInput.value).toBe("2");

      // Then decrease
      fireEvent.click(minusButton);
      expect(quantityInput.value).toBe("1");

      // Should not go below 1
      fireEvent.click(minusButton);
      expect(quantityInput.value).toBe("1");
    });

    it("should not allow quantity above 10", () => {
      render(<NftMinter />, { wrapper });

      const quantityInput = screen.getByRole("spinbutton") as HTMLInputElement;
      const plusButton = screen.getByRole("button", { name: "+" });

      // Click 10 times
      for (let i = 0; i < 15; i++) {
        fireEvent.click(plusButton);
      }

      expect(quantityInput.value).toBe("10");
    });

    it("should update total cost when quantity changes", () => {
      render(<NftMinter />, { wrapper });

      const plusButton = screen.getByRole("button", { name: "+" });

      // Click to increase to 5
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

    it('should show "Confirm in Wallet..." when transaction is pending', () => {
      useWriteContractSpy.mockReturnValue({
        data: undefined,
        writeContract: vi.fn(),
        isPending: true,
        error: undefined,
      } as Partial<UseWriteContractReturnType>);

      render(<NftMinter />, { wrapper });

      expect(
        screen.getByRole("button", { name: /confirm in wallet/i }),
      ).toBeInTheDocument();
    });

    it('should show "Confirming..." when transaction is confirming', () => {
      useWaitForTransactionReceiptSpy.mockReturnValue({
        isLoading: true,
        isSuccess: false,
      } as Partial<UseWaitForTransactionReceiptReturnType>);

      render(<NftMinter />, { wrapper });

      expect(
        screen.getByRole("button", { name: /confirming/i }),
      ).toBeInTheDocument();
    });
  });

  describe("mint functionality", () => {
    it("should call writeContract when mint button is clicked", () => {
      const mockWriteContract = vi.fn();
      useWriteContractSpy.mockReturnValue({
        data: undefined,
        writeContract: mockWriteContract,
        isPending: false,
        error: undefined,
      } as Partial<UseWriteContractReturnType>);

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
      const mockHash = "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef";

      // Mock refetch functions
      const mockRefetchTotalMinted = vi.fn();
      const mockRefetchEthBalance = vi.fn();

      // Track transaction state
      let currentHash: `0x${string}` | undefined = undefined;
      let isConfirmed = false;

      // Mock useWriteContract - hash gets set when writeContract is called
      const mockWriteContract = vi.fn(() => {
        currentHash = mockHash as `0x${string}`;
      });
      useWriteContractSpy.mockReturnValue({
        data: currentHash,
        writeContract: mockWriteContract,
        isPending: true, // Start as pending to trigger toastId set
        error: undefined,
        reset: vi.fn(),
        submittedAt: 0,
        variables: undefined,
        context: undefined,
        isPaused: false,
      } as unknown as UseWriteContractReturnType);

      // Mock useWaitForTransactionReceipt - starts pending, then confirmed
      useWaitForTransactionReceiptSpy.mockImplementation(() => ({
        data: isConfirmed
          ? { transactionHash: mockHash as `0x${string}`, blockNumber: 123456n }
          : undefined,
        isLoading: !isConfirmed,
        isSuccess: isConfirmed,
      } as Partial<UseWaitForTransactionReceiptReturnType>));

      // Mock useReadContract to return refetch functions
      useReadContractSpy.mockImplementation(
        () =>
          ({
            data: 5n,
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
            refetch: mockRefetchTotalMinted,
            queryKey: ["totalMinted"],
          }) as unknown as UseReadContractReturnType,
      );

      // Mock useBalance to return refetch function
      useBalanceSpy.mockReturnValue({
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
        status: "success" as const,
        dataUpdatedAt: Date.now(),
        errorUpdatedAt: 0,
        failureCount: 0,
        failureReason: null,
        isFetched: true,
        isFetchedAfterMount: true,
        isFetching: false,
        isStale: false,
        refetch: mockRefetchEthBalance,
        queryKey: ["getBalance"],
        errorUpdateCount: 0,
        isInitialLoading: false,
        isPaused: false,
        isRefetching: false,
        isPreviousData: false,
        isNextPlaceholderData: false,
      } as unknown as UseBalanceReturnType);

      const { rerender } = render(
        <NftMinter onMintSuccess={mockOnMintSuccess} />,
        { wrapper },
      );

      // Simulate transaction confirmation
      isConfirmed = true;

      // Update mocks for confirmed state
      useWriteContractSpy.mockReturnValue({
        data: mockHash as `0x${string}`,
        writeContract: mockWriteContract,
        isPending: false,
        error: undefined,
        reset: vi.fn(),
        submittedAt: 0,
        variables: undefined,
        context: undefined,
        isPaused: false,
      } as unknown as UseWriteContractReturnType);

      // Rerender to trigger the state change
      rerender(<NftMinter onMintSuccess={mockOnMintSuccess} />);

      // Wait for the refetch functions to be called (which indicates the callback should have been triggered)
      await waitFor(() => {
        expect(mockRefetchTotalMinted).toHaveBeenCalled();
      });

      // Verify the callback was called
      expect(mockOnMintSuccess).toHaveBeenCalled();
    });
  });

  describe("progress calculation", () => {
    it("should calculate correct progress percentage", () => {
      useReadContractSpy.mockImplementation(
        (config: { functionName?: string }) =>
          ({
            data: (() => {
              if (config?.functionName === "totalMinted") return 500n;
              if (config?.functionName === "MAX_SUPPLY") return 1000n;
              if (config?.functionName === "MINT_PRICE") return parseEther("0.01");
              if (config?.functionName === "balanceOf") return 2n;
              return undefined;
            })(),
            refetch: vi.fn(),
            isLoading: false,
          }) as unknown as UseReadContractReturnType,
      );

      render(<NftMinter />, { wrapper });

      expect(screen.getByText("50%")).toBeInTheDocument();
    });
  });
});
