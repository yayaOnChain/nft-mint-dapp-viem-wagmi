import { myNftAbi } from "@/abi/myNft";

/**
 * Application-wide constants
 * All magic numbers and strings should be defined here
 */

export const APP_CONFIG = {
  name: "MyProjectNFT",
  tagline: "A premium NFT collection on Ethereum",
  description:
    "Mint unique NFTs on the Ethereum blockchain. Limited supply, maximum quality.",
  version: "1.0.0",
  author: "yayaOnChain",
  repository: "https://github.com/yayaOnChain/nft-mint-dapp-viem-wagmi",
  discord: "https://discord.gg/yourserver",
  twitter: "https://x.com/yayaOnChain",
} as const;

export const CONTRACT_CONFIG = {
  abi: myNftAbi,
  maxSupply: 1000,
  mintPrice: "0.01",
  mintPriceWei: 10000000000000000n,
  maxMintPerTransaction: 10,
  defaultMintQuantity: 1,
} as const;

export const CHAIN_CONFIG = {
  default: "sepolia",
  production: "mainnet",
  supported: ["sepolia", "mainnet"] as const,
} as const;

export const CHAIN_IDS = {
  mainnet: 1,
  sepolia: 11155111,
} as const;

export const EXPLORER_URLS = {
  [CHAIN_IDS.mainnet]: "https://etherscan.io",
  [CHAIN_IDS.sepolia]: "https://sepolia.etherscan.io",
} as const;

export const UI_CONFIG = {
  toast: {
    duration: 4000,
    errorDuration: 6000,
    successDuration: 5000,
    position: "bottom-right" as const,
    maxVisible: 5,
  },
  polling: {
    interval: 15000,
    eventInterval: 5000,
    retryCount: 3,
  },
  animation: {
    duration: 300,
    easing: "ease-out",
    fadeInDelay: 100,
  },
  pagination: {
    defaultLimit: 10,
    maxLimit: 100,
    defaultPage: 1,
  },
  skeleton: {
    count: 4,
    animationDuration: 1500,
  },
} as const;

export const STORAGE_KEYS = {
  connectedWallet: "myproject_connected_wallet",
  preferredChain: "myproject_preferred_chain",
  theme: "myproject_theme",
  lastTransaction: "myproject_last_transaction",
} as const;

export const ERROR_MESSAGES = {
  walletNotConnected: "Please connect your wallet first",
  wrongNetwork: "Please switch to the correct network",
  insufficientBalance: "Insufficient ETH balance",
  maxSupplyReached: "Max supply has been reached",
  mintLimitExceeded: "Mint limit per transaction exceeded",
  transactionRejected: "Transaction was rejected by user",
  transactionFailed: "Transaction failed. Please try again.",
  networkError: "Network error. Please check your connection.",
  contractError: "Contract interaction failed.",
  apiError: "Failed to fetch data. Please try again.",
  unknownError: "An unknown error occurred.",
} as const;

export const SUCCESS_MESSAGES = {
  walletConnected: "Wallet connected successfully",
  walletDisconnected: "Wallet disconnected",
  mintInitiated: "Mint transaction initiated",
  mintSuccess: "NFT minted successfully!",
  transactionConfirmed: "Transaction confirmed on blockchain",
  dataRefreshed: "Data refreshed successfully",
} as const;

export const IPFS_GATEWAYS = [
  "https://ipfs.io/ipfs/",
  "https://gateway.pinata.cloud/ipfs/",
  "https://cloudflare-ipfs.com/ipfs/",
  "https://gateway.ipfs.io/ipfs/",
] as const;

export const RPC_URLS = {
  mainnet: {
    http: "https://eth-mainnet.g.alchemy.com/v2/",
    ws: "wss://eth-mainnet.g.alchemy.com/v2/",
  },
  sepolia: {
    http: "https://eth-sepolia.g.alchemy.com/v2/",
    ws: "wss://eth-sepolia.g.alchemy.com/v2/",
  },
} as const;

export const DATE_FORMATS = {
  short: "MMM d, yyyy",
  long: "MMMM d, yyyy HH:mm:ss",
  relative: "relative",
  iso: "iso",
} as const;

export const VALIDATION_RULES = {
  mintQuantity: {
    min: 1,
    max: 10,
  },
  address: {
    minLength: 42,
    pattern: /^0x[a-fA-F0-9]{40}$/,
  },
  txHash: {
    minLength: 66,
    pattern: /^0x[a-fA-F0-9]{64}$/,
  },
} as const;

export const CACHE_CONFIG = {
  staleTime: 5 * 60 * 1000, // 5 minutes
  gcTime: 10 * 60 * 1000, // 10 minutes
  retry: 2,
  retryDelay: 1000,
} as const;

export const FEATURE_FLAGS = {
  enableWalletConnect: true,
  enableEventListeners: true,
  enableTransactionHistory: true,
  enableNFTGallery: true,
  enableDarkMode: true,
  enableAnalytics: false,
} as const;

/**
 * Helper function to get explorer URL for a transaction
 */
export const getExplorerTxUrl = (txHash: string, chainId: number): string => {
  const baseUrl =
    EXPLORER_URLS[chainId as keyof typeof EXPLORER_URLS] ||
    EXPLORER_URLS[CHAIN_IDS.sepolia];
  return `${baseUrl}/tx/${txHash}`;
};

/**
 * Helper function to get explorer URL for an address
 */
export const getExplorerAddressUrl = (
  address: string,
  chainId: number,
): string => {
  const baseUrl =
    EXPLORER_URLS[chainId as keyof typeof EXPLORER_URLS] ||
    EXPLORER_URLS[CHAIN_IDS.sepolia];
  return `${baseUrl}/address/${address}`;
};

/**
 * Helper function to get explorer URL for a token
 */
export const getExplorerTokenUrl = (
  contractAddress: string,
  tokenId: string,
  chainId: number,
): string => {
  const baseUrl =
    EXPLORER_URLS[chainId as keyof typeof EXPLORER_URLS] ||
    EXPLORER_URLS[CHAIN_IDS.sepolia];
  return `${baseUrl}/token/${contractAddress}?a=${tokenId}`;
};
