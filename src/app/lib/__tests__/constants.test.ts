import { describe, it, expect } from 'vitest';
import {
  APP_CONFIG,
  CONTRACT_CONFIG,
  CHAIN_CONFIG,
  CHAIN_IDS,
  EXPLORER_URLS,
  UI_CONFIG,
  STORAGE_KEYS,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
  getExplorerTxUrl,
  getExplorerAddressUrl,
  getExplorerTokenUrl,
} from '@/lib/constants';

describe('APP_CONFIG', () => {
  it('should have required properties', () => {
    expect(APP_CONFIG).toHaveProperty('name');
    expect(APP_CONFIG).toHaveProperty('tagline');
    expect(APP_CONFIG).toHaveProperty('description');
    expect(APP_CONFIG).toHaveProperty('version');
  });

  it('should have non-empty values', () => {
    expect(APP_CONFIG.name).toBeTruthy();
    expect(APP_CONFIG.description).toBeTruthy();
  });
});

describe('CONTRACT_CONFIG', () => {
  it('should have required properties', () => {
    expect(CONTRACT_CONFIG).toHaveProperty('abi');
    expect(CONTRACT_CONFIG).toHaveProperty('maxSupply');
    expect(CONTRACT_CONFIG).toHaveProperty('mintPrice');
    expect(CONTRACT_CONFIG).toHaveProperty('maxMintPerTransaction');
  });

  it('should have valid maxSupply', () => {
    expect(CONTRACT_CONFIG.maxSupply).toBeGreaterThan(0);
  });

  it('should have valid mintPrice', () => {
    expect(CONTRACT_CONFIG.mintPrice).toMatch(/^\d+\.?\d*$/);
  });
});

describe('CHAIN_CONFIG', () => {
  it('should have required properties', () => {
    expect(CHAIN_CONFIG).toHaveProperty('default');
    expect(CHAIN_CONFIG).toHaveProperty('production');
    expect(CHAIN_CONFIG).toHaveProperty('supported');
  });

  it('should have sepolia as default', () => {
    expect(CHAIN_CONFIG.default).toBe('sepolia');
  });

  it('should have mainnet as production', () => {
    expect(CHAIN_CONFIG.production).toBe('mainnet');
  });
});

describe('CHAIN_IDS', () => {
  it('should have correct mainnet ID', () => {
    expect(CHAIN_IDS.mainnet).toBe(1);
  });

  it('should have correct sepolia ID', () => {
    expect(CHAIN_IDS.sepolia).toBe(11155111);
  });
});

describe('EXPLORER_URLS', () => {
  it('should have mainnet explorer URL', () => {
    expect(EXPLORER_URLS[CHAIN_IDS.mainnet]).toBe(
      'https://etherscan.io',
    );
  });

  it('should have sepolia explorer URL', () => {
    expect(EXPLORER_URLS[CHAIN_IDS.sepolia]).toBe(
      'https://sepolia.etherscan.io',
    );
  });
});

describe('UI_CONFIG', () => {
  it('should have toast configuration', () => {
    expect(UI_CONFIG).toHaveProperty('toast');
    expect(UI_CONFIG.toast).toHaveProperty('duration');
    expect(UI_CONFIG.toast).toHaveProperty('position');
  });

  it('should have polling configuration', () => {
    expect(UI_CONFIG).toHaveProperty('polling');
    expect(UI_CONFIG.polling).toHaveProperty('interval');
  });

  it('should have animation configuration', () => {
    expect(UI_CONFIG).toHaveProperty('animation');
    expect(UI_CONFIG.animation).toHaveProperty('duration');
  });

  it('should have pagination configuration', () => {
    expect(UI_CONFIG).toHaveProperty('pagination');
    expect(UI_CONFIG.pagination).toHaveProperty('defaultLimit');
    expect(UI_CONFIG.pagination.defaultLimit).toBe(10);
  });
});

describe('STORAGE_KEYS', () => {
  it('should have wallet connected key', () => {
    expect(STORAGE_KEYS).toHaveProperty('connectedWallet');
  });

  it('should have theme key', () => {
    expect(STORAGE_KEYS).toHaveProperty('theme');
  });
});

describe('ERROR_MESSAGES', () => {
  it('should have walletNotConnected message', () => {
    expect(ERROR_MESSAGES.walletNotConnected).toBeTruthy();
  });

  it('should have transactionRejected message', () => {
    expect(ERROR_MESSAGES.transactionRejected).toBeTruthy();
  });

  it('should have all messages as strings', () => {
    Object.values(ERROR_MESSAGES).forEach((message) => {
      expect(typeof message).toBe('string');
    });
  });
});

describe('SUCCESS_MESSAGES', () => {
  it('should have mintSuccess message', () => {
    expect(SUCCESS_MESSAGES.mintSuccess).toBeTruthy();
  });

  it('should have all messages as strings', () => {
    Object.values(SUCCESS_MESSAGES).forEach((message) => {
      expect(typeof message).toBe('string');
    });
  });
});

describe('getExplorerTxUrl', () => {
  it('should return correct Sepolia explorer URL', () => {
    const url = getExplorerTxUrl(
      '0xabc123',
      CHAIN_IDS.sepolia,
    );
    expect(url).toBe(
      'https://sepolia.etherscan.io/tx/0xabc123',
    );
  });

  it('should return correct Mainnet explorer URL', () => {
    const url = getExplorerTxUrl('0xabc123', CHAIN_IDS.mainnet);
    expect(url).toBe('https://etherscan.io/tx/0xabc123');
  });

  it('should fallback to Sepolia for unknown chain', () => {
    const url = getExplorerTxUrl('0xabc123', 999);
    expect(url).toBe(
      'https://sepolia.etherscan.io/tx/0xabc123',
    );
  });
});

describe('getExplorerAddressUrl', () => {
  it('should return correct Sepolia address URL', () => {
    const url = getExplorerAddressUrl(
      '0x1234567890abcdef',
      CHAIN_IDS.sepolia,
    );
    expect(url).toBe(
      'https://sepolia.etherscan.io/address/0x1234567890abcdef',
    );
  });

  it('should return correct Mainnet address URL', () => {
    const url = getExplorerAddressUrl(
      '0x1234567890abcdef',
      CHAIN_IDS.mainnet,
    );
    expect(url).toBe(
      'https://etherscan.io/address/0x1234567890abcdef',
    );
  });
});

describe('getExplorerTokenUrl', () => {
  it('should return correct Sepolia token URL', () => {
    const url = getExplorerTokenUrl(
      '0xContractAddress',
      '123',
      CHAIN_IDS.sepolia,
    );
    expect(url).toBe(
      'https://sepolia.etherscan.io/token/0xContractAddress?a=123',
    );
  });

  it('should return correct Mainnet token URL', () => {
    const url = getExplorerTokenUrl(
      '0xContractAddress',
      '456',
      CHAIN_IDS.mainnet,
    );
    expect(url).toBe(
      'https://etherscan.io/token/0xContractAddress?a=456',
    );
  });
});
