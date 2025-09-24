/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Enable PPR for better performance but avoid build issues
    ppr: false,
  },
  
  // Disable static generation for auth pages
  async generateStaticParams() {
    return [];
  },
  
  // Custom webpack config if needed
  webpack: (config: any, { buildId, dev, isServer, defaultLoaders, webpack }: any) => {
    // Important: return the modified config
    return config;
  },
  
  // Headers for better security
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options', 
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;