import type { MetadataRoute } from "next";

// Web app manifest, served by Next.js at /manifest.webmanifest.
// Colours match --accent-primary and --bg-secondary in globals.css.
// Icons are produced by `npm run icons` (scripts/generate-pwa-icons.mjs).
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "Royal King Water Supply",
    short_name: "Royal King",
    description: "Royal King Water Supply Management System",
    // "/" redirects a signed-in user to their portal (see proxy.ts).
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#f8fafc",
    theme_color: "#0a3d91",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    // Long-press shortcuts. A user with the wrong role is sent to /login by proxy.ts.
    shortcuts: [
      {
        name: "Log delivery",
        short_name: "Deliver",
        url: "/driver",
        icons: [{ src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }],
      },
      {
        name: "Deliveries",
        short_name: "Deliveries",
        url: "/admin/supplies",
        icons: [{ src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }],
      },
    ],
  };
}
