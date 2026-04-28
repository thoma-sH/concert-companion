/** @type {import('next').NextConfig} */
const nextConfig = {
  // better-sqlite3 ships a native .node binary; let Next require it directly
  // instead of bundling it through Turbopack/webpack.
  serverExternalPackages: ["better-sqlite3"],
};

export default nextConfig;
