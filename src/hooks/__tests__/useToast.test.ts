import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useToast } from "@/hooks/useToast";

// Mock sonner toast - must be before any variable that uses the mocks
vi.mock("sonner", () => {
  const mockFn = vi.fn();
  mockFn.success = vi.fn();
  mockFn.error = vi.fn();
  mockFn.loading = vi.fn();
  mockFn.info = vi.fn();
  mockFn.dismiss = vi.fn();
  return {
    toast: mockFn,
  };
});

// Import mocked module after vi.mock
let toast: typeof import("sonner").toast;
let mockToastSuccess: ReturnType<typeof vi.fn>;
let mockToastError: ReturnType<typeof vi.fn>;
let mockToastLoading: ReturnType<typeof vi.fn>;
let mockToastInfo: ReturnType<typeof vi.fn>;

describe("useToast", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    // Get fresh references after clearing mocks
    const sonner = await import("sonner");
    toast = sonner.toast;
    mockToastSuccess = toast.success;
    mockToastError = toast.error;
    mockToastLoading = toast.loading;
    mockToastInfo = toast.info;
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("success", () => {
    it("should call toast.success with message", () => {
      const { result } = renderHook(() => useToast());

      act(() => {
        result.current.success("Success message");
      });

      expect(mockToastSuccess).toHaveBeenCalledWith(
        "Success message",
        expect.objectContaining({
          duration: 4000,
        }),
      );
    });

    it("should call toast.success with description", () => {
      const { result } = renderHook(() => useToast());

      act(() => {
        result.current.success("Success message", "Detailed description");
      });

      expect(mockToastSuccess).toHaveBeenCalledWith(
        "Success message",
        expect.objectContaining({
          description: "Detailed description",
        }),
      );
    });

    it("should debounce same messages within 1 second", () => {
      vi.useFakeTimers();
      const { result } = renderHook(() => useToast());

      act(() => {
        result.current.success("Same message");
        result.current.success("Same message");
      });

      expect(mockToastSuccess).toHaveBeenCalledTimes(1);

      // After debounce period, should allow new toast
      act(() => {
        vi.advanceTimersByTime(1100);
        result.current.success("Same message");
      });

      expect(mockToastSuccess).toHaveBeenCalledTimes(2);
    });
  });

  describe("error", () => {
    it("should call toast.error with message", () => {
      const { result } = renderHook(() => useToast());

      act(() => {
        result.current.error("Error message");
      });

      expect(mockToastError).toHaveBeenCalledWith(
        "Error message",
        expect.objectContaining({
          duration: 6000,
        }),
      );
    });

    it("should call toast.error with description", () => {
      const { result } = renderHook(() => useToast());

      act(() => {
        result.current.error("Error message", "Error details");
      });

      expect(mockToastError).toHaveBeenCalledWith(
        "Error message",
        expect.objectContaining({
          description: "Error details",
        }),
      );
    });

    it("should debounce same error messages", () => {
      vi.useFakeTimers();
      const { result } = renderHook(() => useToast());

      act(() => {
        result.current.error("Same error");
        result.current.error("Same error");
      });

      expect(mockToastError).toHaveBeenCalledTimes(1);
    });
  });

  describe("loading", () => {
    it("should call toast.loading with message", () => {
      const mockToastId = 123;
      mockToastLoading.mockReturnValue(mockToastId);
      const { result } = renderHook(() => useToast());

      let toastId: number | undefined;
      act(() => {
        toastId = result.current.loading("Loading message");
      });

      expect(mockToastLoading).toHaveBeenCalledWith(
        "Loading message",
        expect.objectContaining({
          duration: Infinity,
        }),
      );
      expect(toastId).toBe(mockToastId);
    });

    it("should call toast.loading with description", () => {
      const { result } = renderHook(() => useToast());

      act(() => {
        result.current.loading("Loading message", "Loading description");
      });

      expect(mockToastLoading).toHaveBeenCalledWith(
        "Loading message",
        expect.objectContaining({
          description: "Loading description",
        }),
      );
    });

    it("should not debounce loading toasts", () => {
      const { result } = renderHook(() => useToast());

      act(() => {
        result.current.loading("Loading 1");
        result.current.loading("Loading 1");
      });

      expect(mockToastLoading).toHaveBeenCalledTimes(2);
    });
  });

  describe("info", () => {
    it("should call toast (main function) with message", () => {
      const { result } = renderHook(() => useToast());

      act(() => {
        result.current.info("Info message");
      });

      // Note: info() calls toast() (the main function), not toast.info()
      expect(toast).toHaveBeenCalledWith(
        "Info message",
        expect.objectContaining({
          description: undefined,
          duration: 4000,
        }),
      );
    });

    it("should debounce same info messages", () => {
      vi.useFakeTimers();
      const { result } = renderHook(() => useToast());

      act(() => {
        result.current.info("Same info");
        result.current.info("Same info");
      });

      expect(toast).toHaveBeenCalledTimes(1);
    });
  });

  describe("transaction", () => {
    describe("pending", () => {
      it("should show pending toast", () => {
        const mockToastId = 456;
        mockToastLoading.mockReturnValue(mockToastId);
        const { result } = renderHook(() => useToast());

        let toastId: number | undefined;
        act(() => {
          toastId = result.current.transaction.pending();
        });

        expect(mockToastLoading).toHaveBeenCalledWith(
          "Transaction Pending",
          expect.objectContaining({
            description: "Waiting for confirmation...",
            duration: Infinity,
          }),
        );
        expect(toastId).toBe(mockToastId);
      });
    });

    describe("success", () => {
      it("should update toast to success with Etherscan link for Sepolia", () => {
        const toastId = 789;
        const txHash = "0xabc123def456";
        const { result } = renderHook(() => useToast());

        act(() => {
          result.current.transaction.success(txHash, toastId, 11155111);
        });

        expect(mockToastSuccess).toHaveBeenCalledWith(
          "Transaction Confirmed!",
          expect.objectContaining({
            id: toastId,
            description: expect.stringContaining(
              "https://sepolia.etherscan.io/tx/",
            ),
          }),
        );
      });

      it("should update toast to success with Etherscan link for Mainnet", () => {
        const toastId = 789;
        const txHash = "0xabc123def456";
        const { result } = renderHook(() => useToast());

        act(() => {
          result.current.transaction.success(txHash, toastId, 1);
        });

        expect(mockToastSuccess).toHaveBeenCalledWith(
          "Transaction Confirmed!",
          expect.objectContaining({
            description: expect.stringContaining("https://etherscan.io/tx/"),
          }),
        );
      });

      it("should not update if toastId is null", () => {
        const { result } = renderHook(() => useToast());

        act(() => {
          result.current.transaction.success("0xabc", null);
        });

        expect(mockToastSuccess).not.toHaveBeenCalledWith(
          "Transaction Confirmed!",
          expect.objectContaining({
            id: null,
          }),
        );
      });
    });

    describe("error", () => {
      it("should update toast to error with message", () => {
        const toastId = 999;
        const errorMessage = "User rejected transaction";
        const { result } = renderHook(() => useToast());

        act(() => {
          result.current.transaction.error(errorMessage, toastId);
        });

        expect(mockToastError).toHaveBeenCalledWith(
          "Transaction Failed",
          expect.objectContaining({
            id: toastId,
            description: errorMessage,
            duration: 6000,
          }),
        );
      });

      it("should debounce transaction errors within 3 seconds", () => {
        vi.useFakeTimers();
        const toastId = 999;
        const { result } = renderHook(() => useToast());

        act(() => {
          result.current.transaction.error("Error 1", toastId);
          result.current.transaction.error("Error 1", toastId);
        });

        expect(mockToastError).toHaveBeenCalledTimes(1);
      });

      it("should not update if toastId is null", () => {
        const { result } = renderHook(() => useToast());

        act(() => {
          result.current.transaction.error("Error message", null);
        });

        expect(mockToastError).not.toHaveBeenCalledWith(
          "Transaction Failed",
          expect.objectContaining({
            id: null,
          }),
        );
      });
    });
  });
});
