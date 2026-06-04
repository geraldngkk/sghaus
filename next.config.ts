import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Allow next/font (and other build-time fetches) to use the OS certificate
    // store. Needed on networks behind a TLS-intercepting proxy; a no-op on
    // Vercel where the proxy isn't present.
    turbopackUseSystemTlsCerts: true,
  },
};

export default nextConfig;
