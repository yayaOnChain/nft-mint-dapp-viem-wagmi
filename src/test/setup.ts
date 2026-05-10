import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

// Mock environment variables
process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID = 'test-project-id';
process.env.NEXT_PUBLIC_CONTRACT_ADDRESS = '0x1234567890123456789012345678901234567890';
process.env.NEXT_PUBLIC_CHAIN_ID = '11155111';

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});
