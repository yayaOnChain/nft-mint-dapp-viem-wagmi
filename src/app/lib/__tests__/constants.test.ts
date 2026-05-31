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
  IPFS_GATEWAYS,
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
    expect(APP_CONFIG).toHaveProperty('author');
    expect(APP_CONFIG).toHaveProperty('repository');
    expect(APP_CONFIG).toHaveProperty('discord');
    expect(APP_CONFIG).toHaveProperty('twitter');
  });

  it('should have non-empty values', () => {
    expect(APP_CONFIG.name).toBeTruthy();
    expect(APP_CONFIG.description).toBeTruthy();
    expect(APP_CONFIG.tagline).toBeTruthy();
    expect(APP_CONFIG.version).toBeTruthy();
    expect(APP_CONFIG.author).toBeTruthy();
    expect(APP_CONFIG.repository).toMatch(/^https?:\/\//);
    expect(APP_CONFIG.discord).toMatch(/^https?:\/\//);
    expect(APP_CONFIG.twitter).toMatch(/^https?:\/\//);
  });
});

describe('CONTRACT_CONFIG', () => {
  it('should have required properties', () => {
    expect(CONTRACT_CONFIG).toHaveProperty('abi');
    expect(CONTRACT_CONFIG).toHaveProperty('maxSupply');
    expect(CONTRACT_CONFIG).toHaveProperty('mintPrice');
    expect(CONTRACT_CONFIG).toHaveProperty('mintPriceWei');
    expect(CONTRACT_CONFIG).toHaveProperty('maxMintPerTransaction');
    expect(CONTRACT_CONFIG).toHaveProperty('defaultMintQuantity');
  });

  it('should have valid maxSupply', () => {
    expect(CONTRACT_CONFIG.maxSupply).toBeGreaterThan(0);
  });

  it('should have valid mintPrice', () => {
    expect(CONTRACT_CONFIG.mintPrice).toMatch(/^\d+\.?\d*$/);
  });

  it('should have valid mintPriceWei', () => {
    expect(CONTRACT_CONFIG.mintPriceWei).toBeGreaterThan(0n);
  });

  it('should have valid defaultMintQuantity', () => {
    expect(CONTRACT_CONFIG.defaultMintQuantity).toBeGreaterThan(0);
    expect(CONTRACT_CONFIG.defaultMintQuantity).toBeLessThanOrEqual(
      CONTRACT_CONFIG.maxMintPerTransaction,
    );
  });

  it('should have abi as an array', () => {
    expect(Array.isArray(CONTRACT_CONFIG.abi)).toBe(true);
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

  it('should have supported chains as array with correct values', () => {
    expect(CHAIN_CONFIG.supported).toEqual(['sepolia', 'mainnet']);
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
    expect(UI_CONFIG.toast).toHaveProperty('errorDuration');
    expect(UI_CONFIG.toast).toHaveProperty('successDuration');
    expect(UI_CONFIG.toast).toHaveProperty('position');
    expect(UI_CONFIG.toast).toHaveProperty('maxVisible');
  });

  it('should have polling configuration', () => {
    expect(UI_CONFIG).toHaveProperty('polling');
    expect(UI_CONFIG.polling).toHaveProperty('interval');
    expect(UI_CONFIG.polling).toHaveProperty('eventInterval');
    expect(UI_CONFIG.polling).toHaveProperty('retryCount');
  });

  it('should have animation configuration', () => {
    expect(UI_CONFIG).toHaveProperty('animation');
    expect(UI_CONFIG.animation).toHaveProperty('duration');
    expect(UI_CONFIG.animation).toHaveProperty('easing');
    expect(UI_CONFIG.animation).toHaveProperty('fadeInDelay');
  });

  it('should have pagination configuration', () => {
    expect(UI_CONFIG).toHaveProperty('pagination');
    expect(UI_CONFIG.pagination).toHaveProperty('defaultLimit');
    expect(UI_CONFIG.pagination).toHaveProperty('maxLimit');
    expect(UI_CONFIG.pagination).toHaveProperty('defaultPage');
    expect(UI_CONFIG.pagination.defaultLimit).toBe(10);
  });

  it('should have skeleton configuration', () => {
    expect(UI_CONFIG).toHaveProperty('skeleton');
    expect(UI_CONFIG.skeleton).toHaveProperty('count');
    expect(UI_CONFIG.skeleton).toHaveProperty('animationDuration');
    expect(UI_CONFIG.skeleton.count).toBeGreaterThan(0);
    expect(UI_CONFIG.skeleton.animationDuration).toBeGreaterThan(0);
  });
});

describe('STORAGE_KEYS', () => {
  it('should have all required keys', () => {
    expect(STORAGE_KEYS).toHaveProperty('connectedWallet');
    expect(STORAGE_KEYS).toHaveProperty('preferredChain');
    expect(STORAGE_KEYS).toHaveProperty('theme');
    expect(STORAGE_KEYS).toHaveProperty('lastTransaction');
  });

  it('should have all values as non-empty strings', () => {
    Object.values(STORAGE_KEYS).forEach((key) => {
      expect(typeof key).toBe('string');
      expect(key.length).toBeGreaterThan(0);
    });
  });
});

describe('ERROR_MESSAGES', () => {
  it('should have all required error messages', () => {
    expect(ERROR_MESSAGES).toHaveProperty('walletNotConnected');
    expect(ERROR_MESSAGES).toHaveProperty('wrongNetwork');
    expect(ERROR_MESSAGES).toHaveProperty('insufficientBalance');
    expect(ERROR_MESSAGES).toHaveProperty('maxSupplyReached');
    expect(ERROR_MESSAGES).toHaveProperty('mintLimitExceeded');
    expect(ERROR_MESSAGES).toHaveProperty('transactionRejected');
    expect(ERROR_MESSAGES).toHaveProperty('transactionFailed');
    expect(ERROR_MESSAGES).toHaveProperty('networkError');
    expect(ERROR_MESSAGES).toHaveProperty('contractError');
    expect(ERROR_MESSAGES).toHaveProperty('apiError');
    expect(ERROR_MESSAGES).toHaveProperty('unknownError');
  });

  it('should have all messages as non-empty strings', () => {
    Object.values(ERROR_MESSAGES).forEach((message) => {
      expect(typeof message).toBe('string');
      expect(message.length).toBeGreaterThan(0);
    });
  });
});

describe('SUCCESS_MESSAGES', () => {
  it('should have all required success messages', () => {
    expect(SUCCESS_MESSAGES).toHaveProperty('walletConnected');
    expect(SUCCESS_MESSAGES).toHaveProperty('walletDisconnected');
    expect(SUCCESS_MESSAGES).toHaveProperty('mintInitiated');
    expect(SUCCESS_MESSAGES).toHaveProperty('mintSuccess');
    expect(SUCCESS_MESSAGES).toHaveProperty('transactionConfirmed');
    expect(SUCCESS_MESSAGES).toHaveProperty('dataRefreshed');
  });

  it('should have all messages as non-empty strings', () => {
    Object.values(SUCCESS_MESSAGES).forEach((message) => {
      expect(typeof message).toBe('string');
      expect(message.length).toBeGreaterThan(0);
    });
  });
});

describe('IPFS_GATEWAYS', () => {
  it('should be an array of gateway URLs', () => {
    expect(Array.isArray(IPFS_GATEWAYS)).toBe(true);
    expect(IPFS_GATEWAYS.length).toBeGreaterThan(0);
  });

  it('should have all gateway URLs as valid http/https strings', () => {
    IPFS_GATEWAYS.forEach((gateway) => {
      expect(typeof gateway).toBe('string');
      expect(gateway).toMatch(/^https?:\/\//);
    });
  });

  it('should have ipfs.io as first gateway', () => {
    expect(IPFS_GATEWAYS[0]).toBe('https://ipfs.io/ipfs/');
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

  it('should fallback to Sepolia for unknown chain', () => {
    const url = getExplorerAddressUrl('0xdeadbeef', 999);
    expect(url).toBe(
      'https://sepolia.etherscan.io/address/0xdeadbeef',
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

  it('should fallback to Sepolia for unknown chain', () => {
    const url = getExplorerTokenUrl('0xContract', '789', 999);
    expect(url).toBe(
      'https://sepolia.etherscan.io/token/0xContract?a=789',
    );
  });
});
