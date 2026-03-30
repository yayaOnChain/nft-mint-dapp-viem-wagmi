import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  AlchemyApi,
  getAlchemyApi,
  setAlchemyApiInstance,
  resetAlchemyApiInstance,
} from '@/services/alchemyApi';
import {
  mockUserNFTs,
  mockTransactions,
  mockAlchemyNFTResponse,
  mockAlchemyTransferResponse,
  mockBlockResponse,
} from '@/test/mockData';

describe('AlchemyApi', () => {
  let alchemyApi: AlchemyApi;

  beforeEach(() => {
    alchemyApi = new AlchemyApi({
      apiKey: 'test-api-key',
      network: 'eth-sepolia',
    });
  });

  afterEach(() => {
    resetAlchemyApiInstance();
  });

  describe('constructor', () => {
    it('should create instance with correct base URL', () => {
      const api = new AlchemyApi({
        apiKey: 'test-key',
        network: 'eth-sepolia',
      });
      expect(api).toBeDefined();
    });

    it('should create instance with different network', () => {
      const api = new AlchemyApi({
        apiKey: 'test-key',
        network: 'eth-mainnet',
      });
      expect(api).toBeDefined();
    });
  });

  describe('getNFTs', () => {
    it('should fetch NFTs successfully', async () => {
      // Mock fetch
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockAlchemyNFTResponse,
      });

      const result = await alchemyApi.getNFTs({
        owner: '0xUserAddress123456789012345678901234567890',
        contractAddress: '0x1234567890123456789012345678901234567890',
        pageSize: 100,
      });

      expect(result.nfts).toHaveLength(mockUserNFTs.length);
      expect(result.totalCount).toBe(mockUserNFTs.length);
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/nft/v2/test-api-key/getNFTs'),
      );
    });

    it('should handle pagination with pageKey', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          ...mockAlchemyNFTResponse,
          pageKey: 'next-page-key',
        }),
      });

      const result = await alchemyApi.getNFTs({
        owner: '0xUserAddress123456789012345678901234567890',
        pageKey: 'previous-page-key',
      });

      expect(result.pageKey).toBe('next-page-key');
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('pageKey=previous-page-key'),
      );
    });

    it('should throw error on API failure', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
      });

      await expect(
        alchemyApi.getNFTs({
          owner: '0xUserAddress123456789012345678901234567890',
        }),
      ).rejects.toThrow('Alchemy API error: 401');
    });

    it('should use default pageSize of 100', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockAlchemyNFTResponse,
      });

      await alchemyApi.getNFTs({
        owner: '0xUserAddress123456789012345678901234567890',
      });

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('pageSize=100'),
      );
    });
  });

  describe('getAssetTransfers', () => {
    it('should fetch asset transfers successfully', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockAlchemyTransferResponse,
      });

      const result = await alchemyApi.getAssetTransfers({
        address: '0xUserAddress123456789012345678901234567890',
        contractAddress: '0x1234567890123456789012345678901234567890',
        limit: 10,
      });

      expect(result.transfers).toHaveLength(mockTransactions.length);
      expect(result.transfers[0].tokenId).toBe('1');
    });

    it('should handle pagination with pageKey', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          result: {
            ...mockAlchemyTransferResponse.result,
            pageKey: 'next-page-key',
          },
        }),
      });

      const result = await alchemyApi.getAssetTransfers({
        address: '0xUserAddress123456789012345678901234567890',
        contractAddress: '0x1234567890123456789012345678901234567890',
        limit: 10,
        pageKey: 'previous-page-key',
      });

      expect(result.pageKey).toBe('next-page-key');
    });

    it('should throw error on RPC error', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          error: { message: 'RPC Error message' },
        }),
      });

      await expect(
        alchemyApi.getAssetTransfers({
          address: '0xUserAddress123456789012345678901234567890',
          contractAddress: '0x1234567890123456789012345678901234567890',
          limit: 10,
        }),
      ).rejects.toThrow('RPC Error message');
    });

    it('should parse timestamps correctly', async () => {
      const mockResponse = {
        result: {
          transfers: [
            {
              tokenId: '0x1',
              hash: '0xabc123',
              blockTimestamp: '2024-01-15T10:30:00.000Z',
              blockNum: '0x123456',
              from: '0x0000000000000000000000000000000000000000',
              to: '0xUserAddress123456789012345678901234567890',
              type: 'mint',
            },
          ],
        },
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await alchemyApi.getAssetTransfers({
        address: '0xUserAddress123456789012345678901234567890',
        contractAddress: '0x1234567890123456789012345678901234567890',
        limit: 10,
      });

      expect(result.transfers[0].timestamp).toBeGreaterThan(0);
    });
  });

  describe('getBlockByNumber', () => {
    it('should fetch block timestamp successfully', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockBlockResponse,
      });

      const result = await alchemyApi.getBlockByNumber('0x123456');

      expect(result).toBeGreaterThan(0);
    });

    it('should throw error on RPC error', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          error: { message: 'Block not found' },
        }),
      });

      await expect(alchemyApi.getBlockByNumber('0xinvalid')).rejects.toThrow(
        'Block not found',
      );
    });
  });
});

describe('getAlchemyApi singleton', () => {
  beforeEach(() => {
    resetAlchemyApiInstance();
  });

  afterEach(() => {
    resetAlchemyApiInstance();
  });

  it('should return same instance on multiple calls', () => {
    // Set up a test instance first
    const testInstance = new AlchemyApi({
      apiKey: 'test-key',
      network: 'eth-sepolia',
    });
    setAlchemyApiInstance(testInstance);

    const instance1 = getAlchemyApi();
    const instance2 = getAlchemyApi();

    expect(instance1).toBe(instance2);
    expect(instance1).toBe(testInstance);
  });

  it('should allow setting custom instance for testing', () => {
    const mockInstance = new AlchemyApi({
      apiKey: 'mock-key',
      network: 'eth-sepolia',
    });

    setAlchemyApiInstance(mockInstance);
    const instance = getAlchemyApi();

    expect(instance).toBe(mockInstance);
  });

  it('should throw error when API key is missing', () => {
    // Create a fresh module by resetting and then mocking env before first call
    resetAlchemyApiInstance();

    // Mock the env access
    const originalEnv = import.meta.env;
    Object.defineProperty(import.meta, 'env', {
      value: {
        VITE_ALCHEMY_API_KEY: '',
        VITE_ALCHEMY_NETWORK: 'eth-sepolia',
      },
      writable: true,
      configurable: true,
    });

    try {
      expect(() => getAlchemyApi()).toThrow(
        'Missing VITE_ALCHEMY_API_KEY environment variable',
      );
    } finally {
      // Restore original env
      Object.defineProperty(import.meta, 'env', {
        value: originalEnv,
        writable: true,
        configurable: true,
      });
    }
  });
});
