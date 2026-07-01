import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: { root: "./" },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: [
            "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
            'https://*.clerk.accounts.dev',
            'https://snap-assets.midtrans.com',
            'https://snap-assets.sandbox.midtrans.com',
            'https://api.midtrans.com',
            'https://api.sandbox.midtrans.com',
            'https://app.midtrans.com',
            'https://app.sandbox.midtrans.com',
            'https://pay.google.com',
            'https://gwk.gopayapi.com/sdk/stable/gp-container.min.js',
            'https://www.googletagmanager.com',
            'https://cdnjs.cloudflare.com',
          ].join(' ') + "; worker-src 'self' blob:",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
