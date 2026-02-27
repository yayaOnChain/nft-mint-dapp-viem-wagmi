import { toast } from "sonner";
import { debounce } from "lodash";
import { useCallback, useRef } from "react";

/**
 * Custom hook for consistent toast notifications across the app
 */
export const useToast = () => {
  // Track last toast time to prevent spam
  const lastToastTime = useRef<Record<string, number>>({});
  const DEBOUNCE_DELAY = 1000; // 1 second minimum between same toasts

  /**
   * Show success toast with debounce protection
   */
  const success = useCallback((message: string, description?: string) => {
    const now = Date.now();
    const toastKey = `success-${message}`;

    // Check if same toast was shown recently
    if (
      lastToastTime.current[toastKey] &&
      now - lastToastTime.current[toastKey] < DEBOUNCE_DELAY
    ) {
      return; // Skip this toast
    }

    lastToastTime.current[toastKey] = now;

    toast.success(message, {
      description,
      duration: 4000,
    });
  }, []);

  /**
   * Show error toast with debounce protection
   */
  const error = useCallback((message: string, description?: string) => {
    const now = Date.now();
    const toastKey = `error-${message}`;

    if (
      lastToastTime.current[toastKey] &&
      now - lastToastTime.current[toastKey] < DEBOUNCE_DELAY
    ) {
      return;
    }

    lastToastTime.current[toastKey] = now;

    toast.error(message, {
      description,
      duration: 6000,
    });
  }, []);

  /**
   * Show loading toast (returns dismiss function)
   * no debounce needed for loading states
   */
  const loading = (message: string, description?: string) => {
    return toast.loading(message, {
      description,
      duration: Infinity, // Must be dismissed manually
    });
  };

  /**
   * Show info toast with debounce protection
   */
  const info = useCallback((message: string, description?: string) => {
    const now = Date.now();
    const toastKey = `info-${message}`;

    if (
      lastToastTime.current[toastKey] &&
      now - lastToastTime.current[toastKey] < DEBOUNCE_DELAY
    ) {
      return;
    }

    lastToastTime.current[toastKey] = now;

    toast(message, {
      description,
      duration: 4000,
    });
  }, []);

  /**
   * Show transaction-specific toast with Etherscan link
   */
  const transaction = {
    pending: useCallback(() => {
      const id = toast.loading("Transaction Pending", {
        description: "Waiting for confirmation...",
        duration: Infinity,
      });
      return id;
    }, []),
    success: useCallback(
      (txHash: string, toastId?: string | number | null, chainId?: number) => {
        if (!toastId) return;

        const explorerUrl =
          chainId === 11155111
            ? `https://sepolia.etherscan.io/tx/${txHash}`
            : `https://etherscan.io/tx/${txHash}`;

        toast.success("Transaction Confirmed!", {
          id: toastId,
          description: `View on Etherscan: ${explorerUrl}`,
          className: "text-purple-400 hover:text-purple-300 underline",
          duration: 8000,
        });
      },
      [],
    ),
    error: useCallback(
      (errorMessage: string, toastId?: string | number | null) => {
        if (!toastId) return;

        const now = Date.now();
        const toastKey = `tx-error-${errorMessage}`;

        if (
          lastToastTime.current[toastKey] &&
          now - lastToastTime.current[toastKey] < 3000
        ) {
          // 3s for tx errors
          return;
        }

        lastToastTime.current[toastKey] = now;

        toast.error("Transaction Failed", {
          id: toastId,
          description: errorMessage,
          duration: 6000,
        });
      },
      [],
    ),
  };

  /**
   * Alternative: Use lodash-style debounce for custom functions
   * This creates a debounced version of any toast call
   */
  const createDebouncedToast = useCallback(
    (type: "success" | "error" | "info", delay: number = 1000) => {
      return debounce((message: string, description?: string) => {
        if (type === "success") success(message, description);
        else if (type === "error") error(message, description);
        else info(message, description);
      }, delay);
    },
    [success, error, info],
  );

  return { success, error, loading, info, transaction, createDebouncedToast };
};
