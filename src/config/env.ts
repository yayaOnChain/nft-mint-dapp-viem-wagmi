/**
 * Environment configuration with validation
 * All env variables should be accessed through this file
 */

interface EnvConfig {
  walletConnectProjectId: string;
  contractAddress: `0x${string}`;
  alchemyApiKey: string;
  alchemyNetwork: string;
  useWebSocket: boolean;
  alchemyWsUrl?: string;
}

// Validate required environment variables
const validateEnv = () => {
  const required = ["VITE_WALLET_CONNECT_PROJECT_ID", "VITE_CONTRACT_ADDRESS"];

  required.forEach((key) => {
    if (!import.meta.env[key]) {
      throw new Error(`Missing required environment variable: ${key}`);
    }
  });
};

// Run validation on module load (development only)
if (import.meta.env.DEV) {
  validateEnv();
}

export const env: EnvConfig = {
  walletConnectProjectId: import.meta.env.VITE_WALLET_CONNECT_PROJECT_ID,
  contractAddress: import.meta.env.VITE_CONTRACT_ADDRESS as `0x${string}`,
  alchemyApiKey: import.meta.env.VITE_ALCHEMY_API_KEY || "",
  alchemyNetwork: import.meta.env.VITE_ALCHEMY_NETWORK || "eth-sepolia",
  useWebSocket: import.meta.env.VITE_USE_WEBSOCKET === "true",
  alchemyWsUrl: import.meta.env.VITE_ALCHEMY_WS_SEPOLIA,
};

// Export individual values for convenience
export const {
  walletConnectProjectId,
  contractAddress,
  alchemyApiKey,
  alchemyNetwork,
  useWebSocket,
  alchemyWsUrl,
} = env;
