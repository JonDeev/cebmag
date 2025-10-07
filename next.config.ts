import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  eslint: {
    // 💡 Vercel/Next no bloqueará el build por errores de ESLint
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
