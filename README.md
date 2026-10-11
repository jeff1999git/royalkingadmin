# Royal King Water Supply

The delivery ledger for Royal King Water Supply: drivers log 20-litre can and bottled-water case deliveries, cash and fuel expenses, and daily odometer readings from their phones; the admin sees the ledger, customers, drivers, vehicles, stock and analytics, and exports sheets.

This is a Turborepo with one app:

| Path | What it is |
|---|---|
| `apps/web` | The Next.js app (admin portal under `/admin`, driver portal under `/driver`, API under `/api`). See [apps/web/README.md](apps/web/README.md). |
| `packages/eslint-config`, `packages/typescript-config` | Shared lint and TypeScript settings. |

## Running it

```bash
npm install
# Only on a fresh checkout. This never overwrites an existing .env, which holds the real credentials.
test -f apps/web/.env || cp apps/web/.env.example apps/web/.env   # then fill in the values
npm run dev                              # http://localhost:3000
```

Other scripts, run from the repo root:

| Command | What it does |
|---|---|
| `npm run build` | Production build of the app. |
| `npm run lint` | ESLint, with warnings treated as errors. |
| `npm run check-types` | Next.js route typegen followed by `tsc --noEmit`. |
| `npm run format` | Prettier over `.ts`, `.tsx` and `.md` files. |

Node 20.9 or newer is required (`engines` in `package.json`).

## Environment

Every variable is documented in [apps/web/.env.example](apps/web/.env.example). `MONGODB_URI` points at the live database in production, so never run scripts or tests against it; use a throwaway MongoDB for anything that writes.
