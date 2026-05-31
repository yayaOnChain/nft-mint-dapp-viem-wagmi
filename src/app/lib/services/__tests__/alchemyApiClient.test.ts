import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { AlchemyApiClient, getAlchemyClient } from '../alchemyApiClient';
import type {
  AlchemyNFTResponse,
  AlchemyTransferResponse,
  BlockResponse,
} from '@/types';

const mockAlchemyNFTResponse: AlchemyNFTResponse = {
  ownedNfts: [
    {
      contract: { address: '0x1234567890123456789012345678901234567890' },
      id: { tokenId: '1' },
      tokenUri: { gateway: 'https://ipfs.io/ipfs/QmTest1' },
    },
  ],
  totalCount: 1,
};

const mockAlchemyTransferResponse: AlchemyTransferResponse = {
  result: {
    transfers: [
      {
        tokenId: '0x1',
        hash: '0xabc123def456789012345678901234567890123456789012345678901234abcd',
        blockTimestamp: '2024-01-15T10:30:00.000Z',
        blockNum: '0x123456',
        from: '0x0000000000000000000000000000000000000000',
        to: '0xUserAddress123456789012345678901234567890',
        type: 'mint',
      },
    ],
  },
};

const mockBlockResponse: BlockResponse = {
  result: {
    timestamp: '0x12345678',
  },
};

describe('AlchemyApiClient', () => {
  let alchemyClient: AlchemyApiClient;

  beforeEach(() => {
    alchemyClient = new AlchemyApiClient();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getAlchemyClient', () => {
    it('should return the same singleton instance', () => {
      const client1 = getAlchemyClient();
      const client2 = getAlchemyClient();
      expect(client1).toBe(client2);
      expect(client1).toBeInstanceOf(AlchemyApiClient);
    });
  });

  describe('getNFTs', () => {
    it('should fetch NFTs successfully', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockAlchemyNFTResponse,
      });

      const result = await alchemyClient.getNFTs({
        owner: '0xUserAddress123456789012345678901234567890',
        contractAddress: '0x1234567890123456789012345678901234567890',
        pageSize: 100,
      });

      expect(result.nfts).toHaveLength(mockAlchemyNFTResponse.ownedNfts.length);
      expect(result.totalCount).toBe(mockAlchemyNFTResponse.totalCount);
    });

    it('should include pagination params in URL', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockAlchemyNFTResponse,
      });

      await alchemyClient.getNFTs({
        owner: '0xUserAddress',
        pageSize: 50,
        pageKey: 'page-key-123',
      });

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('pageSize=50'),
      );
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('pageKey=page-key-123'),
      );
    });

    it('should throw on non-ok response', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
      });

      await expect(
        alchemyClient.getNFTs({ owner: '0xUserAddress' }),
      ).rejects.toThrow('Alchemy API error: 401');
    });

    it('should throw on API error', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ error: { message: 'Invalid API key' } }),
      });

      await expect(
        alchemyClient.getNFTs({ owner: '0xUserAddress' }),
      ).rejects.toThrow('Invalid API key');
    });

    it('should use default pageSize of 100', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockAlchemyNFTResponse,
      });

      await alchemyClient.getNFTs({ owner: '0xUserAddress' });

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('pageSize=100'),
      );
    });

    it('should handle response with no totalCount', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          ownedNfts: [],
        }),
      });

      const result = await alchemyClient.getNFTs({ owner: '0xUserAddress' });

      expect(result.totalCount).toBe(0);
    });

    it('should use empty array when ownedNfts is missing', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({}),
      });

      const result = await alchemyClient.getNFTs({ owner: '0xUserAddress' });

      expect(result.nfts).toEqual([]);
    });

    it('should handle API error with non-object value', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ error: 'just a string error' }),
      });

      await expect(
        alchemyClient.getNFTs({ owner: '0xUserAddress' }),
      ).rejects.toThrow('Unknown API error');
    });
  });

  describe('getAssetTransfers', () => {
    it('should fetch asset transfers successfully', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockAlchemyTransferResponse,
      });

      const result = await alchemyClient.getAssetTransfers({
        address: '0xUserAddress123456789012345678901234567890',
        contractAddress: '0x1234567890123456789012345678901234567890',
        limit: 10,
      });

      expect(result.transfers).toHaveLength(
        mockAlchemyTransferResponse.result.transfers.length,
      );
      expect(result.transfers[0].tokenId).toBe('1');
    });

    it('should pass pageKey in request', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          result: { ...mockAlchemyTransferResponse.result, pageKey: 'next' },
        }),
      });

      await alchemyClient.getAssetTransfers({
        address: '0xUserAddress',
        contractAddress: '0xContract',
        limit: 10,
        pageKey: 'prev-key',
      });

      expect(fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: expect.stringContaining('"pageKey":"prev-key"'),
        }),
      );
    });

    it('should throw on RPC error', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ error: { message: 'RPC Error' } }),
      });

      await expect(
        alchemyClient.getAssetTransfers({
          address: '0xUserAddress',
          contractAddress: '0xContract',
          limit: 10,
        }),
      ).rejects.toThrow('RPC Error');
    });

    it('should parse hex tokenId correctly', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          result: {
            transfers: [
              {
                tokenId: '0x5',
                hash: '0xabc',
                blockTimestamp: '2024-01-15T10:30:00.000Z',
                blockNum: '0x123456',
                from: '0xfrom',
                to: '0xto',
                type: 'mint',
              },
            ],
          },
        }),
      });

      const result = await alchemyClient.getAssetTransfers({
        address: '0xUserAddress',
        contractAddress: '0xContract',
        limit: 10,
      });

      expect(result.transfers[0].tokenId).toBe('5');
    });

    it('should parse hex blockTimestamp', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          result: {
            transfers: [
              {
                tokenId: '0x1',
                hash: '0xabc',
                blockTimestamp: '0x65d0c0a0',
                blockNum: '0x123456',
                from: '0xfrom',
                to: '0xto',
                type: 'mint',
              },
            ],
          },
        }),
      });

      const result = await alchemyClient.getAssetTransfers({
        address: '0xUserAddress',
        contractAddress: '0xContract',
        limit: 10,
      });

      expect(result.transfers[0].timestamp).toBeGreaterThan(0);
    });

    it('should default timestamp to 0 when blockTimestamp is missing', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          result: {
            transfers: [
              {
                tokenId: '0x1',
                hash: '0xabc',
                blockNum: '0x123456',
                from: '0xfrom',
                to: '0xto',
                type: 'mint',
              },
            ],
          },
        }),
      });

      const result = await alchemyClient.getAssetTransfers({
        address: '0xUserAddress',
        contractAddress: '0xContract',
        limit: 10,
      });

      expect(result.transfers[0].timestamp).toBe(0);
    });

    it('should default timestamp to 0 for unknown format', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          result: {
            transfers: [
              {
                tokenId: '0x1',
                hash: '0xabc',
                blockTimestamp: 'not-a-timestamp',
                blockNum: '0x123456',
                from: '0xfrom',
                to: '0xto',
                type: 'mint',
              },
            ],
          },
        }),
      });

      const result = await alchemyClient.getAssetTransfers({
        address: '0xUserAddress',
        contractAddress: '0xContract',
        limit: 10,
      });

      expect(result.transfers[0].timestamp).toBe(0);
    });

    it('should return pageKey from response', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          result: {
            transfers: [
              {
                tokenId: '0x1',
                hash: '0xabc',
                blockTimestamp: '2024-01-15T10:30:00.000Z',
                blockNum: '0x123456',
                from: '0xfrom',
                to: '0xto',
                type: 'mint',
              },
            ],
            pageKey: 'next-page',
          },
        }),
      });

      const result = await alchemyClient.getAssetTransfers({
        address: '0xUserAddress',
        contractAddress: '0xContract',
        limit: 10,
      });

      expect(result.pageKey).toBe('next-page');
    });

    it('should default to "transfer" when type is missing', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          result: {
            transfers: [
              {
                tokenId: '0x1',
                hash: '0xabc',
                blockTimestamp: '2024-01-15T10:30:00.000Z',
                blockNum: '0x123456',
                from: '0xfrom',
                to: '0xto',
              },
            ],
          },
        }),
      });

      const result = await alchemyClient.getAssetTransfers({
        address: '0xUserAddress',
        contractAddress: '0xContract',
        limit: 10,
      });

      expect(result.transfers[0].type).toBe('transfer');
    });
  });

  describe('getBlockByNumber', () => {
    it('should fetch block timestamp successfully', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockBlockResponse,
      });

      const result = await alchemyClient.getBlockByNumber('0x123456');

      expect(result).toBeGreaterThan(0);
    });

    it('should throw on RPC error', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ error: { message: 'Block not found' } }),
      });

      await expect(
        alchemyClient.getBlockByNumber('0xinvalid'),
      ).rejects.toThrow('Block not found');
    });
  });
});
