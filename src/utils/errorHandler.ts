export const handleContractError = (error: any): string => {
  // Handle common viem/wagmi errors
  if (error?.message?.includes("user rejected")) {
    return "You rejected the transaction in your wallet";
  }

  if (error?.message?.includes("insufficient funds")) {
    return "Not enough ETH for gas + mint price";
  }

  // Handle contract revert reasons
  if (error?.shortMessage) {
    return error.shortMessage;
  }

  return "An unexpected error occurred. Please try again.";
};
