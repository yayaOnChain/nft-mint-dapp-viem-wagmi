// src/components/ConnectButton.tsx
import { ConnectButton } from "@rainbow-me/rainbowkit";

export const CustomConnectButton = () => {
  return (
    <div className="flex justify-end p-4">
      {/* 
        RainbowKit's ConnectButton handles:
        1. Connecting via Injected (MetaMask Extension)
        2. Connecting via WalletConnect (Mobile QR Code)
        3. Chain Switching
        4. Displaying Address/Balance
      */}
      <ConnectButton
        showBalance={false} // Optional: Hide balance for privacy
        label="Connect Wallet" // Custom button label
        chainStatus="full" // Show chain icon and name
      />
    </div>
  );
};
