# NFT Mint DApp with Viem and Wagmi

A modern, production-ready decentralized application (DApp) for minting NFTs on the Ethereum blockchain. Built with cutting-edge Web3 technologies including **Viem**, **Wagmi v2**, **RainbowKit**, and **React 19**.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![React](https://img.shields.io/badge/React-19.2.0-61dafb.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9.3-3178c6.svg)
![Wagmi](https://img.shields.io/badge/Wagmi-2.19.5-f56e4a.svg)
![Viem](https://img.shields.io/badge/Viem-2.46.2-36759c.svg)

---

## ✨ Features

### Core Functionality

- 🔗 **Wallet Connection** - Seamless multi-wallet support via RainbowKit
- 🎨 **NFT Minting** - Mint unique NFTs with customizable quantities (1-10 per transaction)
- 🖼️ **NFT Gallery** - View your personal NFT collection in real-time
- 📜 **Transaction History** - Track all minting activities and transactions
- 🔴 **Live Updates** - Real-time event polling for recent community mints

### Technical Highlights

- ⚡ **Real-time Events** - WebSocket support for instant transaction confirmations
- 🎯 **Multi-Chain** - Support for Ethereum Mainnet and Sepolia testnet
- 🧪 **Test Coverage** - Comprehensive unit tests with Vitest
- 🎨 **Modern UI** - Beautiful dark theme with Tailwind CSS v4
- 📱 **Responsive Design** - Mobile-first, works on all devices
- 🔐 **Type Safe** - Full TypeScript support with strict type checking

---

## 🛠️ Tech Stack

| Category               | Technology                     |
| ---------------------- | ------------------------------ |
| **Frontend Framework** | React 19.2.0                   |
| **Language**           | TypeScript 5.9.3               |
| **Build Tool**         | Vite 7.3.1                     |
| **Web3 Libraries**     | Viem 2.46.2, Wagmi 2.19.5      |
| **Wallet UI**          | RainbowKit 2.2.10              |
| **Styling**            | Tailwind CSS v4.2.1            |
| **State Management**   | TanStack Query 5.90.21         |
| **Notifications**      | Sonner 2.0.7                   |
| **Testing**            | Vitest 4.0.18, Testing Library |
| **Linting**            | ESLint 9.20.0, Prettier 3.8.1  |

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** >= 18.x
- **npm** or **yarn**
- **MetaMask** or compatible Web3 wallet
- **WalletConnect Project ID** (for RainbowKit)

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/yayaOnChain/nft-mint-dapp-viem-wagmi.git
   cd nft-mint-dapp-viem-wagmi
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Configure environment variables**

   Create a `.env` file in the root directory:

   ```env
   VITE_WALLETCONNECT_PROJECT_ID=your_walletconnect_project_id
   VITE_USE_WEBSOCKET=true
   VITE_ALCHEMY_WS_URL=wss://eth-sepolia.g.alchemy.com/v2/your_api_key
   ```

4. **Start development server**

   ```bash
   npm run dev
   ```

5. **Open your browser**

   Navigate to `http://localhost:5173`

---

## 📖 Available Scripts

| Command                 | Description                   |
| ----------------------- | ----------------------------- |
| `npm run dev`           | Start development server      |
| `npm run build`         | Build for production          |
| `npm run lint`          | Run ESLint                    |
| `npm run lint:fix`      | Auto-fix linting issues       |
| `npm run format`        | Format code with Prettier     |
| `npm run type-check`    | Run TypeScript type checking  |
| `npm run test`          | Run all tests                 |
| `npm run test:watch`    | Run tests in watch mode       |
| `npm run test:ui`       | Run tests with UI             |
| `npm run test:coverage` | Generate test coverage report |
| `npm run predeploy`     | Full pre-deployment check     |

---

## 🏗️ Project Structure

```
src/
├── abi/                    # Smart contract ABIs
├── assets/                 # Static assets (images, icons)
├── components/             # React components
│   ├── nft/               # NFT-related components
│   │   ├── NftMinter.tsx  # Minting interface
│   │   ├── NftGallery.tsx # User's NFT collection
│   │   ├── NftCard.tsx    # Individual NFT display
│   │   └── RecentMints.tsx# Live community mints
│   ├── transaction/       # Transaction components
│   │   └── TransactionHistory.tsx
│   └── ui/                # Reusable UI components
├── config/                 # App configuration
│   └── wagmi.ts           # Wagmi setup
├── hooks/                  # Custom React hooks
│   ├── useNftMintedEvents.ts
│   ├── useNftMintedEventsPolling.ts
│   ├── useUserNFTHistory.ts
│   └── useToast.ts
├── lib/                    # Utilities and constants
│   └── constants.ts       # App-wide configuration
├── providers/              # Context providers
│   └── AppProviders.tsx   # Centralized provider wrapper
├── services/               # External service integrations
├── test/                   # Test utilities
├── types/                  # TypeScript type definitions
├── App.tsx                 # Main application component
├── main.tsx               # Entry point
└── index.css              # Global styles
```

---

## 🎨 Configuration

### Contract Configuration

Located in `src/lib/constants.ts`:

```typescript
export const CONTRACT_CONFIG = {
  abi: myNftAbi,
  maxSupply: 1000, // Maximum NFT supply
  mintPrice: "0.01", // Price in ETH
  mintPriceWei: 10000000000000000n,
  maxMintPerTransaction: 10, // Max mints per tx
  defaultMintQuantity: 1,
};
```

### Chain Configuration

```typescript
export const CHAIN_CONFIG = {
  default: "sepolia", // Default network
  production: "mainnet", // Production network
  supported: ["sepolia", "mainnet"],
};
```

### UI Configuration

Customizable UI settings including:

- Toast notifications (duration, position)
- Polling intervals for real-time updates
- Animation settings
- Pagination defaults
- Skeleton loading states

---

## 🔌 Smart Contract Integration

### Required Contract ABI

The DApp expects an NFT contract with the following standard functions:

- `mint(uint256 quantity)` - Mint NFTs
- `totalSupply()` - Get current supply
- `maxSupply()` - Get maximum supply
- `tokenURI(uint256 tokenId)` - Get metadata URI
- `ownerOf(uint256 tokenId)` - Get token owner
- `balanceOf(address owner)` - Get user's NFT count

### Contract Deployment

1. Deploy your ERC-721 contract to Sepolia or Mainnet
2. Update the contract address in `src/config/wagmi.ts`
3. Add your contract ABI to `src/abi/myNft.ts`

---

## 🧪 Testing

Run the complete test suite:

```bash
npm run test
```

Run specific test categories:

```bash
# Component tests
npm run test:components

# Hook tests
npm run test:hooks

# Service tests
npm run test:services
```

Generate coverage report:

```bash
npm run test:coverage
```

---

## 🌐 Deployment

### Pre-deployment Checklist

```bash
npm run predeploy
```

This command runs:

- ✅ Production build
- ✅ Linting
- ✅ Type checking

### Build for Production

```bash
npm run build
```

The built files will be in the `dist/` directory.

### Hosting

Deploy the `dist/` folder to any static hosting service:

- **Vercel** (Recommended)
- **Netlify**
- **GitHub Pages**
- **IPFS**

---

## 🎯 Key Features Explained

### Real-time Event Listening

The app uses WebSocket connections for instant updates when NFTs are minted:

```typescript
// WebSocket transport configuration
transports: {
  [mainnet.id]: webSocket(alchemyWsUrl),
  [sepolia.id]: webSocket(alchemyWsUrl.replace("mainnet", "sepolia")),
}
```

### Custom Hooks

- **`useNftMintedEvents`** - Listen to mint events via WebSocket
- **`useNftMintedEventsPolling`** - Fallback polling mechanism
- **`useUserNFTHistory`** - Fetch user's transaction history
- **`useToast`** - Unified toast notification system

### Error Handling

Comprehensive error messages defined in `constants.ts`:

- Wallet connection errors
- Network switching prompts
- Transaction failures
- Insufficient balance warnings

---

## 📱 Browser Support

| Browser | Version |
| ------- | ------- |
| Chrome  | Latest  |
| Firefox | Latest  |
| Safari  | Latest  |
| Edge    | Latest  |
| Opera   | Latest  |

**Note:** Requires a Web3 wallet extension (MetaMask, Rainbow, etc.)

---

## 🔒 Security Considerations

- ✅ No private keys stored client-side
- ✅ All transactions require user confirmation
- ✅ Environment variables for sensitive data
- ✅ HTTPS required for production
- ✅ Input validation on all user inputs

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📞 Support & Contact

- **Repository:** [GitHub](https://github.com/yayaOnChain/nft-mint-dapp-viem-wagmi)
- **Twitter:** [@yayaOnChain](https://x.com/yayaOnChain)

---

## 🙏 Acknowledgments

- [Wagmi](https://wagmi.sh/) - React Hooks for Ethereum
- [Viem](https://viem.sh/) - TypeScript Interface for Ethereum
- [RainbowKit](https://rainbowkit.com/) - Wallet Connection UI
- [TanStack Query](https://tanstack.com/query) - Data Management
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS

---

<p align="center">
  <strong>Built with ❤️ on Ethereum</strong>
</p>
