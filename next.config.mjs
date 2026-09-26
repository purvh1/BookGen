/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Enable the instrumentation hook (src/instrumentation.ts)
    // so the book loader runs on server startup.
    instrumentationHook: true,
  },
  images: {
    // Allow unoptimized images so local covers work without a configured domain
    unoptimized: true,
  },
};

export default nextConfig;
