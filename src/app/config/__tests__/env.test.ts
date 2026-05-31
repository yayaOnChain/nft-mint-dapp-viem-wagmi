import { describe, it, expect, vi, beforeEach, afterAll } from 'vitest';

describe('env configuration', () => {
  beforeEach(() => {
    vi.resetModules();
    process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID = 'test-project-id';
    process.env.NEXT_PUBLIC_CONTRACT_ADDRESS = '0x1234567890123456789012345678901234567890';
    delete process.env.NEXT_PUBLIC_USE_WEBSOCKET;
    delete process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL;
  });

  afterAll(() => {
    process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID = 'test-project-id';
    process.env.NEXT_PUBLIC_CONTRACT_ADDRESS = '0x1234567890123456789012345678901234567890';
  });

  describe('values', () => {
    it('should export walletConnectProjectId when set', async () => {
      const { walletConnectProjectId } = await import('@/config/env');
      expect(walletConnectProjectId).toBe('test-project-id');
    });

    it('should export contractAddress when set', async () => {
      const { contractAddress } = await import('@/config/env');
      expect(contractAddress).toBe('0x1234567890123456789012345678901234567890');
    });

    it('should export useWebSocket as false when not set to "true"', async () => {
      const { useWebSocket } = await import('@/config/env');
      expect(useWebSocket).toBe(false);
    });

    it('should export sepoliaRpcUrl as empty string when not set', async () => {
      const { sepoliaRpcUrl } = await import('@/config/env');
      expect(sepoliaRpcUrl).toBe('');
    });
  });

  describe('env var truthy branches', () => {
    it('should set useWebSocket to true when set to "true"', async () => {
      process.env.NEXT_PUBLIC_USE_WEBSOCKET = 'true';
      const { useWebSocket } = await import('@/config/env');
      expect(useWebSocket).toBe(true);
    });

    it('should set sepoliaRpcUrl when env var is provided', async () => {
      process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL = 'https://sepolia.example.com';
      const { sepoliaRpcUrl } = await import('@/config/env');
      expect(sepoliaRpcUrl).toBe('https://sepolia.example.com');
    });
  });

  describe('validation errors (client-side)', () => {
    it('should throw when walletConnectProjectId is missing', async () => {
      delete process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID;
      await expect(import('@/config/env')).rejects.toThrow(
        'Missing NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID',
      );
    });

    it('should throw when contractAddress is missing', async () => {
      delete process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;
      await expect(import('@/config/env')).rejects.toThrow(
        'Missing NEXT_PUBLIC_CONTRACT_ADDRESS',
      );
    });
  });

  describe('server-side (window undefined)', () => {
    it('should not validate and default to empty values when window is undefined', async () => {
      vi.stubGlobal('window', undefined);
      delete process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID;
      delete process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;

      const mod = await import('@/config/env');
      expect(mod.walletConnectProjectId).toBe('');
      expect(mod.contractAddress).toBe('');
      expect(mod.useWebSocket).toBe(false);
      expect(mod.sepoliaRpcUrl).toBe('');

      vi.unstubAllGlobals();
    });
  });

  describe('exports', () => {
    it('should export all properties', async () => {
      const mod = await import('@/config/env');
      expect(mod).toHaveProperty('walletConnectProjectId');
      expect(mod).toHaveProperty('contractAddress');
      expect(mod).toHaveProperty('useWebSocket');
      expect(mod).toHaveProperty('sepoliaRpcUrl');
    });
  });
});
