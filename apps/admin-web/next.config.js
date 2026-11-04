/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@zuridrop/ui', '@zuridrop/shared'],
  reactStrictMode: true,
  async rewrites() {
    const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';
    return [{ source: '/api/:path*', destination: `${apiBase}/api/:path*` }];
  },
};

module.exports = nextConfig;
