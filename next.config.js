/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config) => {
    config.resolve.fallback = {
      fs: false,
      os: false,
      path: false,
      crypto: false,
    };

    return config;
  },
  env: {
    NEXT_PUBLIC_CLIENT_ID: process.env.REACT_APP_CLIENT_ID,
    NEXT_PUBLIC_SOLANA_RPC_HOST: process.env.NEXT_PUBLIC_SOLANA_RPC_HOST,
    NEXT_PUBLIC_TREASURY_ADDRESS: process.env.NEXT_PUBLIC_TREASURY_ADDRESS,
    NEXT_CANDY_MACHINE_ID: process.env.NEXT_CANDY_MACHINE_ID,
    NEXT_SPL_TOKEN_MINTS: process.env.SPL_TOKEN_MINTS,
    NEXT_PUBLIC_CANDY_MACHINE_CONFIG: process.env.NEXT_PUBLIC_CANDY_MACHINE_CONFIG,
    NEXT_PUBLIC_CANDY_START_DATE: process.env.NEXT_PUBLIC_CANDY_START_DATE
  }
}

module.exports = nextConfig
