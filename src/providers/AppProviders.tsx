import React from "react";
import { WagmiProvider } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RainbowKitProvider, darkTheme } from "@rainbow-me/rainbowkit";
import { Toaster } from "sonner";
import { config } from "../config/wagmi";

// Import RainbowKit styles (Required for UI to render correctly)
import "@rainbow-me/rainbowkit/styles.css";

// Create a single query client instance
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
});

interface AppProvidersProps {
  children: React.ReactNode;
}

/**
 * Centralized provider wrapper for the entire application
 * Includes: Wagmi, React Query, RainbowKit, Toast
 */
export const AppProviders: React.FC<AppProvidersProps> = ({ children }) => {
  return (
    <QueryClientProvider client={queryClient}>
      <WagmiProvider config={config}>
        <RainbowKitProvider
          theme={darkTheme({
            accentColor: "#7b3fe4",
            accentColorForeground: "white",
            borderRadius: "medium",
            fontStack: "system",
            overlayBlur: "small",
          })}
        >
          {children}
          <Toaster
            position="bottom-right"
            richColors
            theme="dark"
            duration={4000}
            visibleToasts={5}
            closeButton
          />
        </RainbowKitProvider>
      </WagmiProvider>
    </QueryClientProvider>
  );
};
