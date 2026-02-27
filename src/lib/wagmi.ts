import { http, webSocket } from "wagmi";
import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { mainnet, sepolia } from "wagmi/chains";

// Ensure you have VITE_WALLET_CONNECT_PROJECT_ID in your .env file
const projectId = import.meta.env.VITE_WALLET_CONNECT_PROJECT_ID;

if (!projectId) {
  throw new Error(
    "Missing VITE_WALLET_CONNECT_PROJECT_ID environment variable",
  );
}

// Check if WebSocket is enabled via environment variable
const hasWebSocket: boolean = import.meta.env.VITE_USE_WEBSOCKETS === "true";

// Define transports for development (HTTP) environment
const devTransports = {
  [sepolia.id]: http(import.meta.env.VITE_RPC_URL_SEPOLIA),
};

// Define transports for production (WebSocket) environment
const prodTransports = {
  [mainnet.id]: webSocket(import.meta.env.VITE_ALCHEMY_WS_MAINNET),
  [sepolia.id]: webSocket(import.meta.env.VITE_ALCHEMY_WS_SEPOLIA),
};

// Create Wagmi config with RainbowKit default setup
// This automatically includes WalletConnect, Injected (MetaMask), and Coinbase connectors
export const config = getDefaultConfig({
  appName: "My NFT Minting DApp",
  projectId: projectId,
  chains: hasWebSocket ? [mainnet, sepolia] : [sepolia], // Use mainnet in production, sepolia in development
  ssr: false, // Set to true if you are using Next.js, false for Vite/CRA
  // Use WebSocket transports in production for real-time event listening, HTTP in development
  transports: hasWebSocket ? prodTransports : devTransports,
});
