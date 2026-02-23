import { MyNFTAbi } from "../lib/abi/MyNFT";

export const CONTRACT_CONFIG = {
  address: {
    mainnet: "0xYourContractAddressHere",
    sepolia: import.meta.env.VITE_CONTRACT_ADDRESS, // Use environment variable for testnet address
  },
  abi: MyNFTAbi,
} as const;
