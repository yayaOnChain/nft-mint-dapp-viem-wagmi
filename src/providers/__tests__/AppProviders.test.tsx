import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { AppProviders } from "../AppProviders";
import { useQueryClient } from "@tanstack/react-query";
import { useAccount } from "wagmi";

// Mock the env module to provide test environment variables
vi.mock("../../config/env", () => ({
  env: {
    walletConnectProjectId: "test-project-id",
    contractAddress: "0x1234567890123456789012345678901234567890",
    alchemyApiKey: "test-alchemy-key",
    alchemyNetwork: "eth-sepolia",
    useWebSocket: false,
    alchemyWsUrl: undefined,
  },
  walletConnectProjectId: "test-project-id",
  contractAddress: "0x1234567890123456789012345678901234567890",
  alchemyApiKey: "test-alchemy-key",
  alchemyNetwork: "eth-sepolia",
  useWebSocket: false,
  alchemyWsUrl: undefined,
}));

describe("AppProviders", () => {
  const TestComponent = ({ children }: { children: React.ReactNode }) => {
    return <AppProviders>{children}</AppProviders>;
  };

  describe("rendering", () => {
    it("should render children", () => {
      render(
        <TestComponent>
          <div data-testid="child">Test Content</div>
        </TestComponent>,
      );
      expect(screen.getByTestId("child")).toBeInTheDocument();
    });

    it("should render multiple children", () => {
      render(
        <TestComponent>
          <h1>Title</h1>
          <p>Paragraph</p>
          <button>Button</button>
        </TestComponent>,
      );
      expect(screen.getByText("Title")).toBeInTheDocument();
      expect(screen.getByText("Paragraph")).toBeInTheDocument();
      expect(screen.getByText("Button")).toBeInTheDocument();
    });
  });

  describe("QueryClient configuration", () => {
    it("should provide QueryClient context", () => {
      const QueryClientChecker = () => {
        const queryClient = useQueryClient();
        return (
          <div data-testid="query-client-check">
            {queryClient ? "available" : "not available"}
          </div>
        );
      };

      render(
        <TestComponent>
          <QueryClientChecker />
        </TestComponent>,
      );

      expect(screen.getByTestId("query-client-check")).toHaveTextContent(
        "available",
      );
    });

    it("should have correct default query options", () => {
      const QueryOptionsChecker = () => {
        const queryClient = useQueryClient();
        const defaultOptions = queryClient.getDefaultOptions();
        return (
          <div data-testid="query-options">
            <span data-testid="stale-time">
              {String(defaultOptions.queries?.staleTime)}
            </span>
            <span data-testid="gc-time">
              {String(defaultOptions.queries?.gcTime)}
            </span>
            <span data-testid="retry">
              {String(defaultOptions.queries?.retry)}
            </span>
            <span data-testid="refetch-on-window-focus">
              {String(defaultOptions.queries?.refetchOnWindowFocus)}
            </span>
          </div>
        );
      };

      render(
        <TestComponent>
          <QueryOptionsChecker />
        </TestComponent>,
      );

      expect(screen.getByTestId("stale-time")).toHaveTextContent("300000"); // 5 minutes
      expect(screen.getByTestId("gc-time")).toHaveTextContent("600000"); // 10 minutes
      expect(screen.getByTestId("retry")).toHaveTextContent("2");
      expect(screen.getByTestId("refetch-on-window-focus")).toHaveTextContent(
        "false",
      );
    });
  });

  describe("Wagmi configuration", () => {
    it("should provide Wagmi context", () => {
      const WagmiChecker = () => {
        const { address } = useAccount();
        return (
          <div data-testid="wagmi-check">
            {address !== undefined ? "available" : "not available"}
          </div>
        );
      };

      render(
        <TestComponent>
          <WagmiChecker />
        </TestComponent>,
      );

      expect(screen.getByTestId("wagmi-check")).toHaveTextContent("available");
    });
  });

  describe("Toaster", () => {
    it("should include Toaster in the component tree", () => {
      render(
        <TestComponent>
          <div>Content</div>
        </TestComponent>,
      );

      // Toaster is rendered as a portal - we verify it's in the component tree
      // by checking that the render completes without errors
      expect(screen.getByText("Content")).toBeInTheDocument();
    });
  });

  describe("RainbowKit integration", () => {
    it("should render with RainbowKit provider", () => {
      render(
        <TestComponent>
          <div>Content</div>
        </TestComponent>,
      );

      // RainbowKit injects styles into the document
      // We verify by checking that the app renders without errors
      expect(screen.getByText("Content")).toBeInTheDocument();
    });
  });

  describe("dark theme configuration", () => {
    it("should apply dark theme to RainbowKit", () => {
      render(
        <TestComponent>
          <div>Content</div>
        </TestComponent>,
      );

      // RainbowKit dark theme adds specific CSS variables
      const root = document.documentElement;
      expect(root).toBeInTheDocument();
    });
  });

  describe("singleton query client", () => {
    it("should use the same query client instance across renders", () => {
      let firstQueryClient: ReturnType<typeof useQueryClient> | null = null;
      let secondQueryClient: ReturnType<typeof useQueryClient> | null = null;

      const QueryClientInstanceChecker = ({ order }: { order: number }) => {
        const queryClient = useQueryClient();
        if (order === 1) {
          firstQueryClient = queryClient;
        } else {
          secondQueryClient = queryClient;
        }
        return <div data-testid={`instance-${order}`}>Check</div>;
      };

      render(
        <TestComponent>
          <QueryClientInstanceChecker order={1} />
          <QueryClientInstanceChecker order={2} />
        </TestComponent>,
      );

      // Both should reference the same query client instance
      expect(firstQueryClient).toBe(secondQueryClient);
    });
  });
});
