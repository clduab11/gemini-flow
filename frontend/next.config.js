/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Enable app directory features
    appDir: true,
  },
  // Support for @xyflow/react ES modules
  transpilePackages: ['@xyflow/react'],
  // Enable webpack 5 compatibility
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
    };
    return config;
  },
}

export default nextConfig;