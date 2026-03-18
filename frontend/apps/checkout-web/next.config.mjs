/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL ?? "",
  },
  async rewrites() {
    // Proxy /api/* to the backend. API_BASE_URL is the server-side container URL
    // (e.g. http://backend:3000 in docker). Falls back to localhost for local dev.
    const apiBase =
      process.env.API_BASE_URL ??
      process.env.NEXT_PUBLIC_API_URL ??
      "http://localhost:3000";
    return [
      {
        source: "/api/:path*",
        destination: `${apiBase}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
