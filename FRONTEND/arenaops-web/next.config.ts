import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
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