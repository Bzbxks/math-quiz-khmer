import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  allowedDevOrigins: ['localhost', '192.168.1.30', '192.168.1.25', '192.168.1.18'], // Add your PC's IP here
};

export default nextConfig;