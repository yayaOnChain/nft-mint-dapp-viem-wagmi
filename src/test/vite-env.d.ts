/// <reference types="vitest/globals" />
/// <reference types="@testing-library/jest-dom" />

interface ImportMetaEnv {
  readonly VITE_CONTRACT_ADDRESS: string;
  readonly VITE_WALLET_CONNECT_PROJECT_ID: string;
  readonly VITE_ALCHEMY_API_KEY: string;
  readonly VITE_ALCHEMY_NETWORK: string;
  readonly VITE_USE_WEBSOCKET: string;
  readonly VITE_ALCHEMY_WS_SEPOLIA?: string;
  readonly VITE_PINATA_JWT: string;
  readonly VITE_PINATA_GATEWAY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
