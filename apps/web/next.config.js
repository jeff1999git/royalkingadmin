/** @type {import('next').NextConfig} */
const nextConfig = {
    // Allow Mongoose to be imported in Next.js server components
    serverExternalPackages: ["mongoose"],
};

export default nextConfig;
