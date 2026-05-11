/**
 * Environment configuration for Next.js
 * All env variables should be accessed through this file
 */

interface EnvConfig {
  walletConnectProjectId: string;
  contractAddress: `0x${string}`;
  useWebSocket: boolean;
}

// Client-safe variables (NEXT_PUBLIC_ prefix)
const env: EnvConfig = {
  walletConnectProjectId: process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID || "",
  contractAddress: (process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || "") as `0x${string}`,
  useWebSocket: process.env.NEXT_PUBLIC_USE_WEBSOCKET === "true",
};

// Validate required client environment variables
if (typeof window !== "undefined") {
  if (!env.walletConnectProjectId) {
    throw new Error("Missing NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID");
  }
  if (!env.contractAddress) {
    throw new Error("Missing NEXT_PUBLIC_CONTRACT_ADDRESS");
  }
}

// Export individual values for convenience
export const {
  walletConnectProjectId,
  contractAddress,
  useWebSocket,
} = env;
