import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider, createConfig, http } from "wagmi";
import { sepolia } from "wagmi/chains";
import type { PropsWithChildren } from "react";

// Create a test query client
const createTestQueryClient = () => {
  return new QueryClient({
    defaultOptions: {
      queries: {
              staleTime: 0,
              gcTime: 0,
              retry: false,
            },
          },
        });
     };
     
     // Create a test wagmi config
     const testConfig = createConfig({
       chains: [sepolia],
       transports: {
         [sepolia.id]: http(),
       },
     });
     
     export function TestProviders({ children }: PropsWithChildren) {
        return (
          <WagmiProvider config={testConfig}>
            <QueryClientProvider client={createTestQueryClient()}>
              {children}
           </QueryClientProvider>
         </WagmiProvider>
       );
     }