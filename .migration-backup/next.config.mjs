import path from 'path'

/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: false,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  turbopack: {},
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.join(process.cwd(), './'),
      '@components': path.join(process.cwd(), './components'),
      '@contexts': path.join(process.cwd(), './contexts'),
      '@lib': path.join(process.cwd(), './lib'),
    }
    return config
  },
}

export default nextConfig
