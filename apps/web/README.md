# Royal King Water Supply — web app

Next.js 16 (App Router) with React 19, TypeScript, Mongoose, next-auth (credentials, JWT sessions) and TanStack Query. Styling is plain CSS in `app/globals.css` plus inline styles. There is no test suite; `npm run check-types` and `npm run lint` are the static checks.

## Running it

```bash
npm install            # from the repo root
test -f .env || cp .env.example .env   # only on a fresh checkout; never overwrite a real .env
npm run dev            # http://localhost:3000
```

`npm run build` then `npm run start` serves the production build, which is also how the PWA and service worker can be tested locally.

## Layout

| Path | What lives there |
|---|---|
| `app/admin/*` | Admin portal: analytics (`amounts`), deliveries (`supplies`), customers, drivers, vehicles. `/admin` redirects to `/admin/amounts`. |
| `app/driver/*` | Driver portal: delivery, cash and customer-registration forms, recent entries, odometer and stock dialogs. |
| `app/api/admin/*`, `app/api/driver/*`, `app/api/stock` | JSON API. Every route checks the session with `requireAdmin()` / `requireDriver()` from `lib/authHelpers.ts` and answers failures as `{ error }` using the helpers in `lib/api.ts`. |
| `app/components/*` | Shared UI: `StockModal`, `PaymentPill`, `ProductPill`, PWA registration and install prompt. |
| `app/hooks/*` | React Query hooks and client types for the admin pages (`useAdminQueries.ts`), `useEscapeKey`. |
| `lib/*` | Shared logic: `supplyProduct.ts` (can/case rules and pricing), `format.ts` (IST date and money formatting for the UI), `istTime.ts` (IST day boundaries for queries), `customers.ts` (create-or-restore), `auth.ts`, `cloudinary.ts`, `csv.ts`, `googleDrive.ts`. |
| `models/*` | Mongoose models: `SupplyLog` (the ledger), `Customer`, `User` (drivers), `Vehicle`, `Stock`. |
| `proxy.ts` | next-auth middleware: sends signed-in users to their portal and keeps `/admin` and `/driver` role-gated. |

## Data rules worth knowing

- **Business days are IST.** The server computes day boundaries with `lib/istTime.ts` and the UI formats every date in IST with `lib/format.ts`, whatever timezone the device is in.
- **Older ledger rows lack newer fields.** A water row without `productType` is a can; rows without `paymentStatus` count as cash. Queries filter with `$ne` / `$nin` and reads default, so old documents keep working. Never change that with a migration.
- **Amounts.** A driver's can delivery is priced from the customer's `cashPerCan`; a case delivery from the price per case the driver enters. The admin can type an amount when adding or editing a delivery; editing only a remark or payment status never changes a saved amount.
- **Deactivated drivers** lose API access within a minute even though their session token is still valid: `lib/auth.ts` re-checks `isActive` in the JWT callback.
- **Deleting** a driver or vehicle that has ledger rows is refused (deactivate or disable it instead). Deleting a customer is a soft delete; registering the same phone again restores it.

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

**Regenerating icons.** Edit the artwork in `scripts/generate-pwa-icons.mjs`, run `npm run icons`, commit the output files, and bump `VERSION` in `public/sw.js`. The script needs `sharp` (pulled in by Next.js; run `npm install` first).

**Proxy.** `proxy.ts` must keep `/sw.js`, `/manifest.webmanifest`, `/offline.html` and `/icons/*` out of its matcher. They have to load without a session.

## Spreadsheet exports and Google Drive

The Deliveries page (both tabs) has two spreadsheet options next to Download Photo and Download PDF:

- **Download Sheet** downloads a `.csv` file that opens in Google Sheets or Excel.
- **Save to Google Drive** creates a Google Sheet in the signed-in admin's own Drive and shows a link to open it.

Both contain every entry matching the current filters, the same rows the summary bar totals, not just the page on screen. With no filters that is the last 5 days. Photo and PDF still export the rows on screen.

**How Drive saving works.** It runs in the browser (`lib/googleDrive.ts`). The first time, Google shows a popup to pick an account and allow access; the sign-in lasts about an hour in that tab. The sheet goes straight from the browser to Google, not through our server. The app asks only for the `drive.file` permission, so it can see the sheets it creates and nothing else in the Drive. Sheets land in the top level of My Drive, named like `Royal King Water Supplies 2026-09 (saved 14:05)`.

**One-time setup** (in Google Cloud Console, with the Google account that owns the app):

1. Create a project, or pick an existing one.
2. Enable the **Google Drive API** for it.
3. Set up the OAuth consent screen: app name and support email, audience **External** (or Internal on Google Workspace), and add the scope `https://www.googleapis.com/auth/drive.file`. While the app is in Testing, add each admin's Google account as a test user, or publish the app. `drive.file` is a non-sensitive scope, so Google doesn't need to review the app for it.
4. Create an **OAuth client ID** of type **Web application**. Under **Authorized JavaScript origins**, add every address the admin page is opened from, exactly as the browser shows it: `http://localhost:3000`, the production URL, and in GitHub Codespaces the forwarded `https://…-3000.app.github.dev` address. No redirect URI is needed.
5. Put the client ID in `NEXT_PUBLIC_GOOGLE_CLIENT_ID` in `apps/web/.env` and in the hosting provider's environment variables, then restart `npm run dev` or rebuild. The value is built into the page, so a running server won't pick it up.

Until the client ID is set, the button explains that Drive saving isn't set up yet. Download Sheet works without any setup.

