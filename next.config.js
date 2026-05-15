/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  transpilePackages: [
    'viem',
    'wagmi',
    '@wagmi/core',
    '@rainbow-me/rainbowkit',
  ],

  experimental: {
    esmExternals: false,
  },

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'ipfs.io',
        pathname: '/ipfs/**',
      },
      {
        protocol: 'https',
        hostname: 'gateway.pinata.cloud',
        pathname: '/ipfs/**',
      },
    ],
  },
};

module.exports = nextConfig;