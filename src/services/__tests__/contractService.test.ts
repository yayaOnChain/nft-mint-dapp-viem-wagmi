import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
  ContractService,
  getContractService,
  setContractServiceInstance,
  resetContractServiceInstance,
} from '@/services/contractService';
import { createConfig, http } from 'wagmi';
import { sepolia } from 'wagmi/chains';
import type { Log } from 'viem';

// Mock wagmi actions
vi.mock('wagmi/actions', () => ({
  readContract: vi.fn(),
  writeContract: vi.fn(),
  waitForTransactionReceipt: vi.fn(),
  simulateContract: vi.fn(),
}));

import {
  readContract,
  writeContract,
  waitForTransactionReceipt,
} from 'wagmi/actions';

describe('ContractService', () => {
  let contractService: ContractService;
  const mockConfig = createConfig({
    chains: [sepolia],
    transports: {
      [sepolia.id]: http(),
    },
  });

  const mockAbi = [
    {
      inputs: [],
      name: 'totalMinted',
      outputs: [{ type: 'uint256' as const }],
      stateMutability: 'view' as const,
      type: 'function' as const,
    },
  ];

  const mockContractParams = {
    config: mockConfig,
    address: '0x1234567890123456789012345678901234567890' as `0x${string}`,
    abi: mockAbi,
    functionName: 'totalMinted' as const,
  };

  beforeEach(() => {
    contractService = new ContractService(mockConfig);
    vi.clearAllMocks();
  });

  afterEach(() => {
    resetContractServiceInstance();
  });

  describe('constructor', () => {
    it('should create instance with config', () => {
      expect(contractService).toBeDefined();
    });
  });

  describe('read', () => {
    it('should call readContract with correct parameters', async () => {
      vi.mocked(readContract).mockResolvedValue(100n);

      const result = await contractService.read({
        ...mockContractParams,
        args: [],
      });

      expect(readContract).toHaveBeenCalledWith(
        mockConfig,
        expect.objectContaining({
          address: mockContractParams.address,
          functionName: 'totalMinted',
        }),
      );
      expect(result).toBe(100n);
    });

    it('should pass args to readContract', async () => {
      vi.mocked(readContract).mockResolvedValue(5n);

      await contractService.read({
        ...mockContractParams,
        functionName: 'balanceOf' as const,
        args: ['0xUserAddress123456789012345678901234567890'],
      });

      expect(readContract).toHaveBeenCalledWith(
        mockConfig,
        expect.objectContaining({
          args: ['0xUserAddress123456789012345678901234567890'],
        }),
      );
    });
  });

  describe('write', () => {
    it('should call writeContract with correct parameters', async () => {
      const mockTxHash = '0xabc123def456789012345678901234567890123456789012345678901234abcd';
      vi.mocked(writeContract).mockResolvedValue(mockTxHash);

      const result = await contractService.write({
        ...mockContractParams,
        functionName: 'mint' as const,
        args: [1n],
        value: 10000000000000000n,
      });

      expect(writeContract).toHaveBeenCalledWith(
        mockConfig,
        expect.objectContaining({
          address: mockContractParams.address,
          functionName: 'mint',
          args: [1n],
          value: 10000000000000000n,
        }),
      );
      expect(result).toBe(mockTxHash);
    });

    it('should handle write without value', async () => {
      const mockTxHash = '0xdef456';
      vi.mocked(writeContract).mockResolvedValue(mockTxHash);

      await contractService.write({
        ...mockContractParams,
        functionName: 'approve' as const,
        args: ['0xSpenderAddress123456789012345678901234567'],
      });

      expect(writeContract).toHaveBeenCalledWith(
        mockConfig,
        expect.objectContaining({
          functionName: 'approve',
          value: undefined,
        }),
      );
    });
  });

  describe('waitForReceipt', () => {
    it('should call waitForTransactionReceipt with hash', async () => {
      const mockHash = '0xabc123def456789012345678901234567890123456789012345678901234abcd';
      const mockReceipt = {
        transactionHash: mockHash,
        blockHash: '0xblockhash123456789012345678901234567890123456789012345678901234',
        blockNumber: 12345678n,
        blockTimestamp: 1700000000n,
        status: 'success' as const,
        cumulativeGasUsed: 1000000n,
        effectiveGasPrice: 1000000000n,
        gasUsed: 500000n,
        logs: [] as Log[],
        logsBloom: '0x',
        contractAddress: null,
        from: '0xfrom123456789012345678901234567890123456789',
        to: '0xto123456789012345678901234567890123456789',
        transactionIndex: 0n,
        type: 'eip1559' as const,
        blobGasUsed: undefined,
        blobGasPrice: undefined,
        chainId: sepolia.id,
        root: undefined,
      };
      (waitForTransactionReceipt as ReturnType<typeof vi.fn>).mockResolvedValue(mockReceipt);

      const result = await contractService.waitForReceipt(mockHash);

      expect(waitForTransactionReceipt).toHaveBeenCalledWith(mockConfig, {
        hash: mockHash,
      });
      expect(result).toEqual(mockReceipt);
    });
  });
});

describe('getContractService singleton', () => {
  const mockConfig = createConfig({
    chains: [sepolia],
    transports: {
      [sepolia.id]: http(),
    },
  });

  afterEach(() => {
    resetContractServiceInstance();
  });

  it('should return same instance on multiple calls', () => {
    const instance1 = getContractService(mockConfig);
    const instance2 = getContractService(mockConfig);

    expect(instance1).toBe(instance2);
  });

  it('should allow setting custom instance for testing', () => {
    const mockInstance = new ContractService(mockConfig);

    setContractServiceInstance(mockInstance);
    const instance = getContractService(mockConfig);

    expect(instance).toBe(mockInstance);
  });
});
