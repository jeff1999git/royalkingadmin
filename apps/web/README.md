This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load Inter, a custom Google Font.

## Installable app (PWA)

The app can be installed to a phone or desktop home screen. It then opens full-screen with the Royal King icon, and it shows a branded page instead of a browser error when there is no connection.

| Piece | File |
|---|---|
| Web app manifest (name, colours, icons, shortcuts), served at `/manifest.webmanifest` | `app/manifest.ts` |
| Theme colour, `viewport-fit=cover`, iOS home-screen settings | `app/layout.tsx` |
| Service worker | `public/sw.js` |
| Offline page | `public/offline.html` |
| Worker registration and the "Update available" banner | `app/components/PwaRegister.tsx` |
| Install button (Chrome/Edge) and iPhone hint, on `/` and `/login` | `app/components/InstallPrompt.tsx` |
| Icons, favicon and Apple touch icon | `public/icons/`, `app/apple-icon.png`, `app/favicon.ico` |

**What the service worker caches.** It caches only content-hashed build files (`/_next/static/*`), the icons, the manifest and the offline page. It never touches `/api/*`, any non-GET request, other origins such as Cloudinary, or page HTML. Ledger data is therefore always live, saves and fuel-bill uploads go straight to the server, and nothing from one signed-in user can appear for another user on a shared phone. Saving while offline is not supported, and forms still need a connection.

**Development.** The worker is registered only in production builds. `npm run dev` unregisters any leftover worker, because dev chunk names aren't hashed and a stale worker would serve old code. To test the PWA locally, run `npm run build && npm run start` and open `http://localhost:3000`. Localhost counts as secure, so HTTPS isn't needed there. Installing from a phone needs the HTTPS deployment.

**Changing the service worker, offline page or icons.** Bump `VERSION` at the top of `public/sw.js`. Open apps then show "A new version of the app is ready" and switch over when the user taps Reload. They never reload by themselves, so a half-filled form is not lost.

**Regenerating icons.** Edit the artwork in `scripts/generate-pwa-icons.mjs`, run `npm run icons`, commit the output files, and bump `VERSION` in `public/sw.js`. The script uses `sharp`, which is already installed through Next.js.

**Proxy.** `proxy.ts` must keep `/sw.js`, `/manifest.webmanifest`, `/offline.html` and `/icons/*` out of its matcher. They have to load without a session.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
