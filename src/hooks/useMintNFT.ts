import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { parseEther } from "viem";
import { CONTRACT_CONFIG } from "../config/contract";
import { useState, useEffect } from "react";

export interface UseMintNFTParams {
  onSuccess?: (txHash: string) => void;
  onError?: (error: Error) => void;
}

export const useMintNFT = ({ onSuccess, onError }: UseMintNFTParams = {}) => {
  const [mintQuantity, setMintQuantity] = useState<number>(1);

  // Hook for writing to the contract
  const {
    writeContract,
    data: txHash,
    isPending: isMintPending,
    error: writeError,
  } = useWriteContract();

  // Hook for waiting for transaction confirmation
  const {
    isLoading: isConfirming,
    isSuccess: isConfirmed,
    error: confirmError,
  } = useWaitForTransactionReceipt({ hash: txHash });

  // Execute mint transaction
  const mint = async () => {
    try {
      // Validate input
      if (mintQuantity < 1 || mintQuantity > 10) {
        throw new Error("Quantity must be between 1 and 10");
      }

      // Calculate total price in Wei
      const totalPrice = parseEther((0.01 * mintQuantity).toString());

      // Call contract mint function
      writeContract({
        address: CONTRACT_CONFIG.address.sepolia as `0x${string}`,
        abi: CONTRACT_CONFIG.abi,
        functionName: "mint",
        args: [BigInt(mintQuantity)],
        value: totalPrice,
      });
    } catch (err) {
      const error =
        err instanceof Error ? err : new Error("Unknown error occurred");
      onError?.(error);
      console.error("Mint error:", error);
    }
  };

  // Callback when transaction is confirmed
  useEffect(() => {
    if (isConfirmed && txHash) {
      onSuccess?.(txHash);
      setMintQuantity(1); // Reset quantity after successful mint
    }
  }, [isConfirmed, txHash, onSuccess]);

  // Derive overall loading state
  const isLoading = isMintPending || isConfirming;

  // Combine errors from write and confirmation phases
  const error = writeError || confirmError;

  return {
    mint,
    mintQuantity,
    setMintQuantity,
    isLoading,
    isConfirmed,
    txHash,
    error,
  };
};
