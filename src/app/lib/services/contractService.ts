import type { Abi, Address } from "viem";
import type { Config } from "wagmi";
import {
  readContract,
  writeContract as wagmiWriteContract,
  waitForTransactionReceipt,
} from "wagmi/actions";

/**
 * Contract read parameters
 */
interface ReadContractParams {
  config: Config;
  address: Address;
  abi: Abi;
  functionName: string;
  args?: readonly unknown[];
}

/**
 * Contract write parameters
 */
interface WriteContractParams {
  config: Config;
  address: Address;
  abi: Abi;
  functionName: string;
  args: readonly unknown[];
  value?: bigint;
}

/**
 * Contract service layer for wagmi interactions
 * Provides testable wrapper around wagmi actions
 */
export class ContractService {
  private config: Config;

  constructor(config: Config) {
    this.config = config;
  }

  /**
   * Read from a contract
   */
  async read(params: ReadContractParams): Promise<unknown> {
    const { address, abi, functionName, args } = params;

    return readContract(this.config, {
      address,
      abi,
      functionName,
      args,
    } as const);
  }

  /**
   * Write to a contract
   */
  async write(params: WriteContractParams): Promise<`0x${string}`> {
    const { address, abi, functionName, args, value } = params;

    return wagmiWriteContract(this.config, {
      address,
      abi,
      functionName,
      args,
      value,
    } as const);
  }

  /**
   * Wait for transaction receipt
   */
  async waitForReceipt(hash: `0x${string}`) {
    return waitForTransactionReceipt(this.config, { hash });
  }
}

// Singleton instance
let contractServiceInstance: ContractService | null = null;

export const getContractService = (config: Config): ContractService => {
  if (!contractServiceInstance) {
    contractServiceInstance = new ContractService(config);
  }
  return contractServiceInstance;
};

// Export for testing purposes
export const setContractServiceInstance = (
  instance: ContractService,
): void => {
  contractServiceInstance = instance;
};

export const resetContractServiceInstance = (): void => {
  contractServiceInstance = null;
};
