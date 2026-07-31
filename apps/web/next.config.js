/** @type {import('next').NextConfig} */
const nextConfig = {
    serverExternalPackages: ["mongoose"],
    poweredByHeader: false,
    // The app renders plain <img> tags (Cloudinary applies transformations
    // via URL), so the /_next/image optimizer endpoint is pure attack
    // surface — turn it off.
    images: {
        unoptimized: true,
    },
    async headers() {
        return [
            {
                source: "/(.*)",
                headers: [
                    { key: "X-Frame-Options", value: "DENY" },
                    { key: "X-Content-Type-Options", value: "nosniff" },
                    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
                    { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
                ],
            },
        ];
    },
};

export default nextConfig;
