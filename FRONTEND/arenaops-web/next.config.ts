import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // NOTE: Do NOT set `output: 'standalone'` — Netlify's build plugin
  // handles the output mode automatically. 'standalone' breaks Netlify's
  // serverless function packaging.
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
      {
        protocol: "https",
        hostname: "cdn.yourdomain.com",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com", 
      },
    ],
  },
};

module.exports = nextConfig;