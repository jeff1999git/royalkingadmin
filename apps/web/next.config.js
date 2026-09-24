/** @type {import('next').NextConfig} */
const nextConfig = {
    serverExternalPackages: ["mongoose"],
    poweredByHeader: false,
    // Dev server only: Next.js 16 refuses dev requests (page scripts, live
    // reload) from any host but localhost unless it is listed here. GitHub
    // Codespaces opens the app at https://<codespace>-3000.app.github.dev.
    // No effect on production builds.
    allowedDevOrigins: ["*.app.github.dev"],
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
                    // Browsers keep using HTTPS for two years once they have seen
                    // the site over HTTPS. Ignored over plain http (localhost).
                    { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
                    { key: "X-Content-Type-Options", value: "nosniff" },
                    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
                    { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
                ],
            },
            {
                // PWA service worker (public/sw.js). Never cache it, so a new
                // version is always picked up; lock it to same-origin scripts.
                source: "/sw.js",
                headers: [
                    { key: "Content-Type", value: "application/javascript; charset=utf-8" },
                    { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
                    { key: "Content-Security-Policy", value: "default-src 'self'; script-src 'self'" },
                ],
            },
        ];
    },
};

export default nextConfig;
