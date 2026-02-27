import React from "react";
import ReactDOM from "react-dom/client";
import { WagmiProvider } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RainbowKitProvider, darkTheme } from "@rainbow-me/rainbowkit";
import { Toaster } from "sonner";
import { config } from "./lib/wagmi";
import "./index.css"; // Tailwind CSS styles
import App from "./App";

// Import RainbowKit styles (Required for UI to render correctly)
import "@rainbow-me/rainbowkit/styles.css";

const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <WagmiProvider config={config}>
        {/* RainbowKitProvider manages the connection UI state */}
        <RainbowKitProvider
          theme={darkTheme({
            // Optional: Customize theme (light, dark, or custom)
            accentColor: "#7b3fe4",
            accentColorForeground: "white",
            borderRadius: "medium",
            fontStack: "system",
            overlayBlur: "small",
          })}
        >
          <App />
          {/* Toast Provider - positioned at bottom-right */}
          <Toaster
            position="bottom-right"
            richColors
            theme="dark"
            duration={4000}
            visibleToasts={5}
          />
        </RainbowKitProvider>
      </WagmiProvider>
    </QueryClientProvider>
  </React.StrictMode>,
);
