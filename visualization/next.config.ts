import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  basePath: '/election_69_analyzer',
  output: 'export',
  images: {
    unoptimized: true,
  },
}

export default nextConfig
