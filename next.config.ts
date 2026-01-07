import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  serverExternalPackages: ['yahoo-finance2'],
  // Ensure environment variables are available during build
  env: {
    NEXT_PUBLIC_BACKEND_URL: process.env.NEXT_PUBLIC_BACKEND_URL
  }
}

export default nextConfig
