# Royal King Water Supply — Project Handbook

> **Last updated:** 2026-10-11 · branch `dev` · code documented at `main` @ `c251bc4` (identical tree to `dev` @ `3458651`, 2026-09-24). This file itself was added on 2026-10-11 and was not yet committed when written.
>
> **Secrets policy:** this file contains **no secret values and no personal data**, and must stay that way. Never open, print or copy `.env` files, keystores, private keys or service-account JSON. Name the config key and say where the secret lives; for a hard-coded secret give `file:line` and its type only. No real names, emails, phone numbers, vehicle registration numbers or account credentials.
>
> **Check your checkout first:** every `file:line` reference below was taken at commit `c251bc4`. Run `git merge-base --is-ancestor 3458651 HEAD`; if it fails, your working tree is older than this handbook — see §18.7 before trusting either. (`3458651` is the last work commit and is on both `dev` and `main`; `c251bc4` is the merge commit that carried it to `main` and exists only there, so testing for it would fail on an up-to-date `dev`.)

This is the single source of truth for the `royalkingadmin` repository. A developer or AI coding agent with no prior context should be able to understand, build, release and safely change the project using only this file. Start with §0.

## Table of contents

- [0. How to use and maintain this file](#0-how-to-use-and-maintain-this-file) — [0.1](#01-reading-order "0.1 Reading order") · [0.2](#02-conventions-used-in-this-file "0.2 Conventions used in this file") · [0.3](#03-mandatory-steps-after-every-change "0.3 Mandatory steps after every change") · [0.4](#04-changelog-entry-template "0.4 Changelog entry template") · [0.5](#05-which-sections-to-update "0.5 Which sections to update") · [0.6](#06-rules-for-this-file "0.6 Rules for this file") · [0.7](#07-how-to-re-check-this-file "0.7 How to re-check this file")
- [1. Snapshot](#1-snapshot)
- [2. Golden rules](#2-golden-rules) — [2.1](#21-working-agreements "2.1 Working agreements") · [2.2](#22-recorded-decisions "2.2 Recorded decisions") · [2.3](#23-never-change-without-a-deliberate-plan "2.3 Never change without a deliberate plan") · [2.4](#24-past-incidents-and-lessons "2.4 Past incidents and lessons") · [2.5](#25-before-you-change-anything "2.5 Before you change anything")
- [3. Product overview](#3-product-overview) — [3.1](#31-what-it-does "3.1 What it does") · [3.2](#32-user-roles "3.2 User roles") · [3.3](#33-permissions-matrix "3.3 Permissions matrix") · [3.4](#34-gating "3.4 Gating") · [3.5](#35-plans-pricing-and-billing "3.5 Plans, pricing and billing") · [3.6](#36-deliberately-absent "3.6 Deliberately absent")
- [4. Tech stack and key libraries](#4-tech-stack-and-key-libraries) — [4.1](#41-runtime-and-framework "4.1 Runtime and framework") · [4.2](#42-dependency-table "4.2 Dependency table") · [4.3](#43-exact-pins-and-overrides "4.3 Exact pins and overrides") · [4.4](#44-upgrade-constraints-and-known-version-traps "4.4 Upgrade constraints and known version traps") · [4.5](#45-deliberately-not-used "4.5 Deliberately not used")
- [5. Repository layout](#5-repository-layout)
- [6. Architecture](#6-architecture) — [6.1](#61-big-picture "6.1 Big picture") · [6.2](#62-startup-sequence "6.2 Startup sequence") · [6.3](#63-routing "6.3 Routing") · [6.4](#64-state-management "6.4 State management") · [6.5](#65-api-layer "6.5 API layer") · [6.6](#66-authentication-and-session-lifecycle "6.6 Authentication and session lifecycle") · [6.7](#67-configuration-and-environments "6.7 Configuration and environments") · [6.8](#68-database-access-layer "6.8 Database access layer") · [6.9](#69-client-side-storage "6.9 Client-side storage") · [6.10](#610-forms-and-validation "6.10 Forms and validation") · [6.11](#611-time-and-timezone "6.11 Time and timezone") · [6.12](#612-error-handling "6.12 Error handling")
- [7. API / backend reference](#7-api--backend-reference) — [7.1](#71-conventions "7.1 Conventions") · [7.2](#72-endpoint-index "7.2 Endpoint index") · [7.3](#73-admin-endpoints "7.3 Admin endpoints") · [7.4](#74-driver-endpoints "7.4 Driver endpoints") · [7.5](#75-shared-endpoint-apistock "7.5 Shared endpoint: /api/stock") · [7.6](#76-auth-endpoints-next-auth "7.6 Auth endpoints (next-auth)") · [7.7](#77-external-apis "7.7 External APIs") · [7.8](#78-not-present "7.8 Not present") · [7.9](#79-removed-endpoints "7.9 Removed endpoints")
- [8. Feature guide](#8-feature-guide) — [8.1](#81-sign-in-home-page-and-role-routing "8.1 Sign-in, home page and role routing") · [8.2](#82-admin-shell-and-navigation "8.2 Admin shell and navigation") · [8.3](#83-deliveries-and-cash-credits-ledger "8.3 Deliveries and Cash Credits ledger") · [8.4](#84-ledger-downloads-and-save-to-google-drive "8.4 Ledger downloads and Save to Google Drive") · [8.5](#85-analytics-and-new-customers "8.5 Analytics and New Customers") · [8.6](#86-customers "8.6 Customers") · [8.7](#87-customer-history "8.7 Customer history") · [8.8](#88-drivers "8.8 Drivers") · [8.9](#89-vehicles-and-odometer-history "8.9 Vehicles and odometer history") · [8.10](#810-stock "8.10 Stock") · [8.11](#811-driver-shell-and-daily-odometer-gate "8.11 Driver shell and daily odometer gate") · [8.12](#812-log-a-delivery "8.12 Log a delivery") · [8.13](#813-cash-credit-and-fuel-entry-with-bill-photo "8.13 Cash credit and fuel entry with bill photo") · [8.14](#814-register-a-customer "8.14 Register a customer") · [8.15](#815-recent-entries-and-date-filter "8.15 Recent entries and date filter")
- [9. UI foundation and coding conventions](#9-ui-foundation-and-coding-conventions) — [9.1](#91-design-tokens "9.1 Design tokens") · [9.2](#92-layout-and-breakpoints "9.2 Layout and breakpoints") · [9.3](#93-css-class-inventory "9.3 CSS class inventory") · [9.4](#94-reusable-components-and-hooks "9.4 Reusable components and hooks") · [9.5](#95-ui-patterns "9.5 UI patterns") · [9.6](#96-coding-conventions "9.6 Coding conventions") · [9.7](#97-misspelled-but-real-and-misleading-names "9.7 Misspelled-but-real and misleading names") · [9.8](#98-do-and-do-not-for-new-code "9.8 Do and do not for new code")
- [10. Database schema and data rules](#10-database-schema-and-data-rules) — [10.1](#101-overview-and-conventions "10.1 Overview and conventions") · [10.2](#102-customer "10.2 Customer") · [10.3](#103-supplylog-the-ledger "10.3 SupplyLog (the ledger)") · [10.4](#104-user-drivers "10.4 User (drivers)") · [10.5](#105-vehicle "10.5 Vehicle") · [10.6](#106-stock "10.6 Stock") · [10.7](#107-indexes "10.7 Indexes") · [10.8](#108-relationships-and-delete-behaviour "10.8 Relationships and delete behaviour") · [10.9](#109-customer-soft-delete-and-restore "10.9 Customer soft delete and restore") · [10.10](#1010-delivery-and-money-rules "10.10 Delivery and money rules") · [10.11](#1011-odometer-and-stock-rules "10.11 Odometer and stock rules") · [10.12](#1012-time-rules "10.12 Time rules") · [10.13](#1013-formatting-csv-and-image-url-helpers "10.13 Formatting, CSV and image-URL helpers") · [10.14](#1014-legacy-data-and-migration-policy "10.14 Legacy data and migration policy") · [10.15](#1015-query-cookbook "10.15 Query cookbook")
- [11. PWA and mobile platform](#11-pwa-and-mobile-platform) — [11.1](#111-what-ships-to-phones "11.1 What ships to phones") · [11.2](#112-web-app-manifest "11.2 Web app manifest") · [11.3](#113-service-worker "11.3 Service worker") · [11.4](#114-registration-and-update-flow "11.4 Registration and update flow") · [11.5](#115-install-prompt "11.5 Install prompt") · [11.6](#116-icons "11.6 Icons") · [11.7](#117-mobile-behaviours "11.7 Mobile behaviours") · [11.8](#118-unverified-on-real-devices "11.8 Unverified on real devices")
- [12. Patches and tooling](#12-patches-and-tooling) — [12.1](#121-patches-and-overrides "12.1 Patches and overrides") · [12.2](#122-turborepo "12.2 Turborepo") · [12.3](#123-eslint "12.3 ESLint") · [12.4](#124-typescript "12.4 TypeScript") · [12.5](#125-prettier "12.5 Prettier") · [12.6](#126-scripts-reference "12.6 Scripts reference") · [12.7](#127-not-present "12.7 Not present")
- [13. Build, run and release](#13-build-run-and-release) — [13.1](#131-prerequisites "13.1 Prerequisites") · [13.2](#132-first-time-setup-on-a-new-machine "13.2 First-time setup on a new machine") · [13.3](#133-commands "13.3 Commands") · [13.4](#134-running-locally "13.4 Running locally") · [13.5](#135-testing-a-production-build-locally "13.5 Testing a production build locally") · [13.6](#136-release-checklist "13.6 Release checklist") · [13.7](#137-adding-or-changing-an-environment-variable "13.7 Adding or changing an environment variable") · [13.8](#138-moving-to-another-machine-or-coding-tool "13.8 Moving to another machine or coding tool")
- [14. Third-party services and accounts](#14-third-party-services-and-accounts)
- [15. Hosting, console and deployment decisions already made](#15-hosting-console-and-deployment-decisions-already-made) — [15.1](#151-decisions-visible-in-the-repo "15.1 Decisions visible in the repo") · [15.2](#152-not-recorded-anywhere---find-out-before-relying-on-it "15.2 Not recorded anywhere - find out before relying on it")
- [16. Known issues and open items](#16-known-issues-and-open-items) — [16.1](#161-how-to-use-this-list "16.1 How to use this list") · [16.2](#162-blockers-blk "16.2 Blockers (BLK)") · [16.3](#163-security-sec "16.3 Security (SEC)") · [16.4](#164-bugs-bug "16.4 Bugs (BUG)") · [16.5](#165-tech-debt-debt "16.5 Tech debt (DEBT)") · [16.6](#166-unverified-items-unv "16.6 Unverified items (UNV)") · [16.7](#167-recently-resolved-done "16.7 Recently resolved (DONE)")
- [17. Testing, quality baselines and debugging recipes](#17-testing-quality-baselines-and-debugging-recipes) — [17.1](#171-baselines-on-c251bc4 "17.1 Baselines on c251bc4") · [17.2](#172-there-are-no-automated-tests "17.2 There are no automated tests") · [17.3](#173-manual-smoke-test "17.3 Manual smoke test") · [17.4](#174-debugging-recipes "17.4 Debugging recipes") · [17.5](#175-logs "17.5 Logs") · [17.6](#176-safe-testing-rules "17.6 Safe-testing rules")
- [18. History, branches and versioning](#18-history-branches-and-versioning) — [18.1](#181-branch-and-merge-model "18.1 Branch and merge model") · [18.2](#182-where-versions-are-bumped "18.2 Where versions are bumped") · [18.3](#183-releases "18.3 Releases") · [18.4](#184-timeline "18.4 Timeline") · [18.5](#185-tried-and-removed "18.5 Tried and removed") · [18.6](#186-feature-introduction-map "18.6 Feature introduction map") · [18.7](#187-working-on-more-than-one-machine "18.7 Working on more than one machine")
- [19. Changelog](#19-changelog)
- [20. Glossary](#20-glossary) — [20.1](#201-domain-terms "20.1 Domain terms") · [20.2](#202-technical-terms "20.2 Technical terms")

## 0. How to use and maintain this file

### 0.1 Reading order

| You are | Read |
|---|---|
| New to the project (human or AI agent) | §0 -> §1 -> §2 -> §3 -> §4, in that order. About 15 minutes. Do not change code before §2. |
| Setting up a machine or moving to another tool | §13.1, §13.2, §13.8, then §14 and §15.2 |
| Changing a screen | The feature's entry in §8, then §9 (UI conventions), then the endpoints it calls in §7 |
| Changing an API route or the data model | §6.5, §6.6, §7, §10 — and the invariants in §2.3 |
| Changing the installed-app behaviour | §11, then §13.6 for the release steps |
| Releasing | §13.6, §18.2 |
| Debugging | §17.4 (symptom table), then §16 (known issues) |
| Looking for "why is it like this?" | §2.2, §15.1, §18.5 |

### 0.2 Conventions used in this file

- **The code wins.** If this file and the code disagree, trust the code, then fix this file in the same change.
- `path/to/file.ts:42` is a repo-relative path and a line number **at the commit named in the header**. Line numbers drift; if a reference looks wrong, search for the quoted identifier instead.
- **(unverified)** marks anything that could not be confirmed from the code alone: behaviour on a real phone, settings in a hosting or third-party console, the state of the live database, or a library default nobody read. Treat it as a question, not a fact.
- "see §N.M" points at the section that owns a topic. Each fact lives in one place: endpoints in §7, screens in §8, schema and data rules in §10, problems in §16.
- Open items have stable IDs (`BLK-`, `SEC-`, `BUG-`, `DEBT-`, `UNV-`, `DONE-`) defined in §16.1. IDs are never reused or renumbered.
- Section numbers 0-20 are fixed. Add subsections; do not renumber sections, because `AGENTS.md`, changelog entries and other notes refer to them by number.

### 0.3 Mandatory steps after every change

A change is not done until all four are done. This applies to code, configuration, dependencies, environment variables, deployment settings and decisions made in conversation.

1. **Changelog:** add an entry at the top of §19 using the template in §0.4.
2. **Stale sections:** fix every section the change made untrue. Use the map in §0.5.
3. **Open items:** in §16, move resolved items to §16.7 (with date and commit) and add any new problem, risk or unverified behaviour with a new ID.
4. **Header:** update the "Last updated" line at the top (date · branch · commit).

Also record decisions that are **not** visible in code — a client requirement, a console setting, something tried and reverted — in §2.2, §15 or §18.5. They are the first thing lost when the project changes hands.

### 0.4 Changelog entry template

```markdown
### YYYY-MM-DD · <branch> · <short title>
- **What:** what changed, with file paths; behaviour before and after.
- **Why:** the reason, and who asked for it if that matters.
- **Verified:** what was run or tried and the result (lint, check-types, build, manual steps). Say "unverified on a real device" if it was not tried on a phone.
- **Follow-ups:** IDs of open items created or left in §16, or "none".
```

### 0.5 Which sections to update

| If you changed | Update |
|---|---|
| A page, component or user-visible rule | §8 (that feature), §9 if a shared pattern or class changed |
| An API route (params, body, response, status code, guard) | §7 (index and the endpoint block), §3.3 if permissions changed |
| A model, index, enum, validation or pricing rule | §10, and §2.3 if an invariant changed |
| Auth, session, proxy rules, React Query keys, storage keys | §6 |
| An environment variable | §6.7, §13.7, §14. In the repo: `turbo.json` `globalEnv`, and a placeholder line in `apps/web/.env.example` (append it without printing the file, or ask the owner; never put a real value there) |
| A dependency, pin, override, Node or npm version | §4, §12.1, §1 |
| Lint, TypeScript, Prettier, Turborepo or scripts | §12, §13.3 |
| Service worker, manifest, install prompt, icons | §11, §13.6 |
| Hosting, domain, console or third-party account settings | §14, §15 |
| The app version or a release | §1, §18.2, §18.3, §19 |
| A file added, moved or deleted | §5 |
| A bug fixed or found, a risk accepted | §16 |
| Baseline results (lint, types, build, audit) | §17.1, §1 |
| A new term or a renamed concept | §20, §9.7 |

### 0.6 Rules for this file

- One file. Do not split it; a second document is a second thing to keep in sync.
- Never write a secret value or personal data here (see the policy at the top). Before saving, search the file for the patterns listed in §0.7.
- Facts over prose. Prefer a table row or a short bullet with a `file:line`. Say **why** for every rule that is not obvious.
- Keep §0-§4 short: they are what every new reader and every AI session loads first.
- Keep the table of contents in step with the headings (the anchors are GitHub-style: lower case, punctuation removed, spaces to hyphens).
- Do not commit this file, or anything else, unless the owner asks (§2.1).

### 0.7 How to re-check this file

| Check | How |
|---|---|
| No secrets or personal data | Search this file for: `AKIA`, `AIza`, `sk_live`, `BEGIN` followed by `PRIVATE KEY`, `mongodb+srv://`, `cloudinary://` followed by digits, any unbroken run of 32 or more letters and digits, anything shaped like an email address, and any 10-digit number. Every hit must be removed or be an obvious non-secret (for example a commit hash). |
| Line references still correct | Pick ten `file:line` references from the section you touched and open them. |
| Baselines still true | Re-run the commands in §17.1 and update the table. |
| Checkout is the documented one | `git merge-base --is-ancestor 3458651 HEAD` exits 0. Use the last work commit named in the header, not a merge commit that exists only on `main`. |
| Table of contents works | Every `##` and `###` heading appears in the table of contents and each link jumps to its heading. |

## 1. Snapshot

| Fact | Value | Source |
|---|---|---|
| Product | Royal King Water Supply | `README.md:1`, `apps/web/app/manifest.ts:9` |
| Purpose | Delivery ledger for a drinking-water supplier: drivers log 20-litre can and bottled-water case deliveries, cash/fuel expenses and a daily odometer reading from their phones; the admin reviews the ledger, manages customers, drivers, vehicles and stock, reads analytics and exports sheets | `README.md:3` |
| Repository | GitHub `jeff1999git/royalkingadmin`, remote `origin` over HTTPS. Visibility, branch protection and Actions settings unverified | checked 2026-10-11 with `git remote -v` |
| Root package | `royalkingwatersupply` (`private`) | `package.json:2-3` |
| App package / version | `web` `0.2.2` (`private`, ESM). The UI shows it as `v0.2.2` at the bottom of both profile menus | `apps/web/package.json:2-5`, `apps/web/next.config.js:5-11` |
| Code basis | Remote `main` @ `c251bc4`, 2026-09-24 (merge of PR #12). 61 commits = 49 non-merge + 12 PR merges. No tags | `git log origin/main` |
| Branches | `dev` (all work) -> `main` (released, via GitHub PRs). `dev` @ `3458651` has the identical tree. No other remote heads | `git ls-remote` 2026-10-11; see §18 |
| Stale-checkout warning | On 2026-10-11 the working tree on the machine where this handbook was written was at local `dev` @ `e849df9` (2026-06-22), 43 commits behind `origin/main` (31 non-merge + 12 PR merges). The handbook describes `c251bc4`, not that tree: compare `HEAD` with `origin/main` before trusting or editing local files | checked 2026-10-11 with `git rev-list --count HEAD..origin/main`; see §18.7 |
| Monorepo layout | Turborepo + npm workspaces: one app `apps/web` (admin portal `/admin`, driver portal `/driver`, API `/api`) plus config-only `packages/eslint-config` and `packages/typescript-config`. 97 tracked files | `package.json:20-23`, `README.md:5-10`; see §5 |
| Stack (locked versions) | Next.js 16.2.12 (App Router, Turbopack build), React 19.2.8, TypeScript 5.9.2, Mongoose 9.9.0, next-auth 4.24.15, TanStack Query 5.101.4, bcryptjs 3.0.3 | `package-lock.json`; see §4 |
| Language / TS mode | TypeScript for all app code; plain JS only for config files, `public/sw.js` and the icon script. `strict` + `noUncheckedIndexedAccess`, `noEmit`. No path aliases: every import is relative | `packages/typescript-config/base.json:13-16`, `apps/web/tsconfig.json:1-20` |
| Database | MongoDB through Mongoose. 5 models: Customer, Stock, SupplyLog, User, Vehicle. Connection string in `MONGODB_URI` | `apps/web/models/index.ts:6-10`, `apps/web/lib/mongodb.ts:97` |
| Auth | next-auth Credentials provider with JWT sessions. One env-defined admin plus database driver accounts | `apps/web/lib/auth.ts:119-233`; see §6 |
| Media | Cloudinary stores fuel-bill photos; called with signed `fetch` requests, no SDK | `apps/web/lib/cloudinary.ts:81-149` |
| Client data layer | TanStack Query + raw `fetch` to `/api/*` from client components. No server-side page data fetching, no server actions | `apps/web/app/providers.tsx:10-27` |
| Styling | Plain CSS (`globals.css`, 552 lines) plus inline styles. No Tailwind, CSS modules or UI kit | `apps/web/app/globals.css`, `apps/web/README.md:3` |
| Platforms | Responsive web app that is installable as a PWA (manifest + hand-written service worker). There are NO native `android/` or `ios/` projects, no Capacitor/React Native, and it is not a store app. Behaviour on real devices is unverified | repository tree at `c251bc4`; `apps/web/app/manifest.ts:6-40`; see §11 |
| Toolchain | Node: use 20.19+ (20.x), 22.13+ (22.x) or 24+. `engines.node` and the README say `>=20.9`, but locked `mongoose` 9.9.0 and its `mongodb` 7.5.0 driver require `>=20.19.0`; `.npmrc` is empty, so npm only warns. npm pinned by `packageManager` `npm@10.8.1`. Turborepo 2.10.7. No `.nvmrc` | `package.json:16-19`, `package-lock.json:3711`, `package-lock.json:3648`, `README.md:30` |
| Dev URL / port | `http://localhost:3000` (`next dev --port 3000`) | `apps/web/package.json:7` |
| Environments | Local development and production only. Hosting is implied to be Vercel with functions in region `bom1` (Mumbai). Production URL not recorded (unverified). No staging or preview environment recorded | `apps/web/vercel.json:3`; see §15 |
| External services | MongoDB (Atlas implied, unverified), Cloudinary, Google Identity Services + Drive API (optional admin export), Google Fonts (Inter, fetched at build time) | see §14 |
| Identifiers | Manifest `id` `/`, `name` "Royal King Water Supply", `short_name` "Royal King", `theme_color` `#0a3d91`. There are no bundle IDs, application IDs or store IDs | `apps/web/app/manifest.ts:8-18` |
| Size | 5 models. 16 API route files = 15 app files exporting 29 handlers + the NextAuth catch-all (GET, POST). 11 `page.tsx` = 10 screens + the `/admin` redirect. 3 layouts, 5 shared components, 2 hook files, 13 lib modules. About 12,800 lines of TS/TSX | repository tree at `c251bc4` (`find`, `grep`, `wc -l`) |
| Quality baseline | Measured on `c251bc4`, Node 20.11.0, no `.env`: `npm ci` ok (6 `EBADENGINE` warnings); lint 0 problems; check-types 0 errors; build ok with no env vars set; Prettier check flags 59 of the 67 files in scope even with line endings ignored (no Prettier config); `npm audit --omit=dev` = 1 critical + 3 high | measured 2026-10-11; see §17 |
| Secrets | Only in `apps/web/.env` on a developer machine (git-ignored) and in the hosting provider's environment settings. No secret file was ever committed; `apps/web/.env.example` lists the names | `apps/web/.gitignore:29-30`; see §6 |
| Tests / CI | None: no test framework, no test files, no CI config, no git hooks. Lint and type-check run only when someone runs them | repository tree at `c251bc4`; `apps/web/README.md:3` |

**Read this next**

- §0 - how to use and maintain this file, and the working agreements (the owner commits; agents do not commit, push or pull unless asked).
- §2 - the golden rules to read before changing any code.
- §13 - set up a new machine, run, build and release.
- §16 - known issues, risks and unverified items (the audit findings, the Node floor mismatch and the stale PDF report are tracked there).

## 2. Golden rules

### 2.1 Working agreements

Set by the owner on 2026-10-11. They bind every person and every AI agent working on this repository.

- **The owner reviews and commits.** Agents do not commit, push or pull unless explicitly asked in that conversation. Leave the change in the working tree and report what changed.
- **Secrets stay unread.** Never open or print `.env` files, keystores, private keys, service-account JSON or similar. Never write a secret value anywhere. For a hard-coded secret give `file:line` and its type only. Variable names are in §6.7.
- **No personal data in notes.** No real names, emails, phone numbers, vehicle registration numbers or account credentials; refer to roles (the admin, a driver, the owner).
- **Update this handbook after every change:** changelog, stale sections, open items, "Last updated" (steps in §0.3).
- **Check the checkout before trusting local code.** On 2026-10-11 one working tree was 43 commits behind the remote (BLK-01, §2.4). Do §2.5 step 1 first.
- **Untested means unverified.** Anything not tried on a real device, or not read from code, a console or the database, is marked "(unverified)" and listed in §16.6.
- **The code wins.** If notes and code disagree, the code is right; fix the notes in the same change.

### 2.2 Recorded decisions

Only decisions with evidence in a code comment, a README or a commit. Decisions that are also hard invariants are stated once, in §2.3.

| Decision | Evidence | Consequence |
|---|---|---|
| One shared admin account defined by environment variables; no admin user record | `apps/web/lib/auth.ts:9-22`, `:146-160` | Admin edits are not attributable (DEBT-03); the admin password is changed in the env settings, not in the app |
| A deactivated driver loses API access within a minute; a database error during that check fails open | `apps/web/README.md:33`; `apps/web/lib/auth.ts:72-74`, `:88` ("A DB blip must never lock every driver out") | SEC-06 |
| Login throttle: 10 failures per 15 minutes per username and IP, kept in memory | `apps/web/lib/auth.ts:32-37` | Per server instance only (SEC-03) |
| "Not signed in" and "wrong role" both answer 401; 403 is never used; server errors answer a generic message and log the real one | `apps/web/lib/api.ts:10-12`, `:22-26` | Basis of rule 2 in §2.3 |
| No offline writes; the app never reloads itself for an update | `apps/web/README.md:50` ("Saving while offline is not supported"), `:54`; `apps/web/app/components/PwaRegister.tsx:9-11` | Forms need a connection; an update waits for the user's tap "so a half-filled form is not lost" |
| Image optimizer off; plain `<img>` with Cloudinary URL transforms | `apps/web/next.config.js:19-24` ("pure attack surface"); `1ca3e0d` | Do not introduce `next/image` optimisation |
| Fuel-bill image limit is 4 MiB | `apps/web/app/api/driver/supplies/route.ts:21-22` ("Vercel refuses function request bodies over 4.5 MB"); `e810079` (was 8 MB) | The client check at `apps/web/app/driver/page.tsx:644` must match |
| Pricing: cans x the customer's `cashPerCan`; cases x the price per case typed with the delivery; an amount typed by the admin wins; remark or payment edits never change a saved amount | `apps/web/README.md:32`; `apps/web/lib/supplyProduct.ts:116-130` | A quantity edit re-prices (BUG-17) |
| No dashboard: `/admin` redirects to Analytics, whose URL stays `/admin/amounts` | `apps/web/app/admin/page.tsx:3-6`; `f466fa5` (the page at that URL became Analytics), `e810079` (dashboard replaced by the redirect) | The slug is hard-coded in four files (DEBT-09) |
| `SessionProvider` lives only in the admin and driver layouts | `apps/web/app/providers.tsx:7-9` | `useSession()` does not work on `/` or `/login` |
| Google Drive export runs in the browser with the `drive.file` scope; the token lives in memory for the tab | `apps/web/lib/googleDrive.ts:1-7`; `apps/web/README.md:69` | No Google secret on the server |
| Sheet and Drive exports hold every row matching the filters; Photo and PDF hold the rows on screen; with no filter the list is the last 5 IST days | `apps/web/README.md:67`; `apps/web/app/api/admin/supplies/route.ts:84-86` | BUG-01, BUG-11, BUG-21 |
| Odometer: one reading per vehicle per IST day, written atomically; a driver with no vehicle is not gated; the gate fails open on error | `apps/web/app/api/driver/vehicles/odometer/route.ts:25-26`, `:75-77`; `apps/web/app/driver/layout.tsx:49-52` | Drivers sharing a vehicle share the reading (BUG-06) |
| Drivers add entries but cannot edit or delete them | Only GET and POST exist in `apps/web/app/api/driver/supplies/route.ts`; the unused attach route went in `e810079` | Corrections go through the admin |
| Saving a delivery in the admin edit dialog records `productType` on an older row | `apps/web/app/admin/supplies/page.tsx:698` | The only sanctioned backfill, one row at a time |
| "New customers" counts by `createdAt` and includes soft-deleted customers; custom analytics windows are capped at two years | `apps/web/lib/analyticsRange.ts:16-18`, `:53-55` | A restored customer never counts as new again |

No separate record of client requirements, hosting or console settings, or earlier AI conversations existed when this handbook was written (2026-10-11). Anything not listed here or in §15 must be confirmed with the owner before it is treated as decided.

### 2.3 Never change without a deliberate plan

Ordered by area: access (1-9), database (10-12), data rules (13-22), environment and tooling (23-26).

1. **Every API handler starts with a guard:** `const x = await requireAdmin()` (or `requireDriver()`), then `if (!x) return unauthorized();`. Why: `/api/*` is outside the proxy matcher and the guards return `null` instead of throwing, so a missing `if` compiles and leaves the route public. `apps/web/proxy.ts:36`, `apps/web/lib/authHelpers.ts:16-26`; `/api/stock` has its own guard (`apps/web/app/api/stock/route.ts:11-14`).
2. **Never answer 401 from a driver API for a business-rule failure.** Why: the driver client treats any 401 as "session ended" and signs out. Use 400, 404 or 409. `apps/web/app/driver/layout.tsx:17-25`, `apps/web/app/driver/page.tsx:171-182`.
3. **Keep `authorized: () => true` in `proxy.ts`, keep `/sw.js`, `/manifest.webmanifest`, `/offline.html` and `/icons/*` out of its matcher, and add no `middleware.ts`.** Why: the wrapped function must run for anonymous visitors on `/` and `/login`, and the PWA files "have to load without a session" (`apps/web/README.md:58`). `apps/web/proxy.ts:28-37`.
4. **The service worker never caches page HTML, `/api/*`, non-GET requests or other origins.** Why: "nothing from one signed-in user can be shown to another user on a shared phone", and ledger data stays live. Bump `VERSION` when the worker, offline page, icons or manifest change. `apps/web/public/sw.js:9-22`, `:64-86`.
5. **Sign-out stays a full-page navigation: `signOut({ callbackUrl })`.** Why: React Query keys are not user-scoped and the cache lives as long as the tab; a client-side redirect would show the previous user's data (the reload itself is library behaviour, UNV-28). `apps/web/app/admin/layout.tsx:99-101`, `apps/web/app/driver/layout.tsx:120-122`.
6. **The `jwt` callback reads only `token` and `user`.** Why: copying client-supplied session data into the token would let a client set its own role. Keep the driver re-check branch as well. `apps/web/lib/auth.ts:195-211`.
7. **`MAX_CREDENTIAL_LENGTH` and `MAX_PASSWORD_LENGTH` stay equal (both 200).** Why: "a longer password could never sign in". `apps/web/lib/auth.ts:36`, `apps/web/app/api/admin/drivers/route.ts:10-11`.
8. **Never return the password hash.** `User.password` has no `select: false`, so every User query that returns data needs `.select("-password")` or an explicit field list. `apps/web/models/User.ts:22`, `apps/web/app/api/admin/drivers/route.ts:21`.
9. **Never store the admin's session id as a reference.** It is a fixed string, not an ObjectId, because the admin has no User document; `createOrRestoreCustomer` drops it. `apps/web/lib/auth.ts:155`, `apps/web/lib/customers.ts:49`.
10. **`await connectToDatabase()` before any model call.** Why: `bufferCommands: false` makes an early query throw instead of queueing (Mongoose behaviour, UNV-29). `apps/web/lib/mongodb.ts:78`.
11. **Import every new model in `apps/web/models/index.ts`.** Why: otherwise it is registered only once a route that imports it has loaded, so `populate()` from another route can fail with `MissingSchemaError` on a fresh instance and its indexes are ensured late. `apps/web/models/index.ts:1-10`, `apps/web/lib/mongodb.ts:53-66`.
12. **Removing an index or `unique` from a schema does not remove it from MongoDB.** `createIndexes()` only adds; an obsolete unique index must be listed in `OBSOLETE_UNIQUE_INDEXES`. Never put a unique index back on `Vehicle.vehicleNumber`: two vehicles may share a model. `apps/web/lib/mongodb.ts:25-52`.
13. **`Vehicle.name` is the registration number ("Number" on screen) and `Vehicle.vehicleNumber` is the model ("Model").** Uniqueness is checked on `name`. A rename needs a data migration and a cache plan. `apps/web/models/Vehicle.ts:23-28`, `apps/web/app/api/admin/vehicles/route.ts:34`.
14. **Filter can deliveries with `{ productType: { $ne: "case" } }`, never `{ productType: "can" }`, and read through `toProductType()`.** Why: rows saved before the field existed have none and count as cans. `apps/web/models/SupplyLog.ts:61-66`, `apps/web/app/api/admin/supplies/route.ts:132-134`.
15. **A missing `paymentStatus` means cash: filter with `{ $nin: ["upi", "not_paid"] }`.** Old rows and every delivery added by the admin lack the field. `apps/web/app/api/admin/supplies/route.ts:123-125`, `:304-319`.
16. **A pending amount is an absent field, never `null`.** Clear it with `$unset`. Why: screens and exports test `amount !== undefined` and the status filter uses `$exists`. `apps/web/app/api/admin/supplies/[id]/route.ts:138-142`, `apps/web/app/api/admin/supplies/route.ts:109-112`.
17. **Never "fix" old documents with a migration.** "Queries filter with `$ne` / `$nin` and reads default, so old documents keep working. Never change that with a migration." (`apps/web/README.md:31`). Keep fallbacks such as `customer?.name ?? pointName` (`apps/web/app/admin/supplies/exports.ts:46`).
18. **Create customers only through `createOrRestoreCustomer()`; delete only by setting `isDeleted: true` and `isActive: false` together.** Why: the unique phone index also covers soft-deleted customers, and the driver list and delivery checks filter on `isActive` alone. `apps/web/lib/customers.ts:1-4`, `apps/web/app/api/admin/customers/[id]/route.ts:155`, `apps/web/app/api/driver/customers/route.ts:14`.
19. **Never hard-delete a driver or vehicle that has ledger rows.** Why: "The ledger keeps its driver attribution"; the routes answer 409 and the admin deactivates instead. `apps/web/app/api/admin/drivers/[id]/route.ts:123-127`, `apps/web/app/api/admin/vehicles/[id]/route.ts:139-143`.
20. **Drivers never set the time of an entry or the amount of a delivery.** `suppliedAt` is the server's "now" and the amount is auto-priced; values sent by the client are ignored. `apps/web/app/api/driver/supplies/route.ts:190`, `:217`, `:234`.
21. **IST is written into five files that change together:** `apps/web/lib/istTime.ts:6`, `apps/web/lib/format.ts:9`, `apps/web/app/api/admin/analytics/route.ts:64` and `:75`, `apps/web/app/admin/supplies/exports.ts:385`, `apps/web/app/admin/amounts/page.tsx:274-275`. Day boundaries go through `lib/istTime.ts` and display through `lib/format.ts`; never use server-local dates (§6.11).
22. **Stock is one document read with `findOne({})`, and PATCH stores absolute values.** Never assume `$inc` or a keyed document; a client must load before it saves. `apps/web/app/api/stock/route.ts:24`, `:62-73`, `apps/web/app/components/StockModal.tsx:13-16`.
23. **Never overwrite, open or print `apps/web/.env`.** It "holds the real credentials"; copy the example only when the file is missing (`test -f apps/web/.env || cp ...`). `README.md:16-17`, `apps/web/README.md:9`.
24. **Never run scripts, seeders, tests or ad-hoc queries against `MONGODB_URI`.** It can be the live database: "use a throwaway MongoDB for anything that writes" (`README.md:34`). The app also creates and drops indexes on its first request (`apps/web/lib/mongodb.ts:34-66`).
25. **A new `process.env.X` goes into `globalEnv` in `turbo.json` and, as a placeholder line, into `apps/web/.env.example`.** Why: `turbo/no-undeclared-env-vars` fails lint under `--max-warnings 0`, and Turborepo does not hash an undeclared variable (library behaviour, unverified). `NEXT_PUBLIC_APP_VERSION` is read unlisted and lint passes, so `NEXT_PUBLIC_*` names appear exempt from the lint rule (reason unverified). `turbo.json:4-13`, `packages/eslint-config/base.js:21`.
26. **Do not run `npm run format` inside another change.** Why: there is no Prettier config, so it rewrites at least 59 of the 67 tracked files in scope with defaults (DEBT-07). Match the indentation of the file you edit. `package.json:8`.

### 2.4 Past incidents and lessons

| Date | What happened | Lesson |
|---|---|---|
| 2026-10-11 | Stale checkout: the machine where this handbook was written had local `dev` at `e849df9` (2026-06-22), 43 commits (31 non-merge + 12 merges) and 128 changed files behind `origin/main` @ `c251bc4`, with matching old `node_modules`. Work had moved to another environment. | Compare with the remote before reading, editing or building (§2.5 step 1). The handbook was written from an export of `c251bc4`, not from that tree. |
| 2026-06-22 to 2026-09-24 | Index builds probably not happening (per the code comment; UNV-29): `bufferCommands: false` arrived in `a5c19d6`; the comment at `apps/web/lib/mongodb.ts:46-52` says Mongoose's import-time build then "fails silently"; explicit creation came only in `e810079`. Customer creation relied on the duplicate-key error alone in that period. | A schema `unique` is no guarantee until the index is confirmed in the database (BUG-03, UNV-21). |
| 2026-06-15 to 2026-09-24 | Hard deletes could orphan ledger references: driver and vehicle DELETE had no ledger check until `e810079` added the 409 guards. Exports still print " (@)" for a row whose driver is gone. | Anything the ledger references is deactivated, never deleted (rule 19). |
| 2026-06-15 to 2026-09-24 | Public diagnostics endpoint: `/api/db/ping` had no guard and returned the raw database error until `e810079` removed it. | Rule 1 applies to diagnostics and one-off routes too. |
| 2026-06-15 to 2026-09-24 | Unique index on the wrong field: `Vehicle.vehicleNumber` holds the model, so the index blocked a second vehicle of the same model; `e810079` removed it and drops it at run time. | Check what a field holds before adding a constraint (rule 13); a schema edit does not drop an index (rule 12). |
| 2026-06-26 to 2026-07-31 | Day boundaries used server time: the odometer gate from `92f0c12` counted UTC days until `1ca3e0d` moved every boundary to IST. | All day maths goes through `lib/istTime.ts` (rule 21). |
| 2026-06-26 to 2026-07-31 | Drivers with no assigned vehicle were shown the blocking odometer dialog and could not satisfy it (PATCH answered "No vehicle assigned to you.") until `1ca3e0d` added `hasVehicle`. | A blocking dialog needs an exit for every server answer; BUG-06 is the remaining case. |
| 2026-07-31, 2026-09-24 | Commit subjects hid large changes: `1ca3e0d` ("chore" about overrides) is 48 files with the Next upgrade and the IST rewrite; `e810079` ("chore" about the Node engine) is 82 files, +3559 / -4237, removing five feature areas and hardening auth. | Read `git show <hash> --stat`, never the subject line. One concern per commit (DEBT-04). |
| 2026-07-31 | A second document went stale: `Royal-King-Water-Supply-System-Report.pdf` ("Prepared 14 July 2026") was committed in `07835b7` under a "Refactor" subject and now contradicts the code (DEBT-22). | Keep one source of truth: this file, updated with every change. |

### 2.5 Before you change anything

1. Confirm the checkout is current, read-only: `git status`, `git rev-parse HEAD`, `git ls-remote origin`, `git merge-base --is-ancestor 3458651 HEAD`. If it is behind, stop and ask the owner to pull.
2. Read §2.3 and the §16 rows for the area, then the owning section: screen §8, endpoint §7, schema §10, auth and config §6, installed app §11.
3. Open the real files and confirm every line reference you rely on. The code wins.
4. Before starting a dev server or any script, ask the owner which database `MONGODB_URI` targets on this machine; never open the env file to find out (rules 23-24).
5. Run the baseline first: `npm run lint`, `npm run check-types`, `npm run build`. All three pass on `c251bc4` (§17); a failure before your change is an environment problem (Node, DEBT-02).
6. Walk the plan through §2.3: new route -> guard; new model -> `models/index.ts`; new env var -> `turbo.json`; worker, offline page, icons or manifest -> `VERSION`; data-shape change -> old rows still read correctly.
7. Keep the diff small and single-purpose. Relative imports only (no path alias); match the file's indentation; no `npm run format`.
8. Re-run lint, check-types and build. There are no tests: exercise the changed flow by hand, on a phone for driver or PWA changes, or mark it "(unverified)".
9. Update this handbook (§0.3), including §16.
10. Stop. Do not commit or push. Report what changed, what was verified and what stays unverified.

## 3. Product overview

### 3.1 What it does

Royal King Water Supply delivers drinking water in 20-litre cans and in cases of bottles (`README.md:3`; the code itself only says "can" and "case"). The app is the delivery ledger: drivers record everything on their phones, one admin reviews, corrects, analyses and exports. The earlier tanker / supply-point workflow, where the admin typed each amount afterwards, no longer exists (see §3.6 and §18). Screen-level detail: §8.

A driver's day (portal `/driver`, one page with tabs Supply / Cash / User, `apps/web/app/driver/page.tsx:839`):
- Signs in at `/login` and lands on `/driver`. On each full page load a blocking "Today's Odometer Reading" dialog appears if the driver has an assigned vehicle with no reading yet for the current IST day (`apps/web/app/driver/layout.tsx:53-76`).
- Supply tab: logs each delivery - customer, product (can: cans delivered and/or empty cans taken back; case: bottle size, cases, price per case), optional vehicle and note, payment status. The server stamps the time and computes the amount (`apps/web/app/api/driver/supplies/route.ts:190`, `:217`).
- Cash tab: logs a cash entry of type `debit` or `fuel`. A fuel entry must carry a bill photo, compressed in the browser and capped at 4 MiB (`apps/web/app/api/driver/supplies/route.ts:22`, `:174`).
- User tab: registers a new customer met on the route (name, phone, optional email, home/office/both, location, rate per can).
- Sees only their own entries for the last 5 IST days or one picked date, read-only. The profile menu opens Odometer, Stock and Sign Out.

The admin's day (portal `/admin`):
- Lands on Analytics (`/admin/amounts`): totals and daily charts of deliveries, cans, cases and new customers for the last 7/14/30/90 days or a custom range, filterable by driver and vehicle.
- Deliveries (`/admin/supplies`): tabs "Deliveries" (water rows) and "Cash Credits" (the drivers' cash/fuel rows), last 5 days by default plus filters. Adds a delivery on a driver's behalf, edits or deletes any row, opens fuel-bill photos, and exports through one Download menu: Photo, PDF, Sheet, Save to Google Drive (`apps/web/app/admin/supplies/page.tsx:823-834`).
- Customers (`/admin/customers`): search, add, edit, soft-delete; each customer has a history page.
- Profile menu: Drivers (accounts), Vehicles (fleet, odometer history and charts), Stock (three shared counters: cans, dispensers, stands), Sign Out.

### 3.2 User roles

| Role | Identity | Created by | Evidence |
|---|---|---|---|
| Admin | ONE shared account. Its credentials are the env vars `ADMIN_USERNAME` / `ADMIN_PASSWORD`, not a database user; every admin session has the literal id `"admin"` | whoever sets the server environment | `apps/web/lib/auth.ts:9-22`, `apps/web/lib/auth.ts:153-159` |
| Driver | `User` documents with `role: "driver"`; bcrypt-hashed password (cost 12, 6-200 characters); must be `isActive` to sign in | the admin, on `/admin/drivers` | `apps/web/app/api/admin/drivers/route.ts:47-52`, `apps/web/app/api/admin/drivers/route.ts:74-82`, `apps/web/lib/auth.ts:164-168` |
| Anonymous | No session; can open `/`, `/login` and the PWA assets only | - | `apps/web/proxy.ts:9-24` |

- No self sign-up, no invitations, no password reset, no customer login and no other roles. The login page says "Driver credentials are assigned by the administrator" (`apps/web/app/login/page.tsx:100`).
- The `User.role` enum also lists `"admin"` (`apps/web/models/User.ts:23-27`), but login only queries `role: "driver"`, so such a document can never sign in. Outside production a hard-coded fallback admin credential exists (`apps/web/lib/auth.ts:10` default username literal, `apps/web/lib/auth.ts:18` development password literal; see §16). The default username applies in every environment when `ADMIN_USERNAME` is unset; in production an unset `ADMIN_PASSWORD` means no admin login at all (`apps/web/lib/auth.ts:17-21`).

### 3.3 Permissions matrix

| Capability | Admin | Driver | Anonymous |
|---|---|---|---|
| Open `/` and `/login`; install the PWA | Yes (redirected to own portal while signed in) | Yes (same) | Yes |
| View deliveries and cash entries | All rows of all drivers, with filters | Own rows only; last 5 IST days or one date; `adminRemark` hidden (`apps/web/app/api/driver/supplies/route.ts:27`, `:117`) | No |
| Add a delivery | Yes, for any driver; may set the date/time and type the amount (`apps/web/app/api/admin/supplies/route.ts:233`) | Yes, as self; server time and server-computed amount | No |
| Edit / delete a delivery | Yes (`apps/web/app/api/admin/supplies/[id]/route.ts:48`, `:228`) | No - no such route exists | No |
| Add a cash entry (`debit` / `fuel`) | The API accepts it (`apps/web/app/api/admin/supplies/route.ts:240`) but the UI has no button: "+ Add Delivery" renders on the water tab only (`apps/web/app/admin/supplies/page.tsx:797-800`) | Yes | No |
| Edit / delete a cash entry | Yes | No | No |
| Upload a bill photo | No - admin-created rows never carry an image | Yes, with an own cash entry: required for `fuel`, and the form shows the photo field only for `fuel` | No |
| View / download bill photos | Yes | Own entries | No app access; the stored `billImageUrl` is served by Cloudinary, outside the app's session checks (see §7) |
| Customers: view | List: all non-deleted. Detail and history by id also open a soft-deleted customer, shown as "Deleted" (`apps/web/app/api/admin/customers/[id]/route.ts:20`) | Active customers only, 6 fields (`apps/web/app/api/driver/customers/route.ts:14-15`) | No |
| Customers: create | Yes, all fields | Yes, reduced form; `subscriptionCans` forced to 1, `createdBy` = the driver (`apps/web/app/api/driver/customers/route.ts:51-61`) | No |
| Customers: edit, soft-delete | Yes | No | No |
| Customers: restore a deleted one | No button; registering the same phone again restores the record in place (`apps/web/lib/customers.ts:1-4`) | Same side effect when registering | No |
| Driver accounts: list, create, edit, activate/deactivate, delete | Yes; delete answers 409 once the driver has ledger rows | No - cannot edit own profile or password | No |
| Vehicles: create, edit, enable/disable, delete | Yes; delete answers 409 once the vehicle has ledger rows | View active vehicles only, to pick one per delivery (`apps/web/app/api/driver/vehicles/route.ts:15`) | No |
| Odometer: submit a reading | No - the admin cannot enter or correct readings | Yes: assigned vehicle only, one reading per vehicle per IST day (`apps/web/app/api/driver/vehicles/odometer/route.ts:78-98`) | No |
| Odometer: view | Current reading, newest 200 entries, charts | Last 5 entries of the assigned vehicle | No |
| Stock: view and edit the counters | Yes | Yes - same document, last writer wins (`apps/web/app/api/stock/route.ts:11-14`) | No |
| Analytics; exports (Photo, PDF, Sheet); Save to Google Drive | Yes; Drive also needs `NEXT_PUBLIC_GOOGLE_CLIENT_ID` and the admin's own Google account | No | No |

### 3.4 Gating

- Layer 1, pages: `apps/web/proxy.ts` (the Next.js 16 name for middleware) runs for `/`, `/login`, `/admin/:path*` and `/driver/:path*` (`apps/web/proxy.ts:36`). It only decodes the session cookie: a signed-in user on `/` or `/login` goes to their portal (`:9-16`); a non-admin on `/admin*` or a non-driver on `/driver*` goes to `/login` (`:18-24`). Page HTML carries no data.
- Layer 2, APIs: `/api/*` is NOT in the matcher, so each handler guards itself on its first lines with `requireAdmin()` / `requireDriver()` (`apps/web/lib/authHelpers.ts:17-26`) or, for stock, `requireAnyRole()`. Failure is always 401 `{ "error": "Unauthorized" }`; 403 is never used, even for a wrong role.
- Deactivated or deleted driver: the JWT callback re-checks the account at most once per 60 s per driver per server instance and strips the role (`apps/web/lib/auth.ts:72-92`, `:201-208`) so the driver loses access "without waiting for the JWT to expire"; the driver client signs out on a 401 from its own API calls (`apps/web/app/driver/layout.tsx:17-25`, `apps/web/app/driver/page.tsx:174-182`), while the shared Stock dialog only shows the error (`apps/web/app/components/StockModal.tsx:40-45`). Admin tokens are never re-checked.
- Full sign-in, session and redirect lifecycle: see §6.

### 3.5 Plans, pricing and billing

- The app has NO plans, tiers, trials, subscriptions, payment gateway, invoices or billing integration (no such dependency in `apps/web/package.json:14-22`, no payment code in the tree). It is an internal tool for one business and nothing in it is sold.
- What it records is the BUSINESS's pricing: a rate per can stored per customer (`cashPerCan`, `apps/web/models/Customer.ts:30`) and a price per case typed on each case delivery (`casePrice`, `apps/web/models/SupplyLog.ts:51`).
- Amount = cans x rate, or cases x price per case, rounded to paise by `autoAmount` (`apps/web/lib/supplyProduct.ts:119-130`); it stays blank when a factor is missing, and the admin may type a different amount.
- `paymentStatus` is really the payment method: `cash`, `upi` or `not_paid` (`apps/web/models/SupplyLog.ts:71`). There are no partial payments, due dates, receipts or customer balances.
- Amounts, `securityDeposit` and `subscriptionCans` (expected cans per day, display only - not a billing subscription; `apps/web/models/Customer.ts:29-31`) are records only: no money moves through the app. Rules: see §10.

### 3.6 Deliberately absent

| Feature | Status | Evidence |
|---|---|---|
| Admin dashboard | Removed. `/admin` only redirects to `/admin/amounts` ("There is no dashboard") | `apps/web/app/admin/page.tsx:3-6` |
| Supply points and driver assignments | Removed in commit `e810079`; their models, routes and pages are gone. Only the legacy read fallback `pointName` remains | `apps/web/models/SupplyLog.ts:46`, `apps/web/models/index.ts:6-10` |
| Driver edit/delete of own entries | Absent; a driver delete never existed. `/api/driver/supplies` exports only GET and POST. Until `e810079` a `PATCH /api/driver/supplies/[id]` existed, which only attached a bill photo to an own cash entry that had none | `apps/web/app/api/driver/supplies/route.ts:96`, `:133`; `git show e810079 --stat` |
| Driver password change or reset (by anyone) | Absent. PATCH accepts only name, username, phone, isActive, assignedVehicle; hashing happens only on create (see §16) | `apps/web/app/api/admin/drivers/[id]/route.ts:24-30`, `apps/web/app/api/admin/drivers/route.ts:74` |
| Audit trail of edits and deletes | Absent. No audit model and no "edited by" field on the ledger; an admin delete is a hard delete. Only `Stock.updatedBy` names the last writer | `apps/web/models/SupplyLog.ts:31-77`, `apps/web/models/Stock.ts:17` |
| Notifications, push, real-time updates | Absent. No WebSocket, SSE, push or polling code; the service worker has no push handler; data refreshes on load or after the user's own writes | `apps/web/public/sw.js:36-86`, `apps/web/app/providers.tsx:14-22` |
| Multiple admins / per-admin identity | Absent. One env credential pair; every admin session is `id: "admin"`, name "Administrator" | `apps/web/lib/auth.ts:153-159` |
| Offline data entry / sync queue | Absent on purpose. The worker never touches `/api/*` or non-GET requests; "Saving while offline is not supported" | `apps/web/public/sw.js:9-15`, `apps/web/README.md:50` |
| Other languages (i18n) | Absent. UI strings are hard-coded English, `lang="en"`, number and date formats `en-IN` | `apps/web/app/layout.tsx:41`, `apps/web/lib/format.ts:11` |
| Dark mode | Absent. No `prefers-color-scheme` rule anywhere; one light "High Visibility" palette | `apps/web/app/globals.css:2` |
| Customer-facing portal, email or SMS | Absent. Customers are records, not users | `apps/web/models/Customer.ts:21-38` |
| Native apps, automated tests, CI | Absent (see §1 and §17.2) | repository tree at `c251bc4` |

## 4. Tech stack and key libraries

### 4.1 Runtime and framework

| Layer | Choice | Evidence |
|---|---|---|
| Runtime | Node.js (real floor 20.19, see §4.4). Server code imports `node:crypto` and `node:fs`, so it needs the Node runtime, not Edge | `apps/web/lib/auth.ts:4`, `apps/web/lib/cloudinary.ts:1`, `apps/web/next.config.js:1` |
| Framework | Next.js 16.2.12, App Router only (`apps/web/app/`; no `pages/` or `src/` directory). `next build` runs Turbopack; `next dev --port 3000` runs the Next 16 default bundler (the `--webpack` flag was dropped in `e810079`, reason not recorded) | `apps/web/package.json:7-8`; build log, see §17 |
| Rendering model | Every page is a client component except the root layout, the `/admin` redirect and `not-found`. No server actions and no server-side data fetching: pages call the `/api/*` route handlers | `apps/web/app/layout.tsx:35-50`, `apps/web/app/admin/page.tsx:5-7` |
| Request gate | `apps/web/proxy.ts`, the Next 16 file name for middleware, wrapping next-auth `withAuth` | `apps/web/proxy.ts:1-37`; see §6 |
| Module system | ESM (`"type": "module"`), so `next.config.js` and `eslint.config.js` use `import`, never `require` | `apps/web/package.json:4`, `packages/eslint-config/package.json:4` |
| Data | MongoDB through Mongoose 9.9.0 (driver `mongodb` 7.5.0), kept out of the server bundle by `serverExternalPackages: ["mongoose"]` | `apps/web/next.config.js:12` |
| Auth | next-auth 4.24.15 - the v4 API (`NextAuthOptions`, `getServerSession`, `next-auth/middleware`); JWT handled by transitive `jose` 4.15.9 | `apps/web/lib/auth.ts:1-2`, `apps/web/lib/authHelpers.ts:1` |
| Client data | TanStack Query 5.101.4, `useQuery` only; writes are plain `fetch` followed by `invalidateQueries` (0 uses of `useMutation`) | `apps/web/app/providers.tsx:4` |
| Monorepo | Turborepo 2.10.7 over npm workspaces `apps/*` and `packages/*` (config: §12) | `package.json:20-23`, `turbo.json:14-30` |
| Hosting target | Vercel implied by `vercel.json` and "fresh serverless instance" wording; not confirmed from any console (unverified) | `apps/web/vercel.json:1-4`, `apps/web/models/index.ts:3` |

### 4.2 Dependency table

"Locked" is what `npm ci` installs from `package-lock.json` (measured with `npm ls`, see §17). `packages/typescript-config` has no dependencies.

| Package | Declared | Locked | Used for | Notes |
|---|---|---|---|---|
| `next` | app dep `16.2.12` (exact) | 16.2.12 | App Router, route handlers, `proxy.ts`, `next/font/google` (`apps/web/app/layout.tsx:2`), `after()` (`apps/web/app/api/admin/supplies/[id]/route.ts:248`) | exact pin, see §4.3; needs Node `>=20.9.0` |
| `react`, `react-dom` | app dep `^19.2.0` | 19.2.8 | UI | |
| `@tanstack/react-query` | app dep `^5.90.21` | 5.101.4 | client cache: `apps/web/app/providers.tsx`, `apps/web/app/hooks/useAdminQueries.ts`, `apps/web/app/driver/page.tsx` | defaults and keys: §6 |
| `next-auth` | app dep `^4.24.13` | 4.24.15 | Credentials + JWT (`apps/web/lib/auth.ts`), `withAuth` (`apps/web/proxy.ts:1`), `SessionProvider`, `signIn`, `signOut` | v4 line; peers allow Next 16 and React 19 (`package-lock.json:3838-3841`) |
| `mongoose` | app dep `^9.2.1` | 9.9.0 | models and `apps/web/lib/mongodb.ts` | needs Node `>=20.19.0` (`package-lock.json:3711`) |
| `bcryptjs` | app dep `^3.0.3` | 3.0.3 | driver password hash, cost 12 (`apps/web/app/api/admin/drivers/route.ts:74`); compare at login (`apps/web/lib/auth.ts:175`) | pure JS, no native build |
| `@repo/eslint-config`, `@repo/typescript-config` | app devDep `*` | workspace links (`0.0.0`) | shared lint and tsconfig presets | local packages, never published |
| `@types/node` | app devDep `^22.15.3` | 22.20.1 | Node typings | typings are Node 22 while the runtime floor is Node 20 |
| `@types/react`, `@types/react-dom` | app devDep `19.2.2` (exact) | 19.2.2 | React typings | exact pin, see §4.3 |
| `typescript` | root + app devDep `5.9.2` (exact); eslint-config devDep `^5.9.2` | 5.9.2 | type-check only (`noEmit`) | exact pin, see §4.3 |
| `eslint`, `@eslint/js` | `^9.39.1`: `eslint` as app + eslint-config devDep, `@eslint/js` as eslint-config devDep only | 9.39.5 | lint, flat config | rules and behaviour: §12 |
| `typescript-eslint`, `eslint-plugin-react`, `eslint-plugin-react-hooks` | eslint-config devDep `^8.50.0`, `^7.37.5`, `^5.2.0` | 8.65.0, 7.37.5, 5.2.0 | TypeScript, React and hooks lint rules | |
| `@next/eslint-plugin-next` | eslint-config devDep `^15.5.0` | 15.5.22 | Next lint rules | one major behind `next` 16, see §4.4 |
| `eslint-plugin-only-warn` | eslint-config devDep `^1.1.0` | 1.2.1 | turns every rule into a warning | with `--max-warnings 0` any finding fails lint (§12) |
| `eslint-plugin-turbo` | eslint-config devDep `^2.7.1` | 2.10.7 | `turbo/no-undeclared-env-vars` | a new env var must be listed in `turbo.json` `globalEnv`. `NEXT_PUBLIC_APP_VERSION` is read unlisted and lint still passes (why: plugin behaviour, unverified) |
| `eslint-config-prettier`, `globals` | eslint-config devDep `^10.1.1`, `^16.5.0` | 10.1.8, 16.5.0 | disables formatting rules; global sets | only `globals.serviceworker` is applied (`packages/eslint-config/next.js:32-34`) |
| `prettier` | root devDep `^3.7.4` | 3.9.6 | `npm run format` only | no config file; do not run casually (§12) |
| `turbo` | root devDep `^2.8.10` | 2.10.7 | task runner for `build`, `dev`, `lint`, `check-types` | |
| `postcss` | not a dependency; root override `^8.5.18` | 8.5.25 | transitive of `next` only; the repo has no PostCSS config | see §4.3 |
| `sharp` | not a dependency; root override `^0.35.0` | 0.35.3 (`optional`) | optional dependency of `next`; imported directly by `apps/web/scripts/generate-pwa-icons.mjs:14` | installing with optional deps omitted breaks `npm run icons` |

### 4.3 Exact pins and overrides

| Item | Where | History (git) | Recorded reason | Labelled inference |
|---|---|---|---|---|
| `next` `16.2.12` exact | `apps/web/package.json:18` | `16.1.5` in `de1f1c6` (2026-06-15) -> `16.2.12` in `1ca3e0d` (2026-07-31) | reason not recorded | Inference: framework upgrades are meant to be deliberate |
| `typescript` `5.9.2` exact | `package.json:14`, `apps/web/package.json:30` | unchanged since `de1f1c6` | reason not recorded | Inference: inherited from the Turborepo starter template |
| `@types/react`, `@types/react-dom` `19.2.2` exact | `apps/web/package.json:27-28` | unchanged since `de1f1c6` | reason not recorded | Inference: same starter default |
| `packageManager` `npm@10.8.1` | `package.json:19` | unchanged since `de1f1c6` | reason not recorded | Inference: Turborepo reads this field to pick the workspace package manager (tool behaviour, unverified) |
| Override `postcss` `^8.5.18` | `package.json:25` | added in `1ca3e0d`, whose subject only says "update package.json with overrides for postcss and sharp" | reason not recorded | Fact: `next@16.2.12` asks for `postcss` `8.4.31` exact (`package-lock.json:3777`). Inference: `npm audit` remediation |
| Override `sharp` `^0.35.0` | `package.json:26` | added in `1ca3e0d` | reason not recorded | Fact: `next` asks for optional `sharp` `^0.34.5` (`package-lock.json:3795`), so 0.35.x is outside Next's own range. Inference: audit remediation |
| `engines.node` `>=20.9` | `package.json:17` | `>=18` in `de1f1c6` -> `>=20.9` in `e810079` | the commit subject states the bump, not why | Fact: equals the floor `next` 16.2.12 declares (`package-lock.json:3784`), but is too low for Mongoose (§4.4) |

- All other ranges are caret ranges; only `package-lock.json` (`lockfileVersion` 3) fixes them, so install with `npm ci`. Dependency versions in the lockfile were refreshed exactly once, in `1ca3e0d`; the three later lockfile commits changed one line each.
- Re-check both overrides on every Next upgrade. Before removing or loosening one: check what `next` then resolves, re-run `npm audit` and `npm run icons`, and write the reason down here.

### 4.4 Upgrade constraints and known version traps

- Node floor: use 20.19+ (20.x), 22.13+ (22.x) or 24+. `mongoose` 9.9.0, `mongodb` 7.5.0, `bson`, `mquery` and `mongodb-connection-string-url` require `>=20.19.0`; dev-only `eslint-visitor-keys` 5.0.1 requires `^20.19.0 || ^22.13.0 || >=24` (`package-lock.json:1466`). `.npmrc` is empty (no `engine-strict`), so an older Node 20 only prints `EBADENGINE` warnings; the baseline passed on 20.11.0 with 6 of them. The hosting Node version is unverified.
- Next 16 conventions used here: the middleware file is `proxy.ts` (it has had that name since `de1f1c6`; there has never been a `middleware.ts`), route-handler `params` is a `Promise` that must be awaited (`apps/web/app/api/admin/vehicles/[id]/route.ts:14-21`), and the dev server refuses non-localhost hosts unless listed in `allowedDevOrigins` (`apps/web/next.config.js:14-18`).
- next-auth is v4. Its peer ranges cover Next 16 and React 19, so no `legacy-peer-deps` is needed. Auth.js v5 is a different API; moving to it means rewriting `apps/web/lib/auth.ts`, `apps/web/lib/authHelpers.ts` and `apps/web/proxy.ts` (library knowledge, unverified here).
- `@next/eslint-plugin-next` is 15.5.22 while `next` is 16.2.12 (`packages/eslint-config/package.json:13`, untouched since `de1f1c6`): the Next lint rule set is the 15.x one.
- `npm audit --omit=dev` (2026-10-11) exits 1 with 1 critical + 3 high: `next` (critical; fix reported as `next@16.4.0`, which is outside the exact pin, so `apps/web/package.json:18` must be edited by hand), `sharp` (high, <=0.35.5-rc.1), `nanoid` (high, <3.3.18) and `source-map-js` (high). The last two enter only through `postcss` (`package-lock.json:4176-4178`). Applicability was not assessed in depth; treat as "needs review, upgrade recommended" (see §16).
- `next/font/google` downloads Inter at build time (`apps/web/app/layout.tsx:2`, `:7-11`), so `next build` needs network access to Google Fonts (framework behaviour; an offline build was not tested).
- `npm ls` reports `@emnapi/runtime@1.11.3` and `@img/sharp-wasm32@0.35.3` as "extraneous" after a clean `npm ci`; harmless so far, cause not investigated.
- `@types/node` is 22.x while Node 20 is allowed: code can type-check against a Node API that Node 20 lacks (inference; no instance found).

### 4.5 Deliberately not used

| Not used (no `package.json` lists it; no `node_modules/` entry in the lockfile) | What the code does instead | Evidence |
|---|---|---|
| Tailwind, Sass, CSS modules, UI kit, icon library | Hand-written classes in `globals.css` plus inline styles and inline SVG. Utility names such as `.gap-1` look like Tailwind but are local (see §9) | `apps/web/app/globals.css`, `apps/web/README.md:3` |
| Chart library | Hand-written SVG charts | `apps/web/app/admin/amounts/page.tsx:87`, `:149`; `apps/web/app/admin/vehicles/[id]/page.tsx:33`, `:121` |
| Form library (`react-hook-form`) | One `useState` object per form plus native HTML validation. Was a dependency from `de1f1c6`, removed in `1ca3e0d`, never imported | `git show 1ca3e0d -- apps/web/package.json` |
| Schema validator (`zod`) | Hand-written coercion and messages. Same history as `react-hook-form` | `apps/web/lib/api.ts:43-61`, `apps/web/lib/supplyProduct.ts:59-105` |
| State library, axios/SWR | React state, the React Query cache and raw `fetch` | `apps/web/app/providers.tsx:10-27` |
| Cloudinary SDK, Google API client | Signed REST calls with `fetch`; Google Identity Services script loaded at runtime | `apps/web/lib/cloudinary.ts:81-149`, `apps/web/lib/googleDrive.ts:9-12` |
| Date library | `Intl.DateTimeFormat` pinned to `Asia/Kolkata` and a fixed IST offset | `apps/web/lib/format.ts:9-19`, `apps/web/lib/istTime.ts:6` |
| PWA toolkit (Workbox, next-pwa) | Hand-written service worker | `apps/web/public/sw.js:1-20` |
| `next/image` optimizer | Plain `<img>`; the optimizer endpoint is switched off as "pure attack surface" | `apps/web/next.config.js:19-24` |
| Any ORM or database other than Mongoose/MongoDB; any test framework | - | `apps/web/package.json:14-31` |

## 5. Repository layout

All 97 tracked files of `main` @ `c251bc4`. Numbers in brackets are line counts (`wc -l`) of the largest files. Every path in this section is repo-relative.

```text
royalkingadmin/                                # repo root: npm workspaces + Turborepo
  package.json                                 # root scripts (build, dev, lint, format, check-types), engines, npm pin, workspaces, overrides
  package-lock.json (5381)                     # lockfile v3 - install with npm ci
  turbo.json                                   # task graph and globalEnv (7 config variable names + NODE_ENV; NEXT_PUBLIC_APP_VERSION is not listed)
  README.md  .gitignore  .npmrc                # quick start + live-database warning; root ignores; .npmrc is an empty file
  Royal-King-Water-Supply-System-Report.pdf    # STALE system report (binary) - see the note under this tree
  packages/
    eslint-config/                             # @repo/eslint-config: package.json, base.js, next.js (used by the app), react-internal.js (unused), README.md
    typescript-config/                         # @repo/typescript-config: package.json, base.json, nextjs.json (used by the app), react-library.json (unused)
  apps/web/                                    # the only app (package "web")
    package.json                               # app version (shown in the UI), scripts incl. start and icons, dependencies
    next.config.js                             # injects the app version, security headers, /sw.js headers, image optimizer off, dev origins
    proxy.ts                                   # Next 16 middleware: role redirects for /, /login, /admin/*, /driver/*
    vercel.json  tsconfig.json  eslint.config.js   # function region bom1; extends the shared tsconfig; re-exports the shared lint config
    README.md  .gitignore  .env.example        # app guide (data rules, PWA, Drive setup); app ignores; env var names with placeholders (tracked)
    app/
      layout.tsx  providers.tsx                # root layout (font, metadata, viewport, PwaRegister); React Query client
      globals.css (552)                        # design tokens and every shared CSS class
      page.tsx  login/page.tsx  error.tsx  not-found.tsx   # public home with two portal cards; sign-in form; root error boundary; 404
      manifest.ts  favicon.ico  apple-icon.png # PWA manifest route; two generated icon files
      admin/
        layout.tsx (351)  page.tsx  error.tsx  # admin shell and nav; redirect to /admin/amounts; error boundary
        amounts/page.tsx (946)                 # Analytics (the route name is historical)
        supplies/page.tsx (1695)               # Deliveries ledger: both tabs, filters, add/edit/delete dialogs, Download menu
        supplies/exports.ts (458)              # lazy-loaded PDF, PNG and CSV builders (not a route)
        customers/page.tsx (584)  customers/[id]/page.tsx (310)   # customer list and dialogs; one customer's history
        drivers/page.tsx (555)                 # driver accounts
        vehicles/page.tsx (184)  vehicles/[id]/page.tsx (590)     # vehicle list; vehicle detail with odometer charts
      driver/layout.tsx (490)  driver/page.tsx (1613)  driver/error.tsx   # shell + daily odometer gate; the whole driver portal (3 tabs); error boundary
      components/                              # InstallPrompt.tsx, PwaRegister.tsx, StockModal.tsx, PaymentPill.tsx, ProductPill.tsx
      hooks/                                   # useAdminQueries.ts (391; admin client types + React Query hooks), useEscapeKey.ts
      api/
        auth/[...nextauth]/route.ts            # NextAuth handler (GET, POST)
        admin/analytics/route.ts  admin/analytics/new-customers/route.ts    # daily chart buckets; new-customer list
        admin/customers/route.ts  admin/customers/[id]/route.ts             # list + create; read, update, soft-delete
        admin/drivers/route.ts  admin/drivers/[id]/route.ts                 # list + create; update, delete
        admin/supplies/route.ts (330)  admin/supplies/[id]/route.ts (255)   # ledger list, stats, create; edit, delete
        admin/vehicles/route.ts  admin/vehicles/[id]/route.ts               # list + create; read, update, delete
        driver/customers/route.ts  driver/supplies/route.ts (262)           # active customers + register; own entries + log delivery or cash entry
        driver/vehicles/route.ts  driver/vehicles/odometer/route.ts         # active vehicles; daily odometer status and submit
        stock/route.ts                         # shared stock counters (admin or driver)
    lib/
      auth.ts (233)  authHelpers.ts            # NextAuth options, login throttle, driver re-check; requireAdmin / requireDriver
      api.ts  mongodb.ts                       # server-only response and input helpers; cached connection, index creation, obsolete-index drop
      supplyProduct.ts (175)                   # can/case rules, validation messages, autoAmount pricing
      customers.ts                             # create-or-restore a customer by phone
      istTime.ts  analyticsRange.ts            # IST day boundaries for queries; analytics date window
      format.ts                                # IST date, number and money formatting for the UI
      cloudinary.ts  imageUrl.ts               # signed upload/delete over fetch; thumbnail URL helpers
      csv.ts  googleDrive.ts                   # CSV builder with formula guard; browser-side save to Google Drive
    models/                                    # Customer.ts, Stock.ts, SupplyLog.ts (the ledger), User.ts (drivers), Vehicle.ts, index.ts (registers all five)
    public/sw.js (124)  public/offline.html    # hand-written service worker; self-contained offline page
    public/icons/                              # 3 generated PNGs: icon-192, icon-512, maskable-512
    scripts/generate-pwa-icons.mjs             # npm run icons: draws all five icon files with sharp
```

`Royal-King-Water-Supply-System-Report.pdf` (5 pages, "Prepared 14 July 2026") is stale: it still describes the removed dashboard, supply points, assignments and "7 collections". The code and this handbook win; do not use it as a reference (see §16).

**Not in git (must exist or is generated locally)**

| Path | What it is | How it gets there |
|---|---|---|
| `apps/web/.env` | The real secrets and settings (variable names: §6) | Copied once from `apps/web/.env.example` on a fresh checkout and filled in; never overwrite an existing one (`README.md:16-17`). Ignored by `apps/web/.gitignore:29-30` |
| `node_modules/` | Installed dependencies at the repo root, with links for the three workspaces | `npm ci` |
| `apps/web/.next/` | Build output, dev cache and generated route types | `next build`, `next dev`, `next typegen` |
| `.turbo/` | Turborepo local cache and logs | any `turbo run` task; ignored by `.gitignore:19` |
| `apps/web/next-env.d.ts` | Next.js ambient types, named in the tsconfig `include` (`apps/web/tsconfig.json:13`) | Generated by Next (dev, build or typegen); ignored by `apps/web/.gitignore:37` |
| `.vercel/` | Vercel CLI project link | Only when the Vercel CLI is used (unverified); ignored by `.gitignore:22` |

**Where do I change X?**

| Task | File(s) |
|---|---|
| Add an API route | New `apps/web/app/api/<area>/<name>/route.ts`. Every handler must start with a guard from `apps/web/lib/authHelpers.ts:17-26` plus `unauthorized()`, because `/api/*` is outside the proxy matcher (`apps/web/proxy.ts:36`). Model it on `apps/web/app/api/admin/vehicles/route.ts`; contract in §7 |
| Add a model | `apps/web/models/<Name>.ts`, then import it in `apps/web/models/index.ts:6-10` - otherwise its indexes are created only in processes where a route importing it has already loaded (`apps/web/lib/mongodb.ts:53-66`), and `populate()` can throw `MissingSchemaError` on a cold instance (§10) |
| Add an env var | `turbo.json:4-13` (`globalEnv`; lint is meant to fail without it - the rule is `turbo/no-undeclared-env-vars`, `packages/eslint-config/base.js:21` - though `NEXT_PUBLIC_APP_VERSION` is read unlisted and lint passes), `apps/web/.env.example` (name and placeholder only), the local `apps/web/.env`, the hosting environment settings; then the table in §6 |
| Change a delivery validation rule | `validateDeliveryQuantities` at `apps/web/lib/supplyProduct.ts:59-105` - the one copy shared by the driver form, the admin forms and all three write routes |
| Change pricing | `autoAmount` at `apps/web/lib/supplyProduct.ts:119-130`; callers `apps/web/app/api/driver/supplies/route.ts:190`, `apps/web/app/api/admin/supplies/route.ts:318`, `apps/web/app/api/admin/supplies/[id]/route.ts:139`; rules in §10 |
| Change nav items | Admin top/bottom nav: `navItems` at `apps/web/app/admin/layout.tsx:9-43`; admin profile menu: `apps/web/app/admin/layout.tsx:219-308`; driver tabs: `apps/web/app/driver/page.tsx:839` |
| Change theme colours | Tokens at `apps/web/app/globals.css:1-43`. The brand blue is repeated in `apps/web/app/layout.tsx:29`, `apps/web/app/manifest.ts:18`, `apps/web/public/offline.html:6`, `:14`, `:76` and `apps/web/scripts/generate-pwa-icons.mjs:16`; after changing it, regenerate the icons and bump the SW `VERSION` (§9, §11) |
| Bump the app version | `version` at `apps/web/package.json:3` plus the `apps/web` entry at `package-lock.json:22`; it reaches the UI through `apps/web/next.config.js:5-11`. Checklist in §13 |
| Change service-worker caching | Fetch strategy at `apps/web/public/sw.js:64-86`, and bump `VERSION` at `apps/web/public/sw.js:22` or installed apps keep the old worker (§11) |
| Change security headers | `apps/web/next.config.js:25-50` |
| Add an export column | `apps/web/app/admin/supplies/exports.ts`: row shape `:20-56`, PDF table `:109-208`, PNG `columns` `:217-238`, CSV `deliverySheetRows` `:397` and `cashSheetRows` `:437`. Change all of them or the formats drift apart |
| Change the recent-days window | `RECENT_DAYS = 5` is declared three times and must change together: `apps/web/app/admin/supplies/page.tsx:49`, `apps/web/app/api/driver/supplies/route.ts:25`, `apps/web/app/driver/page.tsx:169` |
| Change the login throttle | `LOGIN_WINDOW_MS` and `MAX_FAILURES` at `apps/web/lib/auth.ts:34-35`. `MAX_CREDENTIAL_LENGTH` (`apps/web/lib/auth.ts:36`) must stay equal to `MAX_PASSWORD_LENGTH` (`apps/web/app/api/admin/drivers/route.ts:11`), or a driver could get a password that can never sign in |
| Change the image size limit | Server `MAX_IMAGE_BYTES` at `apps/web/app/api/driver/supplies/route.ts:22-24` (comment: Vercel refuses request bodies over 4.5 MB), the "4 MB" wording in its messages (`apps/web/app/api/driver/supplies/route.ts:140`, `apps/web/app/api/driver/supplies/route.ts:173`), and the separate client check and message at `apps/web/app/driver/page.tsx:644-646` |
| Regenerate icons | Edit the artwork in `apps/web/scripts/generate-pwa-icons.mjs`, run `npm run icons` inside `apps/web`, commit the five output files, bump `VERSION` at `apps/web/public/sw.js:22` |

## 6. Architecture
Paths are repo-relative. In a table or list whose caption names one file, `:N` is a line of that file. "(unverified)" marks library, framework or platform behaviour that was not read from code.

### 6.1 Big picture
```text
Browser tab / installed PWA (client components)
   | navigation (GET)                             | fetch("/api/...", { cache: "no-store" }): React Query or plain fetch
   v                                              | (the service worker never touches /api/* or non-GET requests)
[service worker public/sw.js - production only]   |
   v                                              |
next.config.js headers() -> security headers      |
   v                                              v
proxy.ts (/, /login, /admin/*, /driver/*)      app/api/**/route.ts   (NOT behind proxy.ts)
  decode JWT cookie -> role redirect, no DB      requireAdmin() | requireDriver() | requireAnyRole() -> 401 { error }
   v                                             lib/api.ts coercion -> 400;  connectToDatabase() -> Mongoose
app/layout.tsx (server) -> Providers                    |                             |
  -> admin | driver layout (SessionProvider)            v                             v
  -> page ("use client")                         MongoDB (MONGODB_URI)     Cloudinary REST (lib/cloudinary.ts)
Browser-only: Google Identity script -> Google Drive REST (lib/googleDrive.ts); Cloudinary image URLs; next-auth client -> /api/auth/*
```
- Every portal layout and every page except `/admin` is a client component (`"use client"`). The only server components are `apps/web/app/layout.tsx`, `apps/web/app/not-found.tsx` and `apps/web/app/admin/page.tsx` (a redirect).
- No server-side data fetching: no page or layout queries the database or calls `getServerSession`, so page HTML carries no user data (build output: every page is static except the two `[id]` pages).
- All data protection lives in the API handlers. `proxy.ts` does not match `/api/*`; its redirects are navigation convenience, not security.
- No server actions (`"use server"` appears nowhere), no Pages router, no route groups.
- No sockets, SSE, webhooks, cron or polling (`refetchInterval` is never set). Data refreshes when a stale query remounts (library default, unverified), on manual invalidation, or on reload. The only deferred work is `after()` at `apps/web/app/api/admin/supplies/[id]/route.ts:248`, plus the un-awaited index sync of §6.8.
- Outbound calls: server -> MongoDB and Cloudinary only; browser -> Google Identity/Drive and Cloudinary image URLs (see §7, §14).
- No route exports `runtime`, `revalidate` or `maxDuration`; the only segment config is `dynamic = "force-dynamic"` at `apps/web/app/api/driver/vehicles/odometer/route.ts:9`.

### 6.2 Startup sequence
| # | Stage | What happens | Where |
|---|---|---|---|
| 0 | Service worker (production, once installed) | Same-origin GET navigations go network-only with `/offline.html` fallback. Page HTML is never cached, so step 2 always runs (see §11) | `apps/web/public/sw.js:64-75`, `:89-99` |
| 1 | Response headers | Security headers attached to every path (see §6.7). Order relative to step 2 is framework behaviour (unverified) | `apps/web/next.config.js:25-50` |
| 2 | Proxy | For `/`, `/login`, `/admin/*`, `/driver/*`: decode the JWT cookie and redirect by role (see §6.3) | `apps/web/proxy.ts:4-37` |
| 3 | Root layout (server) | Imports `globals.css`, loads Inter via `next/font/google` (`--font-inter`), exports `metadata` and `viewport`, renders `html > body > Providers > {children} + PwaRegister` | `apps/web/app/layout.tsx:3-11`, `:13-33`, `:41-47` |
| 4 | `Providers` (client) | Creates one `QueryClient` in `useState`; mounts `QueryClientProvider` only | `apps/web/app/providers.tsx:10-27` |
| 5 | Portal layout (client; not on `/` or `/login`) | `SessionProvider refetchOnWindowFocus={false}` -> `AdminShell` / `DriverShell`. The driver shell also fires `GET /api/driver/vehicles/odometer` on mount (10 s timeout) without waiting for the client session, and blurs `main` until it settles (see §8) | `apps/web/app/admin/layout.tsx:84-90`; `apps/web/app/driver/layout.tsx:484-490`, `:53-76`, `:313-318` |
| 6 | Page (client) | React Query hooks or plain `fetch` call `/api/*` | e.g. `apps/web/app/hooks/useAdminQueries.ts:126-140` |
| 7 | API handler | Guard -> `getServerSession(authOptions)` (runs the `jwt` and `session` callbacks) -> `connectToDatabase()` (lazy: nothing connects to MongoDB before the first API call and there is no `instrumentation.ts`; index sync in §6.8) -> query | `apps/web/lib/authHelpers.ts:11-26` |
| 8 | `PwaRegister` | After window `load`: registers `/sw.js` in production; in development unregisters every worker | `apps/web/app/components/PwaRegister.tsx:20-27`, `:66-94` |

### 6.3 Routing
| Path | File (under `apps/web/app/`) | Access | Purpose |
|---|---|---|---|
| `/` | `page.tsx` | public; signed-in users are redirected | Portal chooser: links to `/login?role=admin` and `/login?role=driver`, install prompt |
| `/login` | `login/page.tsx` | public; signed-in users are redirected | Credentials form. `?role=` only changes the heading and links (`:13`, `:71`); either role can sign in from either variant |
| `/admin` | `admin/page.tsx` | admin | Server `redirect("/admin/amounts")` (`:6`): "There is no dashboard" |
| `/admin/amounts` | `admin/amounts/page.tsx` | admin | Analytics; the admin landing page |
| `/admin/supplies` | `admin/supplies/page.tsx` | admin | Deliveries ledger and cash credits, add/edit/delete, exports |
| `/admin/customers` | `admin/customers/page.tsx` | admin | Customer list, add/edit/delete |
| `/admin/customers/[id]` | `admin/customers/[id]/page.tsx` | admin | One customer and its delivery history |
| `/admin/drivers` | `admin/drivers/page.tsx` | admin | Driver accounts |
| `/admin/vehicles` | `admin/vehicles/page.tsx` | admin | Vehicle list and create |
| `/admin/vehicles/[id]` | `admin/vehicles/[id]/page.tsx` | admin | Vehicle detail, edit, odometer history |
| `/driver` | `driver/page.tsx` | driver | The whole driver app in one page (tabs `delivery`, `cash`, `register`) |

- Layouts and special files under `apps/web/app/`: `layout.tsx` (root, server); `admin/layout.tsx` and `driver/layout.tsx` (client shells, each owning its `SessionProvider`); `error.tsx`, `admin/error.tsx`, `driver/error.tsx`, `not-found.tsx` (see §6.12); `manifest.ts`, `favicon.ico`, `apple-icon.png` (file conventions, see §11).
- API: 16 route files = 15 guarded (29 handlers) + the NextAuth catch-all (see §7). `admin/supplies/exports.ts` is a helper module, not a route. Absent: `loading.tsx`, `global-error.tsx`, `template.tsx`, `middleware.ts`, `instrumentation.ts`, `robots.ts`, `sitemap.ts`.
- `apps/web/proxy.ts` is the Next.js 16 file convention for middleware (the build lists it as "Proxy (Middleware)"). Never add a `middleware.ts` beside it.
- Shape: `withAuth(function proxy(req) {...}, { callbacks: { authorized: () => true } })` (`apps/web/proxy.ts:4-33`). `authorized: () => true` is load-bearing: it stops next-auth's own redirect so the inner function also runs for anonymous visitors and makes every decision (library behaviour, unverified).
- The token is `req.nextauth.token` (`apps/web/proxy.ts:7`): the decoded cookie only. The proxy makes no database call, and `withAuth` does not run the `jwt` callback (library behaviour, unverified), so the driver-active re-check of §6.6 does not happen in the proxy.

| # | Condition (`apps/web/proxy.ts`) | Result | Line |
|---|---|---|---|
| 1 | Path is `/` or `/login`, token has `role === "admin"` | Redirect `/admin/amounts` | `:9-12` |
| 2 | Path is `/` or `/login`, token has `role === "driver"` | Redirect `/driver` | `:13-15` |
| 3 | Path is `/` or `/login`, no token or a token without a role | Falls through; the page renders | `:9-16` |
| 4 | Path starts with `/admin` and `token?.role !== "admin"` | Redirect `/login` with no `callbackUrl` and no `role` param, so a deep link is lost | `:18-20` |
| 5 | Path starts with `/driver` and `token?.role !== "driver"` | Redirect `/login` | `:22-24` |
| 6 | Otherwise | `NextResponse.next()` | `:26` |

- Matcher: `["/", "/login", "/admin/:path*", "/driver/:path*"]` (`apps/web/proxy.ts:35-37`).
- A signed-in user on the wrong portal takes two hops: rule 4 or 5 to `/login`, then rule 1 or 2 to their own portal. The manifest shortcuts rely on this.
- Outside the matcher: `/api/*` (each handler guards itself and answers 401 JSON, never a redirect), `/sw.js`, `/manifest.webmanifest`, `/offline.html`, `/icons/*`, `/_next/*`, `/favicon.ico`, `/apple-icon.png`. WHY the PWA files must stay outside: "They have to load without a session." (`apps/web/README.md:58`).
- Landing pages are hard-coded and must change together: admin `/admin/amounts` in `apps/web/proxy.ts:11`, `apps/web/app/login/page.tsx:47`, `apps/web/app/admin/page.tsx:6` (first nav item `apps/web/app/admin/layout.tsx:11`); driver `/driver` in `apps/web/proxy.ts:14`, `apps/web/app/login/page.tsx:49`.

### 6.4 State management
- `QueryClient` defaults (`apps/web/app/providers.tsx:14-22`): `staleTime: 1000 * 30` (30 s), `gcTime: 1000 * 60 * 5` (5 min), `retry: 1`, `refetchOnWindowFocus: false`. Nothing else is set (library defaults); no persister. WHY: "Mobile-friendly defaults: cache & dedupe network work."
- `SessionProvider` is mounted only by the two portal layouts. WHY: "so the home and login pages render without a session request" (`apps/web/app/providers.tsx:7-9`). `useSession()` therefore has no provider on `/`, `/login` or in root-level components such as `PwaRegister`.
- `useSession()` is used only for the display name (`apps/web/app/admin/layout.tsx:94`, `apps/web/app/driver/layout.tsx:28`). Both providers set `refetchOnWindowFocus={false}`: "Focus refetches are off: the API answers 401 if a session expires." (`apps/web/app/driver/layout.tsx:481-483`).

| Admin hook (`apps/web/app/hooks/useAdminQueries.ts`) | Query key | Endpoint | enabled | staleTime / gcTime / placeholderData | Invalidated by |
|---|---|---|---|---|---|
| `useAdminDrivers()` (`:126`) | `["admin","drivers"]` | `GET /api/admin/drivers` | always | 10 min / 60 min / none | Driver create, toggle, edit, delete (`apps/web/app/admin/drivers/page.tsx:77`, `:99`, `:137`, `:163`); vehicle edit, toggle, delete (`apps/web/app/admin/vehicles/[id]/page.tsx:241`) |
| `useAdminVehicles()` (`:142`) | `["admin","vehicles"]` | `GET /api/admin/vehicles` | always | 10 min / 60 min / none | Vehicle create (`apps/web/app/admin/vehicles/page.tsx:50`); vehicle edit, toggle, delete (`apps/web/app/admin/vehicles/[id]/page.tsx:240`) |
| `useAdminCustomers()` (`:159`) | `["admin","customers"]` | `GET /api/admin/customers` (no params: full list for dropdowns) | always | 10 min / 60 min / none | Customer create, edit, delete: prefix `["admin","customers"]` (`apps/web/app/admin/customers/page.tsx:107-109`) |
| `useAdminPaginatedCustomers(params)` (`:176`) | `["admin","customers","paginated",params]` | `GET /api/admin/customers?page&limit[&search][&area]` | always | 2 min / 15 min / `keepPreviousData` | Same prefix |
| `useAdminCustomerDetail(id)` (`:302`) | `["admin","customers","detail",id]` | `GET /api/admin/customers/{id}` | `Boolean(id)` | 5 min / 30 min / none | Same prefix |
| `useAdminSupplyList(logType, filters, page, opts)` (`:249`); wrappers `useAdminAddedSupplies` (`:277`, water) and `useAdminCashCredits` (`:285`, cash) | `["admin","supplies","added" \| "cash-credits",filters,page]` | `GET /api/admin/supplies?logType&<filters>&page&limit=50` | `opts.enabled ?? true`; the page enables only the visible tab (`apps/web/app/admin/supplies/page.tsx:363`, `:368`) | 30 s / default / `keepPreviousData` | Ledger add, edit, delete: prefix `["admin","supplies"]` (`apps/web/app/admin/supplies/page.tsx:629`, `:723`, `:748`) |
| `useAdminCustomerHistory(id, filters, page)` (`:321`) | `["admin","supplies","customer-history",id,filters,page]` | `GET /api/admin/supplies?customer&page&limit=50[&month][&paymentStatus]` | `Boolean(id)` | 30 s / default / `keepPreviousData` | Same `["admin","supplies"]` prefix |
| `useAdminNewCustomers(rangeQuery, opts)` (`:380`) | `["admin","analytics","new-customers",rangeQuery]` | `GET /api/admin/analytics/new-customers?<rangeQuery>` | `opts.enabled ?? true` | 2 min / default / none | Never |
| Inline `useQuery` (`apps/web/app/admin/amounts/page.tsx:739-748`) | `["admin","analytics",analyticsQuery]` | `GET /api/admin/analytics?<query>` | always | 2 min / default / `keepPreviousData` | Never |
| `fetchAllSupplies(logType, filters)` (`:233`) | None: plain async function for the sheet and Drive exports | `GET /api/admin/supplies?logType&<filters>` with no `page` / `limit` | n/a | n/a | n/a |

- There is no `useMutation` anywhere. Writes are plain `fetch` calls in pages followed by `queryClient.invalidateQueries` (prefix match in the admin portal).
- The key segments `"added"` and `"cash-credits"` are historic names kept on purpose: "The key segment each list has always used, so the Deliveries page's invalidations keep matching." (`apps/web/app/hooks/useAdminQueries.ts:243-245`).
- Not covered by any invalidation: the analytics keys after a ledger change, and `["admin","supplies"]` after a customer, driver or vehicle edit (see §16).
- Not in React Query at all (response held in `useState`): vehicle detail (`apps/web/app/admin/vehicles/[id]/page.tsx:217-233`), `StockModal`, the driver odometer calls.

| Driver query key (`apps/web/app/driver/page.tsx`) | Endpoint | enabled | staleTime | Invalidated by | Lines |
|---|---|---|---|---|---|
| `["driver","vehicles"]` | `GET /api/driver/vehicles` | always | 10 min | Never | `:447-457` |
| `["driver","customers"]` | `GET /api/driver/customers` | always | 5 min | Register customer (`:778`) | `:460-467` |
| `["driver","supplies"]` | `GET /api/driver/supplies` | always | default 30 s | Log delivery (`:742`), log cash (`:825`) | `:470-476` |
| `["driver","supplies","byDate",<YYYY-MM-DD>]` | `GET /api/driver/supplies?date=` | only while a date filter is set | 5 min | Never: driver invalidations pass `exact: true` (see §16) | `:480-499` |

- Sign-out code is only `signOut({ callbackUrl })`; nothing calls `queryClient.clear()`. Query keys are not user-scoped and the `QueryClient` lives as long as the tab, so one user's data is hidden from the next only because next-auth `signOut` ends in a full-page navigation (library behaviour, unverified).
- Rule: never switch sign-out to `redirect: false` or `router.push` without clearing the query cache first.
- Local state is page-level `useState` per form, dialog flag, filter, tab and page number. None of it is in the URL (a reload resets it); URL state is limited to `/login?role=` and the `[id]` route params.
- There is no Redux, Zustand, `createContext` or `useReducer` anywhere in `apps/web`.

### 6.5 API layer
Skeleton every route follows (modelled on `apps/web/app/api/admin/vehicles/route.ts:27-60`):
```ts
export async function POST(req: NextRequest) {
  const admin = await requireAdmin();           // or requireDriver(); returns null, never throws
  if (!admin) return unauthorized();            // 401; without this line the route is public
  const body = await readJsonObject(req);       // writes only
  if (!body) return badRequest("Invalid request body.");
  const name = requiredString(body.name, 200);  // coerce + cap each field; whitelist, never spread the body
  if (!name) return badRequest("...");          // validate before touching the database
  try {
    await connectToDatabase();                  // mandatory: bufferCommands is off (§6.8)
    return NextResponse.json(await Model.create({ name }), { status: 201 });
  } catch (err) { return serverError(err); }    // logs the real error, answers a generic 500
}
```
- `[id]` routes take `{ params }: { params: Promise<{ id: string }> }`, `await params`, then answer 400 unless `Types.ObjectId.isValid(id)`.

| `apps/web/lib/api.ts` export | Behaviour | Line |
|---|---|---|
| `jsonError(message, status)` | `NextResponse.json({ error: message }, { status })` | `:6-8` |
| `unauthorized()`, `badRequest(message)`, `notFound(message = "Not found")` | 401 `Unauthorized`, 400, 404 | `:10-20` |
| `serverError(error, message = "Something went wrong. Please try again.")` | `console.error(message, error)`, then 500 with the generic message, "so internals never reach the client" | `:22-26` |
| `readJsonObject(req)`, `isPlainObject(value)` | Parsed body if it is a plain object (non-null, not an array), else `null`. `Content-Type` is not checked | `:28-40` |
| `optionalString(value, maxLength = 500)` | Non-string -> `undefined` "so it can't reach a query"; trims; cuts to `maxLength`; may return `""` | `:43-47` |
| `requiredString(value, maxLength = 500)` | Same, but `""` -> `undefined` | `:50-53` |
| `optionalNumber(value)` | `undefined`, `null`, `""` -> `undefined`; number or numeric string -> finite number. Negatives pass; callers range-check | `:56-61` |

- `apps/web/lib/api.ts` is server-only (imports `next/server`). It is NOT a client fetch wrapper; none exists.
- Error envelope everywhere: `{ "error": string }`; success bodies are the bare resource, array or result object (no `data` wrapper). Two handlers build the envelope by hand: `apps/web/app/api/driver/customers/route.ts:63` (409), `apps/web/app/api/driver/supplies/route.ts:258` (502).
- Status codes in use: 200, 201, 400, 401, 404, 409, 500, 502. There is no 403 (a wrong role is also 401), 422 or 429; 413 can only come from the hosting platform's body limit.
- String caps truncate silently: over-long input is cut at `maxLength` (`apps/web/lib/api.ts:46`) and saved with a 2xx, never rejected. Per-field caps are in §7.

| Client caller | On 401 | Error parsing |
|---|---|---|
| Driver queries: `driverGet<T>(url)` (`apps/web/app/driver/page.tsx:174-182`) | `signOut({ callbackUrl: "/login" })`, throws `Error("Signed out")` | Other non-ok -> `Error("Request failed")` |
| Driver form submits (`apps/web/app/driver/page.tsx:731`, `:769`, `:811`) and odometer calls (`apps/web/app/driver/layout.tsx:19-25`, `:59`, `:105`, `:135`) | `signOut({ callbackUrl: "/login" })` | `data.error ?? fallback`; the cash submit also handles 413 (`apps/web/app/driver/page.tsx:812`) |
| Admin hooks (`apps/web/app/hooks/useAdminQueries.ts`) | Nothing | `throw new Error("Failed to fetch ...")` (`"Failed to load new customers"` at `:387`); only `useAdminCustomerDetail` attaches `error.status` (`:310-314`) |
| Admin page writes (e.g. `apps/web/app/admin/drivers/page.tsx:49-55`) | Nothing | Page-local `safeParseJson` / `safeJson`, then `data.error ?? fallback` |
| `StockModal`, used by both portals (`apps/web/app/components/StockModal.tsx:40-45`, `:68-77`) | Nothing (shows `Unauthorized`) | `res.json().catch(() => ({}))` |

- Rule: never answer 401 from a driver API for a business-rule failure; the driver client treats ANY 401 as "session ended" and signs out. WHY: "A signed-out or deactivated driver gets 401 from every API; send them to the login page instead of leaving a dead screen." (`apps/web/app/driver/layout.tsx:17-18`).
- The admin portal has no 401 handling: an expired admin session shows failing lists until a reload, when the proxy redirects (see §16).

### 6.6 Authentication and session lifecycle
- Provider: one `CredentialsProvider` with fields `username`, `password` (`apps/web/lib/auth.ts:120-126`); no OAuth, adapter or events. Handler: `NextAuth(authOptions)` exported as GET and POST (`apps/web/app/api/auth/[...nextauth]/route.ts:4-6`). `pages.signIn` is `/login` (`apps/web/lib/auth.ts:226-228`); `secret` is `process.env.NEXTAUTH_SECRET` with no fallback (`apps/web/lib/auth.ts:232`).
- Session: `strategy: "jwt"` (`apps/web/lib/auth.ts:229-231`). `maxAge` / `updateAge` are NOT set, so the library default lifetime applies (unverified; next-auth v4 documents 30 days). No `cookies` / `useSecureCookies` override: cookie names and flags are library defaults (unverified).

`authorize()` in order (`apps/web/lib/auth.ts:127-191`):
1. Input guard: `username` and `password` must be non-empty strings of at most 200 characters, else `null`. WHY: "next-auth passes the JSON body through verbatim, so insist on plain strings before anything reaches a query" (`:128-141`). No trim, no case folding.
2. Throttle key = `username|ip`; `ip` is the first `x-forwarded-for` entry, or the literal `"local"` when the header is missing (`:39-45`). A throttled key returns `null` before any password check, so even the correct password is refused (`:143-144`).
3. Admin credentials come from `getAdminCredentials()` (`:9-22`): `ADMIN_USERNAME` trimmed, else a hard-coded default username literal (`:10`); `ADMIN_PASSWORD` trimmed; if unset outside production, a hard-coded development fallback password literal (`:18`); if unset in production, `null` (admin sign-in impossible).
4. Admin match uses `safeEqual` on both fields (`:148-152`). On match: clear the throttle entry and return `{ id: "admin", name: "Administrator", username: <fixed literal>, role: "admin" }` (`:153-159`). No database is touched, so the admin can sign in while MongoDB is down.
5. Otherwise the driver path: `await connectToDatabase()` (`:163`, not in try/catch), then `User.findOne({ username, role: "driver", isActive: true })` (`:164-168`).
6. No user, or `bcrypt.compare` false: `recordLoginFailure`, return `null` (`:170-182`). Success: clear the throttle entry, return `{ id: user._id.toString(), name, username, role: "driver" }` (`:184-190`).
- A wrong admin password falls through to step 5: one MongoDB query and one counted failure. The login page shows one message for every failure, throttled and server errors included (`apps/web/app/login/page.tsx:35-39`).
- The admin exists only in env: a `users` document with `role: "admin"` can never sign in.
- `safeEqual(a, b)` (`apps/web/lib/auth.ts:26-30`): SHA-256 of each side, then `crypto.timingSafeEqual`. WHY: "Hashing both sides first gives equal-length buffers, so neither the length nor the first differing byte leaks timing."

| Constant (`apps/web/lib/auth.ts`) | Value | Line | Note |
|---|---|---|---|
| `LOGIN_WINDOW_MS` | `15 * 60 * 1000` | `:34` | Fixed window measured from the FIRST failure, not sliding (`:47-55`) |
| `MAX_FAILURES` | `10` | `:35` | Per `username\|ip` key |
| `MAX_CREDENTIAL_LENGTH` | `200` | `:36` | Must equal `MAX_PASSWORD_LENGTH` in `apps/web/app/api/admin/drivers/route.ts:11`, or a driver could get a password that can never sign in |
| `loginFailures`, `driverActiveCache` | Module-level `Map`s | `:37`, `:75` | "In-memory, per-instance" (`:32-33`): lost on cold start, not shared between instances. `loginFailures` is pruned of expired entries only above 1000 keys (`:59-63`) |
| `DRIVER_ACTIVE_TTL_MS` | `60 * 1000` | `:74` | "Re-checked at most once a minute per driver" |
| bcrypt cost | `12`; password length 6-200 | `apps/web/app/api/admin/drivers/route.ts:47-52`, `:74` | Hashing happens only at driver creation |

- Callbacks (line refs in this list: `apps/web/lib/auth.ts`). `jwt({ token, user })` at sign-in copies `id`, `username`, `role`, `name` onto the token (`:196-200`); these four are the only app fields in the JWT.
- `jwt` on later calls, only when `token.role === "driver" && token.id`: if `isDriverActive(token.id)` is false it deletes `role` and `id` from the token (`:201-208`). WHY (`:72-73`): "A driver deactivated (or deleted) after signing in must lose access without waiting for the JWT to expire."
- `isDriverActive(id)` (`:77-92`): invalid ObjectId -> `false`; an answer younger than 60 s is reused; otherwise `User.exists({ _id: id, role: "driver", isActive: true })`. On a database error it fails open (last cached answer, else `true`): "A DB blip must never lock every driver out; fall back to the last answer."
- Admin tokens are never revalidated. `jwt` ignores the `trigger` / `session` arguments, so a client `update()` cannot change the role; keep it that way.
- `session({ session, token })` copies `id`, `username`, `role`, `name` to `session.user` and forces `role = undefined` when the token has none (`:212-224`).
- Both callbacks run inside `getServerSession()` (every API guard) and `/api/auth/session`. They do not run in `proxy.ts` (library behaviour, unverified).
- Admin identity: session `id` is the sentinel string `"admin"`, not an ObjectId (never use it as a Mongo `_id` or ref); session `username` is a fixed literal (`:157`), not the `ADMIN_USERNAME` value. Driver identity: session `id` is the `users` `_id` string, which driver routes use for ownership.
- Guards (`apps/web/lib/authHelpers.ts`): `getServerUser()` (`:11-14`), `requireAdmin()` (`:17-20`), `requireDriver()` (`:23-26`) return `SessionUser | null` and never throw. `/api/stock` has a private `requireAnyRole()` (`apps/web/app/api/stock/route.ts:11-14`).

| Event | Effect on existing sessions | Evidence |
|---|---|---|
| Driver deactivated (`isActive: false`) | Guards return `null` within 60 s per server instance -> every API answers 401 -> the driver client signs out. The proxy keeps serving `/driver` until a role-less token is written back to the cookie (when that happens is unverified) | `apps/web/lib/auth.ts:74-92`, `:201-208` |
| Driver deleted | Same path (`User.exists` is false). Delete is refused with 409 once the driver has ledger rows | `apps/web/app/api/admin/drivers/[id]/route.ts:125-127` |
| Driver reactivated | Access returns within 60 s only if the cookie still carries the role (the re-check runs only while `token.role === "driver"`); a signed-out driver signs in again | `apps/web/lib/auth.ts:201` |
| Driver renamed or username changed | Session keeps working (keyed on `token.id`). `name` / `username` in the token stay as at sign-in, so the header and Stock `updatedBy` show the old name until the next sign-in | `apps/web/lib/auth.ts:196-200`; `apps/web/app/api/stock/route.ts:53-54` |
| Driver password change | Not possible: no change or reset feature exists (see §16) | - |
| `ADMIN_PASSWORD` / `ADMIN_USERNAME` changed | Existing admin sessions are NOT revoked; only new sign-ins use the new values | `apps/web/lib/auth.ts:195-211` |
| `NEXTAUTH_SECRET` rotated | Every session, admin and driver, becomes invalid (library behaviour, unverified). The only "sign out everyone" lever | `apps/web/lib/auth.ts:232` |

- Sign-out flows: both menus call `signOut({ callbackUrl: "/" })` (`apps/web/app/admin/layout.tsx:99-101`, `apps/web/app/driver/layout.tsx:120-122`); a driver 401 calls `signOut({ callbackUrl: "/login" })` (see §6.5). Nothing else is cleared (see §6.4, §6.9).
- Sign-in redirect: `signIn("credentials", { redirect: false })`, then a second request to `/api/auth/session` picks the portal by role, with `router.replace` so the login page stays out of history (`apps/web/app/login/page.tsx:29-53`).
- Type augmentation caveat: `Session.user`, `User`, `JWT` (`apps/web/lib/auth.ts:94-117`) and `SessionUser` (`apps/web/lib/authHelpers.ts:4-9`) declare `id` and `role` as always present, but a stripped token makes both `undefined` at runtime. Always compare the role; never treat a non-null `getServerUser()` as "signed in".
- No CSRF token or Origin check exists in the custom API handlers; they rely on next-auth's cookie attributes (unverified) (see §16).

### 6.7 Configuration and environments
| Name | Read at | Side | Required | Behaviour when missing |
|---|---|---|---|---|
| `MONGODB_URI` | `apps/web/lib/mongodb.ts:97` | server | yes | `connectToDatabase()` throws at call time (not import time): routes answer a generic 500 and driver sign-in fails |
| `NEXTAUTH_SECRET` | `apps/web/lib/auth.ts:232`; also read from env by `next-auth/middleware` in `proxy.ts` (unverified) | server | yes | No fallback in code; library behaviour (unverified) |
| `NEXTAUTH_URL` | Not read by app code; consumed by next-auth | server | deployment-dependent (unverified) | Listed only in `turbo.json:7` |
| `ADMIN_USERNAME` | `apps/web/lib/auth.ts:10` | server | optional | Hard-coded default username literal (same line) |
| `ADMIN_PASSWORD` | `apps/web/lib/auth.ts:11` | server | yes in production | Production: admin sign-in disabled (`:21`). Elsewhere: hard-coded development fallback password literal (`:18`). Trimmed, so whitespace-only counts as missing |
| `CLOUDINARY_URL` | `apps/web/lib/cloudinary.ts:27` | server | for fuel-bill upload and delete | Throws at call time; the format is checked at `:32` |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | `apps/web/lib/googleDrive.ts:15` | client (inlined) | optional | `""`: Save to Google Drive shows "This feature is not available yet." (`apps/web/app/admin/supplies/page.tsx:551-555`) |
| `NODE_ENV` | `apps/web/lib/auth.ts:17`; `apps/web/app/components/PwaRegister.tsx:20` | both | set by Next.js | - |
| `NEXT_PUBLIC_APP_VERSION` | Injected at `apps/web/next.config.js:5`, `:9-11`; read at `apps/web/app/admin/layout.tsx:307`, `apps/web/app/driver/layout.tsx:305` | client (inlined) | derived | Not an env-file variable: it is `version` from `apps/web/package.json` |

- Values live in `apps/web/.env` (git-ignored by `apps/web/.gitignore:29-30`; `.env.example` is the tracked template) and in the hosting provider's settings (see §15). Never open or print them (see §2).
- `NEXT_PUBLIC_*` values are inlined at build time: changing one needs a rebuild or a dev-server restart. The app version is independent of the service worker `VERSION` (see §11).
- No server read throws at import time: `NEXTAUTH_SECRET` is read when `apps/web/lib/auth.ts` loads (`:232`) but is only passed on, and every other server read happens at call time. That is why `next build` succeeds with no env vars set (see §17).

| `apps/web/next.config.js` option | Value | Why | Line |
|---|---|---|---|
| `env.NEXT_PUBLIC_APP_VERSION` | `version` from `package.json` | "App version shown next to Sign Out, so it is easy to tell which build a phone is running. Bump "version" in package.json for each release." | `:3-5`, `:9-11` |
| `serverExternalPackages`, `poweredByHeader` | `["mongoose"]`, `false` | No comment in code | `:12`, `:13` |
| `allowedDevOrigins` | `["*.app.github.dev"]` | Dev server only: Next.js 16 refuses dev requests from non-localhost hosts; GitHub Codespaces serves from that domain | `:14-18` |
| `images.unoptimized` | `true` | The app renders plain `img` tags, "so the /_next/image optimizer endpoint is pure attack surface" | `:19-24` |

| Header (`apps/web/next.config.js`) | Value | Scope | Line |
|---|---|---|---|
| `X-Frame-Options` | `DENY` | all paths | `:30` |
| `Strict-Transport-Security` | `max-age=63072000; includeSubDomains` (two years; "Ignored over plain http (localhost)") | all paths | `:31-33` |
| `X-Content-Type-Options` | `nosniff` | all paths | `:34` |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | all paths | `:35` |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=()`: blocks any future in-page camera or GPS feature until changed; the fuel-bill photo uses a file input (see §11) | all paths | `:36` |
| `Content-Type`, `Cache-Control`, `Content-Security-Policy` | `application/javascript; charset=utf-8`; `no-cache, no-store, must-revalidate`; `default-src 'self'; script-src 'self'`. WHY: "Never cache it, so a new version is always picked up; lock it to same-origin scripts." This is the only CSP: there is no site-wide policy (see §16) | `/sw.js` only | `:44-46` |

- `turbo.json:4-13` `globalEnv` lists the first seven names above plus `NODE_ENV`. Rule: add every new env var there; `turbo/no-undeclared-env-vars` is on (`packages/eslint-config/base.js:21`) and lint fails on warnings (see §12). `turbo.json:17` adds `.env*` to the build inputs, so editing an env file busts the build cache.
- Local dev (`npm run dev`, `NODE_ENV=development`): admin fallback credentials are active when `ADMIN_PASSWORD` is unset; the service worker is never registered and leftovers are unregistered; `allowedDevOrigins` applies.
- Local production build (`npm run build`, then `npm run start` inside `apps/web`; the root `package.json` has no `start` script): the service worker registers (the only local way to test the PWA) and admin sign-in needs `ADMIN_PASSWORD`.
- Production: same code path, env from the host. `apps/web/vercel.json:3` pins `regions: ["bom1"]`, which implies Vercel (unverified).
- No staging or preview environment is recorded, and there are no feature flags or per-environment config files: behaviour differs only through `NODE_ENV` at its two read sites. Treat any `MONGODB_URI` as the live database (see §2).

### 6.8 Database access layer
- Everything is in `apps/web/lib/mongodb.ts` (schema and indexes: §10). `connectToDatabase()` (`:68-94`) is called by every handler, by `authorize()` and by `isDriverActive()`.
- Cache: `global.mongooseCache = { conn, promise, indexedModels? }` (`:5-23`) survives dev hot reload and warm serverless invocations. For the same reason models are exported as `models.X || model(...)` (e.g. `apps/web/models/User.ts:38-40`).
- Flow: read `MONGODB_URI` first (`:69`) -> return `cached.conn` if present -> else create and await `cached.promise`; on failure `cached.promise = null` and rethrow, so the next request retries (`:85-90`).
- Options (`:77-82`): `bufferCommands: false`, `maxPoolSize: 10`, `serverSelectionTimeoutMS: 5000`, `socketTimeoutMS: 45000`. Nothing else is set (no `dbName`: the database name comes from the URI).
- Consequence of `bufferCommands: false`: a model query issued before `await connectToDatabase()` throws instead of queueing. Every new handler must connect first.
- Model registration: `import "../models"` (`:2-3`) loads `apps/web/models/index.ts`, which imports all five models. WHY (`apps/web/models/index.ts:1-5`): without it "a route that populates a model it doesn't import (e.g. SupplyLog → vehicle) fails with MissingSchemaError until some other route happens to load that model."
- Rule: add every new model to `apps/web/models/index.ts`, or its indexes are ensured only after a route that imports it has loaded (`ensureIndexes()` walks `mongoose.models`, `:56`) and `populate()` can fail on a cold instance.
- Index sync: `ensureIndexes()` (`:53-66`) runs on every `connectToDatabase()` call; for each model not yet in `cached.indexedModels` it marks the model done, then fires `createIndexes()` and `dropObsoleteIndexes()` without awaiting them. Nothing waits for the build, so a unique index may not exist yet on the first requests against a fresh database, and a failed build is only logged and not retried until the process restarts (see §16).
- Which indexes exist, why they are built at runtime and the obsolete-index list (`OBSOLETE_UNIQUE_INDEXES`, the only indexes the app ever drops): see §10.7.

### 6.9 Client-side storage
| Kind | Key / name | Written at | Purpose | Lifetime |
|---|---|---|---|---|
| `localStorage` | `rk-install-dismissed` = `"1"` | `apps/web/app/components/InstallPrompt.tsx:14`, `:37` (read `:29`) | Install card was dismissed | Permanent: nothing clears it; survives sign-out; storage errors are swallowed |
| Cache Storage | `rk-static-v2` (`rk-static-${VERSION}`) | `apps/web/public/sw.js:22-23`, `:37`, `:110` | Offline page, manifest, three icons, plus runtime `/_next/static/*` and `/icons/*` (cap 200 entries, `:25`) | Until `VERSION` changes: `activate` deletes every other `rk-*` cache (`:43-48`). Survives sign-out (user-agnostic content) |
| Service worker registration | `/sw.js`, scope `/` | `apps/web/app/components/PwaRegister.tsx:68-71` | PWA (see §11) | Production builds only; removed in development (`:20-27`) |
| Cookies | next-auth session, CSRF and callback-URL cookies; names and flags are library defaults (unverified) | Set server-side by `/api/auth/*`; app code never touches `document.cookie` | The JWT session | Library default (unverified); cleared by `signOut` |
| `localStorage` (library) | next-auth cross-tab sync key (unverified; not in repo code) | next-auth client | Session sync between tabs | - |
| Memory | React Query cache | `apps/web/app/providers.tsx:11-24` | Server-state cache | Tab lifetime; lost on reload |
| Memory | Google Drive access token `cachedToken` | `apps/web/lib/googleDrive.ts:55`, `:78-81` | Admin "Save to Google Drive" | "kept in memory for this tab only" (`:6-7`); reused until 60 s before expiry; cleared on a Drive 401 (`:127`) |

- Not used at all: `sessionStorage`, IndexedDB, `document.cookie` (no match in `apps/web`).
- Never stored client-side: page HTML, any `/api/*` response, passwords, form drafts, an offline write queue. WHY (`apps/web/public/sw.js:13-14`): "so nothing from one signed-in user can be shown to another user on a shared phone."

### 6.10 Forms and validation
- No form or schema library (no react-hook-form, Formik, Zod or Yup). Forms are controlled inputs held in `useState`; submit handlers call `fetch` and put a message string into an inline alert.
- Client validation lives in three places: HTML attributes (`required`, `type`, `min`, `step`, `inputMode`, `maxLength`); a few inline checks in submit handlers (e.g. `apps/web/app/driver/page.tsx:696-700`, `:791-798`); and the shared validators below.
- Shared validators: `apps/web/lib/supplyProduct.ts` is "shared by the API routes and the driver/admin forms so validation copy and pricing never drift apart" (`:1-2`). `validateDeliveryQuantities` runs on the client (`apps/web/app/driver/page.tsx:711`; `apps/web/app/admin/supplies/page.tsx:598`, `:681`) and on the server (`apps/web/app/api/driver/supplies/route.ts:166`; `apps/web/app/api/admin/supplies/route.ts:274`; `apps/web/app/api/admin/supplies/[id]/route.ts:152`). Change quantity rules there, never in a form.
- The server is the source of truth: every handler re-validates by hand and writes an explicit field whitelist. `runValidators` is never set, so schema `min` / `enum` do not run on updates (Mongoose default, unverified).
- Forms display the server's `error` text verbatim, so API messages are user-facing copy. Over-long strings are truncated silently, not rejected (see §6.5).
- POST coerces, PATCH rejects. On create an unknown enum value falls back to a default: `logType` -> `"water"` unless `"cash"` (`apps/web/app/api/admin/supplies/route.ts:240`; `apps/web/app/api/driver/supplies/route.ts:146`), `productType` -> `"can"` (`apps/web/app/api/admin/supplies/route.ts:254`; `apps/web/app/api/driver/supplies/route.ts:150`), driver `paymentStatus` -> `"cash"` (`apps/web/app/api/driver/supplies/route.ts:235-236`). On update an unknown value answers 400 in `apps/web/app/api/admin/supplies/[id]/route.ts`: `paymentStatus` (`:81-83`), `productType` (`:84`) and `cashType` (`:79`; also rejected on create). PATCH cannot change `logType`.
- PATCH field convention: `undefined` = leave alone, `null` or `""` = clear (`$unset`), a value = set (e.g. `textField`, `apps/web/app/api/admin/supplies/[id]/route.ts:39-46`).

### 6.11 Time and timezone
- A business day is an IST calendar day, whatever timezone the server or device is in. WHY (`apps/web/lib/istTime.ts:1-4`): "The server may run in any timezone (usually UTC) ... IST has no DST, which makes the fixed offset safe."
- Fixed offset: `IST_OFFSET_MS = 330 * 60 * 1000` (+05:30) at `apps/web/lib/istTime.ts:6`. Stored values are ordinary UTC `Date`s; only day boundaries and display are IST.
- Server day boundaries go through `apps/web/lib/istTime.ts`; client display goes through `apps/web/lib/format.ts`.
- IST is encoded in five files that must change together: `apps/web/lib/istTime.ts`, `apps/web/lib/format.ts`, `apps/web/app/api/admin/analytics/route.ts`, `apps/web/app/admin/supplies/exports.ts` and `apps/web/app/admin/amounts/page.tsx` (lines and literals: see §10.12).
- Exception: some admin screens call `toLocaleDateString("en-IN")` with no `timeZone`, so they follow the device timezone (`apps/web/app/admin/customers/[id]/page.tsx:61`, `apps/web/app/admin/drivers/page.tsx:399`, `apps/web/app/admin/vehicles/[id]/page.tsx:111`, `:183`, `:419`, `:443`, `:502`) (see §16).
- Day windows, date parsing and the full helper list are in §10.12.

### 6.12 Error handling
- `apps/web/app/error.tsx`: whole app below the root layout, including errors thrown by a portal layout (framework behaviour, unverified). Full-height "Something went wrong" / "An unexpected error occurred. Please try again." / "Try again".
- `apps/web/app/admin/error.tsx`: admin pages, rendered inside the admin shell. "Page error" / "Something went wrong. Please try again." / "Retry".
- `apps/web/app/driver/error.tsx`: same layout, but it shows the raw `error.message`, falling back to "Something went wrong loading this page." (`:26`) (see §16).
- All three boundaries `console.error(error)` in an effect (`:12-14`) and call `reset()` from the button. There is no `global-error.tsx`, so an error in the root layout itself has no custom screen.
- `apps/web/app/not-found.tsx` (server component): "404" / "Page not found" / "Go home" -> `/` for every unmatched route.
- API: every handler body sits in try/catch ending in `serverError(err, message?)` (29 call sites), which logs `console.error(message, error)` and answers that message (generic by default) with 500. These logs have no prefix: the user-facing message is the log label.
- One deliberate exception returns a real message: driver cash POST answers 502 with the upload error. WHY: "Upload problems carry a message written for the driver; anything else is logged and answered generically." (`apps/web/app/api/driver/supplies/route.ts:254-258`).
- `authorize()` does not catch database errors (`apps/web/lib/auth.ts:163-178`): an outage surfaces as a failed sign-in with the generic login message.
- Server log prefixes: `[auth] driver active check failed` (`apps/web/lib/auth.ts:89`); `[mongodb] dropped obsolete index <collection>.<name>` (info, `apps/web/lib/mongodb.ts:41`); `[mongodb] index build failed for <Model>` (`:60`); `[mongodb] obsolete index cleanup failed for <Model>` (`:63`); `[driver supplies POST]` (`apps/web/app/api/driver/supplies/route.ts:257`); `[supplies DELETE] image cleanup` (`apps/web/app/api/admin/supplies/[id]/route.ts:248`). Browser console only: `Service worker registration failed` (warn, `apps/web/app/components/PwaRegister.tsx:78`).
- No logging library, error tracker, request ID or structured log format exists: server logs are plain `console` output on the host (where to read them: see §15).
- Client data errors are shown inline where a page reads `isError`: with a retry control on the driver page (`ErrorWithRetry`), the customer detail card and the New Customers dialog; as text only on the Deliveries lists, the customer history and the main analytics query. The drivers, vehicles and customers list pages never read `isError`. A failed write sets an alert string beside the form.

## 7. API / backend reference

16 `route.ts` files under `apps/web/app/api/` export 29 method handlers plus the next-auth catch-all (GET + POST). In §7.3-§7.5 a bare `L123` is a line of the route file named in that block's heading; in §7.7 a bare `:123` is a line of the file named at the top of the block. Fields, indexes, soft delete, pricing and IST rules: see §10. Auth and session lifecycle, env keys: see §6.

### 7.1 Conventions

| Topic | Rule | Where |
|---|---|---|
| Guards | Pipeline is guard -> input coercion -> `connectToDatabase()` -> Mongoose (`.lean()` reads). Every handler starts with `const admin = await requireAdmin(); if (!admin) return unauthorized();` (or `requireDriver()`; `/api/stock` uses a route-private `requireAnyRole()`, §7.5). The helpers return the session user or `null` instead of throwing | `apps/web/lib/authHelpers.ts:17-26` |
| Proxy does not protect the API | The matcher is `["/", "/login", "/admin/:path*", "/driver/:path*"]`: no `/api` path. A new route without a guard call is public | `apps/web/proxy.ts:36` |
| No 403 | Not signed in and wrong role both answer 401 `{ "error": "Unauthorized" }`. Driver clients treat any 401 as "session ended" and call `signOut` | `apps/web/lib/api.ts:10-12`, `apps/web/app/driver/page.tsx:176-178` |
| Deactivated driver | The JWT callback strips the role (re-checked at most once per 60 s per driver; the cache is per server instance), so every guard returns `null` -> 401; see §6.6 | `apps/web/lib/auth.ts:74-92`, `apps/web/lib/auth.ts:201-208` |
| Session ids | Driver `id` = the User `_id` string (used for ownership). Admin `id` is a fixed literal that is not an ObjectId: never store it as a ref | `apps/web/lib/auth.ts:155`, `apps/web/lib/auth.ts:186` |
| Error envelope | Always `{ "error": string }`. Helpers: `unauthorized()` 401; `badRequest(msg)` 400; `notFound(msg = "Not found")` 404; `serverError(err, msg = "Something went wrong. Please try again.")` 500, which `console.error`s the real error "so internals never reach the client" | `apps/web/lib/api.ts:6-26` |
| Common errors | Every handler: 401 (guard) and 500 (default text unless the block names another). Every JSON-body handler: 400 `Invalid request body.`. The blocks below list only the additional ones | - |
| Status codes | 200; 201 (creates); 400; 401; 404; 409 (duplicate phone / username / vehicle number, detected by a pre-check or `err.code === 11000`; delete blocked by ledger rows); 500; 502 (`POST /api/driver/supplies` only). App code never sends 403, 413, 422 or 429 | e.g. `apps/web/app/api/admin/drivers/route.ts:94-96` |
| Success envelope | Resources are returned bare (no wrapper). Confirmations are inconsistent: `{ ok: true }` (customer DELETE, ledger DELETE) vs `{ success: true }` (driver DELETE, vehicle DELETE, odometer PATCH) | `apps/web/app/api/admin/customers/[id]/route.ts:160`, `apps/web/app/api/admin/drivers/[id]/route.ts:132` |
| Body parsing | `readJsonObject(req)`: the body must parse to a plain object (not an array, not `null`). `Content-Type` is not checked. Only POST `/api/driver/supplies` also accepts multipart | `apps/web/lib/api.ts:33-40` |
| Strings | `optionalString(v, max = 500)`: non-string -> `undefined` ("so it can't reach a query"); trimmed; silently truncated to `max`, never rejected. `requiredString`: same, and `""` -> `undefined` | `apps/web/lib/api.ts:43-53` |
| Numbers | `optionalNumber`: number or numeric string -> finite number; `""`, `null` and other types -> `undefined`; callers range-check. Quantity fields use the looser `parseOptionalNumber`: blank -> `undefined`, else `Number(value)` (`true` -> 1; `NaN` is rejected by the validators) | `apps/web/lib/api.ts:56-61`, `apps/web/lib/supplyProduct.ts:39-41` |
| Id validation | `Types.ObjectId.isValid(x)` on every path id and every id in query or body -> 400 (which non-hex strings pass is library behaviour, unverified) | e.g. `apps/web/app/api/admin/customers/[id]/route.ts:16` |
| Aggregation casting | Values placed in a `$match` are pre-cast (`new Types.ObjectId()`, `Date`) because "aggregation pipelines skip schema casting" | `apps/web/app/api/admin/supplies/route.ts:59-60` |
| Regex escaping | User text reaching `$regex` is escaped with `value.replace(/[.*+?^${}()\|[\]\\]/g, "\\$&")`. Three copies, no shared helper | `apps/web/app/api/admin/customers/route.ts:19`, `apps/web/app/api/admin/vehicles/route.ts:7-9`, `apps/web/app/api/admin/vehicles/[id]/route.ts:96` |
| Update whitelist | Handlers build `$set` / `$unset` (or an `updates` object) field by field; no handler spreads the body into a write. The option is `{ returnDocument: "after" }` | e.g. `apps/web/app/api/admin/drivers/[id]/route.ts:24-30`, `apps/web/app/api/admin/drivers/[id]/route.ts:90-94` |
| No `runValidators` | Never set, so schema `min` / `enum` do not run on updates (Mongoose default; library behaviour, unverified); each handler validates by hand. A new updatable field needs its own check | e.g. `apps/web/app/api/admin/supplies/[id]/route.ts:214` |
| Route-segment config | The only segment export in any route is `export const dynamic = "force-dynamic"`. No `runtime`, `maxDuration`, `revalidate`, `fetchCache` or `preferredRegion` anywhere -> Node.js runtime and the platform's default duration (unverified on the host) | `apps/web/app/api/driver/vehicles/odometer/route.ts:9` |
| Platform and caching | `"regions": ["bom1"]` is the whole hosting config (that production runs there is unverified). The app's own `fetch` calls send every `/api` GET with `cache: "no-store"`; the service worker skips `/api/*` | `apps/web/vercel.json:3`, `apps/web/public/sw.js:70` |
| Absent | Rate limiting (only the login-failure throttle exists, §6.6), CORS headers, CSRF-token or `Origin` checks in handlers, audit log of edits, idempotency keys (see §16) | - |

String caps (silent truncation unless noted):

| Field | Admin routes | Driver routes |
|---|---|---|
| customer `name` / `phone` / `email` / `address` / `area` | 200 / 30 / 200 / 1000 / 200, POST and PATCH (`apps/web/app/api/admin/customers/route.ts:74-78`) | 120 / 30 / 120 / 500 / not accepted (`apps/web/app/api/driver/customers/route.ts:32-35`) |
| driver `name` / `username` / `phone` / `assignedVehicleId`; `password` | 200 / 100 / 30 / 100 on POST (`apps/web/app/api/admin/drivers/route.ts:38-42`), **no cap on PATCH**; `password` 6..200 characters, rejected rather than truncated | - |
| vehicle `name` / `vehicleNumber` / `capacity` | 200 / 100 / 100 on POST (`apps/web/app/api/admin/vehicles/route.ts:35-37`); **no cap on PATCH** | - |
| `notes`, `adminRemark` | 1000 each | `notes` 1000 |
| `driverId`, `customerId`, `vehicleId` / `caseSize` | 64 / 10 | 64 / 10 |

### 7.2 Endpoint index

| Method | Path | Guard | Purpose | Handler | Called from |
|---|---|---|---|---|---|
| GET | `/api/admin/analytics` | admin | Per-IST-day delivery and registration series | `apps/web/app/api/admin/analytics/route.ts:11` | `apps/web/app/admin/amounts/page.tsx:744` |
| GET | `/api/admin/analytics/new-customers` | admin | Customers behind the "New Customers" number | `apps/web/app/api/admin/analytics/new-customers/route.ts:21` | `apps/web/app/hooks/useAdminQueries.ts:386` (hook used at `apps/web/app/admin/amounts/page.tsx:349`) |
| GET | `/api/admin/customers` | admin | Dropdown array, or paginated list + counts + areas | `apps/web/app/api/admin/customers/route.ts:8` | `apps/web/app/hooks/useAdminQueries.ts:165` (dropdown), `apps/web/app/hooks/useAdminQueries.ts:193` (paginated) |
| POST | `/api/admin/customers` | admin | Create, or restore a soft-deleted customer | `apps/web/app/api/admin/customers/route.ts:67` | `apps/web/app/admin/customers/page.tsx:117` |
| GET | `/api/admin/customers/[id]` | admin | One customer (soft-deleted included) | `apps/web/app/api/admin/customers/[id]/route.ts:8` | `apps/web/app/hooks/useAdminQueries.ts:309` |
| PATCH | `/api/admin/customers/[id]` | admin | Partial update | `apps/web/app/api/admin/customers/[id]/route.ts:29` | `apps/web/app/admin/customers/page.tsx:169` |
| DELETE | `/api/admin/customers/[id]` | admin | Soft delete | `apps/web/app/api/admin/customers/[id]/route.ts:141` | `apps/web/app/admin/customers/page.tsx:207` |
| GET | `/api/admin/drivers` | admin | All drivers + assigned vehicle | `apps/web/app/api/admin/drivers/route.ts:14` | `apps/web/app/hooks/useAdminQueries.ts:132` |
| POST | `/api/admin/drivers` | admin | Create driver (bcrypt hash) | `apps/web/app/api/admin/drivers/route.ts:31` | `apps/web/app/admin/drivers/page.tsx:63` |
| PATCH | `/api/admin/drivers/[id]` | admin | Edit details / activate / default vehicle | `apps/web/app/api/admin/drivers/[id]/route.ts:11` | `apps/web/app/admin/drivers/page.tsx:89` (toggle), `apps/web/app/admin/drivers/page.tsx:126` (edit) |
| DELETE | `/api/admin/drivers/[id]` | admin | Hard delete if no ledger rows | `apps/web/app/api/admin/drivers/[id]/route.ts:110` | `apps/web/app/admin/drivers/page.tsx:156` |
| GET | `/api/admin/supplies` | admin | Ledger list (export / paged / window) + stats | `apps/web/app/api/admin/supplies/route.ts:42` | `apps/web/app/hooks/useAdminQueries.ts:234` (export), `apps/web/app/hooks/useAdminQueries.ts:265` (list), `apps/web/app/hooks/useAdminQueries.ts:339` (customer history) |
| POST | `/api/admin/supplies` | admin | Admin adds a ledger row | `apps/web/app/api/admin/supplies/route.ts:233` | `apps/web/app/admin/supplies/page.tsx:610` (deliveries only) |
| PATCH | `/api/admin/supplies/[id]` | admin | Edit a ledger row, re-price | `apps/web/app/api/admin/supplies/[id]/route.ts:48` | `apps/web/app/admin/supplies/page.tsx:709` |
| DELETE | `/api/admin/supplies/[id]` | admin | Hard delete + deferred image cleanup | `apps/web/app/api/admin/supplies/[id]/route.ts:228` | `apps/web/app/admin/supplies/page.tsx:740` |
| GET | `/api/admin/vehicles` | admin | All vehicles, without odometer history | `apps/web/app/api/admin/vehicles/route.ts:11` | `apps/web/app/hooks/useAdminQueries.ts:148` |
| POST | `/api/admin/vehicles` | admin | Create vehicle | `apps/web/app/api/admin/vehicles/route.ts:27` | `apps/web/app/admin/vehicles/page.tsx:37` |
| GET | `/api/admin/vehicles/[id]` | admin | Vehicle + newest 200 odometer readings | `apps/web/app/api/admin/vehicles/[id]/route.ts:14` | `apps/web/app/admin/vehicles/[id]/page.tsx:220` |
| PATCH | `/api/admin/vehicles/[id]` | admin | Edit / enable / disable | `apps/web/app/api/admin/vehicles/[id]/route.ts:47` | `apps/web/app/admin/vehicles/[id]/page.tsx:270`, `apps/web/app/admin/vehicles/[id]/page.tsx:295` |
| DELETE | `/api/admin/vehicles/[id]` | admin | Hard delete if no ledger rows; unassign drivers | `apps/web/app/api/admin/vehicles/[id]/route.ts:126` | `apps/web/app/admin/vehicles/[id]/page.tsx:321` |
| GET | `/api/driver/customers` | driver | All active customers (picker) | `apps/web/app/api/driver/customers/route.ts:8` | `apps/web/app/driver/page.tsx:464` |
| POST | `/api/driver/customers` | driver | Register (or restore) a customer | `apps/web/app/api/driver/customers/route.ts:25` | `apps/web/app/driver/page.tsx:757` |
| GET | `/api/driver/supplies` | driver | Own entries: last 5 IST days, or one day | `apps/web/app/api/driver/supplies/route.ts:96` | `apps/web/app/driver/page.tsx:473`, `apps/web/app/driver/page.tsx:485`, `apps/web/app/driver/page.tsx:496` |
| POST | `/api/driver/supplies` | driver | Delivery (JSON) or cash/fuel entry (multipart + bill photo) | `apps/web/app/api/driver/supplies/route.ts:133` | `apps/web/app/driver/page.tsx:719` (JSON), `apps/web/app/driver/page.tsx:810` (multipart) |
| GET | `/api/driver/vehicles` | driver | Active vehicles + own assigned vehicle id | `apps/web/app/api/driver/vehicles/route.ts:8` | `apps/web/app/driver/page.tsx:451` |
| GET | `/api/driver/vehicles/odometer` | driver | Daily-gate status + last 5 readings | `apps/web/app/api/driver/vehicles/odometer/route.ts:16` | `apps/web/app/driver/layout.tsx:57`, `apps/web/app/driver/layout.tsx:104` |
| PATCH | `/api/driver/vehicles/odometer` | driver | Submit today's reading | `apps/web/app/api/driver/vehicles/odometer/route.ts:53` | `apps/web/app/driver/layout.tsx:130` |
| GET | `/api/stock` | admin or driver | Read shared stock counts | `apps/web/app/api/stock/route.ts:16` | `apps/web/app/components/StockModal.tsx:40` |
| PATCH | `/api/stock` | admin or driver | Overwrite shared stock counts | `apps/web/app/api/stock/route.ts:32` | `apps/web/app/components/StockModal.tsx:68` |
| GET, POST | `/api/auth/[...nextauth]` | next-auth | Sign-in, session, sign-out, CSRF | `apps/web/app/api/auth/[...nextauth]/route.ts:6` | see §7.6 |

Not implemented (do not look for them): GET `/api/admin/drivers/[id]`, GET `/api/admin/supplies/[id]`, any driver PATCH/DELETE of a ledger row, any driver edit of a customer, any password-change route.

### 7.3 Admin endpoints

#### GET /api/admin/analytics (`apps/web/app/api/admin/analytics/route.ts`)
| Query param | Default | Rule |
|---|---|---|
| `driverId`, `vehicleId` | none | ObjectId, else 400 `Invalid driver id.` / `Invalid vehicle id.` Why: "A bad or stale id must not silently show company-wide numbers under a name." (L18) |
| `from`, `to` | none | `YYYY-MM-DD` inclusive IST days. Used only when both are present, both match `^\d{4}-\d{2}-\d{2}$` and `from <= to` (string compare); otherwise silently ignored and `days` applies (`apps/web/lib/analyticsRange.ts:35`) |
| `days` | 30 | Clamped to 7..90; non-numeric -> 30; the window ends today in IST (`apps/web/lib/analyticsRange.ts:39-43`) |

- 400 `Invalid date range.`: an unparseable day (e.g. month 13) or a custom span over 731 days (`MAX_SPAN_MS`, `apps/web/lib/analyticsRange.ts:18`; "so one mistyped year cannot enumerate thousands of day buckets and scan the whole ledger"). An overflowing day (the 30th of February) rolls into the next month per the comment at `apps/web/lib/analyticsRange.ts:25-28` (unverified, not executed).
- DB, in parallel (L59-80): `SupplyLog.aggregate` with `$match { logType: "water", suppliedAt in range, driver?, vehicle? }` grouped by `$dateToString` (`%Y-%m-%d`, timezone `+05:30`) into `count`, `totalCans`, `totalCases`; `Customer.aggregate` with `$match { createdAt in range }` grouped the same way.
- 200 `{ deliveries: [{ date, count, totalCans, totalCases }], registrations: [{ date, count }] }`: one zero-filled entry per IST day (L36-42, L92-102). The range actually used is not echoed. Registrations ignore the driver/vehicle filters and include soft-deleted customers (`apps/web/lib/analyticsRange.ts:53-57`). Cash rows are excluded.

#### GET /api/admin/analytics/new-customers (`apps/web/app/api/admin/analytics/new-customers/route.ts`)
- Query: `from` / `to` / `days` exactly as above (shared `resolveAnalyticsRange` and `newCustomerMatch`, "so the list always adds up to that number", L18-20). No driver/vehicle filter. 400 `Invalid date range.`
- DB (L32-49): `Customer.countDocuments(match)` + `Customer.find(match).select("name phone area address locationType subscriptionCans cashPerCan isActive isDeleted registeredDate createdAt createdBy").sort({ createdAt: -1, _id: -1 }).limit(500).lean()`, then `User.find({ _id: { $in: driverIds } }).select("name username").lean()`.
- 200 `{ fromDay, toDay, total, limit: 500, customers }`. `MAX_CUSTOMERS = 500` (L11), so `total` can exceed `customers.length`; compare with `limit` to detect truncation. Each customer = the selected fields minus `createdBy`, plus `addedBy`: `{ kind: "admin" }` when there is no `createdBy` ("the admin account isn't stored in the users collection"), `{ kind: "driver", name, username }`, or `{ kind: "deleted-driver" }` (L51-60).

#### /api/admin/customers - GET, POST (`apps/web/app/api/admin/customers/route.ts`)
| GET query param | Default | Rule |
|---|---|---|
| `search` | "" | Trimmed, regex-escaped, case-insensitive `$or` over `name`, `phone`, `email`, `area` (L18-22); no length cap |
| `area` | "" | Trimmed, exact match (L23) |
| `page`, `limit` | 1, 30 | `page` = `max(1, parseInt)`; `limit` clamped to 1..100 (L37-38); bad values never give a 400 |

- Base filter is always `{ isDeleted: { $ne: true } }` (L17).
- Two response shapes on one URL. Neither `page` nor `limit` -> a bare array for dropdowns: `.select("name phone area isActive locationType subscriptionCans cashPerCan").sort({ isActive: -1, name: 1 })`, unbounded (L28-35). Otherwise `{ customers, total, activeCount, inactiveCount, page, limit, totalPages, areas }` (L61).
- Paginated shape (L41-59): `customers` are full documents; counts come from a `$group` on `isActive` (a document whose `isActive` is neither `true` nor `false` is in neither count); `total = activeCount + inactiveCount`; `totalPages = max(1, ceil(total / limit))`; `areas` = sorted distinct non-empty `area` of all non-deleted customers, ignoring the current search.

| POST body field | Required | Validation | 400 message |
|---|---|---|---|
| `name`, `phone`, `address` | yes | Non-empty string; no phone format check | `Name is required.` / `Phone is required.` / `Location is required.` |
| `email`, `area` | no | Empty -> not stored | - |
| `locationType` | no | `home` / `office` / `both`; any other truthy value is rejected | `Location type must be home, office, or both.` |
| `subscriptionCans` | no (1 when the key is absent) | Integer >= 1 | `Subscription cans must be a positive integer.` |
| `cashPerCan`, `securityDeposit` | no | Number >= 0; `null` / `""` = not given | `Cash per can must be a non-negative number.` / `Security deposit must be a non-negative number.` |
| `registeredDate` | no (now) | String parsed with `new Date()` | `Invalid date.` |

- Write: `createOrRestoreCustomer` (`apps/web/lib/customers.ts:38-81`; duplicate / restore rules in §10) with `createdBy: admin.id`. That id is not an ObjectId, so it is dropped (`apps/web/lib/customers.ts:49`) and admin-created customers have no `createdBy`. 201 the full customer document (new or restored; the response does not say which). 409 `A customer with this phone number already exists.`

#### /api/admin/customers/[id] - GET, PATCH, DELETE (`apps/web/app/api/admin/customers/[id]/route.ts`)
- All three: 400 `Invalid customer id.`, 404 `Customer not found.` GET (L8-27): `Customer.findById(id).lean()`; soft-deleted customers are returned too.
- PATCH (L29-139): only keys that are sent change.

| PATCH field | Semantics |
|---|---|
| `name`, `phone`, `address` | Empty or non-string -> 400 `Name cannot be empty.` / `Phone cannot be empty.` / `Location cannot be empty.` |
| `email`, `area` | Non-empty -> set; empty or non-string -> `$unset` |
| `locationType` | Enum value -> set; falsy -> `$unset`; anything else -> 400 (POST message) |
| `subscriptionCans` | Integer >= 1 (POST message) |
| `cashPerCan`, `securityDeposit` | `null` / `""` -> `$unset`; else number >= 0 (POST messages) |
| `isActive` | `Boolean(value)` (L107): the string `"false"` becomes `true` |
| `registeredDate` | String -> `new Date()`; 400 `Invalid registered date.` |

- No recognised key -> 400 `Nothing to update.` (L116). Write: `Customer.findByIdAndUpdate(id, { $set?, $unset? }, { returnDocument: "after" })` with no `isDeleted` filter, so a deleted customer can be edited and re-activated. 409 on duplicate phone (L134-136). The unique phone index includes soft-deleted customers, so PATCH can 409 against a record the admin cannot see, whereas POST restores it.
- DELETE (L141-164): soft delete, `$set { isDeleted: true, isActive: false }`; 200 `{ ok: true }`. No ledger check; ledger rows keep pointing at the customer.

#### /api/admin/drivers - GET, POST (`apps/web/app/api/admin/drivers/route.ts`)
- GET (L14-28): `User.find({ role: "driver" }).select("-password").populate("assignedVehicle", "name vehicleNumber capacity isActive").lean()`. No sort, no pagination, bare array.
- POST (L31-99) body: `name`, `username` (trimmed, case-sensitive), `phone`, `password` (raw string, not trimmed), optional `assignedVehicleId`. `MAX_PASSWORD_LENGTH = 200` (L11): "Logins are capped at this length (lib/auth.ts), so a longer password could never sign in". It mirrors `MAX_CREDENTIAL_LENGTH` (`apps/web/lib/auth.ts:36`); change both together.
- 400: `All fields are required`, `Password must be at least 6 characters.`, `Password must be at most 200 characters.`, `Invalid assigned vehicle.`, `Assigned vehicle is not available.` (the vehicle must exist with `isActive: true`, L67-70). 409 `Username already taken` (pre-check `User.exists({ username })`, L57-60, and the 11000 catch).
- Write: `bcrypt.hash(password, 12)` (L74); `User.create({ ..., role: "driver", assignedVehicle })`; re-read without the password, populated. 201 the driver; 500 `Failed to load created driver` if the re-read finds nothing (L89). Nothing stops several drivers being assigned the same vehicle.

#### /api/admin/drivers/[id] - PATCH, DELETE (`apps/web/app/api/admin/drivers/[id]/route.ts`)
- Both: 400 `Invalid driver id.` PATCH whitelist (L24-30): `name`, `username`, `phone` (trimmed; non-strings ignored; empty -> 400 `Name cannot be empty.` / `Username cannot be empty.` / `Phone cannot be empty.`), `isActive` (booleans only; other types ignored), `assignedVehicleId`.
- `assignedVehicleId` (L54-65, L80-84): `null` or `""` unassigns; a non-string or invalid id -> 400 `Invalid assigned vehicle.`; it must be an active vehicle -> 400 `Assigned vehicle is not available.`
- No password field: no API changes or resets a driver's password (see §16).
- Username uniqueness: `User.exists({ username, _id: { $ne: id }, role: "driver" })` -> 409 `Username already taken.` (with a full stop, unlike POST).
- No recognised field -> 400 `No valid fields to update.` Write: `User.findByIdAndUpdate(id, updates, { returnDocument: "after" })` (not filtered by role) `.select("-password")` + populate. 404 `Driver not found`.
- DELETE (L110-136): `SupplyLog.exists({ driver: id })` -> 409 `This driver has delivery records. Deactivate the driver instead.` Why: "The ledger keeps its driver attribution: a driver with history is deactivated (PATCH isActive:false), never hard-deleted." Otherwise `User.findOneAndDelete({ _id: id, role: "driver" })` -> 200 `{ success: true }`; 404 `Driver not found.` Not cleaned up: `Vehicle.odometerHistory[].driverId` and `Customer.createdBy` (the latter then reads as `deleted-driver`).

#### /api/admin/supplies - GET, POST (`apps/web/app/api/admin/supplies/route.ts`)
| GET query param | Values | Effect / 400 message |
|---|---|---|
| `date` | `YYYY-MM-DD` | That IST day; `Invalid date format.` (L72-76) |
| `month` | `YYYY-MM`, month 1-12 | That IST month; `Invalid month format.` (L78-82; only checked as two integers around one `-`, so `2026-9` passes). If `date` is also sent, `month` wins |
| `days` | integer 1..366 | Rolling window; ignored when `date` or `month` is sent; `Invalid days value.` (L88-92) |
| `driver`, `vehicle`, `customer` | ObjectId | `Invalid driver id.` / `Invalid vehicle id.` / `Invalid customer id.` |
| `logType` | `water` / `cash` | `Invalid logType value.` |
| `paymentStatus` | `cash` / `upi` / `not_paid` | `cash` filters `{ $nin: ["upi", "not_paid"] }` ("Include records explicitly marked "cash" AND old records with no field set"); `Invalid paymentStatus value.` |
| `productType` | `can` / `case` | `can` filters `{ $ne: "case" }` (legacy rows count as cans); `Invalid productType value.` |
| `amountStatus` | `pending` / `added` / `all` | `pending` = `amount` missing; `added` = `amount` exists and is not null; `Invalid amountStatus value.` No client sends it |
| `page`, `limit` | default 1, 10 | `page` = `max(1, parseInt)`; `limit` clamped to 1..200 (L144-145). The client always sends 50 (`apps/web/app/hooks/useAdminQueries.ts:200`) |

| List mode | Trigger | `suppliedAt` filter | skip | Row cap | `total` | `totalPages` | `serialStart` |
|---|---|---|---|---|---|---|---|
| Export | neither `page` nor `limit` | `date` / `month`, or `[windowStart, istDayEnd()]` with `days`, else none | 0 | `EXPORT_MAX_ROWS = 5000` (L25) | none: the response is a **bare array** (L167-170) | - | - |
| Plain page | `page` or `limit` sent ("paged"), no `days` window | `date` / `month` / none | `(page - 1) * limit` | `limit` | match count | `max(1, ceil(total / limit))` | `skip` |
| Window page 1 | paged + `days`, page 1 | `[windowStart, istDayEnd()]` | 0 | `WINDOW_MAX_ROWS = 500` (L27), ignores `limit` | rows in the window | `1 + ceil(olderCount / limit)` | 0 |
| Window page >= 2 | paged + `days`, page >= 2 | `< windowStart` | `(page - 2) * limit` | `limit` | rows older than the window | `1 + ceil(total / limit)` | `windowCount + skip` |

- `windowStart = istDayStart() - (days - 1) * 24 h` (L91). `olderCount` / `windowCount` come from one extra `countDocuments` on the other side of the window (L175-180). Find (L160-165): `.select("-billImagePublicId -__v")` (`LIST_PROJECTION`, L23) `.populate("driver", "name username phone").populate("vehicle", "name vehicleNumber capacity").populate("customer", "name phone area").sort({ suppliedAt: -1 })`; no tie-breaker on equal timestamps.
- Stats: one `$group` over the same `query` object as `total` (L184-199). In window mode they therefore describe the window on page 1 and all older rows on later pages; never add them up as a grand total.
- 200 (paged) `{ logs, total, page, limit, totalPages, serialStart, stats: { totalCans, totalCansTakenBack, totalCases, casesBySize: { "300ml", "500ml", "1L", "2L" }, totalAmount, uniqueDrivers, uniqueCustomers } }` (L217-227); `totalAmount` is rounded to 2 dp. 500 text: `Failed to load entries.`
- Silent limits: window rows beyond 500 are returned by no page, exports stop at 5000 rows, and a row dated after today matches neither window filter (see §16).

| POST body field | Rule | 400 message (unless noted) |
|---|---|---|
| `logType` | `"cash"` -> cash; anything else -> `"water"` (L240) | - |
| `driverId` | Required ObjectId of a `role: "driver"` user, active or not | `Valid driver is required.` / `Driver not found.` |
| `customerId` | Water only; required ObjectId of an `isActive: true` customer | `Valid customer is required.`; **404** `Customer not found or inactive.` |
| `vehicleId` | Optional ObjectId of an existing vehicle, active or not; stored on water rows only | `Invalid vehicle id.` / `Vehicle not found.` |
| `suppliedAt` | Missing / `null` / `""` -> now; else `parseSuppliedAtInput` (§10); no bounds, future dates accepted | `Invalid delivery date.` |
| `notes` | Optional text | - |
| `productType`, `cansDelivered`, `cansTakenBack`, `casesDelivered`, `caseSize`, `casePrice` | Water only; quantity rules below | quantity messages |
| `amount` | Water: optional number >= 0 that wins over auto-pricing. Cash: required. Why: "Anything sent that isn't a non-negative number is rejected rather than stored as NaN" (L264-265) | `Amount must be a valid non-negative number.` |
| `cashType` | Cash only: `debit` / `fuel` | `Cash type must be debit or fuel.` |

- POST write: the three existence checks run in one `Promise.all` (L286-292). Water amount = `amountValue ?? autoAmount(customer, quantities)` (L318; pricing rule in §10), left unset when it cannot be priced. Never set here: `paymentStatus` (admin-created deliveries have none and read as cash) and any bill image. Result: 201 `created.toObject()` (not populated); 500 text `Failed to save delivery log.` The admin UI only ever sends `logType: "water"` (`apps/web/app/admin/supplies/page.tsx:614`).
- Quantity rules (`validateDeliveryQuantities`, `apps/web/lib/supplyProduct.ts:59-105`) are shared by this POST, the PATCH below, the driver POST and the client forms "so validation copy and pricing never drift apart". The first failing rule's text is the 400 message; `{ partial: true }` skips only the "required" rules.
- `case` rules: no cans fields (`Cans fields do not apply to a case delivery.`); `caseSize` required (`Choose the bottle size.`) and one of `300ml`, `500ml`, `1L`, `2L` (`Bottle size must be 300ml, 500ml, 1L or 2L.`); `casesDelivered` required (`Enter cases delivered.`) and an integer >= 1 (`Cases delivered must be a positive integer.`); `casePrice` required (`Enter the price per case.`) and finite >= 0 (`Price per case must be a valid non-negative number.`).
- `can` rules (any `productType` other than exactly `case`): no `casesDelivered` (`Cases delivered does not apply to a can delivery.`); no `caseSize` / `casePrice` (`Bottle size and price per case only apply to case deliveries.`); at least one of `cansDelivered` / `cansTakenBack` (`Enter cans delivered, cans taken back, or both.`); each an integer >= 0 (`Cans delivered must be a non-negative integer.` / `Cans taken back must be a non-negative integer.`).

#### /api/admin/supplies/[id] - PATCH, DELETE (`apps/web/app/api/admin/supplies/[id]/route.ts`)
| PATCH body field | Semantics | 400 message |
|---|---|---|
| `amount` | Omitted = keep (or re-price if a priced quantity changed); `null` / `""` = clear and re-price from the quantities; number >= 0 = explicit and always wins (L61-71) | `Amount must be a valid non-negative number.`; `null` on a cash row: `Please enter a valid amount.` |
| `adminRemark`, `notes` | `textField` (L41-46): omitted or non-string = untouched; `""` or `null` = `$unset`; else trimmed text | - |
| `suppliedAt` | If sent, must parse with `parseSuppliedAtInput` | `Invalid date/time.` |
| `vehicleId` | ObjectId of an **active** vehicle (both POST routes accept inactive ones); empty is ignored, so a vehicle cannot be cleared | `Invalid vehicle id.` / `Selected vehicle is not available.` |
| `cashType` | `debit` / `fuel`; cash rows only | `Invalid cash type.` / `Cash type applies to cash entries only.` |
| `paymentStatus` | `cash` / `upi` / `not_paid`; water rows only | `Invalid payment status.` / `Payment status applies to deliveries only.` |
| `productType` | `can` / `case` | `Invalid product type.` |
| `cansDelivered`, `cansTakenBack` (`null` = clear), `casesDelivered`, `caseSize`, `casePrice` | Water rows only | `Product fields apply to deliveries only.` + quantity messages |

- Not changeable: `driver`, `customer`, `logType`, the bill image (absent from `SetPayload`, L23-37). Flow: optional `Vehicle.exists({ _id, isActive: true })` -> `SupplyLog.findById(id).select(...).populate("customer", "cashPerCan").lean()` (L102-105; a row is water unless `logType === "cash"`) -> build `$set` / `$unset` -> `findByIdAndUpdate` with the list projection and populates (L214-219).
- Product switch (L144-177): target type = the sent `productType`, else the row's current type. "Sending "can" for an older row with no productType just records it; that is not a switch." A switch needs the full quantity set of the new product and `$unset`s the other family's fields; a plain edit validates with `partial: true`.
- Re-pricing (L179-206) runs when `amount` is `null`, or when `amount` is omitted AND (the product switched, or a sent `casesDelivered` / `casePrice` / `cansDelivered` differs from the saved value). Why: "a remark or payment-status edit never touches the amount." Re-pricing takes the factor that was not sent from the saved row; if the row cannot be priced, `amount` is `$unset` only when switching or explicitly cleared. Consequence: changing a quantity without sending `amount` overwrites a manually typed amount (see §16).
- Other errors: 400 `Invalid supply id.`, 400 `Nothing to update.` (L209), 404 `Supply not found.`; 500 text `Failed to update. Please try again.`
- DELETE (L228-255): hard delete, `SupplyLog.findByIdAndDelete(id).select("billImagePublicId").lean()`; 200 `{ ok: true }`; 500 text `Failed to delete supply log.`
- DELETE side effect: when the row had `billImagePublicId`, `after(() => deleteImageFromCloudinary(publicId).catch(log))` runs once the response is sent ("the admin doesn't wait on Cloudinary, and a failure there changes nothing", L244-249). A failure is only logged and the image is orphaned.

#### /api/admin/vehicles - GET, POST (`apps/web/app/api/admin/vehicles/route.ts`)
- Naming trap (L34): the registration "Number" is stored in `name`; the "Model" is stored in `vehicleNumber` (see §9, §10).
- GET (L11-25): `Vehicle.find().select("-odometerHistory").sort({ createdAt: -1 }).lean()`; active and inactive; bare array.
- POST (L27-60): `name`, `vehicleNumber`, `capacity` (a string) are all required -> 400 `Number, model, and capacity are required.` 201 the created document (`odometer: 0`, `odometerHistory: []`).
- Uniqueness: `Vehicle.exists({ name: { $regex: "^<escaped>$", $options: "i" } })` -> 409 `A vehicle with this number already exists.` ("Two vehicles can share a model, but not a registration number", L46). It is check-then-insert with no unique index behind it (see §16). The 11000 catch (L55-57) can only fire from the obsolete `vehicleNumber_1` index while that still exists (`apps/web/lib/mongodb.ts:30-32`).

#### /api/admin/vehicles/[id] - GET, PATCH, DELETE (`apps/web/app/api/admin/vehicles/[id]/route.ts`)
- All three: 400 `Invalid vehicle id.`, 404 `Vehicle not found.`
- GET (L14-45): projection `name, vehicleNumber, capacity, isActive, odometer, odometerLastUpdated, createdAt, odometerHistory: { $slice: -200 }`. History entries are `{ reading, recordedAt, driverId, _id }` (`_id` is Mongoose's subdocument default, unverified); `driverId` is not populated. `MAX_HISTORY_ENTRIES = 200` (L12): "the array grows by one entry per driver-day forever, so only the newest entries are sent".
- PATCH whitelist (L60-65): `name` (`Number cannot be empty.`), `vehicleNumber` (`Model cannot be empty.`), `capacity` (`Capacity cannot be empty.`), all trimmed strings, plus `isActive` (booleans only). No recognised field -> 400 `No valid fields to update.`
- PATCH has no odometer field: a wrong reading cannot be corrected through the API (see §16).
- PATCH `name` runs the same case-insensitive check excluding the vehicle itself -> 409. The response omits `odometerHistory`. Disabling a vehicle does not unassign it from drivers.
- DELETE (L126-158): `SupplyLog.exists({ vehicle: id })` -> 409 `This vehicle has delivery records. Disable it instead.` Otherwise `Vehicle.findByIdAndDelete`, then `User.updateMany({ assignedVehicle: id }, { $set: { assignedVehicle: null } })` (two writes, no transaction). 200 `{ success: true }`.

### 7.4 Driver endpoints

#### /api/driver/customers - GET, POST (`apps/web/app/api/driver/customers/route.ts`)
- GET (L8-23): `Customer.find({ isActive: true }).select("name phone area subscriptionCans cashPerCan locationType").sort({ name: 1 }).lean()`. Every driver sees every active customer; unbounded; bare array. 500 text `Failed to load customers.`
- GET has no `isDeleted` filter; it relies on the admin DELETE also setting `isActive: false` (see §16).

| POST body field | Required | Validation | 400 message |
|---|---|---|---|
| `name`, `phone`, `address` | yes | Non-empty string | `Name is required.` / `Phone is required.` / `Location is required.` |
| `email` | no | Empty -> not stored | - |
| `locationType` | no | Enum whenever the key is present; `null` and `""` are rejected | `Location type must be home, office, or both.` |
| `cashPerCan` | **yes** | Number >= 0 | `Cash per can is required.` / `Cash per can must be a non-negative number.` |

- Server-fixed (L57-60): `subscriptionCans: 1`, `registeredDate: now`, `createdBy: driver.id`. `area`, `securityDeposit` and `isActive` are not accepted. Write: `createOrRestoreCustomer`, so a soft-deleted customer with that phone is restored and overwritten with the driver's values (see §10, §16).
- 201 the full customer document; 409 `A customer with this phone number already exists.`; 500 text `Failed to register the customer.`

#### /api/driver/supplies - GET, POST (`apps/web/app/api/driver/supplies/route.ts`)
- `MAX_IMAGE_BYTES = 4 * 1024 * 1024` (L22): "Vercel refuses function request bodies over 4.5 MB, so stay under it." The 4 MB figure is repeated in the client check (`apps/web/app/driver/page.tsx:644`) and in the error texts on both sides. `MAX_BODY_BYTES = MAX_IMAGE_BYTES + 64 * 1024` (L24): "The multipart body is the image plus a few short fields."
- `RECENT_DAYS = 5` (L25) is also defined at `apps/web/app/driver/page.tsx:169` and `apps/web/app/admin/supplies/page.tsx:49`; keep the three in sync.
- GET window (L96-131): `?date=YYYY-MM-DD` = that IST day, any day (400 `Invalid date format.`); without it, from `istDayStart()` minus 4 days to `istDayEnd()`. Query: `SupplyLog.find({ driver: driver.id, suppliedAt: { $gte, $lte } }).select("-billImagePublicId -adminRemark -__v").populate("vehicle", "name vehicleNumber capacity").populate("customer", "name phone area").sort({ suppliedAt: -1 }).limit(200).lean()`.
- GET result: a bare array of the session driver's own water and cash rows together (the client splits them); hard cap of 200 rows with no indicator (see §16). 500 text `Failed to load your entries.`
- POST body format (L48-87): JSON, or `multipart/form-data` when the `Content-Type` header contains that string. Multipart text fields use the JSON key names; the file field is **`billImage`**, kept only when it is a `File` with `size > 0`. The JSON path does not strip a client-sent `billImageFile` key, so a non-File value can reach the cash branch (L82-83, L161; see §16).

| POST field | Delivery (`logType` is not `"cash"`) | Cash (`logType: "cash"`) |
|---|---|---|
| `customerId` | Required ObjectId (400 `Customer is required.` / `Invalid customer.`) of an active customer (**404** `Customer not found or inactive.`) | ignored |
| `vehicleId` | Optional ObjectId (400 `Invalid vehicle.`) of an existing vehicle, active or not (400 `Vehicle not found.`) | ignored, not validated, not stored |
| quantities | Quantity rules of §7.3 | ignored |
| `amount` | **Ignored**; the amount is `autoAmount(customer, quantities)` | Required number >= 0 (400 `Amount must be a valid non-negative number.`) |
| `paymentStatus` | `upi` / `not_paid`; anything else -> `cash` (L235-236) | not stored |
| `cashType` | not stored | `debit` / `fuel` required (400 `Cash type must be debit or fuel.`) |
| `billImage` | ignored, never uploaded | Required for `fuel` (400 `Fuel bill image is required for fuel entries.`), optional for `debit` |
| `notes` | optional | optional |

- Accepted image types, `isAcceptedImage` (L91-94): MIME type starts with `image/`, or the MIME type is empty and the file name ends `.heic`, `.heif`, `.jpg`, `.jpeg`, `.png` or `.webp` ("Some phones send HEIC with an empty MIME type, so the extension counts too"). Else 400 `Please upload a valid image file.` The declared type is trusted; nothing inspects the bytes (see §16).
- Image limits: `Content-Length` above `MAX_BODY_BYTES` -> 400 `Image is too large. Please keep it under 4 MB.` before the body is read (L137-141; an absent header counts as 0 and passes); then file `size` above `MAX_IMAGE_BYTES` -> the same 400 (L173). The platform's own 413 is handled by the client (`apps/web/app/driver/page.tsx:812`).
- Server-fixed: `driver` = the session id (L216); `suppliedAt = new Date()` (L217), so drivers cannot back-date. Order of side effects: (1) validation, (2) `connectToDatabase()`, (3) delivery only: customer and vehicle lookups in parallel (L184-187), (4) cash with an image only: `uploadImageToCloudinary(file)` (L194), (5) `SupplyLog.create(payload)` (L246).
- Rollback: if anything throws after the upload, the image is deleted best-effort and that error is swallowed (L251-253). Any new step between upload and create must stay inside the same `try`.
- 502 rule (L254-259): a thrown `Error` whose message matches `/upload|timed out/i` is returned verbatim as 502 `{ error: error.message }` ("Upload problems carry a message written for the driver"); everything else is 500 `Failed to save the entry. Please try again.`
- 502 caveat: the DB calls sit in the same `try`, so a DB error containing "timed out" would also be returned verbatim, and a Cloudinary rejection without the word "upload" becomes the generic 500 (see §16).
- 201 `created.toObject()`, which includes `billImagePublicId` although list projections hide it ("The driver screen only checks res.ok and refetches its list", L247-248).

#### GET /api/driver/vehicles (`apps/web/app/api/driver/vehicles/route.ts`)
- In parallel (L14-20): `Vehicle.find({ isActive: true }).select("name vehicleNumber capacity").sort({ createdAt: -1 }).lean()` and `User.findById(driver.id).select("assignedVehicle").lean()`.
- 200 `{ vehicles, assignedVehicleId }` (string or `null`). The id is returned even when that vehicle is inactive and therefore absent from `vehicles`.

#### /api/driver/vehicles/odometer - GET, PATCH (`apps/web/app/api/driver/vehicles/odometer/route.ts`)
- GET (L16-51): no assigned vehicle, or the vehicle document is gone -> 200 `{ hasVehicle: false, filledToday: false, odometer: null, history: [] }`. Why: "hasVehicle:false tells the client not to show the blocking daily prompt (which could never be satisfied)".
- GET otherwise: `Vehicle.findById(assigned).select({ odometer: 1, odometerLastUpdated: 1, odometerHistory: { $slice: -5 } })` (`HISTORY_ENTRIES = 5`, L13); `filledToday = odometerLastUpdated >= istDayStart()` (L39); 200 `{ hasVehicle: true, filledToday, odometer, history: [{ reading, recordedAt }] }`, newest first. The history is the vehicle's, whoever recorded it.
- PATCH (L53-108): body `{ odometer }`, an integer from 0 to `MAX_ODOMETER = 9_999_999` (L14), else 400 `Invalid odometer value.` No comparison with the previous reading. No assigned vehicle -> 400 `No vehicle assigned to you.`
- Atomic daily gate (L75-98): one `Vehicle.findOneAndUpdate`. Filter: `{ _id: assignedVehicle, $or: [{ odometerLastUpdated: { $exists: false } }, { odometerLastUpdated: null }, { odometerLastUpdated: { $lt: istDayStart() } }] }`. Update: `$set { odometer, odometerLastUpdated: now }` + `$push odometerHistory { reading, recordedAt: now, driverId }`.
- Why one write: "the daily gate is part of the filter, so two overlapping submits cannot both pass it and record the day twice." Do not split it into a read followed by a write. No match -> 400 `Odometer already submitted for today.` (also the answer when the assigned vehicle document no longer exists). Success -> 200 `{ success: true }`.
- The gate is per vehicle per IST day, not per driver: drivers sharing a vehicle share one daily reading, and a typo cannot be resubmitted that day (see §16).

### 7.5 Shared endpoint: /api/stock

- File: `apps/web/app/api/stock/route.ts`. Callable by any signed-in admin or driver. The guard is a route-private `requireAnyRole()` built on `getServerUser()` (L11-14), not one of the two shared helpers, so a search for `requireAdmin` / `requireDriver` misses this route (`apps/web/README.md:21` says every route uses those two).
- Why both roles: "Stock is shared by the admin and every driver. A session whose role was stripped (deactivated driver, see lib/auth.ts) is not signed in here either."
- Why outside `/api/admin` and `/api/driver`: one dialog (`apps/web/app/components/StockModal.tsx`) is mounted in both portals (`apps/web/app/admin/layout.tsx:330`, `apps/web/app/driver/layout.tsx:322`) and calls this one URL (inferred from the callers). The path prefix carries no authorization meaning anyway (§7.1).
- GET (L16-30): `Stock.findOne({}).lean()`, or `{ cans: 0, dispensers: 0, stands: 0 }` when no document exists ("Read-only: the first PATCH creates the document"). A stored document also carries `_id`, `updatedBy`, `createdAt`, `updatedAt`, `__v` (`__v` is a Mongoose default, unverified).
- PATCH (L32-79): optional `cans`, `dispensers`, `stands`. Each key that is sent must be a number >= 0 (400 `Cans must be a non-negative number.` / `Dispensers must be a non-negative number.` / `Stands must be a non-negative number.`) and is stored as `Math.floor(value)`; no upper bound. Write: `Stock.findOneAndUpdate({}, { $set }, { upsert: true, returnDocument: "after" })`; `updatedBy` = a fixed admin label or the driver's session display name (L53-54). 200 the document.
- Values are absolute, not increments: last write wins, the dialog always sends all three counts (`apps/web/app/components/StockModal.tsx:71`), an empty body still rewrites `updatedBy` / `updatedAt`, and no history is kept (see §16).
- Deliveries never touch stock: no supplies route imports `apps/web/models/Stock.ts`.

### 7.6 Auth endpoints (next-auth)

- Catch-all: `const handler = NextAuth(authOptions); export { handler as GET, handler as POST }` (`apps/web/app/api/auth/[...nextauth]/route.ts:4-6`). Every sub-path is implemented inside next-auth 4.x; nothing is custom. Configuration is `authOptions` (`apps/web/lib/auth.ts:119-233`): one Credentials provider, JWT sessions, `pages.signIn = "/login"`. Providers, callbacks, throttle and session lifetime: see §6.6.

| Sub-path | Method | Triggered by | Evidence |
|---|---|---|---|
| `/api/auth/session` | GET | Explicit fetch after sign-in to read the role; also `SessionProvider` / `useSession()` | `apps/web/app/login/page.tsx:43`; `apps/web/app/admin/layout.tsx:86`, `apps/web/app/driver/layout.tsx:486` |
| `/api/auth/providers`, `/api/auth/csrf`, `/api/auth/callback/credentials` | GET, GET, POST | `signIn("credentials", { username, password, redirect: false })` | `apps/web/app/login/page.tsx:29` (sub-paths are next-auth client internals, unverified) |
| `/api/auth/csrf`, `/api/auth/signout` | GET, POST | `signOut({ callbackUrl })` | `apps/web/app/admin/layout.tsx:100`, `apps/web/app/driver/layout.tsx:21`, `apps/web/app/driver/layout.tsx:121`, `apps/web/app/driver/page.tsx:177` (unverified internals) |

- Failure contract: the login page only tests `res.ok` and shows one generic message for every refusal (`apps/web/app/login/page.tsx:35-36`). These are the only `/api` endpoints reachable without a session.

### 7.7 External APIs

#### Cloudinary (server side)
- All code is in `apps/web/lib/cloudinary.ts`; `:71` is the only server-side `fetch` in the project. No SDK: `apps/web/package.json:14-22` has no `cloudinary` dependency, and the module uses global `fetch` / `FormData` and `node:crypto` only.
- Config (`getCloudinaryConfig`, `:26-50`): `CLOUDINARY_URL` must match `^cloudinary:\/\/([^:]+):([^@]+)@(.+)$` -> API key, API secret, cloud name. Each part goes through `normalizeCredential` (trim; strip one surrounding pair of `<>`, double or single quotes; `:14-24`) and then `decodeURIComponent`. Everything after `@` is taken as the cloud name, so a query-string suffix breaks every call. The value is parsed on every call, so a bad value surfaces only at the first upload or delete. Config errors thrown: `Missing CLOUDINARY_URL in environment variables.`, `Invalid CLOUDINARY_URL format.`, `Incomplete CLOUDINARY_URL credentials.`
- Signature (`createSignature`, `:52-63`): drop undefined / null / empty params, sort by key, join `key=value` with `&`, append the API secret, SHA-1, hex. A new upload or destroy parameter must also be added to the signature input (`:87`, `:127`).
- Upload (`uploadImageToCloudinary(file, folder)`, `:81-119`): `POST https://api.cloudinary.com/v1_1/{cloudName}/image/upload`, multipart fields `file` (the `File` from the driver's request, raw binary), `folder`, `timestamp` (unix seconds), `api_key`, `signature`. Signed params: `folder`, `timestamp`. Folder: default `royal-king-water-supply/fuel-bills` (`:83`); the only caller passes none. No `public_id` (Cloudinary assigns it), preset, transformation or `allowed_formats`. Upload result: needs `response.ok` + `secure_url` + `public_id` -> `{ secureUrl, publicId }`; otherwise throws `payload.error.message ?? "Failed to upload image to Cloudinary."`
- Delete (`deleteImageFromCloudinary(publicId)`, `:121-149`): no-op for a falsy id; `POST .../image/destroy` with `public_id`, `timestamp`, `invalidate=true`, `api_key`, `signature` (signed: `invalidate`, `public_id`, `timestamp`). Only `response.ok` is checked; a non-OK response throws `error.message ?? "Failed to delete image from Cloudinary."`
- Timeout: `CLOUDINARY_TIMEOUT_MS = 20_000` through `AbortSignal.timeout` (`:67-79`), rethrown as `Image upload timed out. Please try again.` / `Image delete timed out. Please try again.` No retries. Why: "Cloudinary must never hang a driver's request: a stalled call turns into a clear, retryable error instead of a spinner until the platform gives up."
- Callers: upload at `apps/web/app/api/driver/supplies/route.ts:194`; rollback delete at `apps/web/app/api/driver/supplies/route.ts:252`; delete on ledger-row delete at `apps/web/app/api/admin/supplies/[id]/route.ts:248`. Size and type limits are the caller's job (§7.4). Stored on the ledger row: `billImageUrl`, `billImagePublicId` (`apps/web/models/SupplyLog.ts:73-74`).
- Display is URL rewriting only (`apps/web/lib/imageUrl.ts:4-12`): `cloudinaryThumb(url, width = 320)` inserts `w_{width},c_limit,q_auto,f_auto/` after `/upload/`; `cloudinaryAuto` inserts `q_auto,f_auto/`. Browsers load and download the image straight from Cloudinary (`apps/web/app/driver/page.tsx:673`, `apps/web/app/admin/supplies/page.tsx:405`).
- Unverified (account-side): the `public_id` format, whether delivery URLs are public, how non-image files are treated, that `destroy` answers 200 for an unknown id, and whether the 20 s timeout can fire before the host ends the function.

#### Google Identity Services and Drive (browser side)
- All code is in `apps/web/lib/googleDrive.ts`, loaded by dynamic import only from `handleSaveToDrive` (`apps/web/app/admin/supplies/page.tsx:544-569`). "Runs entirely in the browser": the app server never sees the token or the file.
- Script URL: `https://accounts.google.com/gsi/client` (`:9`), appended once to `<head>` as an async script by `loadGoogleIdentity()` (`:38-53`). The promise is memoised; on a load error it is reset, the tag is removed and it rejects with `Couldn't load Google sign-in. Check your connection and try again.`
- OAuth scope: `https://www.googleapis.com/auth/drive.file` only (`:10`), "so the app can only see files it creates, never the rest of the admin's Drive".
- Token flow (`requestDriveToken`, `:59-96`): the GIS token model, `google.accounts.oauth2.initTokenClient({ client_id, scope, callback, error_callback }).requestAccessToken()`. A popup; no redirect URI, refresh token or backend exchange. A new token client per request; no `prompt` or `hint`. Token caching: module variable `cachedToken = { value, expiresAt: now + (expires_in ?? 3600) * 1000 }` (`:55`, `:78-81`), reused while `expiresAt > now + 60 s` (`:60`). Lost on reload, never persisted ("kept in memory for this tab only").
- Token errors: `Google didn't allow access to Drive, so nothing was saved.`; popup closed: `Google sign-in was closed before it finished, so nothing was saved.`; other popup failure: `Couldn't open Google sign-in. Allow pop-ups for this site and try again.`; script missing: `Google sign-in didn't load. Check your connection and try again.`
- Upload (`saveCsvAsGoogleSheet(token, name, csv)`, `:99-134`): `POST https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,webViewLink` with `Authorization: Bearer <token>` and `Content-Type: multipart/related; boundary=rk-sheet-<base36 time>`. Returns `{ id, webViewLink }`. Conversion to Google Sheets: part 1 is `application/json; charset=UTF-8` = `{ name, mimeType: "application/vnd.google-apps.spreadsheet" }`; part 2 is `text/csv; charset=UTF-8` = the CSV, built without a BOM (`apps/web/app/admin/supplies/page.tsx:559`). The target `mimeType` makes Drive convert the CSV into a native sheet. No `parents` is sent (the README says the file lands in the top level of My Drive; unverified). Every save creates a new file.
- Upload errors: 401 clears `cachedToken` and throws `Your Google sign-in expired. Tap Save to Google Drive again.`; any other non-2xx throws `Google Drive didn't accept the sheet. Please try again.`
- Client ID unset: `googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? ""` (`:15`), inlined at build time. When empty, the handler shows the notice `This feature is not available yet.` and returns before any Google script loads (`apps/web/app/admin/supplies/page.tsx:551-555`). The menu item is always shown.
- Call order: dynamic import -> `loadGoogleIdentity()` -> `requestDriveToken()`, all awaited inside the click handler, although the module comment says to load the script early "so the sign-in popup can open straight from the click without being blocked". Whether browsers block the first popup is unverified (see §16).
- App headers: `apps/web/next.config.js:25-50` sets no page-level Content-Security-Policy (only on `/sw.js`), so nothing in the app blocks the script, the popup or the `googleapis.com` request.
- Console-side requirements, from `apps/web/README.md:71-77` (actual console state is not recorded, unverified): Drive API enabled; OAuth consent screen with the `drive.file` scope (while in Testing, each admin's Google account must be a test user); an OAuth client ID of type Web application; Authorized JavaScript origins listing every origin the admin page is opened from (local dev, production, the Codespaces forwarded address); no redirect URI. Changing the client ID needs a rebuild.

#### Google Fonts (build time)
- `apps/web/app/layout.tsx:2` imports `Inter` from `next/font/google`; `apps/web/app/layout.tsx:7-11` configures `subsets: ["latin"]`, `display: "swap"`, CSS variable `--font-inter`.
- `next/font` fetches the font files during `next build` and serves them from the app's own origin, so browsers make no request to Google at runtime and a cold build needs network access to Google Fonts (library behaviour, unverified; not read from source). No `fonts.googleapis.com` or `fonts.gstatic.com` URL appears anywhere in the source.

### 7.8 Not present

Verified by searching the repository tree at `c251bc4` (source, config, `apps/web/public/sw.js`):

- WebSockets / SSE / streaming responses: none (no `WebSocket`, `EventSource`, `text/event-stream` or `ReadableStream`).
- Webhooks: none received (no receiver route) and none sent.
- Cron / scheduled jobs: none. `apps/web/vercel.json` has only `$schema` and `regions`; the only deferred work is the `after()` call in the ledger DELETE (§7.3).
- Server actions: none (no `"use server"` directive). GraphQL: none. Pages-router API: none (no `apps/web/pages` directory).
- Public / unauthenticated data API: none. All 29 handlers call a guard first; only the next-auth endpoints (§7.6) answer without a session.
- Health-check or ping route: none (removed, §7.9).
- Push notifications: none (no `PushManager`, `showNotification` or `push` listener).
- Other server-side outbound HTTP: none besides Cloudinary; MongoDB is reached through the driver.

### 7.9 Removed endpoints

| Path | Methods at removal | What it was | Removed in | Date |
|---|---|---|---|---|
| `/api/test` | GET | Unauthenticated DB connection check | `a5c19d6` | 2026-06-22 |
| `/api/db/ping` | GET | Unauthenticated DB ping that returned the DB error message | `e810079` | 2026-09-24 |
| `/api/admin/stats` | GET | Dashboard counts (active drivers, vehicles, customers; deliveries on one IST day, today or `?date=`) | `e810079` | 2026-09-24 |
| `/api/admin/assignments` | GET, POST | List / create supply-point assignments | `e810079` | 2026-09-24 |
| `/api/admin/supply-points` | GET, POST | List / create supply points | `e810079` | 2026-09-24 |
| `/api/admin/supply-points/[id]` | PATCH, DELETE | Edit / delete a supply point | `e810079` | 2026-09-24 |
| `/api/driver/assignments` | GET | The driver's own assignments | `e810079` | 2026-09-24 |
| `/api/driver/assignments/[id]/complete` | PATCH | Mark an assignment complete | `e810079` | 2026-09-24 |
| `/api/driver/supplies/[id]` | PATCH | Driver attached a bill photo to an existing cash entry (8 MB cap) | `e810079` | 2026-09-24 |

- These exist only in git history; a checkout that still contains one predates the commit named in its row (see §18). `e810079` is the large API refactor (82 files changed) although its subject mentions only a Node engine bump. The same commit deleted the `Assignment` and `WaterSupplyPoint` models and added `apps/web/lib/api.ts`, `apps/web/lib/customers.ts`, `apps/web/lib/format.ts` and `apps/web/models/index.ts`.
- Leftover: `SupplyLog.pointName` (`apps/web/models/SupplyLog.ts:46`) is still read as a fallback display name but no current route writes it.

## 8. Feature guide

One subsection per feature, always with the same five labels: **Files** (line counts or key line ranges), **What the user sees and does**, **Rules** (validation, limits, defaults, exact messages), **Data** (hooks and endpoints, by name) and **Gotchas** (each with file:line).
Owned elsewhere: request/response shapes, status codes and the Cloudinary and Google HTTP calls in §7; collections, pricing, soft delete, IST day rules and legacy-data tolerance in §10; CSS classes, pills, dialog and form patterns in §9; hook cache times and query keys in §6.
Double quotes mark exact on-screen strings and, in WHY notes, exact code comments; `{name}` inside a quote is a placeholder. §8.1-§8.10 cover sign-in and the admin portal (Stock is shared with drivers); the driver portal starts at §8.11.

### 8.1 Sign-in, home page and role routing

- **Files:** `apps/web/app/page.tsx` (106 lines, home), `apps/web/app/login/page.tsx` (139 lines), `apps/web/proxy.ts` (37 lines, role routing), `apps/web/app/admin/page.tsx` (7 lines, redirect only). Session internals: `apps/web/lib/auth.ts` (see §6).
- **What the user sees and does:**
  - Home `/`: title "Royal King Water Supply", card "Admin Portal" -> `/login?role=admin`, card "Driver Portal" -> `/login?role=driver`, then the install prompt (see §11) (`apps/web/app/page.tsx:29-96`).
  - Login: heading "Admin Login", "Driver Login" or, without a `role` param, "Royal King Water Supply"; fields Username and Password; button "Sign In" / "Signing in…"; a link to the other role's login (only when `role` is `admin` or `driver`); hint "Driver credentials are assigned by the administrator" unless `role=admin` (`apps/web/app/login/page.tsx:71-112`).
  - After a successful sign-in the page reads `/api/auth/session` and calls `router.replace("/admin/amounts")` for an admin or `router.replace("/driver")` for a driver. WHY `replace`: it "keeps the login page out of the back-button history" (`apps/web/app/login/page.tsx:41-49`).
- **Rules:**
  - `?role=` is cosmetic: both variants submit the same `signIn("credentials", { username, password, redirect: false })`, so either role can sign in from either; client validation is HTML `required` only, with no trim and no length check (`apps/web/app/login/page.tsx:13, 29-33, 82, 87`).
  - Messages: every failed sign-in shows "Invalid username or password.", whatever the cause (wrong credentials, inactive driver, throttled, server error); a session without a role shows "Unexpected error. Please try again."; a thrown request shows "Network error. Please check your connection and try again." (`apps/web/app/login/page.tsx:35-57`).
  - Role routing is decided in `apps/web/proxy.ts`, before any page renders:

| Request path | Session token | Result | Where |
|---|---|---|---|
| `/` or `/login` | role `admin` | redirect to `/admin/amounts` | `apps/web/proxy.ts:9-12` |
| `/` or `/login` | role `driver` | redirect to `/driver` | `apps/web/proxy.ts:13-15` |
| `/` or `/login` | none, or a token whose role was stripped | the page renders | `apps/web/proxy.ts:9-16` |
| starts with `/admin` (or `/driver`) | role is not `admin` (not `driver`) | redirect to `/login`; no `callbackUrl` is added and the login page reads none, so the wanted page is lost | `apps/web/proxy.ts:18-24` |
| `/admin` exactly | admin | server `redirect("/admin/amounts")`, because "There is no dashboard" | `apps/web/app/admin/page.tsx:3-6` |

- **Data:** NextAuth `signIn("credentials")` and `GET /api/auth/session`; no React Query. Session lifecycle and login throttle: see §6; routes: see §7.
- **Gotchas:**
  - Neither page checks the session itself: "Anyone who is signed in is redirected by proxy.ts before this page renders" (`apps/web/app/page.tsx:6-7`; `apps/web/app/login/page.tsx:20-21`). `/` and `/login` must therefore stay in the matcher, which does not cover `/api/*`: every API handler checks the role itself (`apps/web/proxy.ts:35-37`; see §6).
  - Home is `height: "100vh"` with `overflow: "hidden"`: content taller than the screen cannot scroll (`apps/web/app/page.tsx:11, 17`).

### 8.2 Admin shell and navigation

- **Files:** `apps/web/app/admin/layout.tsx` (351 lines: `navItems` 9-43, `isActivePath` 47-49, `NavLinks` 51-80, `AdminLayout` 84-90, `AdminShell` 92-351); `apps/web/app/admin/error.tsx` (34 lines).
- **What the user sees and does:** a sticky 65px header with the brand "Royal King" / "Admin" (not a link), the nav links on desktop and a round profile button (icon only, `aria-label` "Account menu") at every width. The profile menu opens under that button; its header shows the session name (fallback "Admin") above the caption "Administrator", and since the admin's session name is itself the literal "Administrator", both lines read the same (`apps/web/app/admin/layout.tsx:120, 127-216`; `apps/web/lib/auth.ts:156`).

| Order | Items and targets | Desktop (wider than 860px) | Mobile (860px and below) |
|---|---|---|---|
| 1-3 | Analytics -> `/admin/amounts`; Deliveries -> `/admin/supplies`; Customers -> `/admin/customers` | header nav, icon + label | fixed bottom tab bar, icon above label |
| 4-5 | Drivers -> `/admin/drivers`; Vehicles -> `/admin/vehicles` | profile menu | profile menu |
| 6 | Stock -> opens `StockModal`, no route (see §8.10) | profile menu | profile menu |
| 7-8 | Sign Out -> `signOut({ callbackUrl: "/" })`; then the text `v` + app version | profile menu, last two lines | same |

- **Rules:**
  - Active item: `pathname === href || pathname.startsWith(href + "/")`, so Customers stays highlighted on `/admin/customers/<id>` (`apps/web/app/admin/layout.tsx:45-49`).
  - The 860px breakpoint is an inline `<style>` block with `!important` rules inside the layout, not in `globals.css`; content is capped at 1200px wide with 80px bottom padding (90px on mobile, clearing the tab bar) (`apps/web/app/admin/layout.tsx:314-325`).
  - The menu closes on an outside `mousedown` and on every route change. Stock closes the menu and sets `stockOpen`; the modal is rendered once in the shell, so it works on every admin page (`apps/web/app/admin/layout.tsx:104-118, 264, 330`).
  - Version text is `process.env.NEXT_PUBLIC_APP_VERSION`, injected from the `version` field of `apps/web/package.json`; bump it for each release. WHY: "so it is easy to tell which build a phone is running" (`apps/web/app/admin/layout.tsx:306-308`; `apps/web/next.config.js:3-10`).
  - Sign-out runs only `signOut({ callbackUrl: "/" })`; the app code clears no cache or storage. If the React Query cache is ever persisted, or the service worker starts caching API or HTML responses, add explicit clearing here (`apps/web/app/admin/layout.tsx:99-101`).
  - Page errors render inside the shell: "Page error" / "Something went wrong. Please try again." / "Retry" (`apps/web/app/admin/error.tsx:22-30`).
- **Data:** `SessionProvider refetchOnWindowFocus={false}` wraps the shell; `useSession()` supplies only the display name. WHY the provider sits here and not in the root layout: "so the public pages don't load it" (`apps/web/app/admin/layout.tsx:82-94`).
- **Gotchas:**
  - No client-side role check exists: pages are protected by `apps/web/proxy.ts:18-20`, APIs by `requireAdmin()` (`apps/web/lib/authHelpers.ts:17-20`). Admin pages also do nothing special on a 401: after the session ends they show a load error or an empty list until a later navigation is redirected by the proxy (see §16).
  - The menu has no Escape handler and no `aria-expanded`; clicking the link of the page already open leaves it open, because the pathname does not change (`apps/web/app/admin/layout.tsx:116-118, 163-165`).

### 8.3 Deliveries and Cash Credits ledger

- **Files:** `apps/web/app/admin/supplies/page.tsx` (1695 lines, one client component): helpers, `LogRow` and `LogTable` 51-285; `SuppliesPage` 287-1695, with state 288-337, queries 339-368, day grouping 442-461, add 592-635, edit 637-731, delete 733-754, header and tabs 758-857, filter panel 859-969, summary bar 971-1005, list and paging 1007-1056, Add dialog 1058-1221, details 1223-1422, bill lightbox 1424-1458, delete confirm 1460-1484, Edit dialog 1486-1692. Product rules shared with the API: `apps/web/lib/supplyProduct.ts` (175 lines).
- **What the user sees and does:**
  - h1 "Deliveries" with two tabs: "Deliveries" (`logType=water`) and "Cash Credits" (`logType=cash`). Each tab keeps its own page number; the filters are shared; only the visible tab's query runs. WHY: "This halves the load on page open and after every add/edit/delete" (`apps/web/app/admin/supplies/page.tsx:290-293, 357-368, 773-793`).
  - Action row: "+ Add Delivery" (Deliveries tab only), "Download ▾" (see §8.4) and "Filter ▾" (▴ while open), which shows the number of active filters, e.g. "Filter (2) ▾", and opens a collapsible filter card with "Clear Filters" (`apps/web/app/admin/supplies/page.tsx:796-848, 859-969`).
  - Summary bar, with server totals for the whole matched set and not just the rows on screen (on unfiltered pages 2+ that set is every record older than the window): Total, Drivers and Total Amount on both tabs; Customers, Cans Del., Cases Del. (with a per-size breakdown such as "500ml 4 · 1L 5 · size not set 2") and Taken Back on the Deliveries tab; "Last 5 days" or "Older records" at the right when unfiltered (`apps/web/app/admin/supplies/page.tsx:463-475, 984-1004`).
  - List: one table per IST day, newest day first, headed "Today", "Yesterday" or a date such as "23 September 2026" (`apps/web/app/admin/supplies/page.tsx:442-461`).
  - Driver note preview: one ellipsised line under the Customer (or Amount) value, full text in the `title` attribute; the row turns amber with a left bar "so it isn't missed" (`apps/web/app/admin/supplies/page.tsx:61-72, 188`; `apps/web/app/globals.css:313-352`).
  - NOT in the row: the admin remark (details dialog and exports only) and any bill thumbnail. A fuel row with a bill has a "Fuel" button that opens the "Fuel Bill Preview" lightbox; the thumbnail (640px-wide Cloudinary variant, shown at most 260px wide) is in the details dialog with "View detailed image" and "Download image" (`apps/web/app/admin/supplies/page.tsx:212-227, 1314-1380, 1424-1458`).
  - Clicking a row, or Enter / Space on it, opens "Supply Details": Date & Time, Driver, Customer (with "View History" -> §8.7), Product, Cans or Cases Delivered, Price per Case, Cans Taken Back, Vehicle, Cash Type, Fuel Bill Image, Amount, Payment Status, Admin Remark, Driver Notes, each only when present; then "Delete" and "Edit Delivery" / "Edit Cash Credit" (`apps/web/app/admin/supplies/page.tsx:1240-1418`).

| Column | Deliveries tab | Cash Credits tab |
|---|---|---|
| S.No | serial within the day group | same |
| 2 | Customer: name, else legacy `pointName`, else "-"; cut to 12 characters + "..." | Amount |
| 3 | Qty: delivered count in bold, product pill ("Can", "Case · 500ml"), a return mark + count whenever `cansTakenBack` is stored (0 included) | Type: "Fuel" (a button when a bill image exists) or the capitalised cash type |
| 4 | Amount + payment pill (Cash / UPI / Not Paid) | (no column) |
| Last | Driver name, cut to 12 characters | same |

- **Rules:**
  - Unfiltered view = recent window: `days=5` is sent when no window-leaving filter is set (`RECENT_DAYS = 5`). Page 1 is the whole window (IST today plus the previous 4 IST days, server cap `WINDOW_MAX_ROWS = 500`); pages 2+ walk older records 50 at a time; `totalPages = 1 + ceil(older / 50)` (`apps/web/app/admin/supplies/page.tsx:49, 351-355`; `apps/web/app/api/admin/supplies/route.ts:27, 84-92, 147-158, 205-216`).
  - Filtered view: ordinary pages of 50 (`SUPPLIES_PAGE_LIMIT`); any filter change resets both tabs to page 1. WHY the Product filter stays inside the window: "it narrows within the same window, so the Cans and Cases totals add up to the unfiltered ones" (`apps/web/app/hooks/useAdminQueries.ts:200`; `apps/web/app/admin/supplies/page.tsx:346-350, 427-430`).
  - S.No is the position inside the day group on the current page, latest first ("top row of every day group is 1"). It restarts on every page and differs from the running "No." in exports; the API's `serialStart` is ignored here (`apps/web/app/admin/supplies/page.tsx:452-458`).
  - Product types: `can` (`cansDelivered`, `cansTakenBack`) or `case` (`casesDelivered`, `caseSize` of 300ml / 500ml / 1L / 2L, `casePrice`); a row without a type reads as Can. Payment status: `cash`, `upi` or `not_paid`; a row without one reads as Cash, and it can be changed only in the Edit dialog (`apps/web/lib/supplyProduct.ts:4-21`; `apps/web/app/components/PaymentPill.tsx:1-8`; `apps/web/app/admin/supplies/page.tsx:1600-1616`). Quantity validation and pricing rules: see §7 and §10.
  - Add Delivery fields: Delivery Date* (max IST today), Driver* (all drivers), Customer* (active only), Product* (Can / Case), Bottle Size* and Price per Case* (Case), Cans or Cases Delivered, Cans Taken Back (Can), Amount "auto-calculated if blank" (Can), Notes (max 1000 characters). There is no UI to add a cash credit (`apps/web/app/admin/supplies/page.tsx:797-801, 1073-1207`).
  - Add checks, in order: "Please select a driver.", "Please select a customer.", "Please enter a delivery date.", `validateDeliveryQuantities`, "Amount must be a valid non-negative number." (`apps/web/app/admin/supplies/page.tsx:594-607`).
  - Add sends no vehicle and no payment status, so an admin-entered row has no vehicle and shows as Cash. It sends a date only; the server stores "now" when that is IST today, otherwise 12:00 IST "so the row sorts inside the day rather than at 05:30" (`apps/web/app/admin/supplies/page.tsx:613-622`; `apps/web/lib/istTime.ts:47-59`).
  - Edit, delivery: Product, Bottle Size, quantity, Price per Case, Cans Taken Back, Amount, Payment Status, Driver Notes, Admin Remark. Edit, cash credit: Amount (required: "Please enter a valid amount."), Admin Remark, Cash Type (Debit / Fuel), Driver Remark. Not editable: date and time, driver, customer, vehicle, bill image (`apps/web/app/admin/supplies/page.tsx:669-671, 1503-1683`).
  - A delivery edit sends the amount only when its text changed (a cash edit always sends it); a blanked amount is sent as `null` "so the server re-prices from the quantity". A blank quantity in a non-switching edit means "unchanged"; only Cans Taken Back can be cleared, by sending `null` (`apps/web/app/admin/supplies/page.tsx:665-668, 679-681, 700-704`).
  - Changing the product in Add or Edit blanks the quantity fields: "A count entered for one product must never be saved as the other"; in Edit, switching back restores the saved values (`apps/web/app/admin/supplies/page.tsx:1122, 1510-1526`).
  - Delete: confirm "Delete Log?" ... "This cannot be undone." with "Cancel" (focused) and "Delete Permanently". It is a hard delete; the server removes the Cloudinary bill image after it has responded (`apps/web/app/admin/supplies/page.tsx:1460-1484`; `apps/web/app/api/admin/supplies/[id]/route.ts:241-249`).

| Filter | Control | API param | Tabs | Leaves the 5-day window |
|---|---|---|---|---|
| Date | date input, max IST today; setting it clears Month | `date=YYYY-MM-DD` | both | yes |
| Month | month input, max IST month; setting it clears Date | `month=YYYY-MM` | both | yes |
| Driver | select of all drivers, `name (@username)` | `driver` (id) | both | yes |
| Customer | select of all non-deleted customers by name, inactive ones marked | `customer` (id) | Deliveries | yes |
| Payment Method | All / Cash / UPI / Not Paid | `paymentStatus=cash\|upi\|not_paid` | Deliveries | yes |
| Product | All Products / Cans / Cases | `productType=can\|case` | Deliveries | no |
| (vehicle) | none: the key exists only in page state | `vehicle` (the hook and API support it; never set, so never sent) | - | - |

- **Data:** `useAdminAddedSupplies` / `useAdminCashCredits` -> `GET /api/admin/supplies`; `useAdminDrivers` and `useAdminCustomers` fill the selects; `POST /api/admin/supplies` and `PATCH` / `DELETE /api/admin/supplies/:id` are plain `fetch` calls, each followed by `invalidateQueries(["admin","supplies"])` (`apps/web/app/admin/supplies/page.tsx:629, 723, 748`). See §7.
- **Gotchas:**
  - Unfiltered page 1 stops at 500 rows with no notice, while the summary bar still counts every row in the window (`apps/web/app/api/admin/supplies/route.ts:158`) (see §16).
  - Every delivery save sends `productType` and `paymentStatus`, so saving a legacy row records `can` and `cash` even when only a remark changed; for the product this is intended: "so older rows get it recorded on save" (`apps/web/app/admin/supplies/page.tsx:697-708`).
  - Both tabs always send `logType`, so a row stored without that field (legacy data; existence unverified) would show on neither tab, only in customer history (`apps/web/app/hooks/useAdminQueries.ts:217`; `apps/web/app/api/admin/supplies/route.ts:117-118`).
  - The Edit hint says "Leave it as is to keep the saved amount", yet the server re-prices when the quantity changed and no amount was sent, replacing a manually typed amount (`apps/web/app/admin/supplies/page.tsx:1597`; `apps/web/app/api/admin/supplies/[id]/route.ts:185-191`).
  - One Escape handler closes layers in the order Download menu, delete confirm, lightbox, edit, details, add, matching z-index 50 / 400 / 300 / 260 / 250 / 250; a new overlay must be added to both lists. Escape or a backdrop click closes Add and Edit even mid-typing, with no discard prompt (`apps/web/app/admin/supplies/page.tsx:372-381, 817, 1059, 1224, 1425, 1461, 1487`).
  - `LogTable` is memoised so that typing in a dialog "doesn't re-render up to 500 rows on every keystroke"; pass it only stable props (`apps/web/app/admin/supplies/page.tsx:160-163, 245, 1023`).
  - `detailError` is shared by the details dialog and the lightbox and is not cleared when a row is opened or the lightbox is closed, so a stale image-download error from a lightbox opened with the row's "Fuel" button can appear on the next entry opened (closing the details dialog does clear it) (`apps/web/app/admin/supplies/page.tsx:1023, 1388, 1449`).
  - Nothing refreshes an open list (no polling, no refresh button, window-focus refetch is off): new driver entries appear after a tab, page or filter change or a reload (see §6).

### 8.4 Ledger downloads and Save to Google Drive

- **Files:** menu and handlers `apps/web/app/admin/supplies/page.tsx:477-569, 802-856`; builders `apps/web/app/admin/supplies/exports.ts` (458 lines); `apps/web/lib/csv.ts` (20 lines); `apps/web/lib/googleDrive.ts` (134 lines); `fetchAllSupplies` in `apps/web/app/hooks/useAdminQueries.ts:231-241`. There is no export library: every format is hand-built. `exports.ts` and `googleDrive.ts` are loaded with `import()` on first use, so "none of it ships in the page's main chunk" (`apps/web/app/admin/supplies/exports.ts:1-3`).
- **What the user sees and does:** "Download ▾" on both tabs opens a four-item menu; while an export runs the button is disabled and reads "Preparing..." or "Saving to Drive..."; after a Drive save a green alert reads "Saved to your Google Drive. Open the sheet", linking to the new sheet (`apps/web/app/admin/supplies/page.tsx:802-856`).

| Menu item | How the file is produced | Rows included | Cap | File name |
|---|---|---|---|---|
| Download Photo | `renderPngBlob`: the table is drawn by hand on a Canvas 2D (Arial 12px, fixed column widths, 1460px wide for deliveries and 1270px for cash, 1x scale) and encoded with `toBlob("image/png")` | rows on screen | first 250 rows drawn (`MAX_PNG_ROWS`) | `water-supplies-{part}.png` or `cash-credits-{part}.png` |
| Download PDF | `writePrintReport`: a new window is filled with an HTML table by `document.write`, then `print()`; the admin picks "Save as PDF" in the browser's print dialog | rows on screen | none | set in the print dialog; window title "Water Supplies" or "Cash Credits" |
| Download Sheet | `buildCsv` -> `toCsv`: CSV text with a UTF-8 BOM in a `text/csv;charset=utf-8` Blob | every row matching the filters, refetched in one unpaginated request | 5000 rows, server side (`EXPORT_MAX_ROWS`) | `water-supplies-{part}.csv` or `cash-credits-{part}.csv` |
| Save to Google Drive | the same CSV without BOM, uploaded from the browser to Drive, which converts it to a Google Sheet | same as Download Sheet | 5000 rows | Drive title `Royal King Water Supplies {part} (saved {time})`, or `Cash Credits` |

- **Rules:**
  - `{part}` is the Date filter, else the Month filter, else IST today. "Rows on screen" means at most 50 when filtered, the whole 5-day window (up to 500) on unfiltered page 1, and 50 older rows on unfiltered pages 2+. WHY the sheet refetches: it "holds every entry matching the filters, so it matches the summary totals" (`apps/web/app/admin/supplies/page.tsx:477-483, 525-527`).
  - Photo and PDF columns, deliveries: No., Date & Time, Driver (`name (@username)`), Customer, Cans Del., Cases Del., Case Size, Taken Back, Amount, Admin Remark. Cash: No., Date & Time, Driver, Type, Amount, Driver Remark, Admin Remark. Both end with a bold Total row (`apps/web/app/admin/supplies/exports.ts:115-177, 217-238`).
  - Sheet columns, deliveries (17): No., Date, Time, Driver, Customer, Area, Product, Cans Delivered, Cases Delivered, Case Size, Price per Case (₹), Cans Taken Back, Amount (₹), Payment, Vehicle, Driver Note, Admin Remark. Cash (9): No., Date, Time, Driver, Type, Amount (₹), Driver Remark, Admin Remark, Bill Image (the cell holds the image URL) (`apps/web/app/admin/supplies/exports.ts:398-402, 438`).
  - Sheet Date (`YYYY-MM-DD`) and Time (24-hour `HH:MM`) are separate IST columns, "in a form Google Sheets and Excel both read as a real date and time". Footer: a blank row, then `Total`; the deliveries sheet adds one `Cases {size}` row per size in use and `Cases size not set` when needed. WHY after a blank line: "so the data block stays easy to sort and filter" (`apps/web/app/admin/supplies/exports.ts:382-396, 426-434, 453`).
  - `toCsv`: CRLF line ends; cells containing a quote, comma, CR or LF are quoted; text starting with `=`, `+`, `-`, `@`, tab or CR gets a leading apostrophe, because it "would run as a formula when the file is opened" (so pass numbers as numbers, or a negative amount gets the apostrophe). BOM on for the download (it "makes Excel read ₹ and non-English names as UTF-8"), off for Drive (`apps/web/lib/csv.ts:5-19`; `apps/web/app/admin/supplies/page.tsx:559`).
  - Messages: "The photo holds the first 250 rows. Use Download Sheet or PDF for all of them." (notice); "Couldn't create the photo on this device. Try Download PDF or Download Sheet instead."; "The browser blocked the report window. Allow pop-ups for this site and try again."; "Couldn't prepare the PDF. Please try again."; "Couldn't prepare the sheet. Please try again." (`apps/web/app/admin/supplies/page.tsx:494-536`).
  - Drive step 1: if `NEXT_PUBLIC_GOOGLE_CLIENT_ID` was empty at build time, show the notice "This feature is not available yet." and stop; the menu item is always visible (`apps/web/app/admin/supplies/page.tsx:550-555`).
  - Drive step 2: `loadGoogleIdentity()` adds Google's sign-in script once; `requestDriveToken()` opens the Google popup (token model: no redirect URI, no refresh token, no backend). The only scope is `drive.file`, "so the app can only see files it creates". The token lives in a module variable "for this tab only", is reused until 60 s before expiry, and belongs to whichever Google account signed in first: there is no account switch or sign-out (`apps/web/lib/googleDrive.ts:1-10, 38-96`).
  - Drive step 3: `saveCsvAsGoogleSheet` sends one multipart `POST` from the browser to the Drive upload URL with target type `application/vnd.google-apps.spreadsheet`; no `parents`, so the sheet lands in the top level of My Drive; every save creates a new file (`apps/web/lib/googleDrive.ts:99-134`).
  - Drive preconditions (`apps/web/README.md:71-77`; the real console state is unverified, see §14): Drive API enabled; OAuth consent screen with scope `drive.file` and, while in Testing, each admin's Google account as a test user; an OAuth client of type Web application whose Authorized JavaScript origins list every origin the admin page is opened from; the client ID in `NEXT_PUBLIC_GOOGLE_CLIENT_ID`, followed by a rebuild.
  - Drive errors: "Google sign-in was closed before it finished, so nothing was saved."; "Couldn't open Google sign-in. Allow pop-ups for this site and try again."; "Google didn't allow access to Drive, so nothing was saved."; on 401 the token is dropped and "Your Google sign-in expired. Tap Save to Google Drive again."; any other failure "Google Drive didn't accept the sheet. Please try again." (`apps/web/lib/googleDrive.ts:73-91, 126-132`).
- **Data:** `fetchAllSupplies(logType, filters)` -> `GET /api/admin/supplies` with the list's filters but no `page` / `limit`; the answer is then a bare array, newest first, and adding either param would turn it into an object (`apps/web/app/api/admin/supplies/route.ts:143, 167-170`). Google endpoints: see §7.
- **Gotchas:**
  - The photo's totals cover every row on screen while only 250 are drawn, yet the caption says "Total Amount (rows shown)" (`apps/web/app/admin/supplies/exports.ts:212-213, 299`) (see §16).
  - Sheet and Drive stop at 5000 rows with no warning (newest kept), and their Total row covers only the returned rows (`apps/web/app/api/admin/supplies/route.ts:25, 167-170`).
  - On unfiltered pages 2+ the list shows older records, but Sheet and Drive still export the last 5 days, because no `page` is sent (`apps/web/app/admin/supplies/page.tsx:532`; `apps/web/app/api/admin/supplies/route.ts:147-152`).
  - PDF: `window.open` must stay synchronous in the click, before any `await` ("so pop-up blockers allow it"), and every string written into the window must pass `escapeHtml`, because driver-entered text "goes into the print window's raw HTML" (`apps/web/app/admin/supplies/page.tsx:507-508`; `apps/web/app/admin/supplies/exports.ts:84-93`).
  - Column lists exist three times for Photo/PDF (print header, print rows, PNG columns) and once per CSV; change them together (`apps/web/app/admin/supplies/exports.ts:115-162, 217-238, 398-402, 438`).
  - The Google popup opens after two awaits (module import, script load) although the module says "Call it early (on page load)"; a first click may be blocked (unverified on real browsers) (`apps/web/app/admin/supplies/page.tsx:550-557`; `apps/web/lib/googleDrive.ts:36-37`).
  - The Drive title's `{time}` is 12-hour (e.g. "02:05 pm", from `formatDateTime(...).split(", ")[1]`), not the "14:05" shown in `apps/web/README.md:69` (`apps/web/app/admin/supplies/page.tsx:560`; `apps/web/lib/format.ts:11-19, 48`).
  - If a page-level CSP or COOP header is ever added, it must allow the `accounts.google.com` script, `www.googleapis.com` requests and popups (`apps/web/next.config.js:25-49`).
  - Real-device behaviour of all four exports is unverified: canvas size limits for the photo, print-to-PDF and file downloads on phones and in the installed app, and the Google popup inside the installed app (see §16).

### 8.5 Analytics and New Customers

- **Files:** `apps/web/app/admin/amounts/page.tsx` (946 lines: `buildRangeQuery` 46-55, `buildQuery` 57-62, `BarChart` 87-145, `LineChart` 149-220, `StatCard` 224-269, `NewCustomersModal` 338-438, `FilterModal` 491-680, `AnalyticsPage` 718-946); window rules `apps/web/lib/analyticsRange.ts` (58 lines).
- **What the user sees and does:**
  - Naming trap: the route is `/admin/amounts`, but the page is "Analytics" and shows no amounts. Commit `f466fa5` (2026-06-22) replaced the old page's content and changed the nav label from "Amounts", keeping the path. Renaming the route means changing `apps/web/proxy.ts:11`, `apps/web/app/login/page.tsx:47`, `apps/web/app/admin/page.tsx:6` and `apps/web/app/admin/layout.tsx:11` together.
  - Header: h1 "Analytics" and a "Filters" button that turns solid blue with a count badge; the count is custom range + driver + vehicle, and a non-default quick period does not count (`apps/web/app/admin/amounts/page.tsx:64-70, 801-834`).
  - Chip row: a period chip, always shown ("Last 30 days" or "DD Mon YYYY – DD Mon YYYY"), plus removable "Driver: ..." and "Vehicle: ..." chips; the period chip is removable only in custom mode and falls back to the remembered quick period (`apps/web/app/admin/amounts/page.tsx:838-862`).
  - Four stat cards (4 across, 2 x 2 at 600px and below): Total Deliveries, Total Cans Delivered, Total Cases Delivered, and New Customers, which is a button ("View list ›") that opens the list. Each number is the sum of the API's daily buckets, one zero-filled bucket per IST day (`apps/web/app/admin/amounts/page.tsx:771-779, 867-902`; `apps/web/app/api/admin/analytics/route.ts:92-102`).
  - Four chart cards: "Daily Deliveries" (line; delivery rows per IST day), "Cans Delivered per Day", "Cases Delivered per Day" and "New Customer Registrations" (bars) (`apps/web/app/admin/amounts/page.tsx:910-921`).
  - Filter modal (bottom sheet): pills "Last 7 days" / 14 / 30 / 90 and "Custom range" (From and To date inputs, max IST today); Driver select ("All Drivers" + every driver, inactive included); Vehicle select ("All Vehicles" + every vehicle); "Reset" and "Apply Filters" (`apps/web/app/admin/amounts/page.tsx:547-675`).
  - New Customers modal (bottom sheet): subtitle "{period} · N customers"; each row links to the customer's history (§8.7) and shows name, a "Deleted" or "Inactive" badge, phone and area, type, cans/day, rate per can, who added it ("Admin", "{driver name} (@{username})" or "A driver who was later removed") and the IST creation date and time; "· Registered {date}" is added only when the admin-set Added Date falls on a different IST day (`apps/web/app/admin/amounts/page.tsx:283-336, 394-431`).
- **Rules:**
  - Defaults: quick mode, last 30 days, all drivers, all vehicles. Quick mode sends `days`; custom mode with both dates sends `from` and `to`; `driverId` and `vehicleId` are added when set (`apps/web/app/admin/amounts/page.tsx:33-62`).
  - Draft pattern: the modal edits a copy; only "Apply Filters" commits it (disabled only in custom mode with a date missing); "Reset" resets the copy without applying; the X, the backdrop and Escape discard it (`apps/web/app/admin/amounts/page.tsx:511, 652, 750-758`).
  - Server window: `days` is clamped to 7-90 (default 30); a custom span is capped at 731 days "so one mistyped year cannot enumerate thousands of day buckets and scan the whole ledger" (`apps/web/lib/analyticsRange.ts:16-18, 39, 49`).
  - Charts are hand-written inline SVG (no chart library, no canvas): viewBox 580 x 170; Y ticks 0, half and `ceil(max / 4) * 4`; X labels "MM-DD" on every point up to 7 days, every 2nd up to 14, every 5th beyond, plus the last; no tooltips, legend or axis titles (`apps/web/app/admin/amounts/page.tsx:96-109, 134-142, 158-184`).
  - Driver and vehicle filters apply to deliveries only; the modal says "The driver and vehicle filters don't apply to new customers." (`apps/web/app/api/admin/analytics/route.ts:46-55`; `apps/web/app/admin/amounts/page.tsx:398-402`).
  - "New" means `createdAt` inside the window; soft-deleted customers count "because they were new at the time". The list holds the newest 500 (`MAX_CUSTOMERS`); when cut it says "Showing the latest N of TOTAL. Pick a shorter period to see the rest." (`apps/web/lib/analyticsRange.ts:53-58`; `apps/web/app/api/admin/analytics/new-customers/route.ts:10-11, 36-37`; `apps/web/app/admin/amounts/page.tsx:422-426`).
- **Data:** inline `useQuery` -> `GET /api/admin/analytics`; `useAdminNewCustomers(rangeQuery)` -> `GET /api/admin/analytics/new-customers`; `useAdminDrivers` and `useAdminVehicles` for the selects. See §7.
- **Gotchas:**
  - The query key is the built query string, not the filter object: "from/to left over from a custom range are ignored in quick mode, so they must not make a second cache entry" (`apps/web/app/admin/amounts/page.tsx:731-733`).
  - Both endpoints must keep using `resolveAnalyticsRange`, so that the New Customers number and the list behind it "always agree" (`apps/web/lib/analyticsRange.ts:23-24`).
  - Nothing invalidates `["admin","analytics"]`: numbers can be up to 2 minutes old after a ledger or customer change (`apps/web/app/admin/amounts/page.tsx:740-741`).
  - A custom span over 731 days returns 400 and shows only "Failed to load analytics data."; a From later than To (the pickers' min / max try to prevent it) silently falls back to the last 30 days while the chip still shows the typed range (`apps/web/lib/analyticsRange.ts:35-49`; `apps/web/app/admin/amounts/page.tsx:48-50, 864`).
  - SVG gradient ids are global to the document; each chart instance needs its own `gradientId` (`apps/web/app/admin/amounts/page.tsx:911-920`).

### 8.6 Customers

- **Files:** `apps/web/app/admin/customers/page.tsx` (584 lines, one component: list 275-411, Add modal 414-482, delete confirm 485-506, Edit modal 509-581); create-or-restore logic `apps/web/lib/customers.ts` (81 lines).
- **What the user sees and does:**
  - h1 "Customers" and "+ Add Customer"; a card with Search ("Name, phone, email, area...") and an Area select ("All Areas" + the server's list); "Clear Filters" when either is set (`apps/web/app/admin/customers/page.tsx:223-272`).
  - Two tables built from the same page of results: "Active (N)" and "Inactive (N)" (rows at 0.6 opacity), where N counts the whole filtered set, not this page. Columns: Name (active rows add the address underneath), Phone, Type (coloured pill on active rows), Area, Cans/Day, Action (Edit, Delete) (`apps/web/app/admin/customers/page.tsx:46-51, 282-384`).
  - A row click opens the history page (§8.7); pagination, when there is more than one page, reads "Page X of Y · N customers" (`apps/web/app/admin/customers/page.tsx:304, 387-409`).
- **Rules:**
  - Page size 30 (`PAGE_LIMIT`); search is debounced 400 ms; a new search or Area resets to page 1. Server: soft-deleted customers are excluded; `search` is a case-insensitive, escaped regex over name, phone, email and area; `area` is an exact match; sort is active first, then name (`apps/web/app/admin/customers/page.tsx:10, 23-33`; `apps/web/app/api/admin/customers/route.ts:17-23, 42`).
  - Add success: "Customer created!", then the modal closes after 1500 ms. Duplicate phone: 409 "A customer with this phone number already exists."; the other server messages are in §7 (`apps/web/app/admin/customers/page.tsx:136-139`; `apps/web/app/api/admin/customers/route.ts:123-125`).
  - Delete is a soft delete. Confirm text: "Delete Customer?" / "{name} will be removed from your customer list." / "Their delivery history will stay preserved and can still be viewed in the deliveries section."; the server sets `isDeleted: true, isActive: false` (`apps/web/app/admin/customers/page.tsx:485-506`; `apps/web/app/api/admin/customers/[id]/route.ts:153-157`).
  - Restore-on-re-register: there is no undelete button. Adding a customer (by the admin or a driver) whose phone belongs to a soft-deleted record restores that record in place: same `_id`, so the history re-attaches; `isActive: true`; new `registeredDate`; optional fields left blank are cleared "so stale data doesn't linger". WHY: phone is unique but delete is soft, so a plain create would fail "on the unique index nobody can see past" (`apps/web/lib/customers.ts:1-4, 54-73`).
  - Inactive customers stay in this list but are hidden from drivers and from the admin's Add Delivery select (`apps/web/app/api/driver/customers/route.ts:14`; `apps/web/app/admin/supplies/page.tsx:1111`).
  - Fields: Add is a real `<form>` with native validation; Edit is a `<div>` with a `type="button"` Save, so only the server validates it, and it adds Status (Active / Inactive, key `isActive`). Over-long text is cut to the stated length, not rejected (`apps/web/lib/api.ts:43-47`; `apps/web/app/api/admin/customers/route.ts:74-106`; `apps/web/app/api/admin/customers/[id]/route.ts:45-112`).

| UI label | Key | Add | Edit | Server rule |
|---|---|---|---|---|
| Name * | `name` | required | always sent | non-empty, max 200 |
| Phone * | `phone` | required, plain text | always sent | non-empty, max 30, unique |
| Gmail / Email (Optional) | `email` | `type="email"`; omitted when blank | blank is omitted = unchanged | max 200 |
| Type * | `locationType` | radios Home / Office / Both, default `home` | radios; an unset type stays unset until one is picked | `home`, `office` or `both` |
| Location * | `address` | required | always sent | non-empty, max 1000 |
| Area | `area` | omitted when blank | blank is omitted = unchanged | max 200 |
| Subscription Cans/Day * | `subscriptionCans` | number, min 1, default 1 | always sent | integer of at least 1 |
| Cash Per Can (₹), Security Deposit (₹) | `cashPerCan`, `securityDeposit` | min 0, step 0.01; omitted when blank | blank is sent as `null` = removed | 0 or more |
| Added Date * | `registeredDate` | date, default IST today, no max | date, default IST day of `registeredDate`, else `createdAt` | parseable date |

- **Data:** `useAdminPaginatedCustomers({ page, limit: 30, search, area })` -> `GET /api/admin/customers`; `POST /api/admin/customers`; `PATCH` / `DELETE /api/admin/customers/:id`. Every write invalidates the prefix `["admin","customers"]`, which "covers the paginated list, the detail pages and the full list used in dropdowns elsewhere" (`apps/web/app/admin/customers/page.tsx:105-109`). See §7.
- **Gotchas:**
  - Edit cannot clear Email or Area: `value || undefined` is dropped by `JSON.stringify`, and the API only touches keys that are present, so the save succeeds and keeps the old value (`apps/web/app/admin/customers/page.tsx:175-178`; `apps/web/app/api/admin/customers/[id]/route.ts:55-69`) (see §16).
  - A restore answers 201 like a create, so the UI says "Customer created!" for both; the record keeps its old `createdAt`, so Analytics does not count it as new (`apps/web/app/api/admin/customers/route.ts:126`; `apps/web/lib/customers.ts:57-73`).
  - Phone is trimmed but not normalised: the same number typed with a space, dash or country prefix is a different customer and does not trigger the restore. Changing a phone in Edit to one held by a soft-deleted customer returns the 409 duplicate error although no such customer is visible (`apps/web/app/api/admin/customers/route.ts:75`; `apps/web/app/api/admin/customers/[id]/route.ts:134-136`).
  - Every Edit save rewrites `registeredDate` to UTC midnight of the date shown, even if the admin did not touch it, and always sends `address`, so a legacy customer without one cannot be saved until Location is filled ("Location cannot be empty.") (`apps/web/app/admin/customers/page.tsx:159, 176, 183`; `apps/web/app/api/admin/customers/[id]/route.ts:60-64, 108-112`).
  - A failed list request looks like "No customers found.", because only `data` and `isLoading` are read; deleting the only row of the last page also leaves that empty state with no Prev button, because pagination sits inside the non-empty branch (`apps/web/app/admin/customers/page.tsx:38, 278-281, 387`).

### 8.7 Customer history

- **Files:** `apps/web/app/admin/customers/[id]/page.tsx` (310 lines, `CustomerHistoryPage`).
- **What the user sees and does:**
  - A read-only page (no edit or delete): h1 = customer name, "Back to Customers". Reached from the Customers list (§8.6), the New Customers list (§8.5) and "View History" in the delivery details dialog (§8.3) (`apps/web/app/admin/customers/[id]/page.tsx:83-86`).
  - Details card: Phone; Area, Location, Type, Cash Per Can and Security Deposit only when set; Subscription (cans per day); Status "Deleted", "Active" or "Inactive"; Added Date (`apps/web/app/admin/customers/[id]/page.tsx:101-163`).
  - Filters: Month (max = current IST month; empty = all time) and Payment (All Payments / Cash / UPI / Not Paid, where Cash also matches older rows with no payment status), with "Clear Filters"; any change resets to page 1 (`apps/web/app/admin/customers/[id]/page.tsx:25-28, 168-206`; `apps/web/app/api/admin/supplies/route.ts:123-125`).
  - Summary strip (Deliveries, Cans Del., Cases Del. with per-size text, Taken Back, Total Amount, "All time" when unfiltered), then a table: S.No, Date & Time (IST), Qty + product pill, Taken Back, Amount, Payment pill, Driver. Rows are not clickable (`apps/web/app/admin/customers/[id]/page.tsx:209-281`).
- **Rules:**
  - 50 rows per page, newest first, all time by default: neither `logType` nor `days` is sent (`apps/web/app/hooks/useAdminQueries.ts:200, 321-349`).
  - S.No = `serialStart + index + 1`, continuous across pages; this is the only page that uses the API's `serialStart` (`apps/web/app/admin/customers/[id]/page.tsx:52, 267`).
  - Soft-deleted customers still open here: the detail route does not filter on `isDeleted` (`apps/web/app/api/admin/customers/[id]/route.ts:20`).
  - Only a 404 shows "Customer not found."; any other failure, including a malformed id (400), shows "Failed to load customer." with a "Try again" that then can never succeed (`apps/web/app/admin/customers/[id]/page.tsx:38-40, 64-99`).
- **Data:** `useAdminCustomerDetail(id)` -> `GET /api/admin/customers/:id`; `useAdminCustomerHistory(id, { month, paymentStatus }, page)` -> `GET /api/admin/supplies` with `customer`, `page`, `limit=50` and optional `month`, `paymentStatus`. See §7.
- **Gotchas:**
  - The history key starts with `["admin","supplies","customer-history"]`, so ledger writes (which invalidate `["admin","supplies"]`) refresh it; keep it under that prefix (`apps/web/app/hooks/useAdminQueries.ts:327`).
  - Added Date uses `toLocaleDateString("en-IN")` without a time zone, so it follows the device clock, not IST (`apps/web/app/admin/customers/[id]/page.tsx:56-62`).
  - A failed history request shows "Failed to load history. Please try again." together with a zeroed summary and the "No deliveries recorded for this customer yet." empty state, with no retry button (`apps/web/app/admin/customers/[id]/page.tsx:235-249`).

### 8.8 Drivers

- **Files:** `apps/web/app/admin/drivers/page.tsx` (555 lines, one component: Add form 190-241, table 246-342, details dialog 344-437, delete confirm 439-457, Edit modal 459-552). There is no per-driver route.
- **What the user sees and does:**
  - h1 "Drivers", subtitle "Manage driver accounts and credentials"; "Add Driver" / "Cancel" toggles an inline "New Driver" card (`apps/web/app/admin/drivers/page.tsx:174-241`).
  - Table: S.No, Name (cut to 12 characters + "..."), Default Vehicle (registration - model, or "-"), Status (a 10px green or red dot). Any cell opens "Driver Details" (`apps/web/app/admin/drivers/page.tsx:253-341`).
  - Driver Details: Name, Username, Phone, Default Vehicle, Status, Joined; buttons "Edit Driver", "Deactivate" / "Activate", "Delete" (`apps/web/app/admin/drivers/page.tsx:373-434`).
- **Rules:** create success is "Driver created successfully!", then the form closes after 1500 ms; Activate / Deactivate and Delete errors go to `actionError`, shown both in the details dialog and on the page (`apps/web/app/admin/drivers/page.tsx:28-30, 75-78, 243, 402`). Per action:

| Action | UI | Rule | Where |
|---|---|---|---|
| Create | Full Name, Phone, Username, Password (all `required`), Default Vehicle (Optional) | Password must be 6-200 characters, checked only on the server: "Password must be at least 6 characters." / "Password must be at most 200 characters." (200 is the login cap). Duplicate username: 409 "Username already taken". Stored as a bcrypt hash, cost 12 | `apps/web/app/api/admin/drivers/route.ts:10-11, 44-60, 74` |
| Edit | Full Name, Phone, Username, Default Vehicle, Status | No password field. The whole form is sent; the modal is not a `<form>`, so the server is the only validator | `apps/web/app/admin/drivers/page.tsx:121-143, 487-549` |
| Activate / Deactivate | one click in Driver Details, no confirmation | `PATCH { isActive }`. An inactive driver cannot sign in; one already signed in is refused by the API once the active-check cache (60 s) expires (see §6) | `apps/web/app/admin/drivers/page.tsx:85-107`; `apps/web/lib/auth.ts:74, 164-168` |
| Default vehicle | select "No default vehicle" + active vehicles | Stored in `User.assignedVehicle`; must exist and be active, else "Assigned vehicle is not available."; several drivers may share one | `apps/web/app/api/admin/drivers/route.ts:62-72` |
| Delete | confirm "Delete Driver?" / "Permanently delete driver {name} (@{username})? This cannot be undone." / "Delete Permanently" | Hard delete, refused with 409 "This driver has delivery records. Deactivate the driver instead." once any ledger row references the driver. WHY: "The ledger keeps its driver attribution" | `apps/web/app/api/admin/drivers/[id]/route.ts:123-129` |
| Reset or change password | none | Impossible in the UI and in the API: PATCH accepts only name, username, phone, isActive and assignedVehicle | `apps/web/app/api/admin/drivers/[id]/route.ts:24-30` |

- **Data:** `useAdminDrivers()` -> `GET /api/admin/drivers` (password excluded, default vehicle populated, no sort); `useAdminVehicles()` for the selects; `POST /api/admin/drivers`; `PATCH` / `DELETE /api/admin/drivers/:id`; every write invalidates `["admin","drivers"]`. See §7.
- **Gotchas:**
  - A forgotten driver password cannot be recovered; once the driver has ledger rows the account cannot be deleted either, so the only in-app workaround is a second account under another username (see §16).
  - Editing a driver whose default vehicle was disabled always fails with "Assigned vehicle is not available.": the stored id is sent back, but the select lists only active vehicles. Choose another vehicle first; the select probably already displays "No default vehicle" while the stale id is still held, so re-picking that option may not register (unverified in a browser). Activate / Deactivate from Driver Details still works, because it sends only `isActive` (`apps/web/app/admin/drivers/page.tsx:116, 129, 524-525`; `apps/web/app/api/admin/drivers/[id]/route.ts:80-83`).
  - Usernames are trimmed on save (max 100 characters) but otherwise stored as typed, with no lowercasing; sign-in matches them exactly and does not trim (`apps/web/app/api/admin/drivers/route.ts:39`; `apps/web/lib/auth.ts:164-168`).
  - Escape is gated so that it closes only the delete prompt while that is open: "The delete prompt opens above the details dialog" (`apps/web/app/admin/drivers/page.tsx:39-43`).
  - `maskName` only shortens names for layout (it is not privacy masking); a failed list request looks like "No drivers yet. Add one to get started."; "Joined" uses the device time zone, not IST (`apps/web/app/admin/drivers/page.tsx:32, 45-47, 250, 399`).

### 8.9 Vehicles and odometer history

- **Files:** `apps/web/app/admin/vehicles/page.tsx` (184 lines, list and Add form); `apps/web/app/admin/vehicles/[id]/page.tsx` (590 lines: `labelIntervalFor` 28-30, `OdometerLineChart` 33-118, `OdometerChart` 121-191, `VehicleDetailPage` 193-590).
- **What the user sees and does:**
  - List `/admin/vehicles`: h1 "Vehicles"; "Add Vehicle" / "Cancel" toggles an inline "New Vehicle" form (Number, Model, Capacity, all required); table S.No, Number (cut to 12 characters), Model, Status dot; a row click, Enter or Space opens the detail page (`apps/web/app/admin/vehicles/page.tsx:60-180`).
  - Detail `/admin/vehicles/<id>`: h1 = the registration with an Active / Inactive pill; buttons Edit, Disable / Enable, Delete; "Vehicle Info" card with Number, Model, Capacity, Added On (`apps/web/app/admin/vehicles/[id]/page.tsx:361-422`).
  - "Odometer" card: Current Reading (km), Last Updated, Total Entries; bar chart "Daily KMs Driven"; list "Odometer History (N entries)", newest first with a "Latest" pill, scrolling at 280px; below it a full-width line chart "Odometer Trend — Days vs KMs" once there are 2 or more readings (`apps/web/app/admin/vehicles/[id]/page.tsx:425-520`).
- **Rules:**
  - Naming trap (read before touching any vehicle code): the UI labels and the stored field names do not match, see the table below; the API comment states that "Number" (registration) is stored in `name` and "Model" in `vehicleNumber`. Any `name - vehicleNumber` string therefore reads "registration - model", and the form's input ids are swapped too (`vehicleName` holds the registration) (`apps/web/app/api/admin/vehicles/route.ts:34`; `apps/web/models/Vehicle.ts:27-28`; `apps/web/app/admin/vehicles/page.tsx:85-104`).
  - Create: 400 "Number, model, and capacity are required."; 409 "A vehicle with this number already exists." on a case-insensitive exact match of `name`. WHY: "Two vehicles can share a model, but not a registration number". Success: "Vehicle added successfully.", then the form closes after 1200 ms (`apps/web/app/api/admin/vehicles/route.ts:39-50`; `apps/web/app/admin/vehicles/page.tsx:48-51`).
  - Enable / Disable: one click, `PATCH { isActive }`, no confirmation. A disabled vehicle disappears from the drivers' vehicle list and from the admin's default-vehicle selects, but stays assigned to its drivers (`apps/web/app/admin/vehicles/[id]/page.tsx:290-312`; `apps/web/app/api/driver/vehicles/route.ts:15`; `apps/web/app/api/admin/vehicles/[id]/route.ts:86-88`).
  - Delete: native `window.confirm` ("Permanently delete vehicle ... This cannot be undone."); refused with 409 "This vehicle has delivery records. Disable it instead." once a ledger row references it; otherwise a hard delete that also sets `assignedVehicle` to null on every driver that used it (`apps/web/app/admin/vehicles/[id]/page.tsx:314-334`; `apps/web/app/api/admin/vehicles/[id]/route.ts:139-152`).
  - Edit modal: Number, Model, Capacity, Status; not a `<form>`, so only the server validates. Odometer data is read-only for the admin: readings come only from drivers, one per vehicle per IST day (see §8.11) (`apps/web/app/admin/vehicles/[id]/page.tsx:530-587`).
  - The API returns only the newest 200 readings (`MAX_HISTORY_ENTRIES`). WHY: "the array grows by one entry per driver-day forever". "Total Entries" and both charts are computed from that slice, so the count stops at 200 with no notice (`apps/web/app/api/admin/vehicles/[id]/route.ts:10-12, 35`; `apps/web/app/admin/vehicles/[id]/page.tsx:448-451, 471`).
  - Bar chart: inline SVG, viewBox 540 x 180, one bar per consecutive pair of readings, `km = max(0, later - earlier)`, the value printed above each non-zero bar. Bars are at least 12 units wide in a 476-unit plot, so they overlap from about 40 readings (derived from the geometry, unverified in a browser) (`apps/web/app/admin/vehicles/[id]/page.tsx:121-189`).
  - Line chart: inline SVG, viewBox 680 x 220, X scaled by time, 5 Y ticks, each dot carrying the reading in a `<title>` element; date labels on every point up to 8, every 2nd up to 16, then about 8 in all. Its gradient id `areaGradient` is hard-coded, so a second instance on one page would collide (`apps/web/app/admin/vehicles/[id]/page.tsx:27-30, 42-67, 75, 104-115`).
  - With fewer than 2 readings: "No chart yet — needs at least 2 days of readings."; with none: "No readings recorded yet." (`apps/web/app/admin/vehicles/[id]/page.tsx:464-466, 474`).

| UI label | Stored in | Meaning |
|---|---|---|
| Number | `name` | registration number; unique, compared case-insensitively |
| Model | `vehicleNumber` | model; may repeat |
| Capacity | `capacity` | free text |

- **Data:** list: `useAdminVehicles()` -> `GET /api/admin/vehicles` (no odometer history, newest first) and `POST /api/admin/vehicles`. Detail: plain `fetch` in `useEffect`, not React Query, for `GET` / `PATCH` / `DELETE /api/admin/vehicles/:id`; its writes invalidate `["admin","vehicles"]` and `["admin","drivers"]`, because both lists "cache for ten minutes" (`apps/web/app/admin/vehicles/[id]/page.tsx:215-242`). See §7.
- **Gotchas:**
  - Nobody can correct a wrong reading; a negative difference is drawn as 0 and the next day shows an inflated jump (`apps/web/app/admin/vehicles/[id]/page.tsx:124`) (see §16).
  - Every date on the detail page uses `toLocaleDateString("en-IN")` without a time zone: device time, not IST (`apps/web/app/admin/vehicles/[id]/page.tsx:111, 183, 419, 443, 502`).
  - A load error replaces the whole detail page with an alert and no retry button; a failed list request looks like "No vehicles added yet." (`apps/web/app/admin/vehicles/[id]/page.tsx:347-356`; `apps/web/app/admin/vehicles/page.tsx:16, 132`).

### 8.10 Stock

- **Files:** `apps/web/app/components/StockModal.tsx` (183 lines); opened from `apps/web/app/admin/layout.tsx:264, 330` and `apps/web/app/driver/layout.tsx:265, 322`; API `apps/web/app/api/stock/route.ts` (79 lines).
- **What the user sees and does:**
  - Profile menu -> "Stock" opens the same dialog for the admin and for every driver; there is no stock page. It closes on Escape, a backdrop click or "Close" (focused on open) (`apps/web/app/components/StockModal.tsx:28, 97, 109`).
  - Three counters (Cans, Dispensers, Stands), each with minus / plus buttons and a number input; then, once a save exists, the line "Last updated: {IST date and time} · by {name}"; then "Save Changes" (`apps/web/app/components/StockModal.tsx:125-177`).
- **Rules:**
  - Values are absolute counts, not movements: Save sends all three numbers and the server `$set`s them on one shared document; the first save creates it, and until then GET answers zeros (`apps/web/app/components/StockModal.tsx:68-72`; `apps/web/app/api/stock/route.ts:7, 23-26, 62-73`).
  - Inputs clamp to whole numbers of 0 or more; empty or non-numeric input becomes 0. The server rejects negatives ("Cans must be a non-negative number." and the same for Dispensers and Stands) and floors decimals (`apps/web/app/components/StockModal.tsx:89-91, 146-149`; `apps/web/app/api/stock/route.ts:43-51, 62-64`).
  - The admin and every active driver may read and write; `updatedBy` is "Admin" for the admin, otherwise the driver's name. Stock is not linked to deliveries (only `apps/web/app/api/stock/route.ts` touches the Stock model) and no change history is kept (`apps/web/app/api/stock/route.ts:9-14, 53-54`).
  - The form renders only after a successful load, and `save()` returns early otherwise. WHY: "so a failed load can never overwrite the real counts with zeros" (`apps/web/app/components/StockModal.tsx:13-16, 63, 114-123`).
  - Messages: "Failed to load stock." / "Failed to load stock. Please check your connection." with "Try Again"; "Stock updated." for 2.5 s; "Failed to save stock." / "Failed to save stock. Please check your connection." (`apps/web/app/components/StockModal.tsx:43-49, 75-83`).
- **Data:** `GET /api/stock` on mount and `PATCH /api/stock` on save, plain `fetch` without React Query. See §7.
- **Gotchas:**
  - Last write wins: the dialog loads once when it opens and does not refetch before saving, so if a driver saves while the admin has it open, the admin's save overwrites all three counts with numbers based on a stale read, and the reverse (`apps/web/app/components/StockModal.tsx:55-60, 68-72`) (see §16).
  - Mount it only while open (`{stockOpen && <StockModal ... />}`): it loads on mount, so an always-mounted dialog would show and save stale counts (`apps/web/app/components/StockModal.tsx:13-14`).

### 8.11 Driver shell and daily odometer gate

- **Files:** `apps/web/app/driver/layout.tsx` (shell, gate, odometer dialogs), `apps/web/app/driver/page.tsx:837-845` (tab bar), `apps/web/app/components/StockModal.tsx`, `apps/web/app/driver/error.tsx`, `apps/web/app/api/driver/vehicles/odometer/route.ts`.
- **What the user sees and does:**
  - Sticky blue header (70px, `zIndex: 100`): "Royal King", "Driver Portal - {name}", and a round button showing the name's first letter, fallback "D" (`apps/web/app/driver/layout.tsx:47`, `:159-209`).
  - Profile menu, in order: name (fallback "Driver"), **Odometer**, **Stock** (the shared dialog, see §8.10), **Sign Out**, then the build label "v{version}" (`apps/web/app/driver/layout.tsx:211-308`; where the number comes from: see §11.4). It closes on an outside `mousedown`, a second tap on the round button or a menu choice; there is no Escape handler (`:79-88`, `:194`).
  - Tab bar with three buttons: **Supply** (`delivery`, the default), **Cash** (`cash`), **User** (`register`). Switching tabs clears every form message but keeps typed values (`apps/web/app/driver/page.tsx:386`, `:617-625`, `:839`). Placement on phones: see §11.7.
  - Blocking gate dialog: "Today's Odometer Reading", "Please enter today's odometer reading to continue.", field "Current Reading (km)", **Submit**. No Close button, inert backdrop, Escape disabled (`apps/web/app/driver/layout.tsx:95`, `:333`, `:346-362`, `:446-473`).
  - Voluntary dialog (menu -> Odometer): "Update Odometer", a "Last 5 Entries" list, then either "Already submitted for today." or a form "Today's Reading (km)" (`apps/web/app/driver/layout.tsx:366-443`).
  - **Sign Out** calls `signOut({ callbackUrl: "/" })`; a 401 from any driver API calls `signOut({ callbackUrl: "/login" })` instead. WHY: "A signed-out or deactivated driver gets 401 from every API; send them to the login page instead of leaving a dead screen." (`apps/web/app/driver/layout.tsx:17-25`, `:120-122`).
  - A render error in the page shows "Page error", the raw `error.message` and **Retry**, inside the shell (`apps/web/app/driver/error.tsx:22-30`).
- **Rules:**
  - When it appears: the check runs once per mount of the layout (a full page load, or arriving at `/driver` after sign-in) - `GET /api/driver/vehicles/odometer` with `cache: "no-store"` and a 10 s `AbortSignal.timeout`; the gate shows only when the response is OK and `!filledToday && hasVehicle !== false` (`apps/web/app/driver/layout.tsx:53-76`).
  - Skipped for a driver with no assigned vehicle, or whose vehicle document is missing (`hasVehicle: false`). WHY: "without one the reading can never be submitted, so blocking would lock the driver out of the whole app" (`apps/web/app/driver/layout.tsx:62-64`; `apps/web/app/api/driver/vehicles/odometer/route.ts:24-36`).
  - Fails open on a non-OK response, a network error or the timeout. WHY: "The page is never left blocked if the check fails or times out" (`apps/web/app/driver/layout.tsx:49-52`, `:69-73`).
  - While checking or gated, `<main>` gets `filter: blur(3px)`, `pointerEvents: none`, `userSelect: none` (`apps/web/app/driver/layout.tsx:313-318`).
  - Once per vehicle per IST day, not per driver: "filled today" is `odometerLastUpdated >= istDayStart()` (`apps/web/app/api/driver/vehicles/odometer/route.ts:38-39`), and the write is one conditional `findOneAndUpdate` - "the daily gate is part of the filter, so two overlapping submits cannot both pass it and record the day twice" (`apps/web/app/api/driver/vehicles/odometer/route.ts:75-98`).
  - Validation: input `type="number"`, `inputMode="numeric"`, `min="0"`, `step="1"`, `required` (`apps/web/app/driver/layout.tsx:414-426`, `:450-462`); the server requires an integer in `0..9_999_999` (`MAX_ODOMETER`), else 400 "Invalid odometer value."; other answers are 400 "No vehicle assigned to you." and 400 "Odometer already submitted for today." (`apps/web/app/api/driver/vehicles/odometer/route.ts:14`, `:60-63`, `:69-71`, `:100-102`).
  - History: the last `HISTORY_ENTRIES = 5` readings of the vehicle by any driver, newest first, shown as the reading with en-IN grouping plus "km" and a short IST date; the top row is green with a "Today" pill when already filled (`apps/web/app/api/driver/vehicles/odometer/route.ts:13`, `:30-45`; `apps/web/app/driver/layout.tsx:377-400`). The blocking dialog shows no history.
  - Client messages: "Failed to load odometer entries." / "Failed to load odometer entries. Please check your connection." / "Failed to update odometer." / "Network error. Please check your connection and try again." (`apps/web/app/driver/layout.tsx:108`, `:114`, `:139`, `:148`).
- **Data:** plain `fetch`, no React Query: `GET` and `PATCH /api/driver/vehicles/odometer`, `GET` and `PATCH /api/stock`. The name comes from `useSession()` under a layout-level `SessionProvider refetchOnWindowFocus={false}` (`apps/web/app/driver/layout.tsx:481-490`; see §6).
- **Gotchas:**
  - Stuck gate: a failed `PATCH` only sets the error text and `odometerRequired` stays true (`apps/web/app/driver/layout.tsx:138-141`). When the server answers "Odometer already submitted for today." (two drivers on one vehicle who both had the gate open, or a retry after a lost response) the dialog cannot be left without reloading the app (see §16). Its overlay is `zIndex: 300` over the header's 100, so Sign Out and Stock are unreachable while gated (`apps/web/app/driver/layout.tsx:169`, `:328-331`).
  - No comparison with the previous reading: any integer in range, including a lower one or 0, is accepted (`apps/web/app/api/driver/vehicles/odometer/route.ts:60-63`, `:87-88`) (see §16).
  - The gate is checked only on mount, so an app left open across IST midnight is not asked for the new day (see §16).
  - `AbortSignal.timeout(10000)` is evaluated inside the `try`; a browser without it throws there and the gate is skipped silently (`apps/web/app/driver/layout.tsx:57`, `:69-71`). Which phones are affected: unverified.
  - A disabled vehicle still gates its drivers: the route never reads `isActive` (`apps/web/app/api/driver/vehicles/odometer/route.ts:30-32`).
  - The tab bar is rendered inside the blurred `<main>` (`apps/web/app/driver/page.tsx:837`); a CSS `filter` makes that element the containing block for `position: fixed` children, so the bar can sit at the end of the content until the check ends (standard CSS; not observed on a device, unverified).
  - `StockModal` has no 401 handling: an expired session shows the text "Unauthorized" instead of signing out (`apps/web/app/components/StockModal.tsx:40-45`, `:73-77`).

### 8.12 Log a delivery

- **Files:** `apps/web/app/driver/page.tsx` (form `:850-1084`, `submitDelivery` `:691-748`), `apps/web/lib/supplyProduct.ts`, `apps/web/app/api/driver/supplies/route.ts:133-262`.
- **What the user sees and does:**
  - Supply tab -> card "Delivery Log": pick a customer, choose Can or Case, enter the quantities, optionally change vehicle, notes and payment status -> **Log Delivery** ("Saving..." while sending).
  - Customer picker: a search box whose list opens on focus (max height 220px) and filters by a case-insensitive substring of the label `name (phone)` - so by name or phone, not by area (`apps/web/app/driver/page.tsx:552`, `:566-570`, `:875`, `:899`). It lists active customers only (`apps/web/app/api/driver/customers/route.ts:14`).
  - After a pick the box is read-only; tapping it or the X clears the customer and the quantity. Under the box: "Subscription: {n} cans/day" ("can" for 1) and, for a can delivery when the customer has a rate, "Rate: ₹{rate}/can" (`apps/web/app/driver/page.tsx:869`, `:876-896`, `:934-941`).
  - A case delivery shows a live line such as "Amount: 3 × ₹120 = ₹360" (`casePricePreview`; `apps/web/app/driver/page.tsx:577-579`, `:1025-1029`). A can delivery shows no amount, and the form has no amount or date field at all.
- **Rules:**
  - Quantity rules live once in `validateDeliveryQuantities` and run on the client and again on the server (`apps/web/lib/supplyProduct.ts:59-105`; `apps/web/app/driver/page.tsx:711`; `apps/web/app/api/driver/supplies/route.ts:166`). WHY: shared "so validation copy and pricing never drift apart" (`apps/web/lib/supplyProduct.ts:1-2`). Change them there, not in the form.
  - Amount is always computed on the server by `autoAmount`: cans x the customer's `cashPerCan`, or cases x `casePrice`, rounded to 2 decimals, and left absent when a factor is missing (`apps/web/app/api/driver/supplies/route.ts:190`; `apps/web/lib/supplyProduct.ts:119-130`). The server ignores a client-sent `amount` for a delivery; it reads that field only for cash rows (`apps/web/app/api/driver/supplies/route.ts:159`, `:234`, `:238`). Pricing rules: see §10.
  - The time is always server now: `suppliedAt: new Date()` (`apps/web/app/api/driver/supplies/route.ts:217`). Drivers cannot back-date.
  - The customer must be active, else 404 "Customer not found or inactive."; a missing or malformed id gives 400 "Customer is required." / "Invalid customer." (`apps/web/app/api/driver/supplies/route.ts:164-165`, `:185-188`).
  - Vehicle default: the assigned vehicle is preselected once loaded, only when it is in the active list, and restored after every save (`apps/web/app/driver/page.tsx:503-513`, `:739`).
  - Results: 201 -> "Delivery logged successfully." and the form resets; other non-OK -> the server's `error` or "Failed to save delivery log."; a thrown fetch -> "Network error. Please check your connection and try again."; 401 -> sign out (`apps/web/app/driver/page.tsx:731-744`).
  - Fields:

| Field | Control and default | Rule or message | Sent as |
|---|---|---|---|
| Customer * | Search box `#customerSearch` | "Please select a customer." (`apps/web/app/driver/page.tsx:697-700`) | `customerId` |
| Product * | Radio Can / Case, default `can` | Switching clears quantity, taken-back, size and price: "so a count typed for one product is never saved as the other" (`apps/web/app/driver/page.tsx:953-954`) | `productType` |
| Bottle Size * (case only) | Radio from `CASE_SIZES`: `300ml`, `500ml`, `1L`, `2L` | "Choose the bottle size." / "Bottle size must be 300ml, 500ml, 1L or 2L." | `caseSize` |
| Cans Delivered * or Cases Delivered * | `number`, `inputMode="numeric"`, `step=1`, `min` 0 (can) or 1 (case) | Can: "Cans delivered must be a non-negative integer." Case: "Enter cases delivered." / "Cases delivered must be a positive integer." | `cansDelivered` or `casesDelivered` |
| Cans Taken Back (can only) | `number`, `inputMode="numeric"`, `min=0`, `step=1` | "Cans taken back must be a non-negative integer."; both can fields blank: "Enter cans delivered, cans taken back, or both." | `cansTakenBack` |
| Price per Case (₹) * (case only) | `number`, `inputMode="decimal"`, `min=0`, `step=0.01` | "Enter the price per case." / "Price per case must be a valid non-negative number." | `casePrice` |
| Vehicle (Optional) | Select of active vehicles, option text `name - vehicleNumber (capacity)`; default = the assigned vehicle | Server 400 "Invalid vehicle." / "Vehicle not found." (must exist; `isActive` is not checked, `apps/web/app/api/driver/supplies/route.ts:186`) | `vehicleId`, omitted when empty |
| Notes (Optional) | Text, `maxLength=1000` | Server trims and caps at 1000 (`apps/web/app/api/driver/supplies/route.ts:149`) | `notes` |
| Payment Status | Radio Cash / UPI / Not Paid, default `cash` | Server keeps `upi` or `not_paid`; anything else becomes `cash` (`apps/web/app/api/driver/supplies/route.ts:235-236`) | `paymentStatus` |

- **Data:** queries `["driver","customers"]` and `["driver","vehicles"]`; `POST /api/driver/supplies` as JSON with `logType: "water"`; success invalidates `["driver","supplies"]` with `exact: true`, fire-and-forget "so the form frees up immediately; the list refreshes in the background" (`apps/web/app/driver/page.tsx:447-467`, `:722-729`, `:741-742`).
- **Gotchas:**
  - The Home/Office tag is display-only. A `both` customer appears as two options (`<id>-home`, `<id>-office`), but only `customerId` is sent and `SupplyLog` has no location field, so the choice is lost (`apps/web/app/driver/page.tsx:554-561`, `:724`) (see §16).
  - `deliveryForm.cansDelivered` holds the quantity for cans and cases alike (`apps/web/app/driver/page.tsx:406-407`, `:702-710`).
  - "Cans Delivered *" carries an asterisk but is not required: a can row may hold only `cansTakenBack` (a pickup), and 0 is a valid count (`apps/web/app/driver/page.tsx:981`; `apps/web/lib/supplyProduct.ts:95-103`).
  - The "Rate" line comes from the cached customer list, while the server prices with the rate stored at save time; the two can differ until the list refreshes.
  - Picker options select on `onMouseDown` only and always report `aria-selected={false}` (`apps/web/app/driver/page.tsx:905-911`); keyboard or assistive-technology activation is expected not to select (unverified).
  - No idempotency: when the response is lost the form shows "Network error..." and a retry inserts a second row, which the driver cannot remove (`apps/web/app/api/driver/supplies/route.ts:246`) (see §16).
  - `submitting` is one flag shared with the cash form (`apps/web/app/driver/page.tsx:389`).

### 8.13 Cash credit and fuel entry with bill photo

- **Files:** `apps/web/app/driver/page.tsx` (form `:1128-1260`, `compressImageFile` `:98-167`, `handleCashBillChange` `:635-660`, `submitCash` `:786-831`), `apps/web/app/api/driver/supplies/route.ts`, `apps/web/lib/cloudinary.ts`.
- **What the user sees and does:**
  - Cash tab -> card "Cash Credit Log": Amount (₹), Type, Remark (Optional) and, for Fuel only, "Fuel Bill Image *" -> **Submit**.
  - Cash types: a select with `debit` (Debit) and `fuel` (Fuel); the default is `fuel` (`apps/web/app/driver/page.tsx:436`, `:1160-1161`). The screens call every cash row a "Cash Credit"; the root `README.md:3` describes them as "cash and fuel expenses".
  - On a phone the photo control is two buttons, **Camera** and **Gallery**; elsewhere a single button "Add Fuel Bill Image" (`apps/web/app/driver/page.tsx:1180-1205`).
  - Status text: "Attach the fuel bill image." -> "Optimizing image..." -> "Selected: {file name}" plus a preview up to 240px wide (`apps/web/app/driver/page.tsx:1230-1248`).
- **Rules:**
  - Amount: `type="number"`, `inputMode="decimal"`, `min=0`, `step=0.01`, `required`; server 400 "Amount must be a valid non-negative number." Type: server 400 "Cash type must be debit or fuel." Remark: `maxLength=1000`, sent as `notes` (`apps/web/app/driver/page.tsx:1134-1173`; `apps/web/app/api/driver/supplies/route.ts:160`, `:170-171`).
  - A photo is required only for `fuel`: client "Please attach the fuel bill image." (`apps/web/app/driver/page.tsx:791-794`), server 400 "Fuel bill image is required for fuel entries." (`apps/web/app/api/driver/supplies/route.ts:174`). Switching the type away from Fuel discards the chosen photo (`apps/web/app/driver/page.tsx:1156`); the server would accept an optional image on a debit row, but the form offers none.
  - Camera vs gallery: `prefersCameraCapture` is computed once per mount - true when `matchMedia("(pointer: coarse)")` matches or the user agent contains `android`, `iphone`, `ipad`, `ipod` or `mobile` (`apps/web/app/driver/page.tsx:601-607`).
  - Two visually hidden file inputs (1x1 px, opacity 0) are opened with `.click()`, both with `accept="image/*,.heic,.heif,image/heic,image/heif"`: the gallery input has no `capture` (`apps/web/app/driver/page.tsx:1208-1216`); the camera input adds `capture="environment"` and exists only when `prefersCameraCapture` is true (`apps/web/app/driver/page.tsx:1218-1229`). No in-page camera API is used (see §11.7).
  - Server limits: `MAX_IMAGE_BYTES` = 4 MiB and `MAX_BODY_BYTES` = 4 MiB + 64 KiB. A larger declared `Content-Length` is refused before the body is read, and a larger file after parsing, both with 400 "Image is too large. Please keep it under 4 MB." (`apps/web/app/api/driver/supplies/route.ts:21-24`, `:137-141`, `:173`). WHY: "Vercel refuses function request bodies over 4.5 MB, so stay under it."
  - Server type check: MIME starts `image/`, or MIME is empty and the name ends heic, heif, jpg, jpeg, png or webp ("Some phones send HEIC with an empty MIME type, so the extension counts too"); else 400 "Please upload a valid image file." (`apps/web/app/api/driver/supplies/route.ts:89-94`, `:172`).
  - How it is sent: `multipart/form-data` built with `FormData` - `logType=cash`, `amount` as `String(Number(amount))`, `cashType`, `notes`, and the file under `billImage` (left out when there is none); no `Content-Type` header is set by hand (`apps/web/app/driver/page.tsx:802-810`).
  - Server order: upload to Cloudinary, then insert; when the insert throws, the uploaded image is deleted again (`apps/web/app/api/driver/supplies/route.ts:193-195`, `:251-253`). Upload mechanics: see §7.7.
  - Client results (`apps/web/app/driver/page.tsx:811-827`): 201 -> "Cash credit logged successfully.", form reset to `{ amount: "", cashType: "fuel", notes: "" }`, photo cleared; 401 -> sign out; 413 -> "Photo is too large. Please retake it or take a screenshot of the bill."; other non-OK -> the server's `error` or "Failed to save cash log."; a thrown fetch -> "Network error. Please check your connection and try again."
  - 502 carries the thrown message, but only when it matches `/upload|timed out/i` - "Image upload timed out. Please try again." after the 20 s Cloudinary timeout, or "Failed to upload image to Cloudinary." (the fallback when Cloudinary's reply carries no error text; its own text is thrown otherwise and passes only if it matches); every other failure is 500 "Failed to save the entry. Please try again." (`apps/web/app/api/driver/supplies/route.ts:254-260`; `apps/web/lib/cloudinary.ts:67`, `:102`, `:112`).
  - Client-side compression, in order:

| Step | Value | Source |
|---|---|---|
| Accepted input | MIME starting `image/`, or extension heic, heif, jpg, jpeg, png, webp; else "Please select a valid image file." | `apps/web/app/driver/page.tsx:87-101` |
| HEIC / HEIF | Returned unchanged: no resize, no re-encode | `apps/web/app/driver/page.tsx:93-105` |
| Decode | `createImageBitmap(file)`, falling back to an `<img>` on an object URL; failure "Could not read the selected image." | `apps/web/app/driver/page.tsx:112-130` |
| Resize | Longest side capped at `1600` px, never upscaled | `apps/web/app/driver/page.tsx:132-135` |
| Canvas | Filled `#ffffff` first, so transparency becomes white; no 2D context: "Image compression is not supported on this device." | `apps/web/app/driver/page.tsx:141-148` |
| Encode | `canvas.toBlob(..., "image/jpeg", 0.72)`; renamed `<base>.jpg`, base falling back to `fuel-bill`; no blob: "Failed to compress the image." | `apps/web/app/driver/page.tsx:150-163` |
| Size limit | More than `4 * 1024 * 1024` bytes after processing: selection cleared, "Photo is too large (over 4 MB). Please retake it or take a screenshot of the bill." WHY: "The server (and Vercel) accept at most 4 MB. HEIC photos can't be compressed in the browser, so catch oversized ones before uploading." | `apps/web/app/driver/page.tsx:642-649` |

- **Data:** `POST /api/driver/supplies` (multipart); success invalidates `["driver","supplies"]` with `exact: true` (`apps/web/app/driver/page.tsx:825`). Stored fields `billImageUrl` and `billImagePublicId`: see §10.
- **Gotchas:**
  - The route itself never answers 413; that status can only come from the hosting platform's body limit (unverified), so the 413 branch is a safety net.
  - Wrong message while the first photo is still processing: the "no file" check runs before the "still processing" check, so Submit shows "Please attach the fuel bill image." rather than "Please wait for the image to finish processing." (`apps/web/app/driver/page.tsx:791-798`); the button is not disabled meanwhile (`:1256`).
  - HEIC/HEIF skips compression, so only the 4 MiB check protects the upload, and the preview is a blob URL of the HEIC that may not render (`apps/web/app/driver/page.tsx:103-105`, `:652`). Photo orientation after the canvas step depends on the browser's EXIF handling. Both unverified on devices.
  - The 4 MiB limit is written twice (`apps/web/app/driver/page.tsx:644`, `apps/web/app/api/driver/supplies/route.ts:22`) and both follow the platform cap noted at `apps/web/app/api/driver/supplies/route.ts:21`; change them together.

### 8.14 Register a customer

- **Files:** `apps/web/app/driver/page.tsx` (form `:1302-1401`, `submitRegister` `:750-784`), `apps/web/app/api/driver/customers/route.ts:25-69`, `apps/web/lib/customers.ts`.
- **What the user sees and does:** User tab -> card "Register New Customer" ("Registered customers can be selected for deliveries.") -> fill the form -> **Register Customer** ("Registering..." while sending) -> "Customer registered successfully.", the form resets and the customer becomes selectable in the delivery picker.
- **Rules:**
  - Client validation is HTML attributes only (`required`, `maxLength`, input types); values are trimmed before sending (`apps/web/app/driver/page.tsx:760-767`). The server enforces its string caps by truncating, not rejecting (`apps/web/lib/api.ts:43-53`).
  - What the server fixes: `subscriptionCans: 1`, `registeredDate: new Date()`, `createdBy` = the driver's id; `area` and `securityDeposit` cannot be set from this form (`apps/web/app/api/driver/customers/route.ts:51-61`).
  - Duplicate phone on a live customer -> 409 "A customer with this phone number already exists." (`apps/web/app/api/driver/customers/route.ts:62-64`; `apps/web/lib/customers.ts:54-55`, `:78`).
  - A soft-deleted customer with the same phone is restored in place instead of rejected: same `_id`, `isDeleted: false`, `isActive: true`, a new `registeredDate`, every sent field overwritten, and the optional fields this form does not send (`area`, `securityDeposit`, a blank `email`) removed "so stale data doesn't linger" (`apps/web/lib/customers.ts:57-73`). WHY restore: the phone is unique and delete is only a soft delete, so a plain insert would fail "on the unique index nobody can see past" (`apps/web/lib/customers.ts:1-4`). The answer is 201 for a new and for a restored customer alike, so the driver is not told which happened (`apps/web/app/api/driver/customers/route.ts:65`).
  - Failures: the server's `error` or "Failed to register customer."; a thrown fetch -> "Network error. Please check your connection and try again."; 401 -> sign out (`apps/web/app/driver/page.tsx:769-780`).
  - Fields (server messages from `apps/web/app/api/driver/customers/route.ts:32-47`):

| Field | Control | Limit | Sent as | Server message |
|---|---|---|---|---|
| Name * | Text, `required` | `maxLength=120` | `name` | "Name is required." |
| Phone * | `type="tel"`, `required` | `maxLength=30`, no pattern | `phone` | "Phone is required." |
| Gmail / Email (Optional) | `type="email"` | `maxLength=120` | `email`, omitted when blank | none |
| Type * | Radio Home / Office / Both, default `home` | - | `locationType` | "Location type must be home, office, or both." |
| Location * | Text, `required` | `maxLength=500` | `address` | "Location is required." |
| Cash Per Can (₹) * | `number`, `inputMode="decimal"`, `min=0`, `step=0.01`, `required` | - | `cashPerCan` as a Number | "Cash per can is required." / "Cash per can must be a non-negative number." |

- **Data:** `POST /api/driver/customers` (JSON); success invalidates `["driver","customers"]` with `exact: true` (`apps/web/app/driver/page.tsx:778`). Soft delete and phone uniqueness: see §10.
- **Gotchas:**
  - Phone numbers are not normalised and the duplicate check is an exact string match, so the same number typed with spaces or a country code registers twice (`apps/web/lib/customers.ts:54`; `apps/web/models/Customer.ts:24`) (see §16).
  - Through the restore path a driver can undo an admin's delete and overwrite that customer's name, address and rate (see §16).
  - The tab is labelled "User" although it registers customers (`apps/web/app/driver/page.tsx:839`).

### 8.15 Recent entries and date filter

- **Files:** `apps/web/app/driver/page.tsx` (lists `:1086-1124`, `:1262-1300`; cards `:270-383`; dialogs `:1404-1610`), `apps/web/app/api/driver/supplies/route.ts:96-131`, `apps/web/lib/format.ts`.
- **What the user sees and does:**
  - Under each form a list - "My Recent Deliveries" (Supply tab), "My Recent Cash Credits" (Cash tab) - grouped by day under "Today", "Yesterday" or a full date such as "23 September 2026" (`apps/web/lib/format.ts:84-93`).
  - Delivery card: number and customer name, a pill such as "2 cans" or "3 cases · 500ml", area, "Taken back: {n} cans", "Amount: ₹{amount}", date and time. Cash card: number and amount, the cash type, a 52px bill thumbnail, date and time (`apps/web/app/driver/page.tsx:270-383`).
  - Tapping a card opens a read-only dialog, "Delivery Details" or "Cash Credit Details"; Escape, the backdrop or **Close** dismisses it (`apps/web/app/driver/page.tsx:528-532`, `:1404-1567`).
  - A fuel entry's dialog offers **View full image** and **Download**. Download fetches the original URL into a blob and saves `fuel-bill-<timestamp>` with extension png, webp or jpg; on failure it opens the image in a new tab and shows "Couldn't start the download automatically. The image was opened in a new tab." (`apps/web/app/driver/page.tsx:669-689`, `:1452-1492`).
  - A 36px calendar button beside each heading opens a date picker; while a date is set the icon is an X that clears it (`apps/web/app/driver/page.tsx:237-242`, `:1089-1099`).
- **Rules:**
  - Default window: today plus the 4 previous IST days - `start = istDayStart() - (RECENT_DAYS - 1) days`, `end = istDayEnd()`, `RECENT_DAYS = 5` (`apps/web/app/api/driver/supplies/route.ts:25`, `:109-112`).
  - Only the signed-in driver's rows, deliveries and cash together, newest first, capped at `.limit(200)` for the whole response (`apps/web/app/api/driver/supplies/route.ts:116-125`). Hidden from drivers: `billImagePublicId`, `adminRemark`, `__v` - "Fields the driver screens never show" (`apps/web/app/api/driver/supplies/route.ts:26-27`).
  - Grouping uses the IST day, not the device's day; serial numbers restart at 1 each day with the newest entry as 1, so they are positions that shift when an entry is added, not identifiers (`apps/web/app/driver/page.tsx:202-223`).
  - Date picker: a hidden `<input type="date" max={istToday()}>` opened with `showPicker()`, falling back to `focus()` + `click()`; any past day can be chosen and each tab keeps its own date (`apps/web/app/driver/page.tsx:397-398`, `:581`, `:662-667`, `:1100-1109`).
  - Filtered view: `GET /api/driver/supplies?date=YYYY-MM-DD` returns that one IST day (400 "Invalid date format." otherwise); the client keeps the tab's log type and shows the first day group only (`apps/web/app/api/driver/supplies/route.ts:101-108`; `apps/web/app/driver/page.tsx:585-599`).
  - Legacy rows: a missing `logType` reads as `water` and a missing `productType` as `can` (`apps/web/app/driver/page.tsx:184-191`).
  - Empty states: "No deliveries in the last 5 days. Use the calendar to view older days." / "No cash credits in the last 5 days. Use the calendar to view older days." / "No deliveries found for selected date." / "No cash logs found for selected date." (`apps/web/app/driver/page.tsx:1117-1120`, `:1293-1296`).
  - Load failures show an alert with **Retry**: "Couldn't load your recent deliveries." / "Couldn't load that day's deliveries." / "Couldn't load your recent cash credits." / "Couldn't load that day's cash credits." (`apps/web/app/driver/page.tsx:1111-1114`, `:1287-1290`).
  - No edit or delete for drivers: the route exports only `GET` and `POST` and no `[id]` route exists under `api/driver/supplies` (`apps/web/app/api/driver/supplies/route.ts:96`, `:133`); the former driver `PATCH` route was deleted in commit `e810079`. Corrections are made by the admin (see §8.3).
- **Data:** `["driver","supplies"]` (default stale time) and `["driver","supplies","byDate",<YYYY-MM-DD>]` (stale 5 min, enabled only while a date is set; both tabs share the key shape) (`apps/web/app/driver/page.tsx:470-499`). Image URLs go through `cloudinaryThumb` (widths 120 and 640) and `cloudinaryAuto` (`apps/web/lib/imageUrl.ts:4-12`).
- **Gotchas:**
  - The 200-row cap is silent: with more than 200 rows in the window the oldest disappear from the default view, while the empty-state text still says "the last 5 days" (see §16).
  - Saves invalidate `["driver","supplies"]` with `exact: true`, so a `byDate` cache is not refreshed: with the filter set to today, a new entry is missing from that view until the query refetches (`apps/web/app/driver/page.tsx:742`, `:825`) (see §16).
  - Nothing refetches on focus or on a timer (see §6), so an app left open keeps old lists and stale "Today" headings until a save, a reload or a network reconnect (React Query's refetch-on-reconnect default, unverified).
  - `RECENT_DAYS` is defined three times: twice for this screen (`apps/web/app/driver/page.tsx:169`, `apps/web/app/api/driver/supplies/route.ts:25`) and once for the admin ledger (`apps/web/app/admin/supplies/page.tsx:49`); change all three together.

## 9. UI foundation and coding conventions

Styling is one hand-written stylesheet, `apps/web/app/globals.css` (552 lines), plus inline `style={{}}` objects. There is no Tailwind, CSS modules, Sass, UI kit, icon set or chart library: icons and charts are inline SVG. Reference style in this section: the "Line(s)" columns of §9.1 and §9.3 are lines of `globals.css`; a `:N` with no path continues the file named just before it.

### 9.1 Design tokens

Every token is a CSS custom property on `:root` (`apps/web/app/globals.css:1-43`), headed "High Visibility Color Palette (White + Deep Blue + Black)" (`:2`).

| Token | Value | Purpose | Line |
|---|---|---|---|
| `--bg-primary` | `#ffffff` | `body` background only | 3 |
| `--bg-secondary` | `#f8fafc` | Page-shell background (admin, driver, home, login), `thead th`, scrollbar track | 4 |
| `--bg-card` | `#ffffff` | `.card`, `.btn-secondary`, inputs, `.table-wrapper` | 5 |
| `--bg-card-hover` | `#f1f5f9` | `tbody tr:hover`, `.btn-secondary:hover` | 6 |
| `--bg-sidebar` | `#0a3d91` | UNUSED; there is no sidebar | 7 |
| `--accent-primary` | `#0a3d91` | Brand deep blue ("Deep Blue Action"): shell headers, `.btn-primary`, input focus border, active nav item; the most-used accent in TSX | 10 |
| `--accent-hover` | `#08337a` | `.btn-primary:hover` | 12 |
| `--accent-light` | `rgba(10, 61, 145, 0.1)` | `.badge-info` background, home-page icon tile | 13 |
| `--accent-teal`, `--accent-teal-light` | `#08337a`, `rgba(10, 61, 145, 0.08)` | UNUSED, and not teal (same dark blue as `--accent-hover`) | 14-15 |
| `--success`, `--success-light` | `#15803d`, `rgba(21, 128, 61, 0.15)` | `.btn-success`, `.badge-success`, `.alert-success` | 17, 19 |
| `--warning`, `--warning-light` | `#b45309`, `rgba(180, 83, 9, 0.15)` | `.badge-warning` | 20, 22 |
| `--danger`, `--danger-light` | `#b91c1c`, `rgba(185, 28, 28, 0.15)` | `.btn-danger`, `.badge-danger`, `.alert-error` | 23, 25 |
| `--text-primary` | `#111827` | Body text, headings, table cells | 27 |
| `--text-secondary` | `#334155` | `.form-label`, `thead th`, sub-copy | 29 |
| `--text-muted` | `#64748b` | Hints, `.text-muted`, and the background of every disabled `.btn` | 30 |
| `--text-inverse` | `#ffffff` | Text on filled buttons | 31 |
| `--border`, `--border-active` | `#e2e8f0`, `#cbd5e1` | Card/table borders and dividers; input and `.btn-secondary` borders | 33-34 |
| `--shadow-sm` | `0 1px 2px rgba(0, 0, 0, 0.05)` | `.card`, `.table-wrapper` | 36 |
| `--shadow-md` | `0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)` | Hover lift; referenced only from TSX | 37 |
| `--shadow-glow` | `0 0 0 3px rgba(10, 61, 145, 0.2)` | Focus ring of `.form-input` / `.form-select` | 38 |
| `--radius-sm`, `--radius-md`, `--radius-lg` | `6px`, `10px`, `16px` | Buttons, inputs, alerts / `.table-wrapper` / `.card` | 40-42 |
| `--font-inter` | set on `<html>` by `next/font`, not in `:root` | Body font family | `apps/web/app/layout.tsx:7-11`, `:41` |

- Font: Inter from `next/font/google` (`subsets: ["latin"]`, `display: "swap"`); `body` falls back to `system-ui, -apple-system, sans-serif`, `line-height: 1.6` (`apps/web/app/globals.css:58-63`). Headings: `h1` 2rem/800, `h2` 1.4rem/700, `h3` 1.1rem/600 (`:91-109`). Building without network access to fetch the font is unverified.
- Two documents use other fonts on purpose: `apps/web/public/offline.html:24` (system fonts, because it "must work with no network at all ... no fonts", `:8-11`) and the PDF print window (Arial, `apps/web/app/admin/supplies/exports.ts:183`).
- Colours that must match the tokens but are separate literals: `themeColor` `#0a3d91` (`apps/web/app/layout.tsx:29`); manifest `theme_color` `#0a3d91` and `background_color` `#f8fafc` (`apps/web/app/manifest.ts:17-18`, comment `:4` "Colours match --accent-primary and --bg-secondary in globals.css"); `apps/web/public/offline.html:6`, `:14`, `:16`, `:76`; `BRAND_BLUE` in `apps/web/scripts/generate-pwa-icons.mjs:16`. Changing the brand blue therefore also means regenerating icons and bumping the service-worker `VERSION` (see §11).
- Tokens are bypassed often: 119 hex literals (41 distinct) sit in TS/TSX, e.g. the `PaymentPill` colours (`apps/web/app/components/PaymentPill.tsx:10-14`). `var(--border-color, #e5e7eb)` at `apps/web/app/admin/supplies/page.tsx:819` names a token that does not exist, so its fallback always wins (see §16).

### 9.2 Layout and breakpoints

- Root: `<html lang="en" className={inter.variable}>` -> `Providers` (React Query) -> page + `PwaRegister` (`apps/web/app/layout.tsx:41-46`). No shared header or footer at root level.
- Admin shell (`apps/web/app/admin/layout.tsx:124-350`): column flex, `min-height: 100vh` on `--bg-secondary`; sticky 65px blue header (`:127-139`) holding brand, `.desktop-nav` and the profile menu; `main.content-area` max-width 1200px, padding 1.5rem, bottom padding 80px (`:314`); fixed `.mobile-bottom-nav` (`:333-347`).
- Driver shell (`apps/web/app/driver/layout.tsx:157-478`): sticky 70px header (`:159-171`); `main` padding 1.5rem, full width, blurred with `pointer-events: none` while the daily odometer check is running or a reading is still required (`:313-318`). The page adds `.driver-tab-bar` and `.driver-content` (`apps/web/app/driver/page.tsx:837`, `:847`).
- No dark mode: no `prefers-color-scheme` or `color-scheme` anywhere. No `@media print` (the PDF export prints a separate window with its own `<style>`), no `@keyframes`, no `prefers-reduced-motion`.

Breakpoints (there is no shared scale; each lives where it is used):

| Query | Effect | Location |
|---|---|---|
| `max-width: 400px` | Smaller analytics stat cards | `apps/web/app/admin/amounts/page.tsx:882` |
| `max-width: 600px` | Stat cards 4-across -> 2x2; `.supply-note` max-width 360px -> 160px | `apps/web/app/admin/amounts/page.tsx:879`; `apps/web/app/globals.css:347` |
| `max-width: 700px` | `.vehicle-detail-grid` -> one column | `apps/web/app/admin/vehicles/[id]/page.tsx:524` |
| `max-width: 768px` | `.grid-2`, `.grid-3` -> one column | `apps/web/app/globals.css:506` |
| `min-width: 768px` | `.driver-tab-bar` fixed-bottom -> static rounded bar; `.driver-content` bottom padding 80px -> 0 | `apps/web/app/globals.css:534` |
| `max-width: 860px` | Admin: hide `.desktop-nav`, show `.mobile-bottom-nav`, `.content-area` bottom padding 90px (all `!important`) | `apps/web/app/admin/layout.tsx:320` |
| JS `(pointer: coarse)` / `(display-mode: standalone)` | Touch detection for camera capture / installed-app detection | `apps/web/app/driver/page.tsx:604`; `apps/web/app/components/InstallPrompt.tsx:18` |

z-index scale (unwritten; one value in CSS, the rest inline numbers - a new overlay must fit it):

| z | Layer | Where |
|---|---|---|
| 0, 1, 10 | Decorative glow vs content on home and login | `apps/web/app/page.tsx:23`, `:27`; `apps/web/app/login/page.tsx:67` |
| 50 | In-page popovers: Download menu, driver customer listbox | `apps/web/app/admin/supplies/page.tsx:817`; `apps/web/app/driver/page.tsx:899` |
| 100 | Sticky headers, admin bottom nav, `.driver-tab-bar` | `apps/web/app/admin/layout.tsx:137`, `:343`; `apps/web/app/driver/layout.tsx:169`; `apps/web/app/globals.css:520` |
| 200 | Profile menus; analytics bottom sheets; driver log-details dialog | `apps/web/app/admin/layout.tsx:186`; `apps/web/app/driver/layout.tsx:216`; `apps/web/app/admin/amounts/page.tsx:358`, `:515`; `apps/web/app/driver/page.tsx:1409` |
| 240 | Driver details dialog | `apps/web/app/admin/drivers/page.tsx:354` |
| 250 | Add, details and single edit dialogs | `apps/web/app/admin/customers/page.tsx:416`; `apps/web/app/admin/drivers/page.tsx:469`; `apps/web/app/admin/vehicles/[id]/page.tsx:532`; `apps/web/app/admin/supplies/page.tsx:1059`, `:1224` |
| 260 | Customer and Deliveries edit dialogs (each opens alone: the Deliveries details dialog closes as its edit opens) | `apps/web/app/admin/customers/page.tsx:511`; `apps/web/app/admin/supplies/page.tsx:1487` |
| 300 | `StockModal`, driver odometer modal, image lightboxes | `apps/web/app/components/StockModal.tsx:96`; `apps/web/app/driver/layout.tsx:331`; `apps/web/app/driver/page.tsx:1574`; `apps/web/app/admin/supplies/page.tsx:1425` |
| 350 | PWA "new version" banner | `apps/web/app/components/PwaRegister.tsx:122` |
| 400 | Confirm-delete dialogs (Drivers and Deliveries open them above the still-open details dialog, so they must stay on top) | `apps/web/app/admin/customers/page.tsx:487`; `apps/web/app/admin/drivers/page.tsx:441`; `apps/web/app/admin/supplies/page.tsx:1461` |

Safe areas: `viewportFit: "cover"` (`apps/web/app/layout.tsx:30-32`) enables `env(safe-area-inset-*)`. Used on `body` left/right ("lets the page reach under an iPhone notch in landscape; keep content clear of it", `apps/web/app/globals.css:64-67`), `.driver-tab-bar` bottom (`:524`), admin bottom nav (`apps/web/app/admin/layout.tsx:342`), the analytics New Customers sheet only, not the filter sheet (`apps/web/app/admin/amounts/page.tsx:373`), the update banner (`apps/web/app/components/PwaRegister.tsx:121`) and `apps/web/public/offline.html:31`. Behaviour on notched devices is unverified; the rest of the mobile setup is in §11.

### 9.3 CSS class inventory

| Group | Classes / selectors | Purpose | Lines |
|---|---|---|---|
| Reset and base | `*, *::before, *::after`; `html, body`; `a`; `::-webkit-scrollbar*` | `box-sizing: border-box` and zero margin/padding on everything (so `p`, `ul`, headings have no default spacing - spacing is added inline); height 100%; links inherit colour, no underline; 6px WebKit scrollbar | 45-56, 70-88 |
| Cards | `.card`; `button.card` | White box, 1px border, radius 16px, padding 1.5rem; also the body of every dialog. `button.card` keeps the page font because "Log cards in the driver portal are buttons" | 112-125 |
| Buttons | `.btn` + `.btn-primary`, `.btn-secondary`, `.btn-danger`, `.btn-success`; `.btn-sm`; `.btn-full`; `.btn:disabled` | Inline-flex button; filled blue / white outlined / tinted red / tinted green (tints go solid on hover); small size; full width and centred; disabled = opacity 0.6 and grey background on every variant | 128-199, 221-224 |
| Download menu | `.download-menu-item` | Full-width transparent rows of the Deliveries "Download" menu; hover/focus `#f1f5f9` | 201-219 |
| Forms | `.form-group`, `.form-label`, `.form-input`, `.form-select` | Column with 0.4rem gap; small UPPERCASE label; full-width input/select with accent border and glow on focus | 227-264 |
| Tables | `.table-wrapper`; bare `table`, `thead th`, `tbody tr`, `tbody tr:hover`, `tbody td` | Scrollable bordered wrapper. The element selectors are GLOBAL: every `<table>` gets uppercase 0.75rem headers and row hover | 267-310 |
| Ledger notes | `tbody tr.supply-row-noted`; `.supply-note` | Amber row (`#fffbeb`, inset bar `#f59e0b`) for Deliveries rows carrying a driver note; one-line ellipsised note preview | 313-351 |
| Badges | `.badge` + `.badge-success`, `.badge-warning`, `.badge-danger`, `.badge-info`; `.badge-can`, `.badge-case` | Pill, 0.75rem/700, `text-transform: capitalize`; status tints; "Delivery product markers (Can / Case)" grey and amber. `-success` and `-info` are unused | 354-394 |
| Alerts | `.alert` + `.alert-error`, `.alert-success`, `.alert-info` | Inline message box with its own `margin-top: 0.5rem`; this is the app's only feedback element | 397-421 |
| Empty state | `.empty-state` | Centred 3rem block, used as `card empty-state` | 424-434 |
| Text | `.text-muted`, `.text-sm` | Muted colour; 0.8rem | 437-443 |
| Layout | `.grid-2`, `.grid-3`, `.flex`, `.flex-col`, `.items-center`, `.justify-between`, `.w-full` | Equal-column grids (gap 1rem, collapse at 768px) and flex helpers. `.w-full` sets width only | 445-472, 502-512 |
| Spacing | `.gap-1`, `.gap-2`, `.gap-3`; `.mt-1`, `.mt-2`, `.mt-3`; `.mb-2` | 0.5 / 1 / 1.5rem steps (`.mb-2` = 1rem). Tailwind-like names, NOT Tailwind values. `.gap-1`, `.gap-3`, `.mt-1`, `.mt-3` are unused | 474-500 |
| Driver nav | `.driver-tab-bar`, `.driver-content` | Fixed bottom tab bar (`#eef2f7`) and the 80px padding that clears it | 515-546 |
| Performance | `.log-group` | `content-visibility: auto` - "Skip layout/paint for offscreen log day-groups; keeps long lists smooth" | 548-552 |

- Classes defined outside `globals.css` in component `<style>` blocks (global, but present only while that component is mounted): `.desktop-nav`, `.mobile-bottom-nav`, `.content-area` (`apps/web/app/admin/layout.tsx:315-325`); `.stat-cards-row`, `.stat-card`, `.stat-card-label`, `.stat-card-value`, `.stat-card-button`, `.stat-card-action`, `.new-customer-list`, `.new-customer-row` (`apps/web/app/admin/amounts/page.tsx:867-889`); `.vehicle-detail-grid` (`apps/web/app/admin/vehicles/[id]/page.tsx:523-527`).
- `apps/web/public/offline.html:13-68` has its own `:root`, `.card` and `.badge` (an icon tile, unrelated to the app `.badge`); it must stay self-contained, so never link `globals.css` into it.

### 9.4 Reusable components and hooks

| Name | File (lines, directive) | Props / signature | Behaviour |
|---|---|---|---|
| `InstallPrompt` | `apps/web/app/components/InstallPrompt.tsx` (140, client) | none | Card that offers installation. Renders nothing when already installed (`:16-19`) or dismissed (localStorage key `rk-install-dismissed`, `:14`). iOS gets a text hint because "iOS has no install API" (`:43-45`); other browsers get an Install button once `beforeinstallprompt` fires. Mounted on `/` and `/login` only (`apps/web/app/page.tsx:96`, `apps/web/app/login/page.tsx:117`). Flow: see §11 |
| `PaymentPill` | `apps/web/app/components/PaymentPill.tsx` (32, none) | `status?: "cash" \| "upi" \| "not_paid" \| null`; `size?: "sm" \| "md"` (default `md`) | Inline-styled pill; does not use `.badge`. Also exports `paymentLabel()` and type `PaymentStatus`. Missing or `cash` -> "Cash", `upi` -> "UPI", else "Not Paid", because "Rows saved before the field existed have no paymentStatus and count as cash" (`:1-8`) |
| `ProductPill` | `apps/web/app/components/ProductPill.tsx` (25, none) | `productType?: string \| null`; `caseSize?: string \| null`; `size?: "sm" \| "md"` | `.badge` with `.badge-case` or `.badge-can`; label "Can", "Case" or "Case · size" via `toProductType` / `productLabel` from `apps/web/lib/supplyProduct.ts`; a missing `productType` shows "Can" (`:3-5`) |
| `PwaRegister` | `apps/web/app/components/PwaRegister.tsx` (153, client) | none | Mounted once in the root layout (`apps/web/app/layout.tsx:45`). Registers `/sw.js` in production, unregisters workers in development, and renders the "A new version of the app is ready." banner with Later / Reload (`:113-152`), placed at `bottom: calc(80px + safe-area)` so it "Sits above the driver tab bar and the admin mobile bottom nav" (`:120-121`). Update lifecycle: see §11 |
| `StockModal` | `apps/web/app/components/StockModal.tsx` (183, client) | `onClose: () => void` | Shared Stock dialog for both shells; render it only while open (`apps/web/app/admin/layout.tsx:330`, `apps/web/app/driver/layout.tsx:322`). Loads `GET /api/stock` on mount; saves all three counts (`cans`, `dispensers`, `stands`) with `PATCH`. The form renders only after a successful load and `save()` returns when `!loaded` (`:63`, `:116-123`) "so a failed load can never overwrite the real counts with zeros" (`:13-16`). Values clamp at 0, NaN -> 0 (`:89-91`, `:146-149`); "Stock updated." clears after 2500 ms (`:79-81`); closes on Escape, backdrop or Close |
| `useEscapeKey` | `apps/web/app/hooks/useEscapeKey.ts` (20, client) | `(onEscape: (() => void) \| undefined, enabled = true)` | `document` `keydown` listener while `enabled`; on Escape calls `stopPropagation()` then the handler. "Pass `enabled: false` while the dialog must stay open (for example a blocking prompt)" (`:5-6`). 13 call sites |
| `useAdminQueries.ts` | `apps/web/app/hooks/useAdminQueries.ts` (391, client) | named exports | Admin client types (`Driver`, `Vehicle`, `Customer`, `PaginatedCustomers`, `SupplyLog`, `PaginatedSupplyLogsWithStats`, `NewCustomer`, `NewCustomersResponse`), `locationTypeLabel()`, `fetchAllSupplies()` and the hooks `useAdminDrivers`, `useAdminVehicles`, `useAdminCustomers`, `useAdminPaginatedCustomers`, `useAdminSupplyList`, `useAdminAddedSupplies`, `useAdminCashCredits`, `useAdminCustomerDetail`, `useAdminCustomerHistory`, `useAdminNewCustomers`. Keys, stale times and invalidation: see §6 |

- That is all of the shared UI (5 components, 533 lines; 2 hook files, 411 lines). Most UI is written inline in the page files: `apps/web/app/admin/supplies/page.tsx` 1695 lines, `apps/web/app/driver/page.tsx` 1613, `apps/web/app/admin/amounts/page.tsx` 946, `apps/web/app/admin/vehicles/[id]/page.tsx` 590, `apps/web/app/admin/customers/page.tsx` 584, `apps/web/app/admin/drivers/page.tsx` 555, `apps/web/app/driver/layout.tsx` 490, `apps/web/app/admin/layout.tsx` 351.
- Page-private components are plain functions above the page component and are not exported: e.g. `BarChart`, `LineChart`, `StatCard`, `NewCustomersModal`, `FilterModal`, `Chip` (`apps/web/app/admin/amounts/page.tsx:87-714`), `LogRow`, `LogTable` (`apps/web/app/admin/supplies/page.tsx:168`, `:245`), `DeliveryCards`, `CashCards` (`apps/web/app/driver/page.tsx:270`, `:330`). Heavy lists are wrapped in `memo(function Name(...))`.
- The driver portal has no hooks file: its five `useQuery` calls are inline (`apps/web/app/driver/page.tsx:447-499`), and entity types are declared again there (`:23`, `:30`, `:49`) instead of being imported from `useAdminQueries.ts`.

### 9.5 UI patterns

| Pattern | How it is built | Example |
|---|---|---|
| Modal | Conditional render of a fixed full-screen overlay (`rgba(0,0,0,0.45)`, flex-centred, `padding: 1rem`, `onClick` = close) around `<div className="card" role="dialog" aria-modal="true" aria-labelledby=...>` whose `onClick` stops propagation; a "Close" button top right. No focus trap, scroll lock or focus restore. Only the Deliveries page factors the overlay into `overlayStyle(zIndex, opacity)` (`apps/web/app/admin/supplies/page.tsx:149-158`). Analytics uses the same overlay as a bottom sheet (`alignItems: "flex-end"`, `apps/web/app/admin/amounts/page.tsx:358`) | `apps/web/app/admin/customers/page.tsx:414-423` |
| Escape and stacked dialogs | `useEscapeKey` per dialog gated with `enabled`, or one `closeTopDialog` that closes the top-most layer. Needed because the hook's `stopPropagation()` does not stop other listeners on `document`: two enabled calls both fire | `apps/web/app/admin/drivers/page.tsx:41-43`; `apps/web/app/admin/supplies/page.tsx:371-381` |
| Confirmation dialog | Same modal at z-index 400 with a darker overlay (0.55), a sentence naming the record, Cancel (`.btn-secondary`) + destructive button (`.btn-danger`, label switches to "Deleting..."). One native `window.confirm` remains for vehicle delete | `apps/web/app/admin/customers/page.tsx:485-506`; `apps/web/app/admin/vehicles/[id]/page.tsx:316` |
| Toast / alert / message | There is NO toast system. Feedback is an inline `.alert .alert-error` / `.alert-success` / `.alert-info` driven by a string state (`formError`, `editError`, `pageError`, `actionError`). Success messages self-clear with `setTimeout` (1200-2500 ms); only `StockModal` clears its timer on unmount | `apps/web/app/admin/customers/page.tsx:474`; `apps/web/app/admin/supplies/page.tsx:1008`; `apps/web/app/components/StockModal.tsx:79-81` |
| Form (add) | One `useState` object per form; numbers kept as strings and converted with `Number()` on submit; a real `<form onSubmit>` with native `required` / `min` / `type`; fields are `.form-group` > `.form-label` + `.form-input`; the submit button shows "Saving..." / "Creating…" and is disabled while pending | `apps/web/app/admin/customers/page.tsx:424-431` |
| Form (edit) | Edit modals are `<div>`s with a `type="button"` Save, not `<form>`s: native validation attributes do nothing and Enter does not save, so the server is the only validator (approach: see §6) | `apps/web/app/admin/customers/page.tsx:519-578` |
| Table / list | `.table-wrapper` > `table`; a "Loading X..." paragraph while loading; `.card.empty-state` when empty; Prev / "Page X of Y" / Next below. Ledgers group rows by day inside `.log-group` | `apps/web/app/admin/customers/page.tsx:276-298`, `:395-398` |
| Pill | `PaymentPill` (inline styles) and `ProductPill` (`.badge-*`); ad-hoc status badges use `.badge .badge-danger` / `.badge-warning` with an inline size override | `apps/web/app/admin/supplies/page.tsx:207`, `:235`; `apps/web/app/admin/amounts/page.tsx:309-311` |
| Popover menu | Absolutely positioned `role="menu"` box at z-index 50, closed by an outside-click listener and Escape | `apps/web/app/admin/supplies/page.tsx:813-837` |
| Inline styles vs classes | Both, on the same element: classes for the reusable look (`card`, `btn`, `form-*`, `alert`), inline `style` for layout, spacing and one-off colours. 576 lines carry `style={` and 562 carry `className=`. Page-specific responsive rules go in an inline `<style>` tag (§9.3) | `apps/web/app/admin/customers/page.tsx:419-420` |

### 9.6 Coding conventions

| Topic | Convention (and where it is broken) | Evidence |
|---|---|---|
| File naming | Next special files lowercase (`page.tsx`, `layout.tsx`, `error.tsx`, `route.ts`, `manifest.ts`, `proxy.ts`); components and models `PascalCase`; hooks `useX.ts`; `lib` files `camelCase.ts`; a page-private helper module may sit next to its page | `apps/web/app/admin/supplies/exports.ts` |
| Exports | Pages and components: `export default function Name`. `lib` and hooks: named exports only. Models: default export plus a named `XDocument` interface, guarded with `(models.X as Model<XDocument>) \|\| model(...)` | `apps/web/models/Vehicle.ts:47-51` |
| `"use client"` | First line, double quotes, in 21 files (paths under `apps/web/`): every page, layout and error boundary under `app/admin` and `app/driver` except the redirect-only `app/admin/page.tsx`, plus `app/error.tsx`, home, login, `app/providers.tsx`, both hooks and 3 of 5 components. Without it: `app/layout.tsx`, `app/admin/page.tsx`, `app/not-found.tsx`, `app/manifest.ts`, `PaymentPill`, `ProductPill`, `exports.ts`. No `"use server"`, no server actions, no server-side data fetching in pages | `apps/web/app/admin/page.tsx:1-7` |
| Imports | Relative only (`"../../../../lib/api"`). There is NO path alias: no `paths` / `baseUrl` in any tsconfig, zero `@/` imports - an `@/` import does not resolve. Inline `type` specifiers and `import type` are both used | `apps/web/tsconfig.json:1-20`; `apps/web/app/admin/layout.tsx:6` |
| Reading data | `useQuery` + `fetch(url, { cache: "no-store" })`; `if (!res.ok) throw new Error(...)`; cast with `(await res.json()) as T` (no runtime schema validation). A non-array list response becomes `[]` (`Array.isArray(data) ? (data as Driver[]) : []`) | `apps/web/app/hooks/useAdminQueries.ts:126-140` |
| Writing data | Plain `fetch` inside an `async function handleX` - no `useMutation` anywhere. Order: clear error -> set busy -> fetch -> `(await res.json().catch(() => ({}))) as { error?: string }` -> on `!res.ok` show `data.error ?? "Failed to ..."` -> `void queryClient.invalidateQueries({ queryKey: [prefix] })` -> `catch` shows a "check your connection" message -> `finally` clears busy | `apps/web/app/admin/supplies/page.tsx:592-635` |
| Floating promises | Written with a leading `void` (62 uses), e.g. `void load()` and `onClick={() => void save()}` | `apps/web/app/components/StockModal.tsx:56`, `:175` |
| 401 handling | Driver side: a 401 from any API call made by the driver layout or page -> `signOut({ callbackUrl: "/login" })` "instead of leaving a dead screen". Admin pages and the shared `StockModal` have no 401 branch | `apps/web/app/driver/layout.tsx:17-25`; `apps/web/app/driver/page.tsx:171-177` |
| API routes | Guard -> params -> body -> coerce -> `try { connect ... } catch { serverError }`; errors are always `{ error: string }`. Skeleton and helpers: see §6.5 | `apps/web/lib/api.ts:1-26` |
| Types | `interface` for entity and response shapes (26 at module level), `type` for unions and helpers (34 at module level). Names: `XDocument` (Mongoose), `XResponse`, `PaginatedX`. Props are typed inline in the signature; there are no `Props` types. No `any`, `@ts-ignore` or `@ts-expect-error` in the code base | `apps/web/app/components/StockModal.tsx:7-8`, `:17` |
| Formatting | 2 spaces in most files; 4 spaces in 11 files under `apps/web/` (`app/admin/layout.tsx`, `app/admin/drivers/page.tsx`, `app/login/page.tsx`, the three `error.tsx`, `app/not-found.tsx`, both `app/api/admin/drivers` routes, `lib/auth.ts`, `next.config.js`); `app/driver/layout.tsx` mixes both. No tabs. Double quotes and semicolons everywhere. Lines are not wrapped: 30 files have lines over 120 characters, 27 lines exceed 200 characters (longest 297). Not Prettier-formatted (see §12.5) - match the file you are editing | `apps/web/app/driver/layout.tsx:19-27` |
| Lint exceptions | Only two `eslint-disable` comments exist, both file-level `@next/next/no-img-element`, because plain `<img>` is deliberate (the image optimizer is off) | `apps/web/app/admin/supplies/page.tsx:3`; `apps/web/app/driver/page.tsx:3` |
| Comments | `//` blocks ABOVE the code that explain WHY (the constraint, the legacy case, the failure being prevented), `/** */` one-liners on `lib` exports, `// ── Name ──` section dividers, `{/* */}` labels in JSX. No TODO/FIXME. These comments are load-bearing documentation: many rules in this handbook exist only there, so keep them accurate when changing the code beneath them | `apps/web/app/components/StockModal.tsx:13-16`; `apps/web/models/SupplyLog.ts:61-65` |

### 9.7 Misspelled-but-real and misleading names

No misspelled identifier, route or class name exists in the source (scan of ts/tsx/js/mjs/css/json/md for common misspellings). The names below are real but misleading; the only true typos are in the last row.

| Name | Where | What it actually is | Why you must not casually rename it |
|---|---|---|---|
| `/admin/amounts` | `apps/web/app/admin/amounts/page.tsx:718` (component `AnalyticsPage`) | The Analytics page and the admin landing page; "amounts" is left over from an earlier page | The URL is hard-coded in `apps/web/proxy.ts:11`, `apps/web/app/login/page.tsx:47`, `apps/web/app/admin/page.tsx:6`, `apps/web/app/admin/layout.tsx:11`; renaming the folder breaks the post-login redirect and saved bookmarks |
| `Vehicle.name` | `apps/web/models/Vehicle.ts:23-27` | The registration number (UI label "Number", `apps/web/app/admin/vehicles/page.tsx:85`) | Stored field name in every vehicle document and in populate strings (`"name vehicleNumber capacity"`); renaming needs a data migration (rules: see §10) |
| `Vehicle.vehicleNumber` | `apps/web/models/Vehicle.ts:23-28` | The MODEL (UI label "Model", `apps/web/app/admin/vehicles/page.tsx:96`); deliberately not unique | An old unique index on it is dropped at runtime (`apps/web/lib/mongodb.ts:25-32`); "fixing" the name or re-adding uniqueness blocks two vehicles of the same model |
| `supplies` / `SupplyLog` / driver tab "Supply" | `/admin/supplies`, `/api/admin/supplies`, `/api/driver/supplies`, `apps/web/models/SupplyLog.ts` | The deliveries ledger; the admin UI says "Deliveries" (`apps/web/app/admin/supplies/page.tsx:759`) | The model name (and so its collection, see §10), API paths, React Query prefix `["admin","supplies"]` and a manifest shortcut URL (`apps/web/app/manifest.ts:35`) all depend on it |
| `logType: "cash"` | `apps/web/models/SupplyLog.ts:18`, `:55-60` | A "Cash Credit" entry: a driver-logged cash row with `cashType: "debit" \| "fuel"`, stored in the SAME collection as deliveries (`logType: "water"`). It does NOT mean "paid in cash" - that is `paymentStatus: "cash"` | Enum value stored in every ledger row and sent by both portals; every list query filters on it |
| `SupplyLog.pointName` | `apps/web/models/SupplyLog.ts:8`, `:46` | Legacy free-text delivery point; never written now, read only as a fallback when a row has no customer (`apps/web/app/admin/supplies/page.tsx:199`) | Removing it blanks the customer column of old rows (legacy rules: see §10) |
| `paymentStatus` | `apps/web/models/SupplyLog.ts:23`, `:71` | The payment METHOD (`cash`, `upi`, `not_paid`); the filter is labelled "Payment Method" (`apps/web/app/admin/supplies/page.tsx:932`) | Stored field and query parameter name |
| `notes` vs `adminRemark` | `apps/web/models/SupplyLog.ts:16`, `:24` | `notes` = the driver's note ("Driver Remark"); `adminRemark` = the admin's | Stored field names; export column mapping depends on them (`apps/web/app/admin/supplies/exports.ts:53-54`) |
| `"added"` / `useAdminAddedSupplies` | `apps/web/app/hooks/useAdminQueries.ts:243-245`, `:277` | The Deliveries (water) list | Kept on purpose: "The key segment each list has always used, so the Deliveries page's invalidations keep matching" |
| `lib/api.ts` | `apps/web/lib/api.ts:1-4` | SERVER helpers for route handlers (`jsonError`, `unauthorized`, `readJsonObject`, input coercion). It is not an API client - the app has none | Imported by every route handler except the next-auth one (`apps/web/app/api/auth/[...nextauth]/route.ts`); it imports `next/server`, so keep it out of client components |
| `requireAdmin()` / `requireDriver()` | `apps/web/lib/authHelpers.ts:16-26` | They RETURN `null` when the check fails; they do not throw or respond | Each route must write `if (!x) return unauthorized();` - omit it and the route is public |
| `User` model | `apps/web/models/User.ts:23-27` | Drivers only. The schema allows role `admin`, but the admin is not a database user; its session `id` is a fixed non-ObjectId string (`apps/web/lib/auth.ts:154-159`) | Code that treats a session id as an ObjectId breaks for the admin |
| `proxy.ts` | `apps/web/proxy.ts:1-37` | The middleware (next-auth `withAuth`); the build lists it as "Proxy (Middleware)" | It is the file name this Next.js version expects; do not rename it to `middleware.ts`. Routing rules: see §6 |
| Driver tab "User" (key `register`) | `apps/web/app/driver/page.tsx:839` | Registers a CUSTOMER, not a user account | Label chosen deliberately in commit `6601167`; treat it as a product decision |
| `DeliveryLog` | `apps/web/app/driver/page.tsx:49` | Driver-side row type for deliveries AND cash rows | Local type; rename only together with every use in that file |
| `maskName` / `maskText` | `apps/web/app/admin/drivers/page.tsx:45-47`; `apps/web/app/admin/supplies/page.tsx:51-53` | Truncation to 12 characters plus "..."; NOT privacy masking | Safe to rename, unsafe to rely on for hiding data |
| `royalkingwatersupply` vs `royalkingadmin` | `package.json:2`; Git remote | Root package name vs repository and folder name; the app package is `web`, the shared configs are `@repo/eslint-config` and `@repo/typescript-config` | `package-lock.json:2` and the workspace links repeat these names; change them only together with a regenerated lockfile |
| `@repo/eslint-config/next-js` | `packages/eslint-config/package.json:8` | Export key for the file `next.js` (exports `nextJsConfig`); the package README still calls itself `@turbo/eslint-config` (`packages/eslint-config/README.md:1`) | `apps/web/eslint.config.js:1` imports this exact specifier |
| `data-testid="case-total"` | `apps/web/app/admin/supplies/page.tsx:121`; `apps/web/app/driver/page.tsx:1026` | Leftover attributes; there are no tests | Harmless; do not infer a test suite from them |
| "sercah cust update with name"; "commiting" | Subject of commit `46d40eb`; comment at `apps/web/.gitignore:28` | Real typos ("search customer", "committing"). Some commit subjects also understate their content (`e810079`, "update Node.js engine requirement", touches 82 files) | History is not rewritten and the comment is template text; read the diff, not the subject (see §18) |

### 9.8 Do and do not for new code

Do:

- Reuse the tokens and classes of §9.1 and §9.3 before adding colours or CSS - 41 distinct stray hex values already exist.
- Build dialogs with the §9.5 recipe (`role="dialog"`, `aria-modal`, `aria-labelledby`, backdrop close, `useEscapeKey`) and pick a z-index from the §9.2 scale - a confirm must sit above the dialog that opened it.
- Use `.btn-full` for a centred full-width button - `.w-full` leaves the label left-aligned.
- Put new query keys under the existing prefixes (`["admin","supplies"]`, `["admin","customers"]`, ...) - pages invalidate by prefix, so a key elsewhere never refreshes (see §6).
- Format dates and money with `apps/web/lib/format.ts` - business days are IST whatever the device timezone (see §10).
- Use `PaymentPill`, `ProductPill` and `toProductType()` for ledger rows - they encode the legacy defaults (missing = Cash / Can).
- Write the WHY comment above any non-obvious rule and match the file's indentation - comments are the project's design record and there is no formatter.
- Run `npm run lint` and `npm run check-types` before handing over - nothing else runs them (see §12.7).

Do not:

- Do not import with `@/` or add a path alias in passing - no alias is configured and every file uses relative imports.
- Do not add Tailwind, a UI kit, a form or schema library, or a chart library without the owner's agreement - `react-hook-form`, `zod` and the `packages/ui` workspace were removed in commit `1ca3e0d`.
- Do not switch `<img>` to `next/image` - the optimizer is disabled on purpose (`apps/web/next.config.js:19-24`).
- Do not call `useSession()` in anything rendered on `/` or `/login` - `SessionProvider` exists only inside the admin and driver layouts (`apps/web/app/providers.tsx:7-9`).
- Do not rename anything in §9.7 as a "cleanup" - most are stored field names, URLs or cache keys.
- Do not link `globals.css`, fonts or scripts into `apps/web/public/offline.html` - it must render with no network.
- Do not style bare elements globally or add `!important` rules to `globals.css` - `table`, `h1`-`h3` and `a` are already global and affect every page.
- Do not run `npm run format` as part of a feature change - it rewrites nearly every source file (see §12.5).

## 10. Database schema and data rules

### 10.1 Overview and conventions
| Model | Schema | Collection | Holds |
|---|---|---|---|
| `Customer` | `apps/web/models/Customer.ts:21-38` | `customers` (unverified) | Delivery customers |
| `SupplyLog` | `apps/web/models/SupplyLog.ts:31-77` | `supplylogs` (unverified) | The ledger: deliveries and cash entries |
| `User` | `apps/web/models/User.ts:17-36` | `users` (unverified) | Drivers only; the admin is not a document |
| `Vehicle` | `apps/web/models/Vehicle.ts:21-45` | `vehicles` (confirmed by the map key at `apps/web/lib/mongodb.ts:31`) | Vehicles with embedded odometer history |
| `Stock` | `apps/web/models/Stock.ts:12-20` | `stocks` (unverified) | One shared counters document |

- Reading this section: a bare `:NN` is a line of the file most recently named before it in the same subsection; inside a table, of the file named earlier in the same row, else in that column's header. The live database was not inspected, so anything said about production contents is (unverified).
- MongoDB is reached only through Mongoose (`apps/web/package.json:17`; versions in §4). No schema sets a collection name, so the "(unverified)" names are Mongoose's default pluralisation, which the code never states. Connection cache, options and model registration: see §6.8.
- Every schema passes only `{ timestamps: true }` (-> `createdAt`, `updatedAt`). `__v` exists; lists project it out (`apps/web/app/api/admin/supplies/route.ts:23`).
- Not used anywhere: virtuals, `pre` / `post` hooks, statics, methods, `toJSON` options, schema-level `trim` / `lowercase`, `select: false`, transactions or sessions. Multi-step writes are therefore never atomic (§10.8).
- Reads use `.lean()` (one exception: the login lookup at `apps/web/lib/auth.ts:164` loads a full document): plain stored documents, so a field removed from a schema still comes back and a missing legacy field stays missing (no defaults on read: Mongoose behaviour, unverified). Creates use `Model.create()`; the Stock document is created by an upsert (§10.11).
- Updates are whitelisted `$set` / `$unset` (driver and vehicle PATCH pass a plain whitelisted object instead) with `{ returnDocument: "after" }` (never `new: true`), and `runValidators` is never set: schema `required` / `min` / `enum` run only on `Model.create()` (Mongoose default, unverified), so every update route validates by hand.
- Trimming and length caps live in the routes, not the schemas: `optionalString` / `requiredString` (`apps/web/lib/api.ts:43-53`) trim and silently truncate. Cap values: see §7.1.

### 10.2 Customer
| Field | Type | Required | Default | Validation | Meaning / written by |
|---|---|---|---|---|---|
| `name` | String | yes | - | - | Admin POST / PATCH, driver POST |
| `phone` | String | yes | - | unique index | Identity key. Compared as an exact string: trimmed only, no normalisation or format check (see §16) |
| `email` | String | no | - | - | Admin POST / PATCH, driver POST. No format check |
| `address` | String | no | - | - | UI label "Location". Optional in the schema, but both create routes answer 400 `Location is required.` without it |
| `area` | String | no | - | - | Admin-only free text; feeds the area filter. Driver registration cannot set it |
| `locationType` | String | no | - | enum `home`, `office`, `both` | Labels Home / Office / Both (`apps/web/app/hooks/useAdminQueries.ts:118-120`) |
| `subscriptionCans` | Number | no | 1 | min 1 | Display only, never used in pricing. Admin: integer >= 1; driver registration fixes it at 1 (`apps/web/app/api/driver/customers/route.ts:57`) |
| `cashPerCan` | Number | no | - | min 0 | Rupees per can: the only stored rate (§10.10). Optional for the admin, required for driver registration (`apps/web/app/api/driver/customers/route.ts:43`) |
| `securityDeposit` | Number | no | - | min 0 | Admin-only, display only |
| `isActive` | Boolean | no | true | - | `false` = hidden from drivers and refused for new deliveries. Admin PATCH; DELETE forces `false`; restore forces `true` |
| `isDeleted` | Boolean | no | false | - | Soft-delete flag (§10.9). Written only by DELETE (`true`) and restore (`false`) |
| `registeredDate` | Date | no | `() => new Date()` | - | UI label "Added Date": admin-editable; driver registration sets now; a restore overwrites it. Analytics ignores it |
| `createdBy` | ObjectId ref `User` | no | - | - | The registering driver. Absent for admin-created customers: the admin session id is not an ObjectId and is dropped (`apps/web/lib/customers.ts:49`) |

- Create only through `createOrRestoreCustomer` (`apps/web/lib/customers.ts:38-81`), never `Customer.create` directly: the unique phone index also covers soft-deleted rows (§10.9).
- `createdAt`, not `registeredDate`, defines a "new customer" in analytics (`apps/web/lib/analyticsRange.ts:56-58`); a restored customer keeps its original `createdAt`.
- Admin PATCH can change every field except `isDeleted` and `createdBy`. It coerces `isActive` with `Boolean()` (`apps/web/app/api/admin/customers/[id]/route.ts:107`), so the string `"false"` stores `true`.
- Changing `cashPerCan` is not retroactive: ledger amounts are snapshots (§10.10).

### 10.3 SupplyLog (the ledger)
| Field | Type | Required | Default | Validation | Meaning / written by |
|---|---|---|---|---|---|
| `driver` | ObjectId ref `User` | yes | - | - | Who logged it (driver POST: the session id) or who it is credited to (admin POST `driverId`). Never changed afterwards |
| `vehicle` | ObjectId ref `Vehicle` | no | - | - | Optional, deliveries only (§10.10) |
| `customer` | ObjectId ref `Customer` | no | - | - | Required by both POST routes for a delivery; never on cash rows; never changed afterwards |
| `pointName` | String | no | - | - | Legacy (tanker era). No current code writes it; read only as a fallback for the customer name (§10.14) |
| `cansDelivered` | Number | no | - | none | Can rows. Routes require an integer >= 0 |
| `cansTakenBack` | Number | no | - | min 0 | Empties collected, can rows. Never priced |
| `casesDelivered` | Number | no | - | min 1 | Case rows. Routes require an integer >= 1 |
| `caseSize` | String | no | - | enum `CASE_SIZES` | Bottle size of the case (§10.10) |
| `casePrice` | Number | no | - | min 0 | Rupees for one case, typed with the delivery |
| `suppliedAt` | Date | yes | - | - | The business timestamp: every day filter, sort and index uses it, never `createdAt` |
| `notes` | String | no | - | - | Note typed by the driver (or by the admin), cap 1000 |
| `amount` | Number | no | - | none | Rupees. Absent = pending (§10.10); never stored as `null` |
| `logType` | String | yes | `water` | enum `water`, `cash` | Delivery vs cash entry. Never changed afterwards |
| `productType` | String | no | - | enum `can`, `case` | Deliveries only. Missing = can |
| `cashType` | String | no | - | enum `debit`, `fuel` | Cash rows only |
| `paymentStatus` | String | no | - | enum `cash`, `upi`, `not_paid` | Deliveries only. Missing = cash |
| `adminRemark` | String | no | - | - | Admin-only note, cap 1000; projected out of the driver list (`apps/web/app/api/driver/supplies/route.ts:27`) |
| `billImageUrl` | String | no | - | - | Cloudinary `secure_url` of a bill photo (cash rows) |
| `billImagePublicId` | String | no | - | - | Cloudinary id used to delete the photo; projected out of both list responses (`apps/web/app/api/admin/supplies/route.ts:23`) |

- Invariant (`apps/web/models/SupplyLog.ts:61-65`): a delivery carries exactly one quantity family, the one matching its `productType` (§10.10).
- Cash rows carry `amount`, `cashType`, optional `notes` and an optional bill photo. The POST routes never store `customer`, `vehicle`, `productType` or `paymentStatus` on them; admin PATCH does not check `logType` before setting `vehicle` (`apps/web/app/api/admin/supplies/[id]/route.ts:121`), though the UI never sends `vehicleId`.
- Drivers can only create rows; the admin can edit and hard-delete them. No edit history or audit trail is kept.

### 10.4 User (drivers)
| Field | Type | Required | Default | Validation | Meaning / written by |
|---|---|---|---|---|---|
| `name` | String | yes | - | - | Admin POST / PATCH |
| `username` | String | yes | - | unique index | Login name; case-sensitive exact match |
| `phone` | String | yes | - | - | Admin POST / PATCH |
| `password` | String | yes | - | - | bcrypt hash, cost 12 (`apps/web/app/api/admin/drivers/route.ts:74`); plain text 6-200 characters. Not `select: false`. Write-once: no route changes it (see §16) |
| `role` | String | no | `driver` | enum `admin`, `driver` | Only `driver` is ever written (`apps/web/app/api/admin/drivers/route.ts:80`). The admin is an env credential, not a document (see §6.6) |
| `isActive` | Boolean | no | true | - | Admin PATCH (boolean only). Required at login (`apps/web/lib/auth.ts:164-168`) and re-checked at most once a minute (`:74-92`) |
| `assignedVehicle` | ObjectId ref `Vehicle`, or null | no | null | - | Default vehicle; must be active when assigned; several drivers may share one. Drives the odometer gate (§10.11) |

- `password` is an ordinary selected field: every `User` query whose result reaches a client must `.select("-password")` or project fields, as all current ones do (`apps/web/app/api/admin/drivers/route.ts:21`, `:85`; `apps/web/app/api/admin/drivers/[id]/route.ts:95`). Only the login lookup (`apps/web/lib/auth.ts:164-168`) loads the hash, for `bcrypt.compare`; it returns just id, name, username and role.
- Admin PATCH whitelist: `name`, `username`, `phone`, `isActive`, `assignedVehicle` (`apps/web/app/api/admin/drivers/[id]/route.ts:24-30`).

### 10.5 Vehicle
| Field | Type | Required | Default | Validation | Meaning / written by |
|---|---|---|---|---|---|
| `name` | String | yes | - | - | THE REGISTRATION NUMBER (UI label "Number"). Unique only through an app-level check (§10.7) |
| `vehicleNumber` | String | yes | - | - | THE MODEL (UI label "Model"). Deliberately not unique: "Two vehicles can share a model" (`apps/web/models/Vehicle.ts:25`) |
| `capacity` | String | yes | - | - | Free text |
| `isActive` | Boolean | no | true | - | A disabled vehicle leaves the driver picker (`apps/web/app/api/driver/vehicles/route.ts:15`) and cannot be newly assigned to a driver or set on a row by admin PATCH |
| `odometer` | Number | no | 0 | - | Latest reading |
| `odometerLastUpdated` | Date | no | - | - | Daily-gate marker; absent until the first reading |
| `odometerHistory` | Array of `{ reading: Number, recordedAt: Date, driverId: ObjectId ref User }`, all three required | no | `[]` | - | Append-only: one entry per accepted reading |

- The two names are swapped relative to intuition. They are stored field names and appear in populate strings: keep them (see §9.7).
- Odometer fields are written only by the driver odometer route (§10.11). Admin PATCH whitelist: `name`, `vehicleNumber`, `capacity`, `isActive` (`apps/web/app/api/admin/vehicles/[id]/route.ts:60-65`).

### 10.6 Stock
| Field | Type | Required | Default | Validation | Meaning / written by |
|---|---|---|---|---|---|
| `cans`, `dispensers`, `stands` | Number | no | 0 | min 0 | Manual counters. PATCH `/api/stock` (the admin or any driver) stores `Math.floor(value)` |
| `updatedBy` | String | no | - | - | Display string: `"Admin"`, or the driver's session name with fallback `"Driver"` (`apps/web/app/api/stock/route.ts:53-54`) |

- Singleton by convention only; rules in §10.11.

### 10.7 Indexes
| Collection | Index | Serves (intent; real query plans unverified) |
|---|---|---|
| customers | `phone` unique (`apps/web/models/Customer.ts:24`) | Identity; the create-or-restore lookup |
| customers | `{ isActive: 1, name: 1 }` (`apps/web/models/Customer.ts:40`) | Driver picker `find({ isActive: true }).sort({ name: 1 })` |
| customers | `{ area: 1, isActive: 1 }` (`apps/web/models/Customer.ts:41`) | Admin area filter and `distinct("area")` |
| customers | `{ createdAt: -1 }` (`apps/web/models/Customer.ts:43`) | Analytics registrations; the New Customers list |
| supplylogs | `{ driver: 1, suppliedAt: -1 }` (`apps/web/models/SupplyLog.ts:79`) | A driver's own list; the driver delete guard |
| supplylogs | `{ suppliedAt: -1 }` (`apps/web/models/SupplyLog.ts:80`) | Date-only filters |
| supplylogs | `{ logType: 1, suppliedAt: -1 }` (`apps/web/models/SupplyLog.ts:81`) | Deliveries / Cash Credits tabs; analytics |
| supplylogs | `{ logType: 1, driver: 1, suppliedAt: -1 }` (`apps/web/models/SupplyLog.ts:82`) | The same tabs filtered by driver |
| supplylogs | `{ customer: 1, suppliedAt: -1 }` (`apps/web/models/SupplyLog.ts:83`) | Customer history |
| supplylogs | `{ vehicle: 1, suppliedAt: -1 }` (`apps/web/models/SupplyLog.ts:85`) | Vehicle filter; the vehicle delete guard |
| users | `username` unique (`apps/web/models/User.ts:20`) | Login lookup; uniqueness |
| vehicles, stocks | None declared | - |

- Not indexed: `customers.isDeleted`, `vehicles.name`. Admin customer search is an unanchored case-insensitive regex over four fields (`apps/web/app/api/admin/customers/route.ts:18-22`), and the admin sort `{ isActive: -1, name: 1 }` (`:42`) mixes directions, so `{ isActive: 1, name: 1 }` cannot supply its order (MongoDB index rule, unverified; see §16).
- Indexes are built by the app at runtime: `ensureIndexes()` (`apps/web/lib/mongodb.ts:53-66`) runs on every `connectToDatabase()` call and, once per process per model, fires `model.createIndexes()` in the background. WHY (`:46-52`): the models "are compiled at import time, before the connection exists, and with bufferCommands off that attempt fails silently" (Mongoose behaviour, unverified); `createIndexes()` "only adds missing indexes; it never drops or rebuilds existing ones, and data is never touched."
- A model is marked done before the attempt (`:58`) and a failure is only logged as `[mongodb] index build failed for <Model>` (`:60`): no retry in that process, and a unique index cannot build while duplicates exist (MongoDB behaviour, unverified). The obsolete-index cleanup logs `[mongodb] obsolete index cleanup failed for <Model>` the same way (`:63`). Whether the declared indexes exist in production is unverified (see §16).
- Obsolete index: `OBSOLETE_UNIQUE_INDEXES = { vehicles: ["vehicleNumber_1"] }` (`:30-32`) is dropped by `dropObsoleteIndexes` (`:34-44`) only while an index of that name exists and is still unique, "so an index added by hand in Atlas is never touched"; it logs `[mongodb] dropped obsolete index vehicles.vehicleNumber_1`. WHY: `vehicleNumber` holds the model, "which two vehicles may share". Removing any other index from a schema does not drop it in MongoDB: add its name to that map (only unique indexes match, `:39`).

| Entity | Uniqueness guard | Duplicate response |
|---|---|---|
| Customer create (admin or driver) | `findOne({ phone })`, then create; an 11000 from a race is caught (`apps/web/lib/customers.ts:54-55`, `:77-79`) | 409 `A customer with this phone number already exists.` |
| Customer PATCH `phone` | 11000 only (`apps/web/app/api/admin/customers/[id]/route.ts:134-136`) | The same 409, also when the holder is a soft-deleted, invisible customer (see §16) |
| Driver create / PATCH `username` | `User.exists` pre-check plus 11000 fallback (`apps/web/app/api/admin/drivers/route.ts:57-60`, `:94-96`; `apps/web/app/api/admin/drivers/[id]/route.ts:71-76`, `:103-105`) | 409 `Username already taken` (POST) / `Username already taken.` (PATCH) |
| Vehicle create / PATCH `name` | Anchored case-insensitive regex `exists` only (`apps/web/app/api/admin/vehicles/route.ts:47-50`; `apps/web/app/api/admin/vehicles/[id]/route.ts:95-99`); no index, so a race can store duplicates | 409 `A vehicle with this number already exists.` The 11000 handlers in both files can fire only while the legacy unique index survives |

### 10.8 Relationships and delete behaviour
| Ref | Populated where | Fields |
|---|---|---|
| `SupplyLog.driver` -> User | Admin list and PATCH response (`apps/web/app/api/admin/supplies/route.ts:162`) | `name username phone` |
| `SupplyLog.vehicle` -> Vehicle | Admin and driver lists | `name vehicleNumber capacity` |
| `SupplyLog.customer` -> Customer | Admin and driver lists; PATCH pre-read (`apps/web/app/api/admin/supplies/[id]/route.ts:104`) | `name phone area`; `cashPerCan` for re-pricing |
| `User.assignedVehicle` -> Vehicle | Admin driver list, create and PATCH (`apps/web/app/api/admin/drivers/route.ts:22`) | `name vehicleNumber capacity isActive` |
| `Customer.createdBy` -> User | Never populated; looked up by hand (`apps/web/app/api/admin/analytics/new-customers/route.ts:43-58`) | Absent -> `{ kind: "admin" }`; driver gone -> `{ kind: "deleted-driver" }` |
| `Vehicle.odometerHistory[].driverId` -> User | Never populated. The admin vehicle GET returns it raw inside the history slice (`apps/web/app/api/admin/vehicles/[id]/route.ts:35`), but no screen reads it; the driver GET strips it (`apps/web/app/api/driver/vehicles/odometer/route.ts:45`) | - |

| Entity | Delete behaviour | Guard and orphans |
|---|---|---|
| Customer | Soft only: `$set { isDeleted: true, isActive: false }` (`apps/web/app/api/admin/customers/[id]/route.ts:153-157`). No hard delete exists | No ledger check; rows keep resolving the customer |
| Driver | Hard: `User.findOneAndDelete({ _id, role: "driver" })` (`apps/web/app/api/admin/drivers/[id]/route.ts:129`) | 409 `This driver has delivery records. Deactivate the driver instead.` when `SupplyLog.exists({ driver })` (`:125-127`): "The ledger keeps its driver attribution". Orphans `Customer.createdBy` and `odometerHistory[].driverId` |
| Vehicle | Hard: `findByIdAndDelete`, then `User.updateMany({ assignedVehicle: id }, { $set: { assignedVehicle: null } })` (`apps/web/app/api/admin/vehicles/[id]/route.ts:145-152`) | 409 `This vehicle has delivery records. Disable it instead.` when `SupplyLog.exists({ vehicle })` (`:141-143`). Two separate writes |
| SupplyLog | Hard, admin only: `findByIdAndDelete` (`apps/web/app/api/admin/supplies/[id]/route.ts:241`); the Cloudinary photo is removed after the response, best-effort (`:246-249`) | None; nothing records the deletion |
| Stock | Never deleted | - |

- Both guards are check-then-delete without a transaction, so a row saved between the two calls is orphaned. A populated ref whose target is gone reads as `null` (Mongoose behaviour, unverified); the UI falls back through optional chaining (§10.14).
- Disabling a vehicle or deactivating a driver removes nothing and unassigns nothing (see §16).

### 10.9 Customer soft delete and restore
- DELETE sets `isDeleted: true` and `isActive: false` on the same document; nothing is removed and no ledger row is touched.
- Admin list, dropdown and area list filter `{ isDeleted: { $ne: true } }` (`apps/web/app/api/admin/customers/route.ts:17`, `:52`). WHY `$ne`: documents created before the flag existed must still appear.
- The driver picker filters only `{ isActive: true }` (`apps/web/app/api/driver/customers/route.ts:14`), and a new delivery requires `Customer.findOne({ _id, isActive: true })`, else 404 `Customer not found or inactive.` (`apps/web/app/api/admin/supplies/route.ts:289`, `:294`; `apps/web/app/api/driver/supplies/route.ts:185`, `:188`). Neither reads `isDeleted`: deleted customers are excluded only because DELETE also clears `isActive`.
- Detail GET and PATCH do not filter `isDeleted` (`apps/web/app/api/admin/customers/[id]/route.ts:20`, `:124`), so a deleted customer's history page still loads. PATCH cannot change `isDeleted` but can set `isActive: true` on a deleted record (see §16).
- Analytics still counts deleted customers: "Soft-deleted customers still count, because they were new at the time." (`apps/web/lib/analyticsRange.ts:54`).
- The unique phone index spans deleted rows. WHY restore exists (`apps/web/lib/customers.ts:2-4`): "A phone number is unique, but DELETE only soft-deletes, so re-registering a returning customer restores the deleted record in place instead of failing on the unique index nobody can see past."
- Restore happens only by registering the same phone again (admin POST or driver POST); there is no un-delete endpoint. `createOrRestoreCustomer` looks up `{ phone }` including deleted rows (`:54`): a live match returns `{ duplicate: true }` (-> 409), a deleted match is updated in place (`:57-73`).
- Restore writes `$set { isDeleted: false, isActive: true, registeredDate }` plus every provided field, and `$unset`s each of `email`, `address`, `area`, `locationType`, `cashPerCan`, `securityDeposit`, `createdBy` that the new registration omits, "so stale data doesn't linger" (`:27`, `:58-67`). Same `_id` and original `createdAt`: the ledger history re-attaches and the customer is not counted as new again. Callers ignore the `restored` flag and answer 201 like a create.
- Consequences: a driver registration can restore and overwrite a customer the admin deleted (unsetting `area` and `securityDeposit`, which drivers cannot send); an admin restore unsets `createdBy` (see §16).

### 10.10 Delivery and money rules
- Products: `can` (a 20-litre can per `README.md:3`; the code only says "can") and `case` (a case of bottles). `CASE_SIZES = ["300ml", "500ml", "1L", "2L"]` (`apps/web/lib/supplyProduct.ts:21`) is "stored on the row exactly as written here" and feeds the schema enum (`apps/web/models/SupplyLog.ts:50`) and the `$group` keys `case_<size>` (`apps/web/lib/supplyProduct.ts:145-150`); the message at `:72` lists the sizes by hand, so change them together. Read a row's type through `toProductType()` (`:16-18`): anything except `"case"` is `can`.
- One-quantity-family invariant: a can row holds `cansDelivered` (+ `cansTakenBack`); a case row holds `casesDelivered`, `caseSize`, `casePrice`. `validateDeliveryQuantities` (`apps/web/lib/supplyProduct.ts:59-105`) rejects the other family and a product switch `$unset`s it. WHY it matters: list totals `$sum` each quantity over every matched row whatever its type (`apps/web/app/api/admin/supplies/route.ts:190-194`); "Can and legacy rows never carry casesDelivered, so they add 0" (`apps/web/lib/supplyProduct.ts:140-141`).
- Can rows need at least one of `cansDelivered` / `cansTakenBack`, each an integer >= 0: a pickup-only row and `cansDelivered: 0` are valid. Case rows need a listed size, cases as an integer >= 1 and a finite price >= 0. `partial: true` (plain edits) skips only the "must enter" rules. Messages: see §7.
- Auto pricing is `autoAmount` (`apps/web/lib/supplyProduct.ts:116-130`), "The only auto-pricing rule": can = `cansDelivered x customer.cashPerCan`, case = `casesDelivered x casePrice`, each `Math.round(x * 100) / 100` ("Rounded to paise: a decimal rate would otherwise store 30.299999999999997"); `undefined` when a factor is missing, and then no `amount` is stored.
- Money is a JS Number in rupees; totals are `$sum`med and rounded to 2 decimals on output (`apps/web/app/api/admin/supplies/route.ts:194`, `:222`). A stored amount is a snapshot of the rate at write time.

| Field | Driver POST (`apps/web/app/api/driver/supplies/route.ts`) | Admin POST (`apps/web/app/api/admin/supplies/route.ts`) | Admin PATCH (`apps/web/app/api/admin/supplies/[id]/route.ts`) |
|---|---|---|---|
| `driver`, `customer`, `logType` | Session id (`:216`); a delivery's customer is required and must be `isActive`; `logType` is `"cash"`, anything else -> `water` (`:146`) | `driverId` must be a `role: "driver"` user, active or not (`:287`); same customer rule; same `logType` rule (`:240`) | Never changed |
| `suppliedAt` | Always server `new Date()` (`:217`): drivers cannot back-date | Body through `parseSuppliedAtInput`, else now (`:246-248`); no bounds | `parseSuppliedAtInput` (`:74`); the UI does not send it |
| `productType` | Always written; unknown -> `can` (`:150`, `:224`) | Same (`:254`, `:306`) | Written when sent; strict, 400 `Invalid product type.` |
| Quantities | Validated in full | Same | Deliveries only; partial unless the product switches |
| `amount`, delivery | Auto only; a client value is ignored (`:234`) | Explicit >= 0 wins, else auto (`:318`) | See the next table |
| `amount`, cash row | Required, >= 0 | Required, >= 0 | Omitted = keep; number >= 0; `null` / `""` -> 400 `Please enter a valid amount.` |
| `paymentStatus` | Always written; unknown -> `cash` (`:235-236`) | NEVER written: the row reads as cash | Deliveries only, strict |
| `cashType` | Cash rows: `debit` or `fuel` required | Same | Cash rows only, strict |
| `vehicle` | Deliveries only; optional; must exist, active or not (`:186`) | Same (`:291`) | Must exist and be active (`:98`); cannot be cleared |
| `notes` / `adminRemark` | `notes` cap 1000 / never | `notes` cap 1000 / never | Each: set, or `$unset` with `""` or `null` |
| `billImageUrl`, `billImagePublicId` | Cash rows; required for `fuel` (upload rules: see §7) | Never | Never |

| Admin PATCH request | Effect on `amount` (`apps/web/app/api/admin/supplies/[id]/route.ts:61-71`, `:135-206`) |
|---|---|
| `amount` is a number >= 0 | Stored; wins over everything (`:115`) |
| `amount` is `null` or `""` on a delivery | Re-priced from the sent or saved quantities; `$unset` when it cannot be priced |
| `amount` absent and a priced quantity really changed (`cansDelivered`, `casesDelivered` or `casePrice` differs from the saved value) | Re-priced, using the saved value for whichever factor was not sent and the customer's CURRENT `cashPerCan` (`:104`), not the rate at delivery time. If it cannot be priced, the old amount is kept |
| Product switch (the sent `productType` differs from the row's) | Needs the complete new family; the other family is `$unset`; re-priced, and `$unset` when unpriceable: "After a switch an amount priced as the other product is never kept" (`:183-184`) |
| `productType: "can"` sent for a legacy row without one | Recorded only: "that is not a switch" (`:146-147`) |
| Only `adminRemark`, `notes`, `paymentStatus`, `cansTakenBack` or `caseSize` changed | Untouched: "a remark or payment-status edit never touches the amount" (`:181`) |
| `cansTakenBack: null` | `$unset` of that field only (`:88`, `:170`) |
| Product fields on a cash row; `cashType` on a delivery; `paymentStatus` on a cash row | 400 (`:109-110`, `:133`) |

- Payment status is a label only: `cash`, `upi`, `not_paid`; missing reads as Cash (`apps/web/app/components/PaymentPill.tsx:6-8`). There is no partial payment, paid date or balance, and `not_paid` rows are still summed into `totalAmount`.
- `logType: "water"` is a delivery; `logType: "cash"` is the UI's "Cash Credit" entry with `cashType` `debit` or `fuel` (labels Debit / Fuel). What "debit" means to the business is not defined in code (unverified).
- Pending amount = the `amount` field is absent. `amountStatus=pending` is `{ amount: { $exists: false } }` and `added` is `{ $exists: true, $ne: null }` (`apps/web/app/api/admin/supplies/route.ts:109-112`; no current client sends the parameter). `0` is a real amount. Clear with `$unset` and never write `null`: the UI tests `amount !== undefined` (e.g. `apps/web/app/admin/supplies/page.tsx:200`), so a `null` would print as 0 and match neither filter.

### 10.11 Odometer and stock rules
- Odometer (`apps/web/app/api/driver/vehicles/odometer/route.ts`): only a driver writes, and only for their own `assignedVehicle`, else 400 `No vehicle assigned to you.` (`:69-71`). No route edits or removes a reading.
- A reading is an integer from 0 to `MAX_ODOMETER = 9_999_999` (`:14`, `:60-63`); anything else answers 400 `Invalid odometer value.` Nothing compares it with the previous reading (see §16).
- One accepted reading per VEHICLE per IST day, gated inside the update filter (`:78-86`): `odometerLastUpdated` missing, `null` or `< istDayStart()`. WHY (`:75-76`): "One atomic, conditional write: the daily gate is part of the filter, so two overlapping submits cannot both pass it and record the day twice." The same update `$set`s `odometer` and `odometerLastUpdated` and `$push`es `{ reading, recordedAt, driverId }` (`:87-96`).
- No match (already submitted today, or the vehicle document is gone) -> 400 `Odometer already submitted for today.` (`:100-102`). The comments at `:11-12` and `apps/web/app/api/admin/vehicles/[id]/route.ts:10-11` say "per driver-day", but the gate is per vehicle-day: two drivers sharing a vehicle get one reading between them.
- GET: `filledToday` is `odometerLastUpdated >= istDayStart()` (`apps/web/app/api/driver/vehicles/odometer/route.ts:39`). No assigned vehicle, or a missing one, returns `hasVehicle: false` so the client skips the blocking prompt "which could never be satisfied" (`:24-36`). `isActive` is not checked (see §16).
- History grows forever; the driver gets the last `HISTORY_ENTRIES = 5` (`:13`, `:31`) and the admin the last `MAX_HISTORY_ENTRIES = 200` (`apps/web/app/api/admin/vehicles/[id]/route.ts:12`, `:35`), both by `$slice`.
- Stock (`apps/web/app/api/stock/route.ts`): three manual counters "shared by the admin and every driver" (`:9`). No supplies route imports the model, so deliveries never change stock, and there is no history.
- Stock is a singleton by convention: `Stock.findOne({})` (`:24`) and `findOneAndUpdate({}, { $set }, { upsert: true, returnDocument: "after" })` (`:69-73`); no key enforces a single document. GET returns `{ cans: 0, dispensers: 0, stands: 0 }` when none exists: "Read-only: the first PATCH creates the document" (`:23`).
- Stock PATCH writes absolute values (never `$inc`) for the fields sent, each >= 0 and floored (`:62-64`), with no upper bound, and always rewrites `updatedBy`: last write wins (see §16).

### 10.12 Time rules
- WHY (`apps/web/lib/istTime.ts:1-4`): "Business days are IST days. The server may run in any timezone (usually UTC), so every "day" boundary used in queries is computed against the fixed IST offset instead of the server's local clock. IST has no DST, which makes the fixed offset safe." `IST_OFFSET_MS = 330 * 60 * 1000` (`:6`); stored dates are ordinary UTC instants, and only boundaries, grouping and display are IST.

| Function (`apps/web/lib/istTime.ts`) | Behaviour |
|---|---|
| `istDayStart(d = now)` (`:9-13`) | UTC instant of 00:00 IST on the day containing `d` |
| `istDayEnd(d = now)` (`:16-18`) | Start + 24 h - 1 ms; queries use `$gte start, $lte end` |
| `istDateRange("YYYY-MM-DD")` (`:21-28`) | `{ start, end }` of that IST day; `null` on a bad format or an unparsable date |
| `istMonthRange(year, month 1-12)` (`:31-35`) | First to last millisecond of that IST month |
| `istTodayString()` (`:38-40`), `istDayString(d)` (`:43-45`) | The IST calendar day as `YYYY-MM-DD` |
| `parseSuppliedAtInput(value)` (`:51-62`) | Non-string or blank -> `null`. A date-only string means that IST day: now when it is today, otherwise 12:00 IST "so the row sorts inside the day rather than at 05:30 (UTC midnight)". Any other string goes through `new Date(text)`: send a full ISO string with a zone, because a zone-less date-time is read in the server's zone |

| Window | Constant | Rule |
|---|---|---|
| Driver recent list | `RECENT_DAYS = 5` (`apps/web/app/api/driver/supplies/route.ts:25`) | `istDayStart() - 4 days` to `istDayEnd()` (`:110-111`); `?date=` returns one IST day; hard `.limit(200)` (`:124`) |
| Admin recent window | `?days=N`, 1-366 (`apps/web/app/api/admin/supplies/route.ts:88-91`) | Same formula. Page 1 is the whole window capped at `WINDOW_MAX_ROWS = 500` (`:27`); later pages walk older rows; `date` / `month` win over `days`. Pagination detail: see §7 |
| Admin export (no `page` / `limit`) | `EXPORT_MAX_ROWS = 5000` (`apps/web/app/api/admin/supplies/route.ts:25`, `:168`) | Newest first, cut silently at the cap (see §16) |
| Analytics range | `days` default 30, clamped 7-90 (`apps/web/lib/analyticsRange.ts:39`) | Used unless `from` and `to` both match `YYYY-MM-DD` and `from <= to` (`:35`); a malformed or reversed pair falls back silently (see §16) |
| Analytics maximum span | `MAX_SPAN_MS` = 731 days (`apps/web/lib/analyticsRange.ts:18`) | Longer, or an unparsable date -> `null` -> 400 `Invalid date range.` WHY: "so one mistyped year cannot enumerate thousands of day buckets and scan the whole ledger" |
| New-customers list | `MAX_CUSTOMERS = 500` (`apps/web/app/api/admin/analytics/new-customers/route.ts:11`) | Same range and match as the chart; the response carries `total` and `limit` |

- Analytics groups by IST day with `$dateToString` and `timezone: "+05:30"` (`apps/web/app/api/admin/analytics/route.ts:64`, `:75`).
- IST is encoded in five places that must change together: `IST_OFFSET_MS` (`apps/web/lib/istTime.ts:6`); `IST_TIME_ZONE = "Asia/Kolkata"` (`apps/web/lib/format.ts:9`); the two `"+05:30"` literals above; a literal `330 * 60 * 1000` (`apps/web/app/admin/supplies/exports.ts:385`); private Intl formatters (`apps/web/app/admin/amounts/page.tsx:274-275`).
- `RECENT_DAYS = 5` is declared three times: the driver route above, `apps/web/app/driver/page.tsx:169` and `apps/web/app/admin/supplies/page.tsx:49` (the value the admin page sends as `days`). Change them together. Screens that ignore IST: see §6.11.

### 10.13 Formatting, CSV and image-URL helpers
- `apps/web/lib/format.ts`: Intl formatters built once ("Intl objects are expensive to build", `:5`), all `en-IN` in `Asia/Kolkata`. Dates: `formatDateTime` (`:49`), `formatShortDateTime` (`:55`), `formatShortDate` (`:61`), `formatDateHeading` (`:67`); an invalid date formats as `""`; exact output strings depend on the runtime's ICU data (unverified).
- `istDayKey` (`apps/web/lib/format.ts:73`) and `istToday` (`:79`) give the IST `YYYY-MM-DD` for grouping and for `<input type="date">`; `relativeDayLabel` (`:84`) gives "Today" / "Yesterday" / the date heading.
- `formatNumber` (`apps/web/lib/format.ts:96`) uses Indian grouping with at most 2 decimals and turns `null`, `undefined` and `NaN` into `"0"`; `formatMoney` (`:101`) prefixes the rupee sign; `roundMoney` (`:106`) rounds to paise. Test for a pending amount BEFORE formatting, or it prints as zero.
- `apps/web/lib/csv.ts` `csvCell` (`:5-12`): `null`, `undefined` and non-finite numbers -> empty cell; a string starting with `=`, `+`, `-`, `@`, tab or CR gets a leading apostrophe because such text "would run as a formula when the file is opened" (this also hits a phone number typed with a leading plus); cells containing a double quote, comma, CR or LF are quoted with the quote doubled.
- `toCsv(rows, { bom = true })` (`apps/web/lib/csv.ts:17-20`): comma-joined cells, CRLF rows, trailing CRLF. The byte-order mark is for Excel: "Leave it out when the text goes somewhere else, such as an upload to Google Drive", which passes `{ bom: false }` (`apps/web/app/admin/supplies/page.tsx:559`).
- `apps/web/lib/imageUrl.ts`: `cloudinaryThumb(url, width = 320)` (`:4-7`) rewrites the first `/upload/` to `/upload/w_{width},c_limit,q_auto,f_auto/` (callers pass 120 and 640); `cloudinaryAuto(url)` (`:9-12`) inserts `q_auto,f_auto`. A URL without `/upload/` is returned unchanged; neither is idempotent, so always pass the stored original. WHY: "so lists and previews don't download the full-resolution original image".

### 10.14 Legacy data and migration policy
| Date | Commit | Schema or data-rule change | What the live database may still hold (unverified) |
|---|---|---|---|
| 2026-06-15 | `de1f1c6` | Tanker-era models `Assignment`, `WaterSupplyPoint`, `Entry`; `SupplyLog` deliveries required `vehicle` + `pointName`; `Vehicle.vehicleNumber` unique | Collections `assignments`, `watersupplypoints`; ledger rows with `pointName` and no customer or cans |
| 2026-06-22 | `a5c19d6` | `bufferCommands: false`; first three `SupplyLog` indexes | Per the comment at `apps/web/lib/mongodb.ts:46-52`, automatic index builds stopped working here |
| 2026-06-22 | `4b79842`, `d03c756`, `0b8b0b3` | `Customer` model with unique `phone`; `SupplyLog` gains `customer`, `cansDelivered`, `cansTakenBack`; `vehicle` and `pointName` become optional; `both` location type | Duplicate phones, if the unique index never built: until `e810079` creation relied on the 11000 error alone |
| 2026-06-26 | `92f0c12`, `a278d1b` | Vehicle odometer fields; `Customer.registeredDate` | Customers without `registeredDate` |
| 2026-06-29 | `2e9a936` | Customer soft delete (`isDeleted`) replaces `findByIdAndDelete` | Customers without `isDeleted`; rows pointing at customers hard-deleted earlier |
| 2026-06-29 | `e7057f4`, `f61febf`, `c1e6c7e` | `securityDeposit`; `paymentStatus`; `Stock` model | Deliveries without `paymentStatus` |
| 2026-07-31 | `1ca3e0d` | `Entry` model deleted (no file ever imported it); `apps/web/lib/istTime.ts` added: day windows and the odometer gate move from the server clock / UTC day to IST | Probably no `entries` collection |
| 2026-09-22 | `6f579ca` | `productType`, `casesDelivered`; `Customer.cashPerCase` | Deliveries without `productType` |
| 2026-09-23 | `3e1ee58` | `cashPerCase` removed; `caseSize`, `casePrice` added | `cashPerCase` values, or case rows without size or price, only if a non-main build wrote to the same database (both commits reached `main` in one merge) |
| 2026-09-24 | `e810079` | `Assignment`, `WaterSupplyPoint` and their routes deleted; `apps/web/models/index.ts`; `ensureIndexes`; `vehicleNumber` unique removed; `{ vehicle, suppliedAt }` and `{ createdAt }` indexes; `apps/web/lib/customers.ts`; driver and vehicle delete guards; atomic integer odometer | Rows whose driver or vehicle was hard-deleted before the guards; fractional odometer readings; same-day duplicate or missing history entries; `vehicleNumber` values upper-cased by the old create route |

- Written policy: "A water row without `productType` is a can; rows without `paymentStatus` count as cash. Queries filter with `$ne` / `$nin` and reads default, so old documents keep working. Never change that with a migration." (`apps/web/README.md:31`), and "`MONGODB_URI` points at the live database in production, so never run scripts or tests against it; use a throwaway MongoDB for anything that writes." (`README.md:34`).
- So: add new fields as optional with a read-time default, keep "missing" meaning the old default, and filter with the forms in §10.15. Do not add `required`, a backfill script or a unique index that old rows would violate.
- Tolerance in code: `$ne` / `$nin` / `$ifNull` in queries; the readers `toProductType` (`apps/web/lib/supplyProduct.ts:16-18`) and `paymentLabel` (`apps/web/app/components/PaymentPill.tsx:6-8`); `log.customer?.name ?? log.pointName ?? "-"` (`apps/web/app/admin/supplies/page.tsx:199`; the driver list ends in `"Delivery"` instead, `apps/web/app/driver/page.tsx:293`); `registeredDate ?? createdAt` (`apps/web/app/admin/customers/[id]/page.tsx:57`); `casesBySizeText` prints "size not set N" for case rows without a size (`apps/web/lib/supplyProduct.ts:170-175`).
- The only backfill is lazy: the admin Edit dialog always sends `productType` and `paymentStatus` for a delivery (`apps/web/app/admin/supplies/page.tsx:698-707`), "so older rows get it recorded on save".
- Nothing reads, writes or drops the old collections or the removed `cashPerCase` field; `pointName` stays in the schema only as a read path.
- Removing a field from a schema does not remove stored data: `.lean()` reads still return it, while Mongoose's default strict mode ignores writes and `$unset`s to paths outside the schema (library default, unverified). Cleaning such data would mean a one-off script against the live database, which the policy above rules out; treat it as the owner's decision.

### 10.15 Query cookbook
| Need | Correct filter | Wrong filter and why |
|---|---|---|
| Can deliveries | `{ logType: "water", productType: { $ne: "case" } }` (`apps/web/app/api/admin/supplies/route.ts:132-134`) | `{ productType: "can" }`: rows saved before the field existed have none (`apps/web/models/SupplyLog.ts:64-65`) |
| Cash-paid deliveries | `{ logType: "water", paymentStatus: { $nin: ["upi", "not_paid"] } }` (`apps/web/app/api/admin/supplies/route.ts:123-125`) | `{ paymentStatus: "cash" }`: older rows and every admin-added delivery have no field. Without `logType`, the `$nin` also matches cash-ledger rows |
| Pending amount | `{ amount: { $exists: false } }` (`apps/web/app/api/admin/supplies/route.ts:110`) | `{ amount: 0 }` or a falsy test: 0 is a real amount |
| Non-deleted customers (admin views) | `{ isDeleted: { $ne: true } }` (`apps/web/app/api/admin/customers/route.ts:17`) | `{ isDeleted: false }`: documents created before the flag existed lack it |
| Selectable customers (picker, new delivery) | `{ isActive: true }` (`apps/web/app/api/driver/customers/route.ts:14`) | `{ isDeleted: { $ne: true } }` alone: includes deactivated customers |
| A driver's own rows | `{ driver: <session id>, suppliedAt: ... }` with the id from `requireDriver()` (`apps/web/app/api/driver/supplies/route.ts:116-119`) | A driver id taken from the query or body: one driver could read another's rows |
| Ids and dates inside `aggregate()` | Pre-cast: `new Types.ObjectId(id)`, `Date` objects (`apps/web/app/api/admin/supplies/route.ts:59-60`, `:96`) | Raw strings: "aggregation pipelines skip schema casting", so the `$match` finds nothing |
| An IST day, today, or the last N days | `istDateRange(day)`; `istDayStart()` / `istDayEnd()`; `istDayStart() - (N - 1) * 24 h`, then `{ suppliedAt: { $gte: start, $lte: end } }` | `new Date(day)` with `setHours(0, 0, 0, 0)`: the server's zone (usually UTC) shifts the day by 5 h 30 min |
| New customers in a period | `newCustomerMatch(range)` = `{ createdAt: { $gte, $lte } }`, deleted ones included (`apps/web/lib/analyticsRange.ts:56-58`) | `registeredDate`: admin-editable and overwritten by a restore |
| A vehicle by registration number | `{ name: <anchored, escaped, case-insensitive regex> }` (`apps/web/app/api/admin/vehicles/route.ts:47`) | `{ vehicleNumber }`: that field is the model |
| Drivers | `{ role: "driver" }` with `.select("-password")` (`apps/web/app/api/admin/drivers/route.ts:20-21`) | An unprojected `User` query returns the password hash |

## 11. PWA and mobile platform

### 11.1 What ships to phones

- One artifact: the Next.js app in `apps/web`, installed from the browser as a Progressive Web App. Admin and driver use the same install; the role decides the portal after sign-in (see §6).
- No native projects exist. Verified by listing the repository tree at `c251bc4` (97 tracked files): no `android/` or `ios/` directory, no Gradle, Xcode, `Info.plist` or `AndroidManifest.xml` file, no Capacitor or Cordova config, no `.well-known/assetlinks.json` (so no Trusted Web Activity), and no `capacitor`, `react-native` or `expo` entry in any `package.json`.
- No app-store or Play Store listing is referenced in any code, config or README file (the root PDF report was not text-searched; a listing kept outside the repo: unverified). README: "Installing from a phone needs the HTTPS deployment." (`apps/web/README.md:52`).
- The PWA layer is hand-written: no `next-pwa`, Workbox or Serwist dependency. It was added in commit `9f9f5a5` (2026-09-21).
- Not implemented: push notifications, background sync, an offline write queue, IndexedDB or any offline data cache. README: "Saving while offline is not supported, and forms still need a connection." (`apps/web/README.md:50`).

### 11.2 Web app manifest

- Source `apps/web/app/manifest.ts` (a Next.js metadata route), served at `/manifest.webmanifest` and listed as a static route by `next build` (see §17). Next.js emits the `<link rel="manifest">` tag itself (built HTML not inspected, unverified).

| Field | Value | Note |
|---|---|---|
| `id` | `/` | Stable app identity |
| `name` / `short_name` / `description` | `Royal King Water Supply` / `Royal King` / `Royal King Water Supply Management System` | |
| `start_url` / `scope` | `/` / `/` | "`/` redirects a signed-in user to their portal (see proxy.ts)" (`apps/web/app/manifest.ts:12`) |
| `display` / `orientation` | `standalone` / `portrait` | No browser chrome when installed |
| `background_color` / `theme_color` | `#f8fafc` / `#0a3d91` | "Colours match --accent-primary and --bg-secondary in globals.css" (`apps/web/app/manifest.ts:4`) |
| `icons` | `/icons/icon-192.png` 192x192 `any`; `/icons/icon-512.png` 512x512 `any`; `/icons/maskable-512.png` 512x512 `maskable` | All `image/png` (`apps/web/app/manifest.ts:19-23`) |
| `shortcuts` | `Log delivery` (short name `Deliver`) -> `/driver`; `Deliveries` (short name `Deliveries`) -> `/admin/supplies` | Both use `/icons/icon-192.png` (`apps/web/app/manifest.ts:25-38`) |

- Not set: `lang`, `dir`, `categories`, `screenshots`, `display_override`, `related_applications`.
- Role mismatch on a shortcut: both shortcuts are offered to every install, because a manifest cannot vary by role. The proxy sends a non-driver on `/driver*` and a non-admin on `/admin*` to `/login` (`apps/web/proxy.ts:18-24`), and a signed-in user reaching `/login` is forwarded to their own portal (`apps/web/proxy.ts:9-16`). Result: a signed-in admin tapping "Log delivery" lands on `/admin/amounts`, a signed-in driver tapping "Deliveries" lands on `/driver`, a signed-out user sees the login page. The comment at `apps/web/app/manifest.ts:24` describes only the first hop.
- The manifest is precached and served cache-first by the service worker, so an edit needs a `VERSION` bump to reach pages the worker controls (`apps/web/public/sw.js:29`, `:80-85`).
- `/manifest.webmanifest`, `/sw.js`, `/offline.html` and `/icons/*` must stay outside the proxy matcher (`apps/web/proxy.ts:35-37`). WHY: "They have to load without a session." (`apps/web/README.md:58`).

### 11.3 Service worker

- `apps/web/public/sw.js`: plain JavaScript served as-is at `/sw.js`, scope `/`. Constants: `VERSION = "v2"` (`apps/web/public/sw.js:22`; it was `v1` until commit `e810079`), `STATIC_CACHE = rk-static-v2` built from `VERSION` and the only cache (`:23`), `OFFLINE_URL = /offline.html` (`:24`), `MAX_STATIC_ENTRIES = 200` (`:25`).
- Precached at install (`apps/web/public/sw.js:27-33`): `/offline.html`, `/manifest.webmanifest`, `/icons/icon-192.png`, `/icons/icon-512.png`, `/icons/maskable-512.png`.

| Event | Behaviour | Lines |
|---|---|---|
| `install` | `cache.addAll(PRECACHE_URLS)`; no `skipWaiting()`, so an updated worker waits | `apps/web/public/sw.js:36-38` |
| `activate` | Deletes every cache named `rk-*` except the current one; enables navigation preload when supported ("Lets the browser start the page request while the worker boots"); `clients.claim()` | `apps/web/public/sw.js:40-56` |
| `message` | `{ type: "SKIP_WAITING" }` -> `self.skipWaiting()`; no other message is handled | `apps/web/public/sw.js:58-62` |
| `fetch` | Routes by request class (next table) | `apps/web/public/sw.js:64-86` |

| Request class | Strategy | Lines |
|---|---|---|
| Non-GET (saves, the fuel-bill upload) | Not intercepted | `apps/web/public/sw.js:66` |
| Other origins (Cloudinary, Google) | Not intercepted | `apps/web/public/sw.js:68-69` |
| `/api/*`, including `/api/auth/*` | Not intercepted | `apps/web/public/sw.js:70` |
| Navigations (`request.mode === "navigate"`) | Network only: the preload response, else `fetch`; when the network call throws, the cached `/offline.html`. HTML is never stored | `apps/web/public/sw.js:72-75`, `:88-99` |
| `/_next/static/*`, `/icons/*`, `/manifest.webmanifest` | Cache-first; a miss is fetched and stored only when `response.ok && response.type === "basic"`, then the cache is trimmed | `apps/web/public/sw.js:77-83`, `:101-113` |
| Any other same-origin GET (RSC payloads, `/apple-icon.png`, `/favicon.ico`) | Browser default; the worker neither answers nor stores it | `apps/web/public/sw.js:84-85` |

- Never cached, and why (`apps/web/public/sw.js:9-15`): `/api/*` "so ledger data is always live"; non-GET requests "so saves and the fuel-bill upload go straight to the server"; page HTML "so nothing from one signed-in user can be shown to another user on a shared phone"; other origins. Because nothing user-specific is stored, the worker and its cache are safely left in place on sign-out; do not add page or API caching without solving the shared-phone case first.
- Trim: at most `200 - 5 = 195` runtime entries, oldest deleted first; precached files are never removed. WHY: "Keeps the cache from growing forever as new deploys add new hashed chunks" (`apps/web/public/sw.js:115-124`).
- The offline page appears only when the navigation request itself fails; an HTTP error page (for example a 500) is passed through unchanged (`apps/web/public/sw.js:89-98`).
- Offline page `apps/web/public/offline.html`: everything inline, "no Next.js chunks, no fonts", because "It must work with no network at all" (`apps/web/public/offline.html:8-11`). Text: "You're offline" / "Check your mobile data or Wi-Fi and try again. Nothing you already saved is lost." / button "Try again" / "This page reloads by itself when the connection comes back." It reloads on the button and on the `online` event (`apps/web/public/offline.html:79-91`).
- `/sw.js` response headers (`apps/web/next.config.js:39-48`): `Content-Type: application/javascript; charset=utf-8`, `Cache-Control: no-cache, no-store, must-revalidate`, `Content-Security-Policy: default-src 'self'; script-src 'self'`. WHY: "Never cache it, so a new version is always picked up; lock it to same-origin scripts." A future cross-origin fetch from inside the worker (for example caching Cloudinary images) is expected to be blocked by that CSP (unverified).

### 11.4 Registration and update flow

- `PwaRegister` is mounted in the root layout, so it runs on every route (`apps/web/app/layout.tsx:45`; `apps/web/app/components/PwaRegister.tsx`).

| Aspect | Behaviour | Lines |
|---|---|---|
| Production only | Registers when `process.env.NODE_ENV === "production"`: any production build, including a local `npm run build && npm run start` | `apps/web/app/components/PwaRegister.tsx:20` |
| Development | Unregisters every service worker on the origin. WHY: "`next dev` serves unhashed chunk names, so a worker left over from a local production run would serve stale code." The `rk-*` caches are left in place | `apps/web/app/components/PwaRegister.tsx:20-27` |
| Registration | After the window `load` event ("so it doesn't compete with first paint"): `register("/sw.js", { scope: "/", updateViaCache: "none" })`; a failure is only a `console.warn` | `apps/web/app/components/PwaRegister.tsx:66-94` |
| Update detection | `reg.waiting` at registration, the `updatefound` event, and the installing worker reaching `installed`. No card on the first install: `offerUpdate` needs an existing `navigator.serviceWorker.controller` | `apps/web/app/components/PwaRegister.tsx:33-51`, `:74-76` |
| Foreground re-check | On `visibilitychange` to visible, `registration.update()` when `UPDATE_CHECK_INTERVAL_MS` (30 min) has passed since the effect started (page load) or the last check. WHY: "Drivers often keep the installed app open all day." | `apps/web/app/components/PwaRegister.tsx:5-7`, `:59-64` |
| What the user sees | A card fixed above the bottom bars (`bottom: calc(80px + env(safe-area-inset-bottom, 0px))`, `zIndex: 350`): "A new version of the app is ready." with **Later** and **Reload**. The words "Update available" used in `apps/web/public/sw.js:18` and the README appear nowhere in the UI | `apps/web/app/components/PwaRegister.tsx:113-152` |
| Reload | Posts `{ type: "SKIP_WAITING" }` to the waiting worker; the page reloads on `controllerchange` only if the user tapped Reload. WHY: "so a half-filled delivery or fuel form is never wiped by an automatic page refresh." | `apps/web/app/components/PwaRegister.tsx:9-11`, `:53-57`, `:107-111` |
| Later | Hides the card; it returns on the next page load while a worker is still waiting, or earlier if another new worker finishes installing (`offerUpdate` resets the flag) | `apps/web/app/components/PwaRegister.tsx:38`, `:74`, `:144-146` |

How a new deployment reaches an installed phone:
1. Ordinary deploy (`sw.js` bytes unchanged): no card. HTML is never cached and `/_next/static/*` names are content-hashed, so the next full page load (cold start or manual reload) runs the new build.
2. An app that stays open keeps running the old bundle: the driver portal is a single page, and nothing in the app compares build versions (see §16).
3. Deploy with a new `VERSION`: the browser re-fetches `/sw.js` on a navigation (browser default, unverified) or on the 30-minute foreground check; the new worker precaches into `rk-static-<new>` and waits; the card appears.
4. **Reload** activates the new worker, which deletes the old `rk-*` cache and claims the page; the resulting `controllerchange` reloads it. Without Reload the waiting worker takes over once every window of the app is closed (standard lifecycle, unverified on devices).
5. Confirm on the phone with the "v{version}" label under Sign Out (see §8.11).

- Bump `VERSION` in `sw.js` when the worker's caching behaviour, `offline.html`, a file in `apps/web/public/icons/` or `apps/web/app/manifest.ts` changes: those are precached or cache-first, so old copies are served until the cache name changes (`apps/web/public/sw.js:17-19`, `:84-85`). Ordinary page, API or CSS changes do not need it.
- Bump `version` in `apps/web/package.json` (now `0.2.2`) for every release: "Bump "version" in package.json for each release" (`apps/web/next.config.js:3-4`). It is only baked into `NEXT_PUBLIC_APP_VERSION` at build time and shown in both profile menus (`apps/web/next.config.js:5`, `:9-11`; `apps/web/app/driver/layout.tsx:304-306`; `apps/web/app/admin/layout.tsx:306-308`). The two numbers are independent and both are edited by hand; changing one never changes the other.

### 11.5 Install prompt

- `apps/web/app/components/InstallPrompt.tsx`, rendered only on `/` (`apps/web/app/page.tsx:96`) and `/login` (`apps/web/app/login/page.tsx:117`). Signed-in users are redirected away from both pages, so they never see it.
- Hidden when already installed (`navigator.standalone === true` or `matchMedia("(display-mode: standalone)")`) or previously dismissed (`apps/web/app/components/InstallPrompt.tsx:16-19`, `:51`).
- Android and desktop Chrome/Edge: listens for `beforeinstallprompt`, calls `preventDefault()` ("keep Chrome's own mini-infobar out of the way"), keeps the event and shows "Install the app for quick access from your home screen." with an **Install** button (`apps/web/app/components/InstallPrompt.tsx:58-62`, `:107-121`).
- Install tap: `prompt()`, await `userChoice`, then hide whatever the answer. WHY: "The event can only be used once ... Chrome fires a fresh beforeinstallprompt later if the user declined." A declined native dialog is not remembered (`apps/web/app/components/InstallPrompt.tsx:79-87`). The `appinstalled` event also hides the card (`:64-67`).
- iOS (user agent contains iphone, ipad or ipod, or is `macintosh` with `maxTouchPoints > 1`): text only, "Install on iPhone: tap Share, then Add to Home Screen.", no button, "because iOS has no install API" (`apps/web/app/components/InstallPrompt.tsx:21-25`, `:43-45`, `:113`).
- Dismissal: the X writes `localStorage["rk-install-dismissed"] = "1"`. There is no timestamp and no expiry: the card stays hidden in that browser until site data is cleared, and nothing in the app removes the key (`apps/web/app/components/InstallPrompt.tsx:14`, `:27-41`, `:89-92`). Storage errors are swallowed: with storage blocked the card simply shows again on the next visit (`:30-32`, `:38-40`).

### 11.6 Icons

| File | Size | Variant | Used by |
|---|---|---|---|
| `apps/web/public/icons/icon-192.png` | 192x192 | Rounded tile (`rx=112`), drop scale 14 | Manifest `any`, both shortcuts, precache |
| `apps/web/public/icons/icon-512.png` | 512x512 | Rounded tile, drop scale 14 | Manifest `any`, precache |
| `apps/web/public/icons/maskable-512.png` | 512x512 | Full bleed, scale 13: "drop stays inside the central 80% safe circle" | Manifest `maskable`, precache |
| `apps/web/app/apple-icon.png` | 180x180 | Full bleed, scale 14: "iOS applies its own rounded corners" | Apple touch icon at `/apple-icon.png` |
| `apps/web/app/favicon.ico` | 16, 32, 48 | Rounded tile, scale 17 "so it stays legible at 16px"; hand-built ICO holding PNG data | Browser tab |

- Generator `apps/web/scripts/generate-pwa-icons.mjs`: the input is an inline SVG, a white water drop on `BRAND_BLUE = "#0a3d91"` on a 512x512 canvas (`apps/web/scripts/generate-pwa-icons.mjs:16-39`); there is no artwork file on disk. It renders each PNG with `sharp` at `compressionLevel: 9` and writes the five files above (`:50-52`, `:89-98`). Paths resolve from the script's own location, so the working directory does not matter (`:17`).
- Run `npm run icons` in `apps/web` (`apps/web/package.json:12`), commit the outputs, and bump `VERSION` in `apps/web/public/sw.js` (`apps/web/scripts/generate-pwa-icons.mjs:1-4`). The script was not run for this handbook (unverified).
- Dependencies: Node built-ins plus `sharp`, which is not declared in `apps/web/package.json`. It is present only because `next` lists it as an optional dependency (`package-lock.json:3795`) and the root override raises it to `^0.35.0` (root `package.json:26`); the installed 0.35.3 is marked `optional` (`package-lock.json:4549-4554`). An install that skips optional packages breaks the script (see §12 and §16).
- The script avoids the Node `process` global and imports `Buffer` explicitly, because the shared lint config "only provides service-worker globals" (`apps/web/scripts/generate-pwa-icons.mjs:6-10`; `packages/eslint-config/next.js:33`).

### 11.7 Mobile behaviours

| Topic | Fact | Source |
|---|---|---|
| Viewport | `width: device-width`, `initialScale: 1`, `themeColor: "#0a3d91"`, `viewportFit: "cover"`; no maximum scale, so pinch zoom stays available. WHY cover: "Lets env(safe-area-inset-*) work, so the bottom tab bars clear the iPhone home indicator when the app is installed." | `apps/web/app/layout.tsx:26-33` |
| iOS web-app metadata | `appleWebApp: { capable: true, title: "Royal King", statusBarStyle: "default" }`; "default" keeps the iOS status bar above the sticky blue headers "instead of drawing over them". No Apple splash images are defined | `apps/web/app/layout.tsx:17-23` |
| Safe areas | `body` left and right padding `env(safe-area-inset-left/right, 0px)`; driver tab bar `padding-bottom: calc(0.35rem + env(safe-area-inset-bottom))`; admin bottom nav `max(0.5rem, env(safe-area-inset-bottom))`; the update card and the offline page add the bottom inset | `apps/web/app/globals.css:64-67`, `:524`; `apps/web/app/admin/layout.tsx:342`; `apps/web/app/components/PwaRegister.tsx:121`; `apps/web/public/offline.html:31` |
| Driver tab bar | Below 768px `position: fixed; bottom: 0; z-index: 100`; from 768px a static strip with radius 14px. `.driver-content` reserves `padding-bottom: 80px` (0 from 768px) | `apps/web/app/globals.css:515-547` |
| Admin bottom nav and update card | `.mobile-bottom-nav`: fixed, shown at 860px and below, where the content gets `padding-bottom: 90px`. The update card's 80px offset "Sits above the driver tab bar and the admin mobile bottom nav." and is tied to the bar heights by hand | `apps/web/app/admin/layout.tsx:314-347`; `apps/web/app/components/PwaRegister.tsx:120-121` |
| Standalone display | Manifest `display: standalone`. The only runtime check is `isInstalled()` in the install card; there is no `@media (display-mode: standalone)` CSS | `apps/web/app/manifest.ts:15`; `apps/web/app/components/InstallPrompt.tsx:16-19` |
| Input modes | `numeric`: odometer, can and case counts, cans taken back, stock counts. `decimal`: price per case, cash amount, cash per can. Also `type="tel"`, `type="email"` and hidden `type="date"` inputs | `apps/web/app/driver/layout.tsx:418`, `:454`; `apps/web/app/driver/page.tsx:986`, `:1003`, `:1016`, `:1140`, `:1327`, `:1340`, `:1384`; `apps/web/app/components/StockModal.tsx:142` |
| Touch and type size | Radio labels `minHeight: 44px`; calendar and stock step buttons 36px; `.form-input, .form-select` are `0.95rem` (15.2px), below the 16px under which iOS Safari is known to zoom on focus (unverified on a device) | `apps/web/app/driver/page.tsx:238`, `:947`, `:1062`; `apps/web/app/components/StockModal.tsx:133`; `apps/web/app/globals.css:248` |

Camera header versus bill-photo capture:
- Every response carries `Permissions-Policy: camera=(), microphone=(), geolocation=()` (`apps/web/next.config.js:36`), while the fuel-bill photo uses only file inputs, one of them with `capture="environment"` (`apps/web/app/driver/page.tsx:1208-1228`; see §8.13). A search of `apps/web` finds no `getUserMedia`, `mediaDevices` or geolocation call.
- Reasoning: the `camera` policy governs in-page camera streams (`getUserMedia`). A file input with `capture` hands off to the operating system's camera or picker and returns a `File`, which is not a policy-controlled feature, so no conflict is expected. This was not confirmed on a real Android or iOS device (unverified).
- Consequence: any future in-page camera feature (live preview, QR scanner) will be blocked until the header becomes `camera=(self)`.

### 11.8 Unverified on real devices

| Item | Why it matters | How to verify |
|---|---|---|
| Camera capture through the file input while `camera=()` is set, and whether Camera opens the rear camera directly or a chooser (mixed `accept` list) | A fuel entry cannot be saved without a photo | Android Chrome and iOS Safari, in a tab and installed: Cash -> Fuel -> Camera, note what opens, take a photo, submit |
| HEIC photos end to end | HEIC skips compression: the preview may be blank, the file may exceed 4 MiB, Cloudinary must accept it | iPhone set to High Efficiency: Gallery -> pick a HEIC, check preview, save, open it in the admin portal |
| Photo orientation after compression | A sideways bill is hard to read | Take one portrait and one landscape photo; view both in the admin portal |
| Install flow: `beforeinstallprompt` fires and Install works; the iOS hint in Safari and in other iOS browsers | Installing from the browser is the only distribution channel | Fresh browser profile, open `/` on the HTTPS deployment on Android, desktop Edge and an iPhone |
| Installed look: standalone window, portrait lock, status-bar style, safe-area insets around both bottom bars and the update card, launch screen | These faults only show on notched phones | Install on an iPhone with a home indicator and on an Android phone; walk through every screen |
| Offline page on a cold start and its automatic reload | It is the only offline behaviour the app promises | Open the installed app in airplane mode, then turn the network back on |
| Update card after a `VERSION` bump, the Later path, and takeover after closing the app | A broken flow strands phones on old icons or an old offline page | Deploy a build with a bumped `VERSION` to a test deployment; reopen the app or keep it open past 30 minutes |
| How long an open or backgrounded app keeps the old bundle after an ordinary deploy | No build-skew check exists | Deploy with a bumped `version`, leave the app open, note when the label under Sign Out changes |
| Manifest edits reaching an already installed app | Name, icon or shortcut changes might never arrive | Change `short_name` and bump `VERSION` on a test deployment; watch the installed app over several days |
| Hosting body limit and its 413 answer; response headers served as configured | The client's 413 message and both 4 MiB limits assume it | `curl -I` the deployment; post an oversized multipart body on a non-production deployment with a throwaway database |
| Hidden date input: `showPicker()` and its `focus()` + `click()` fallback | Without it a driver cannot reach older days | Tap the calendar button on the phones in use |
| Fuel-bill Download inside the installed app (blob download, new-tab fallback, Cloudinary CORS) | The download may fail silently | Open a fuel entry -> Download, in a tab and installed, on Android and iOS |
| `AbortSignal.timeout` support, and the tab bar position while the odometer check blurs the page | Without the API the daily odometer gate is skipped silently (see §8.11) | Open `/driver` on the oldest phone in use before the day's reading is entered; the gate must appear |

## 12. Patches and tooling

npm workspaces (`apps/*`, `packages/*`, `package.json:20-23`) driven by Turborepo. `apps/web` and `@repo/eslint-config` are ES modules (`"type": "module"`), so `next.config.js` and `eslint.config.js` use `import`, never `require`. Tool versions: see §4. Measured results (lint, types, build, audit): see §17.

### 12.1 Patches and overrides

- There is NO patching mechanism: no `patch-package`, no `patches/` folder, no `postinstall` / `prepare` script, no git, URL or file dependencies (every lockfile `resolved` is the npm registry except the three workspace links).
- The only forced versions are the npm `overrides` in the root `package.json:24-27`:

| Override | Range | Locked | What `next@16.2.12` itself asks for | Effect |
|---|---|---|---|---|
| `postcss` | `^8.5.18` | 8.5.25 (`package-lock.json:4156`) | exact `8.4.31` (`package-lock.json:3777`) | One hoisted copy newer than Next's pin. The repo has no PostCSS config; this only affects Next's internal CSS pipeline |
| `sharp` | `^0.35.0` | 0.35.3, `optional: true` (`package-lock.json:4549`) | optional `^0.34.5` (`package-lock.json:3795`) | A version outside the range Next declares. It is also the only source of `sharp` for `npm run icons`: `sharp` is in no `dependencies` list |

- Why: not recorded. Added in commit `1ca3e0d` (2026-07-31), whose subject only says "update package.json with overrides for postcss and sharp"; the same commit moved `next` 16.1.5 -> 16.2.12 and removed `@repo/ui`, `react-hook-form` and `zod`. Forcing patched transitive versions after an `npm audit` is the likely reason (unverified), and the audit is still not clean (see §17). On every `next` upgrade re-check both overrides against Next's new ranges and delete the ones no longer needed; removing or loosening one changes what resolves, so review the lockfile diff.
- Exact pins (no `^`): `next` 16.2.12 (`apps/web/package.json:18`), `typescript` 5.9.2 (`package.json:14`, `apps/web/package.json:30`), `@types/react` 19.2.2 and `@types/react-dom` 19.2.2 (`apps/web/package.json:27-28`). No reason is recorded; all four were already exact in the template commit `de1f1c6` (`next` was 16.1.5 then).
- Lockfile: `package-lock.json`, `lockfileVersion: 3` (`:3`), 354 `node_modules/*` entries; `packageManager` is `npm@10.8.1` (`package.json:19`). `.npmrc` is an empty file: no `engine-strict`, no `legacy-peer-deps`, so engine mismatches only warn.
- `npm ls` reports two "extraneous" packages after a clean `npm ci`: `@emnapi/runtime@1.11.3` and `@img/sharp-wasm32@0.35.3`. Both are lockfile entries marked `optional: true` (`package-lock.json:51`, `:693`); `@img/sharp-wasm32` is required only by the platform packages `@img/sharp-freebsd-wasm32` and `@img/sharp-webcontainers-wasm32` (`:348`, `:719`), and `@emnapi/runtime` only by it (`:700`). Why npm flags them is unverified. They are harmless: do not hand-edit the lockfile or prune to "fix" it.

### 12.2 Turborepo

| Key in `turbo.json` | Value | Meaning |
|---|---|---|
| `ui` (`:3`) | `"tui"` | Interactive terminal UI for `turbo run`. For plain logs pass `--ui=stream` (flag not run here) |
| `globalEnv` (`:4-13`) | `MONGODB_URI`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, `CLOUDINARY_URL`, `ADMIN_USERNAME`, `ADMIN_PASSWORD`, `NEXT_PUBLIC_GOOGLE_CLIENT_ID`, `NODE_ENV` | The values of these variables are part of every task's cache key, and the list is what the lint rule in §12.3 checks against |
| `tasks.build` (`:15-19`) | `dependsOn: ["^build"]`; `inputs: ["$TURBO_DEFAULT$", ".env*"]`; `outputs: [".next/**", "!.next/cache/**"]` | Cached. Editing any `.env*` file in the workspace invalidates the build; on a cache hit `.next` (without Next's own cache) is restored instead of rebuilt |
| `tasks.lint`, `tasks.check-types` (`:20-25`) | `dependsOn` the same task in upstream workspaces | Cached with no outputs (a hit replays the log). The two config packages have no scripts, so only `web` runs |
| `tasks.dev` (`:26-29`) | `cache: false`, `persistent: true` | Long-running, never cached |
| Not defined | `start`, `icons`, `format` tasks; `envMode`; `globalDependencies`; pass-through env; remote cache | `start` and `icons` exist only as `apps/web` scripts (§12.6) |

- The local cache directory `.turbo` is git-ignored (`.gitignore:19`). Remote caching is not configured in the repo; whether a hosting account links one is unverified. To rule out a stale cache, run the task with `--force` (not run here).
- A new environment variable goes into `turbo.json` `globalEnv`, `apps/web/.env.example` (name and placeholder only), each developer's `apps/web/.env`, the hosting provider's settings and the §6.7 table (the full six-step checklist is §13.7). If it is NOT added to `globalEnv`, in order of certainty:
  1. `npm run lint` fails on the first `process.env.NEW_VAR` (expected from config, not run here: `turbo/no-undeclared-env-vars`, §12.3). Measured exception: an undeclared `NEXT_PUBLIC_*` name is not flagged (§12.3).
  2. The variable is not in the cache key, so `turbo run build` can replay a `.next` built with the old value (Turborepo behaviour, unverified here). `NEXT_PUBLIC_*` values are inlined at build time, so declare them too; whether Turborepo adds framework-prefixed names to the key by itself is unverified.
  3. Under Turborepo 2's default strict environment mode an undeclared shell or CI variable is not passed into the task at all, so it reads as `undefined` during `turbo run build` (unverified here). Values in `apps/web/.env*` are loaded by Next itself and are covered by `build.inputs`.

### 12.3 ESLint

- Flat config, ESLint 9. Chain: `apps/web/eslint.config.js:1-4` re-exports `nextJsConfig` from `@repo/eslint-config/next-js` = `packages/eslint-config/next.js:16-57`, which spreads `config` from `packages/eslint-config/base.js:12-32`. The script passes no path, so the whole `apps/web` directory is linted, including `public/sw.js`, `scripts/` and the config files.
- Order of what is applied: `js.configs.recommended`, `eslint-config-prettier`, `typescript-eslint` recommended (`base.js:13-15`) -> `turbo` plugin with `"turbo/no-undeclared-env-vars": "warn"` (`base.js:16-23`) -> `eslint-plugin-only-warn` (`base.js:24-28`) -> ignore `dist/**` -> the first three again (`next.js:18-20`, redundant) -> ignores `.next/**`, `out/**`, `build/**`, `next-env.d.ts` (`next.js:21-27`) -> `eslint-plugin-react` flat recommended (`next.js:28-36`) -> `@next/eslint-plugin-next` `recommended` + `core-web-vitals` rules (`next.js:37-45`) -> `eslint-plugin-react-hooks` recommended, `react/react-in-jsx-scope` off (`next.js:46-56`).
- `eslint-plugin-only-warn` + `--max-warnings 0` (`apps/web/package.json:10`): the plugin reports every rule violation as a warning (its documented purpose), and the CLI flag turns one warning into a non-zero exit - "ESLint, with warnings treated as errors" (`README.md:26`). In practice there is no "soft" tier: any finding of any enabled rule (unused variable, `react-hooks/exhaustive-deps`, `<img>`, explicit `any`, undeclared env var) fails `npm run lint` while being printed as a "warning". An editor showing only yellow squiggles, or `eslint` run without the flag (exit 0), does not mean lint passes. Deliberate exceptions need an `eslint-disable` comment (see §9.6).
- Turbo env rule: every `process.env.X` in linted code must be declared in `turbo.json` (§12.2). `NEXT_PUBLIC_APP_VERSION` is read at `apps/web/app/admin/layout.tsx:307` and `apps/web/app/driver/layout.tsx:305` without being listed and lint still passes; the plugin's handling of framework-prefixed `NEXT_PUBLIC_*` names is the presumed reason (unverified).
- Globals trap: the only declared globals are `globals.serviceworker` (`packages/eslint-config/next.js:30-35`) - no browser or Node set. Plain JS files (`next.config.js`, `public/sw.js`, `scripts/*.mjs`) must therefore avoid `process`, `Buffer`, `__dirname` and `window`; the icon script says so: "this file is linted with the shared config, which only provides service-worker globals, so it avoids the Node `process` global and imports Buffer explicitly" (`apps/web/scripts/generate-pwa-icons.mjs:6-8`). TS/TSX files use `window` and `document` freely and lint passes.
- Plugin-version mismatch: `@next/eslint-plugin-next` is `^15.5.0` (locked 15.5.22, `packages/eslint-config/package.json:13`) while the app runs `next` 16.2.12, so the Next rules are the 15.x set (see §16). `packages/eslint-config` has not changed since the template commit `de1f1c6`, which also explains its leftovers: exports `./base` and `./react-internal` (`packages/eslint-config/package.json:7`, `:9`) and `packages/typescript-config/react-library.json` are used by nothing since `packages/ui` was deleted, and `eslint-config-prettier` sits before the React/Next rule sets instead of last.

### 12.4 TypeScript

`apps/web/tsconfig.json:2` extends `@repo/typescript-config/nextjs.json`, which extends `base.json`. File names in the table are under `packages/typescript-config/` unless they start with `apps/`.

| Option | Value | Source | Effect on code |
|---|---|---|---|
| `strict` | `true` | `base.json:16` | Full strict family |
| `noUncheckedIndexedAccess` | `true` | `base.json:13` | `arr[i]` and `record[key]` are `T \| undefined`, so code needs `?.`, `??` or `!`: `entries[0]?.suppliedAt ?? Date.now()` (`apps/web/app/admin/supplies/page.tsx:457`), `sorted[0]!` (`apps/web/app/admin/vehicles/[id]/page.tsx:50`). Only 7 non-null `!` exist (on 6 lines) |
| `module` / `moduleResolution` | `ESNext` / `Bundler` (overriding base `NodeNext`) | `nextjs.json:6-7` | Extensionless relative imports. No `paths` or `baseUrl` anywhere, hence no import alias (see §9.6) |
| `isolatedModules` / `moduleDetection` | `true` / `force` | `base.json:8`, `:11` | Every file is a module; type-only re-exports need `type` |
| `target` / `lib` | `ES2022` / `es2022`, `DOM`, `DOM.Iterable` | `base.json:17`, `:9` | - |
| `jsx` / `allowJs` | `preserve` / `true` | `nextjs.json:9`, `:8` | `next.config.js` is in `include`, so it is part of the program; `checkJs` is not set anywhere, so its body is not expected to be type-checked (TypeScript default, unverified) |
| `noEmit` / `incremental` | `true` / `false` | `nextjs.json:10`; `base.json:7` | `tsc` only checks, and every run is a full check; `declaration` / `declarationMap` in base have no effect |
| `plugins` | `[{ "name": "next" }]`, declared twice | `nextjs.json:5`; `apps/web/tsconfig.json:4-8` | Editor integration only |
| `include` | `**/*.ts`, `**/*.tsx`, `next-env.d.ts`, `next.config.js`, `.next/types/**/*.ts` | `apps/web/tsconfig.json:10-16` | `scripts/*.mjs` and `public/sw.js` are NOT type-checked |

- `check-types` is `next typegen && tsc --noEmit` (`apps/web/package.json:11`). Typegen runs first to produce the generated route types that `tsconfig.json` includes; `.next/` and `next-env.d.ts` are git-ignored (`apps/web/.gitignore:13`, `:37`), so a fresh checkout has neither until a Next command has run (exactly which files typegen writes is unverified).
- `typescript.ignoreBuildErrors` is not set in `apps/web/next.config.js`, so `next build` is expected to stop on type errors too, and is not expected to run ESLint (Next.js 16 defaults, unverified).

### 12.5 Prettier

- Installed as a root devDependency only (`package.json:12`). There is no config of any kind: no `.prettierrc*`, `prettier.config.*`, `"prettier"` key, `.prettierignore` or `.editorconfig`, so Prettier's defaults apply.
- `npm run format` = `prettier --write "**/*.{ts,tsx,md}"` (`package.json:8`), from the repo root. Scope: `.ts`, `.tsx` and `.md` in every workspace - including the READMEs and this handbook - but NOT `.js`, `.mjs`, `.css`, `.json` or `.html`.
- Nothing checks formatting: there is no `--check` script, ESLint does not run Prettier (`eslint-config-prettier` only switches off conflicting ESLint rules), and nothing runs on commit.
- The code is not Prettier-formatted. Baseline (see §17.1): on a Windows working copy with CRLF line endings, `prettier --check` with the same glob flags all 67 tracked `.ts`/`.tsx`/`.md` files, because the committed blobs are LF and Prettier's default `endOfLine` is `lf`. With line endings ignored (`--end-of-line auto`) it still flags 59 of the 67, so the drift is real formatting (4-space files, unwrapped long lines, see §9.6), not only line endings.
- Therefore do NOT run `npm run format` as part of an unrelated change: it buries the real diff and conflicts with every open branch. If the owner wants formatting, add a config first, then format in one dedicated commit with nothing else in it.

### 12.6 Scripts reference

| Script | Defined in | Runs | Notes |
|---|---|---|---|
| `npm run dev` | `package.json:6` | `turbo run dev` -> `next dev --port 3000` (`apps/web/package.json:7`) | Port 3000. `--webpack` was dropped from this script in commit `e810079` |
| `npm run build` | `package.json:5` | `turbo run build` -> `next build` (`apps/web/package.json:8`) | Output `apps/web/.next`; cached by turbo (§12.2) |
| `npm run lint` | `package.json:7` | `turbo run lint` -> `eslint --max-warnings 0` (`apps/web/package.json:10`) | Any finding fails (§12.3) |
| `npm run check-types` | `package.json:9` | `turbo run check-types` -> `next typegen && tsc --noEmit` (`apps/web/package.json:11`) | Typegen first, then a full check (§12.4) |
| `npm run format` | `package.json:8` | `prettier --write "**/*.{ts,tsx,md}"` | Not a turbo task. Do not run casually (§12.5) |
| `npm run start` | `apps/web/package.json:9` only | `next start` | Run inside `apps/web` after a build; the root has no `start` script and turbo has no `start` task |
| `npm run icons` | `apps/web/package.json:12` only | `node scripts/generate-pwa-icons.mjs` | Run inside `apps/web`. Writes `public/icons/icon-192.png`, `public/icons/icon-512.png`, `public/icons/maskable-512.png`, `app/apple-icon.png` and `app/favicon.ico`; needs `sharp` (§12.1). Commit the output and bump the service-worker `VERSION` (see §11) |
| (none) | - | - | No `test`, `clean`, `format:check`, `prepare` or `postinstall` script exists in any `package.json`; the two `packages/*` workspaces have no scripts at all. Day-to-day commands and the release checklist: see §13 |

### 12.7 Not present

Verified by listing the repository tree at `c251bc4` (`git ls-tree -r origin/main`, 97 tracked files).

| Missing | Looked for | Consequence |
|---|---|---|
| CI | `.github/`, any workflow or pipeline file | Lint, type-check and build run only when a person runs them. Whether the host builds on push is a console setting (unverified, see §15) |
| Tests | A test runner in any `package.json` or the lockfile; `*.test.*`, `*.spec.*`, `__tests__` | No automated tests of any kind |
| Git hooks | `.husky/`, `lint-staged`, a `prepare` script | Nothing blocks a bad commit |
| Docker | `Dockerfile`, compose files, `.dockerignore` | Not containerised; the only deployment file is `apps/web/vercel.json` (see §15) |
| Editor / formatting policy | `.editorconfig`, `.gitattributes`, Prettier config, `.vscode/`, `.devcontainer/` | No shared indentation or line-ending rule |
| Node version file | `.nvmrc`, `.node-version` | Only `engines.node` `>=20.9` (`package.json:16-18`) guides the version, and it is lower than the locked database driver needs (see §13 and §16) |
| Ownership / process | `CODEOWNERS`, PR or issue templates, `LICENSE` | Review rules are an agreement, not tooling (see §2) |
| CSS build config | PostCSS or Tailwind config | Plain CSS only (see §9) |

## 13. Build, run and release

Tool configuration is in §12, versions in §4, the environment-variable table in §6.7, measured results in §17.1. Working agreement: the owner commits, pushes and pulls; an AI agent does none of these unless asked (see §2).

### 13.1 Prerequisites

| Need | Detail | Why / source |
|---|---|---|
| Node.js | 20.19 or newer on the 20.x line, 22.13+ on 22.x, or 24+ | Locked `mongoose` 9.9.0 declares `node >=20.19.0` (`package-lock.json:3711`). `engines.node` (`package.json:17`) and `README.md:30` still say 20.9, and `.npmrc` is empty (no `engine-strict`), so an older 20.x only warns. There is no `.nvmrc` |
| npm | 10.x; `packageManager` is `npm@10.8.1` (`package.json:19`) | The lockfile is `lockfileVersion` 3; no yarn or pnpm files exist |
| git | Remote `origin` = GitHub `jeff1999git/royalkingadmin` over HTTPS | Only two branches exist: `dev` and `main` |
| Network at build time | npm registry and Google Fonts | `next/font/google` fetches Inter during `next build` (`apps/web/app/layout.tsx:2`, `:7-11`; framework behaviour, an offline build was not tested) |
| Access (names only) | GitHub repository; a MongoDB database for development; a Cloudinary account (fuel-bill photos only); a Google Cloud OAuth client (optional, Drive export); the hosting account (deploys only) | See §14. No store, signing or mobile-SDK account exists: the product is a PWA |

### 13.2 First-time setup on a new machine

1. Clone and switch to `dev` (all work lands there).
   ```bash
   git clone https://github.com/jeff1999git/royalkingadmin.git
   cd royalkingadmin
   git switch dev
   ```
2. Prove the checkout is current - also on any machine that already has a clone. WHY: on 2026-10-11 the clone on the machine where this handbook was written sat at local `dev` @ `e849df9` (2026-06-22), 43 commits behind `origin/main` (31 non-merge commits plus the 12 PR merge commits), with a `node_modules` matching the old lockfile.
   ```bash
   git fetch origin                                     # only updates remote-tracking refs
   git status -sb                                       # prints "behind N" when stale
   git rev-list --count --no-merges HEAD..origin/main   # 0 = no work on main is missing locally
   git merge-base --is-ancestor 3458651 HEAD && echo "contains the documented code"
   ```
   Keep `--no-merges`: the 12 PR merge commits exist only on `main`, so on a current `dev` the plain count is 12 and `c251bc4` itself is never an ancestor. `3458651` is the `dev` tip with the same tree as `c251bc4`. If it is behind, updating the branch is the owner's call (see §2). After any update repeat step 3.
3. Install exactly what the lockfile says. The READMEs say `npm install`, which also works but may rewrite `package-lock.json`.
   ```bash
   npm ci
   ```
4. Create the env file only when none exists. The README command (`README.md:17`) "never overwrites an existing .env, which holds the real credentials" (`README.md:16`).
   ```bash
   test -f apps/web/.env || cp apps/web/.env.example apps/web/.env
   ```
5. Fill in `apps/web/.env` using the key table below. Replace the whole `MONGODB_URI` line: the template's host part looks like a real cluster (whether it is production is unverified, see §16).
6. WARNING: "`MONGODB_URI` points at the live database in production, so never run scripts or tests against it; use a throwaway MongoDB for anything that writes." (`README.md:34`). Merely using the app writes to the database it points at: the first request that reaches the database creates missing indexes and drops one obsolete index (see §17.6).
7. Start the dev server and open `http://localhost:3000`.
   ```bash
   npm run dev
   ```

| Key | Where the value comes from (never paste values into chat, logs, commits or this file) | Needed for |
|---|---|---|
| `MONGODB_URI` | Connection string of a development database you control (local MongoDB or a separate cloud project) | Every data route and driver sign-in |
| `NEXTAUTH_SECRET` | Generate a fresh random value on this machine (for example `openssl rand -base64 32`); do not reuse production's | Signing session tokens (`apps/web/lib/auth.ts:232`) |
| `NEXTAUTH_URL` | The origin the app is opened at (the address in step 7, or the Codespaces address) | Read by next-auth, not by app code (what depends on it is unverified) |
| `ADMIN_USERNAME`, `ADMIN_PASSWORD` | Choose your own for this machine | Admin sign-in (`apps/web/lib/auth.ts:9-22`); set the password even locally (see §13.4) |
| `CLOUDINARY_URL` | Cloudinary console: the single-URL API credential; its shape is checked at `apps/web/lib/cloudinary.ts:32` | Fuel-bill upload and delete only |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | Google Cloud Console OAuth client ID (public, not a secret); setup steps at `apps/web/README.md:71-77` | Optional: Save to Google Drive |

### 13.3 Commands

| Command | Where | What it does | Expected result today (timings in §17.1) |
|---|---|---|---|
| `npm ci` | repo root | Clean install from `package-lock.json` | Exit 0, 318 packages; `EBADENGINE` warnings when Node is below the floor in §13.1 |
| `npm run dev` | repo root | `turbo run dev` -> `next dev --port 3000` | Serves `http://localhost:3000`; not part of the measured baseline |
| `npm run lint` | repo root | `turbo run lint` -> `eslint --max-warnings 0` in `apps/web` | Exit 0, 0 problems |
| `npm run check-types` | repo root | `turbo run check-types` -> `next typegen && tsc --noEmit` | Exit 0, 0 errors |
| `npm run build` | repo root | `turbo run build` -> `next build` (Turbopack); output `apps/web/.next` | Exit 0, even with no env vars set |
| `npm run start` | `apps/web` only | `next start`: serves the last build on port 3000 | Not run for the baseline. The root has no `start` script and turbo no `start` task; from the root use `npm run start -w web` (npm workspace flag, not run here) |
| `npm run icons` | `apps/web` only | Rewrites the five icon files with `sharp` | Not run for the baseline (see §11.6) |
| `npm run format` | repo root | `prettier --write` over `.ts`, `.tsx`, `.md` | Do NOT run as part of other work: it would rewrite at least 59 of the 67 files in scope (see §12.5) |
| `npm audit --omit=dev` | repo root | Advisory check of runtime dependencies | Exit 1 today (see §17.1) |
| (none) | - | No `test`, `clean` or `deploy` script exists in any `package.json` | - |

### 13.4 Running locally

- Port 3000 is hard-coded in the `dev` script (`apps/web/package.json:7`). Using another port means running `next dev` yourself inside `apps/web` and matching `NEXTAUTH_URL` and the Google OAuth origin to it.
- A fresh database has no drivers: sign in as the admin at `/login`, then create a vehicle and a driver from the profile menu (see §8.8, §8.9).
- Admin fallback credential: when `ADMIN_PASSWORD` is unset and `NODE_ENV` is not `production` (`apps/web/lib/auth.ts:17`), sign-in accepts a hard-coded development fallback (`apps/web/lib/auth.ts:18`, type: admin password literal) together with the default username (`apps/web/lib/auth.ts:10`, type: admin username literal, used whenever `ADMIN_USERNAME` is unset). Always set `ADMIN_PASSWORD`, above all on a forwarded host. The values are deliberately not written here (see §16).
- Service worker: never registered under `npm run dev`. `PwaRegister` unregisters every worker on the origin because "`next dev` serves unhashed chunk names, so a worker left over from a local production run would serve stale code" (`apps/web/app/components/PwaRegister.tsx:20-27`). That also removes another project's worker on the same localhost port; the `rk-*` caches stay.
- GitHub Codespaces: `allowedDevOrigins: ["*.app.github.dev"]` makes the dev server accept the forwarded host (`apps/web/next.config.js:14-18`; no effect on production builds). The Google OAuth client must list that origin for Drive export (`apps/web/README.md:76`). No `.devcontainer` folder is in the repo.
- Restarting or hot-reloading the server clears its in-memory state: the failed-login counters and the driver-active cache (`apps/web/lib/auth.ts:37`, `:75`).
- `turbo` uses its interactive terminal UI (`turbo.json:3`); for plain logs see §12.2.
- Windows / PowerShell: the baseline in §17.1 was measured on Windows 11, so every npm script works there. The command in step 4 of §13.2 is POSIX shell: run it in Git Bash, or in PowerShell use `if (-not (Test-Path apps/web/.env)) { Copy-Item apps/web/.env.example apps/web/.env }`. There is no `.gitattributes`, so line endings follow each machine's git settings (effect on diffs unverified).

### 13.5 Testing a production build locally

```bash
npm run build                   # repo root
cd apps/web && npm run start    # next start
```

- Build time: no env var is required, because server code reads the environment at call time (`apps/web/lib/mongodb.ts:96-104`). Exception: for Drive export to be switched on, `NEXT_PUBLIC_GOOGLE_CLIENT_ID` must be present when the build runs (rule in §13.7).
- Run time (`NODE_ENV=production`): `MONGODB_URI` and `NEXTAUTH_SECRET` for anything signed-in; `ADMIN_PASSWORD` is mandatory because the development fallback is off (`apps/web/lib/auth.ts:21`); `CLOUDINARY_URL` for fuel bills. `next start` loading `apps/web/.env` is Next.js behaviour (unverified here).
- turbo can replay a cached build; editing any `.env*` file invalidates it (`turbo.json:17`; other cases in §12.2).
- PWA: this is the only local way to test it. "Localhost counts as secure, so HTTPS isn't needed there. Installing from a phone needs the HTTPS deployment." (`apps/web/README.md:52`).
- Check in browser DevTools -> Application (this and the next bullet are what the code implies; not run for this handbook): the manifest loads from `/manifest.webmanifest`; `/sw.js` is activated; Cache Storage holds `rk-static-v2`; tick Offline and reload -> the "You're offline" page; untick -> it reloads by itself.
- Update flow: change `VERSION` (`apps/web/public/sw.js:22`), rebuild, restart, reload the open tab -> the card "A new version of the app is ready." with Later / Reload. It appears only when an older worker already controls the page. Revert the edit afterwards.
- HSTS is "Ignored over plain http (localhost)" (`apps/web/next.config.js:31-33`). Running `npm run dev` afterwards removes the worker again.

### 13.6 Release checklist

No CI, tags or deploy script exist: every step is manual. Steps marked (owner) are not done by an AI agent unless asked.

1. Confirm the checkout is the current `dev` (§13.2 step 2). Since PR #1, `main` receives work only through a GitHub pull request from `dev`, merged with a merge commit (PRs #1-#12 so far, see §18).
2. Bump `version` in `apps/web/package.json:3` and the matching `apps/web` entry at `package-lock.json:22` (commits `f4240d4` and `3458651` changed both together). WHY: it is shown as `v<version>` under Sign Out in both portals (`apps/web/app/admin/layout.tsx:307`, `apps/web/app/driver/layout.tsx:305`), "so it is easy to tell which build a phone is running" (`apps/web/next.config.js:3-4`); with no tags it is the only release marker.
3. Bump the service-worker `VERSION` ONLY if the worker's caching behaviour, `public/offline.html`, an icon or `app/manifest.ts` changed (`apps/web/public/sw.js:17-19`, and `:84-85` for the manifest; mechanics in §11.4). Ordinary code changes do not need it.
4. New or changed env var: finish §13.7 first, including the hosting settings.
5. Dependency change: `npm ci` on a clean tree must still succeed; re-check §4 and §12.1.
6. `npm run lint`, `npm run check-types` and `npm run build` must all exit 0. Nothing else enforces them.
7. Serve the production build (§13.5) and walk the smoke test in §17.3 for every area touched.
8. On a real phone: driver flows, camera capture and the installed app cannot be verified on a desktop. Record anything not tried on a device as "unverified on a real device" in the changelog (§0.4).
9. Update this handbook (§0.3): changelog entry, stale sections, open items, "Last updated".
10. (owner) Commit and push `dev`, open the pull request `dev` -> `main`, merge it.
11. (owner) Confirm the deployment happened, or trigger it, and run the post-deploy checks below.

- Deployment implied by the repo: Vercel (`apps/web/vercel.json`), functions in region `bom1` (`:3`), project Root Directory `apps/web` (where `vercel.json` sits), request bodies limited to 4.5 MB (`apps/web/app/api/driver/supplies/route.ts:21`).
- Deployment unverified (recorded nowhere readable): whether a merge to `main` deploys automatically, the production branch, build command, Node version, env-var scopes and the production URL (see §15.2).
- Post-deploy checks: the hosting dashboard shows a finished deployment for the merge commit; fully reload the production site on a phone; the label under Sign Out shows the new version; sign in as the admin and as a driver and load one list in each portal; if `VERSION` changed, a phone that had the old worker shows the update card -> Reload; read the function logs for the lines in §17.5. Ask drivers to close and reopen the app: an open app keeps running the old bundle.
- Rollback option A: re-promote the previous deployment in the hosting dashboard (provider feature, unverified for this project).
- Rollback option B: a pull request that reverts the merge commit (`git revert -m 1 <merge>`; history contains no revert yet), then redeploy.
- Rollback limits: there are no migrations to undo, but rows written by the newer code keep their new fields (check §10 before rolling back across a model change), and the drop of `vehicles.vehicleNumber_1` is one-way (`apps/web/lib/mongodb.ts:30-44`). A rolled-back `sw.js` is just another byte change: phones show the update card again.

### 13.7 Adding or changing an environment variable

1. Code: read it at call time, not at module top level, so `next build` keeps working without it (pattern: `apps/web/lib/mongodb.ts:96-104`). Never give a secret the `NEXT_PUBLIC_` prefix: that prefix puts the value in the browser bundle.
2. `apps/web/.env.example`: add the name with a placeholder and a comment, never a real value.
3. `turbo.json:4-13` `globalEnv`: add the name. Otherwise lint is expected to fail on `turbo/no-undeclared-env-vars` (`packages/eslint-config/base.js:21`; not reproduced, and a `NEXT_PUBLIC_*` name is not flagged: `NEXT_PUBLIC_APP_VERSION` is undeclared and lint passes) and the turbo cache ignores the variable (see §12.2).
4. `apps/web/.env` on every developer machine and Codespace.
5. Hosting provider environment settings, for every environment that builds or runs (which scopes exist is unverified), then redeploy.
6. This handbook: the §6.7 table, the key table in §13.2, §14 if a service is involved, §19.

- Rebuild rule: `NEXT_PUBLIC_*` values are inlined when the build runs. "The value is built into the page, so a running server won't pick it up" (`apps/web/README.md:77`): restart `npm run dev`, or rebuild and redeploy.
- Server-only values are read per call, but a running process only sees the environment it started with: restart it (on the host: redeploy; unverified).
- Removing a variable: undo the same six places.

### 13.8 Moving to another machine or coding tool

| Item | In git? | Action |
|---|---|---|
| Source code | yes | Clone, then prove the checkout is current (§13.2 steps 1-2) |
| `ROYALKINGADMIN.md`, `AGENTS.md`, `CLAUDE.md` | not in `c251bc4` | They exist only on the machine where they were written until the owner commits them: copy by hand if still untracked. `CLAUDE.md` only points at `AGENTS.md`; a different coding tool may need its own pointer file |
| `apps/web/.env` | no (`apps/web/.gitignore:29-30`) | Copy by hand over a private channel, or recreate from the consoles (§13.2 step 5). Never commit it or paste it into a chat or AI tool |
| `node_modules`, `apps/web/.next`, `.turbo`, `apps/web/next-env.d.ts` | no | Regenerate: `npm ci`, then `npm run check-types` or `npm run build` |
| `.vercel/` project link, if the hosting CLI was ever used (unverified) | no (`.gitignore:22`) | Re-link and sign in again |
| GitHub credentials and git identity | no | Re-authenticate for the HTTPS remote. History already has two author identities, so set the one the owner wants |
| Console sign-ins: hosting, MongoDB, Cloudinary, Google Cloud | no | Re-authorise each. A new dev origin (for example a new Codespace address) must be added to the Google OAuth client; a database network-access list may need the new address (unverified) |
| Codespaces secrets or settings (unverified whether any exist) | no | Recreate |
| AI-tool memory or chat transcripts | no | Nothing to move: none existed for this repo on 2026-10-11. This handbook is the whole context; a new tool starts at §0-§2 |
| Browser state: installed app, `rk-install-dismissed`, service worker | no | Per device and per browser; nothing to migrate |
| Development database contents | no | Start empty and recreate test data through the UI (§13.4) |

## 14. Third-party services and accounts

Secret values live only in `apps/web/.env` (git-ignored) and in the hosting provider's settings; this table gives key NAMES only. Request and response detail for Cloudinary and Google: see §7.7. Every "console-side" cell is what the code or README implies, not something read from a console (unverified).

| Service | Used for | Configured in code at | Config keys (names only) | Console-side setup implied (unverified) | What breaks if it is down or misconfigured |
|---|---|---|---|---|---|
| MongoDB (Atlas implied by the template connection string and by the comment at `apps/web/lib/mongodb.ts:27`; unverified) | All persistent data: 5 collections (see §10) | `apps/web/lib/mongodb.ts:68-104`; options at `:77-82` | `MONGODB_URI` (also carries the database name: no `dbName` option is set) | A cluster, a database user, a network-access rule that admits the hosting functions, a backup policy. Indexes are created by the app itself (`apps/web/lib/mongodb.ts:53-66`) | Every data route answers a generic 500; driver sign-in fails with the generic login message. Admin sign-in still works (no database call, `apps/web/lib/auth.ts:146-160`) but every list fails. The driver-active re-check falls back to its last cached answer and allows the driver when it has none (`apps/web/lib/auth.ts:87-91`) |
| Cloudinary | Fuel-bill photos: upload on a driver cash entry, delete when the admin deletes that ledger row, thumbnails through URL transforms | `apps/web/lib/cloudinary.ts:26-50` (config), `:81-149` (upload, destroy); `apps/web/lib/imageUrl.ts:4-12` | `CLOUDINARY_URL` | One account ("cloud") and its API key pair. Folder `royal-king-water-supply/fuel-bills` (`apps/web/lib/cloudinary.ts:83`) is named by the upload call. Images must be publicly deliverable, because pages show the stored `secure_url` in plain `img` tags | Fuel entries cannot be saved (a bill photo is mandatory): missing or malformed key -> generic 500; the 20 s timeout, or an upload failure whose message contains "upload" (the default text does) -> 502 with that message for the driver; any other Cloudinary or network error -> generic 500 (`apps/web/app/api/driver/supplies/route.ts:256-260`). Deliveries and debit entries without a photo still work. Existing bill images stop loading. Deleting a ledger row still succeeds; the failed image cleanup is only logged |
| Google Cloud OAuth client (Drive export) | "Save to Google Drive" on the admin Deliveries page. Browser only: Google Identity Services popup, scope `drive.file`, upload straight from the browser | `apps/web/lib/googleDrive.ts:9-15`; `apps/web/app/admin/supplies/page.tsx:544-569` | `NEXT_PUBLIC_GOOGLE_CLIENT_ID` (public client ID, not a secret; inlined at build time) | Steps at `apps/web/README.md:71-77`: a project with the Drive API enabled; an OAuth consent screen with the `drive.file` scope (test users while in Testing); an OAuth client of type Web application whose Authorized JavaScript origins list every origin the admin page is opened from; no redirect URI | Key empty at build time -> the menu item only shows "This feature is not available yet." (`apps/web/app/admin/supplies/page.tsx:551-554`). Wrong origin or consent setup -> the Google popup fails and nothing is saved (exact behaviour unverified). Download Photo, PDF and Sheet are unaffected; the server is never involved |
| Hosting (Vercel implied) | Serves the Next.js app and runs the route handlers as serverless functions | `apps/web/vercel.json:3` (`regions: ["bom1"]`); `.vercel` ignored at `.gitignore:22`; body-limit comment at `apps/web/app/api/driver/supplies/route.ts:21` | Every key of §6.7, entered in the provider's environment settings (none are in `vercel.json`) | A project linked to the GitHub repository, Root Directory `apps/web`, a production branch, Node 20.19 or newer, the production domain | The whole product is down. Typical misconfigurations: `ADMIN_PASSWORD` missing -> the admin cannot sign in; `MONGODB_URI` missing -> every data route answers 500; a Node version below the driver's floor (untested) |
| GitHub | Source hosting; the `dev` -> `main` pull-request flow; probably Codespaces as a development machine (inferred from `apps/web/next.config.js:14-18` and `apps/web/README.md:76`) | No `.github/` folder: no workflows, templates or CODEOWNERS | none | Repository `jeff1999git/royalkingadmin`. Visibility, branch protection, Actions, Codespaces secrets and any deploy integration were not readable (the GitHub CLI was not installed) | No merges or releases; if the host deploys through a Git integration, no deploys either (unverified). The running app is unaffected |
| Google Fonts (build time) | The Inter typeface through `next/font/google`: fetched during `next build` and then served from the app's own static files (framework behaviour) | `apps/web/app/layout.tsx:2`, `:7-11` | none | none | `next build` cannot fetch the font without network access (not reproduced). Nothing at run time: phones are not expected to contact Google Fonts (unverified) |
| next-auth | A library, not a service: no account and no console. It needs `NEXTAUTH_SECRET` and consumes `NEXTAUTH_URL`; lifecycle in §6.6 | `apps/web/lib/auth.ts:119-233`, `apps/web/proxy.ts:1-37` | `NEXTAUTH_SECRET`, `NEXTAUTH_URL` | none | Sessions cannot be issued or read without the secret; changing it signs every user out (library behaviour, unverified) |

**Not used** (checked 2026-10-11 by searching every `package.json`, `package-lock.json` and all code under `apps/web`): analytics or tag managers, error tracking or monitoring, email or SMS, payments, push notifications (no `PushManager` or `Notification` call), maps or geolocation (also disabled by the `Permissions-Policy` header, see §6.7), websockets, webhooks, cron jobs. The only outbound hosts in code are `api.cloudinary.com`, `accounts.google.com` and `www.googleapis.com`. `nodemailer` appears in the lockfile only as an optional peer of next-auth (`package-lock.json:3839`) and is not installed.

## 15. Hosting, console and deployment decisions already made

### 15.1 Decisions visible in the repo

"No comment" means the code gives no reason; do not invent one. Header values and the full `next.config.js` option table are in §6.7.

| Decision | Where | Why (quoted from the code where a comment exists) |
|---|---|---|
| Hosting is configured for Vercel, functions pinned to region `bom1` (Mumbai) | `apps/web/vercel.json:3`; `.vercel` ignored at `.gitignore:22` | No comment. The commit body (`e810079`) says only "add Vercel configuration for deployment region". Presumably closest to the IST users and the database (unverified) |
| The Next.js image optimizer is off (`images.unoptimized: true`) | `apps/web/next.config.js:19-24` | The app renders plain `img` tags and Cloudinary transforms by URL, "so the /_next/image optimizer endpoint is pure attack surface". Do not introduce `next/image` optimisation |
| Security headers on every path: `X-Frame-Options: DENY`, two-year HSTS with `includeSubDomains`, `nosniff`, `Referrer-Policy`, `Permissions-Policy` with camera, microphone and geolocation off | `apps/web/next.config.js:28-37` | HSTS: "Browsers keep using HTTPS for two years once they have seen the site over HTTPS. Ignored over plain http (localhost)." The others have no comment. Consequences: every subdomain of the production domain must serve HTTPS for two years; the app cannot be framed; in-page camera or GPS needs the header changed first |
| No site-wide Content-Security-Policy; the only CSP is on `/sw.js`, which is also never cached | `apps/web/next.config.js:39-48` | "Never cache it, so a new version is always picked up; lock it to same-origin scripts." No reason is recorded for leaving pages without a CSP (see §16) |
| One shared admin account defined by env vars; no admin row in the database | `apps/web/lib/auth.ts:9-22`, `:146-160` | No comment. Effects: the admin can sign in while the database is down; changing the password is a hosting-settings change, and it does not end sessions that already exist (see §6.6) |
| Service worker caches only content-hashed static files, icons, the manifest and the offline page; never `/api/*`, non-GET requests, page HTML or other origins | `apps/web/public/sw.js:9-15` | "so ledger data is always live"; "so saves and the fuel-bill upload go straight to the server"; "so nothing from one signed-in user can be shown to another user on a shared phone" |
| A new worker never reloads the page by itself | `apps/web/app/components/PwaRegister.tsx:9-11` | "An update is applied only when the user taps Reload, so a half-filled delivery or fuel form is never wiped by an automatic page refresh." |
| Customers are soft-deleted (`isDeleted: true`, `isActive: false`), never removed | `apps/web/app/api/admin/customers/[id]/route.ts:153-157`; `apps/web/lib/customers.ts:1-4` | "A phone number is unique, but DELETE only soft-deletes, so re-registering a returning customer restores the deleted record in place instead of failing on the unique index nobody can see past." The reason for soft delete itself is not written down |
| A driver or vehicle with ledger rows cannot be deleted (409) | `apps/web/app/api/admin/drivers/[id]/route.ts:123-127`; `apps/web/app/api/admin/vehicles/[id]/route.ts:139-143` | "The ledger keeps its driver attribution: a driver with history is deactivated (PATCH isActive:false), never hard-deleted." |
| No data migrations. Old documents are tolerated by queries and read defaults | `apps/web/README.md:31`; no migration script exists in the repo | "Queries filter with `$ne` / `$nin` and reads default, so old documents keep working. Never change that with a migration." |
| The only automatic database changes: missing indexes are created, and one listed obsolete unique index is dropped | `apps/web/lib/mongodb.ts:25-66` | `createIndexes()` "only adds missing indexes; it never drops or rebuilds existing ones, and data is never touched"; only listed indexes are dropped, "so an index added by hand in Atlas is never touched" |
| Fuel-bill uploads are capped at 4 MiB on the server and in the client | `apps/web/app/api/driver/supplies/route.ts:21-24`; `apps/web/app/driver/page.tsx:642-644` | "Vercel refuses function request bodies over 4.5 MB, so stay under it." Do not raise the cap without changing how uploads reach Cloudinary |
| Cloudinary calls time out after 20 s; no function `maxDuration` is exported anywhere | `apps/web/lib/cloudinary.ts:65-67` | "Cloudinary must never hang a driver's request: a stalled call turns into a clear, retryable error instead of a spinner until the platform gives up." |
| The dev server accepts GitHub Codespaces hosts (`*.app.github.dev`) | `apps/web/next.config.js:14-18` | "Dev server only: Next.js 16 refuses dev requests (page scripts, live reload) from any host but localhost unless it is listed here. ... No effect on production builds." |
| The app version is shown in the UI and bumped by hand per release | `apps/web/next.config.js:3-5`, `:9-11`; `apps/web/app/admin/layout.tsx:307`; `apps/web/app/driver/layout.tsx:305` | "App version shown next to Sign Out, so it is easy to tell which build a phone is running. Bump "version" in package.json for each release." |
| Secrets stay out of git: every `.env*` file except `.env.example` is ignored | `apps/web/.gitignore:28-30` | Comment: "env files (can opt-in for commiting if needed)". The root `.gitignore:9-13` lists only `.env` and the `.local` variants, so keep env files inside `apps/web` |

### 15.2 Not recorded anywhere - find out before relying on it

No console was opened and no console setting is written down in the repo, the READMEs or any note on the machine where this handbook was written. Every row is unverified until someone checks and writes the answer here (names and settings only, never secret values).

The repo holds NO App Store or Play Store artefact - no native wrapper, signing key, bundle ID or store listing (a listing made outside the repo is unverified, none is recorded): the product is a web app installed as a PWA straight from the browser (see §11). Releasing means deploying the website.

| Item | Why it matters | Where to look |
|---|---|---|
| Production URL and custom domain | Needed for post-deploy checks, `NEXTAUTH_URL` and the Google OAuth origins; HSTS with `includeSubDomains` binds every subdomain of it | Hosting dashboard (domains); ask the owner |
| Hosting project settings: account and plan, Root Directory, build and install commands, Node.js version, production branch, auto-deploy on push, env-var scopes, whether preview deployments exist | Decides what is actually built. Node must meet the floor in §13.1; a preview deployment reads and writes whichever database its `MONGODB_URI` names; whether `bom1` is honoured depends on the plan | Hosting dashboard -> project settings |
| Which optional keys are set in production: `ADMIN_USERNAME`, `NEXTAUTH_URL`, `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | Decides the admin login name and whether Drive export is switched on | Hosting environment settings (read the names, not the values) |
| Which commit and version are live | Nothing in git marks a deployment (no tags) | The label under Sign Out in the live app; the hosting deployments list |
| Who owns and who can access each console: hosting, MongoDB, Cloudinary, Google Cloud, GitHub | Bus factor; which secrets to rotate when someone leaves | The owner; each console's members page |
| MongoDB: organisation and project, cluster tier and region, database name, database users, network-access list, backup and restore policy | The only copy of the business data: the app has no backup of its own; distance from `bom1` sets the latency | MongoDB Atlas console (Atlas implied) |
| Live database state: declared indexes present, the obsolete `vehicles.vehicleNumber_1` index dropped, leftover collections from deleted models | Unique rules depend on a background index build whose failure is only logged (see §16) | Database console; function logs for `[mongodb]` lines (§17.5) |
| Cloudinary: account and cloud name, plan and quota, the `royal-king-water-supply/fuel-bills` folder, delivery and access settings | Fuel entries need a working upload; orphaned images are possible (see §16) | Cloudinary console |
| Google Cloud: project, OAuth client and its Authorized JavaScript origins, consent-screen status (Testing or Published), test users, Drive API enabled | While in Testing, only listed Google accounts can save to Drive (`apps/web/README.md:75`) | Google Cloud Console -> APIs and Services |
| GitHub: visibility, branch protection on `main`, required reviews, Actions, Codespaces settings, deploy integration | A public repository exposes the development fallback credential (`apps/web/lib/auth.ts:18`) and the host name in the env template (see §16); nothing in git forces checks before a merge | Repository settings (the GitHub CLI was not installed when this was written) |
| Monitoring and logs: where function logs are, retention, alerts, uptime checks | The app has no error tracker; `console` lines are the only diagnostics | Hosting dashboard logs |

## 16. Known issues and open items

### 16.1 How to use this list

- Every problem, risk and unverified behaviour lives here once; other sections point here with "(see §16)". Rows were checked against `c251bc4` on 2026-10-11.
- ID prefixes: `BLK-nn` blocker, `SEC-nn` security, `BUG-nn` wrong behaviour, `DEBT-nn` tech debt, `UNV-nn` unverified, `DONE-nn` resolved.
- IDs are stable: never reused, never renumbered. A new item takes the next free number of its prefix and is inserted at its severity position, so numbers may be out of order.
- Tables are sorted high -> medium -> low.
- `SEC`, `BUG` and `DEBT` rows come from reading the code, git history and the §17 baselines; no behaviour was reproduced in a browser, on a device or against a database.

| Severity | Meaning |
|---|---|
| high | Can lose or corrupt business data, expose the system, or let regressions ship unnoticed. Act before the next release. |
| medium | Wrong or misleading result, or a blocked workflow that has a workaround. Plan a fix. |
| low | Rare, cosmetic or maintainability only. Fix when the area is touched. |

- To close an item: re-check the cited lines, delete its row, add a row to §16.7 with a new `DONE-nn` that names the old ID, the date and the commit, and add a changelog entry (§19).
- To settle an `UNV` item: do what its last column says, then delete the row (say so in §19) or turn it into a `SEC` / `BUG` / `DEBT` row.
- Database checks in §16.6 are read-only and are run by the owner. Never write to the live database to "fix" a finding (§2.3).

### 16.2 Blockers (BLK)

No blocker is confirmed for the deployed product. The one blocker below is specific to a single machine, the one where this handbook was written; a fresh clone or an up-to-date checkout on any other machine is not blocked.

| ID | Blocks | Item | Evidence | To clear |
|---|---|---|---|---|
| BLK-01 | Any edit, build or release made from the checkout on the machine where this handbook was written (that one checkout only) | That checkout is stale: local `dev` @ `e849df9` (2026-06-22) is 43 commits (31 non-merge + 12 merges) behind `origin/main` @ `c251bc4`; local `main` @ `a5c19d6`; `node_modules` matches the old lockfile | Measured 2026-10-11: 128 files differ (+9056 / -5657); the old tree still has routes, models and time handling that were deleted or rewritten | Exit condition: on that machine the owner pulls (agents do not, §2.1) and reinstalls with `npm ci`. Cleared when `git merge-base --is-ancestor 3458651 HEAD` succeeds; then move this row to §16.7 as a `DONE` row |

Candidates the owner should judge (none is confirmed as a blocker for the deployed product):

- SEC-01: a critical advisory is reported for the pinned `next`; whether it applies to this deployment is not assessed (UNV-20).
- BUG-03: unique rules on customer phone and driver username depend on indexes nobody has confirmed in production (UNV-21, UNV-22).
- SEC-02: the development fallback admin credential is live in any non-production run without `ADMIN_PASSWORD`; whether such a run can reach the live database is unknown (UNV-12).

### 16.3 Security (SEC)

| ID | Severity | Item | Location | Detail | Suggested fix |
|---|---|---|---|---|---|
| SEC-01 | high | Known advisories in locked dependencies | `apps/web/package.json:18` | `npm audit --omit=dev` (2026-10-11): 1 critical in `next` (affected range reported up to 16.3.7) + 3 high (`sharp`, `source-map-js`, `nanoid`). Reported fix is `next` 16.4.0, outside the exact pin 16.2.12. Titles include RCE and SSRF in image optimisation, cache poisoning when self-hosted. | Review each advisory, raise the pin deliberately (§4.3), re-run the §17 baselines |
| SEC-02 | medium | Hard-coded development fallback admin credential | `apps/web/lib/auth.ts:18` (password literal), `apps/web/lib/auth.ts:10` (default username literal) | Used when `ADMIN_PASSWORD` is unset and `NODE_ENV` is not `production`; production returns `null` (`:21`). Dev servers on forwarded Codespaces hosts are allowed (`apps/web/next.config.js:18`) and the env file can point at the live database (`README.md:34`). In git history since `de1f1c6`. | Remove the fallback; fail closed in every environment |
| SEC-03 | medium | Login throttle is in-memory, per instance, keyed on a header-derived IP | `apps/web/lib/auth.ts:32-70` | 10 failures per 15 min per username + first `X-Forwarded-For` value, or one shared key when the header is absent (`:39-45`). Lost on cold start, not shared between instances, no per-account cap across IPs. Driver passwords need only 6 characters (`apps/web/app/api/admin/drivers/route.ts:47`). | Persist counters per account; trust only the platform's client-IP header |
| SEC-04 | medium | Admin sessions cannot be revoked; no lifetime configured | `apps/web/lib/auth.ts:201`, `apps/web/lib/auth.ts:229-231` | Only driver tokens are re-checked; `session` sets only `strategy: "jwt"`, so the library default lifetime applies (UNV-28). Changing `ADMIN_PASSWORD` does not end an existing admin session; rotating `NEXTAUTH_SECRET` signs out every driver too. | Set `session.maxAge`; add a token-version check for the admin |
| SEC-05 | low | A driver can undo an admin's customer delete and overwrite the record | `apps/web/lib/customers.ts:57-72`, `apps/web/app/api/driver/customers/route.ts:51-61` | Restore on re-registration is the documented design (`apps/web/README.md:34`), but from the driver app it replaces the name, address and rate, forces `subscriptionCans` to 1 and unsets `area`, `securityDeposit` and a blank `email`. Normal 201; `createdAt` unchanged. | Driver route: answer 409, or restore without touching admin-owned fields |
| SEC-06 | low | Deactivated-driver cut-off is best-effort | `apps/web/lib/auth.ts:74`, `apps/web/lib/auth.ts:87-91` | Answer cached 60 s per server instance; a database error fails open by design. `apps/web/proxy.ts:7` only decodes the cookie, so page access ends only once the stripped token is written back (UNV-28). | Accept, or fail closed for writes |
| SEC-07 | low | Driver usernames can be enumerated by response time | `apps/web/lib/auth.ts:170-178` | Unknown or inactive username returns right after the lookup; a valid one runs bcrypt at cost 12. | Compare against a dummy hash on the not-found path |
| SEC-08 | low | No Content-Security-Policy for pages | `apps/web/next.config.js:25-49` | Only `/sw.js` has one (`:46`). A future policy must allow the Google sign-in script (`apps/web/lib/googleDrive.ts:9`), Cloudinary images and the inline `<style>` blocks (`apps/web/app/admin/layout.tsx:315`). | Start with a report-only policy |
| SEC-09 | low | Driver cash POST can return raw internal error text | `apps/web/app/api/driver/supplies/route.ts:256-259` | Any error whose message matches `/upload\|timed out/i` is returned verbatim with 502; database calls sit in the same `try` (`:180`), so a database timeout message can reach the driver. | Throw a typed upload error and match on the type |
| SEC-10 | low | Fuel-bill upload trusts client-declared type, name and length | `apps/web/app/api/driver/supplies/route.ts:91-94`, `:138-141` | Any `image/*` type (SVG included) passes; no content check; a missing `Content-Length` reads as 0, so the body is buffered before the per-file size check (`:173`); no `allowed_formats` is sent to Cloudinary (`apps/web/lib/cloudinary.ts:89-94`). | Whitelist formats on the server and in the upload call |
| SEC-11 | low | No rate limit on any write endpoint | `apps/web/app/api/driver/supplies/route.ts:133` | The login counter is the only throttle; one driver session can create unlimited rows, customers and 4 MB uploads. | Per-session limit on POST routes |
| SEC-12 | low | Real-looking database hostname in the example env file | `apps/web/.env.example:2` | Credentials there are placeholders, but the `MONGODB_URI` example carries a real-looking MongoDB Atlas cluster hostname (type: infrastructure hostname; production or not: UNV-19). Present since `de1f1c6`. | Replace with a generic host (history keeps the old text) |
| SEC-13 | low | Root `.gitignore` is narrower than the app's | `.gitignore:9-13`, `apps/web/.gitignore:29-30` | Root lists `.env` and the `.local` variants only, so a root-level `.env.production` would be committed. | Ignore `.env*` except `.env.example` at the root |
| SEC-14 | low | Driver PATCH has no role filter and no length caps | `apps/web/app/api/admin/drivers/[id]/route.ts:32-48`, `:90` | Update matches any User document (DELETE filters `role: "driver"`, `:129`); name, username and phone are only trimmed, unlike POST. Vehicle PATCH has the same gap (`apps/web/app/api/admin/vehicles/[id]/route.ts:69-84`). | Filter by role; reuse the POST limits |
| SEC-15 | low | No CSRF token or `Origin` check in the custom API handlers | `apps/web/lib/authHelpers.ts:17-26`, `apps/web/lib/api.ts:33-40`, `apps/web/app/api/driver/supplies/route.ts:51` | The guards read only the session cookie; `readJsonObject` does not check `Content-Type` and the driver POST also accepts multipart. For the POST routes the only barrier to a cross-site form post is therefore the cookie's `SameSite` attribute, a next-auth default not confirmed here (UNV-28). | Reject state-changing requests whose `Origin` is not the app's own; require `application/json` where no file is sent |
| SEC-16 | low | Bill images are served from Cloudinary URLs, outside the app's session checks | `apps/web/lib/cloudinary.ts:89-94`, `apps/web/lib/imageUrl.ts:4-7`, `apps/web/app/admin/supplies/page.tsx:1331` | The upload sends only file, folder, timestamp, key and signature (no access restriction), and the stored `secure_url` is used directly as the image source: nothing in the app signs, proxies or expires it. Whether a URL opens without any token depends on the account's delivery settings (UNV-18). | Settle UNV-18; if bills are sensitive, upload them as authenticated assets and hand out signed, expiring URLs |

### 16.4 Bugs (BUG)

| ID | Severity | Item | Location | Detail | Suggested fix |
|---|---|---|---|---|---|
| BUG-01 | medium | Default Deliveries view hides rows beyond 500 in the recent window | `apps/web/app/api/admin/supplies/route.ts:27`, `:151`, `:157-158` | Page 1 fetches at most 500 rows of the 5-day window; page 2 starts before the window. Rows 501+ appear on no page yet count in `total` and `stats` (`:184-199`). No notice; Photo and PDF export the incomplete screen. Needs about 100 entries a day per log type (UNV-25). | Page inside the window or show a truncation notice. Workaround: set a date filter |
| BUG-02 | medium | Stock saves are last-write-wins with no history | `apps/web/app/api/stock/route.ts:56-73`, `apps/web/app/components/StockModal.tsx:62-72` | The dialog loads a snapshot and sends all three absolute counts; the route `$set`s them. Concurrent editors overwrite each other. Any driver can set any value; only the last `updatedBy` name is kept. Two simultaneous first saves could each upsert a document (race, unverified). | Send deltas with `$inc` or a version check; keep a movement log |
| BUG-03 | medium | Unique indexes are not guaranteed to exist | `apps/web/lib/mongodb.ts:53-66` | `ensureIndexes()` marks a model done before `createIndexes()` resolves and only logs a failure. Between `a5c19d6` (2026-06-22) and `e810079` (2026-09-24) nothing built indexes explicitly and customer creation relied only on the duplicate-key error, so duplicate phones may exist and would block the unique index. | Run UNV-21 and UNV-22, clean up, then alert on build failure |
| BUG-04 | medium | A driver's password cannot be changed or reset | `apps/web/app/api/admin/drivers/[id]/route.ts:24-30` | PATCH accepts name, username, phone, isActive, assignedVehicle only, and a driver with ledger rows cannot be deleted (`:125-127`); a hash is written only at creation (`apps/web/app/api/admin/drivers/route.ts:74-78`). The options are a database edit or a second account that splits the history. | Add an admin "set new password" field (same 6-200 rule) |
| BUG-05 | medium | Customer phone uniqueness is an exact string match | `apps/web/lib/customers.ts:54`, `apps/web/models/Customer.ts:24` | Routes only trim and cap at 30 characters (`apps/web/app/api/admin/customers/route.ts:75`, `apps/web/app/api/driver/customers/route.ts:33`). A space, dash or country prefix makes a second customer and misses the soft-delete restore. | Normalise before save and lookup; plan the clean-up of stored values |
| BUG-06 | medium | Blocking odometer dialog cannot be dismissed when the server refuses | `apps/web/app/driver/layout.tsx:138-141`, `:328-333` | A failed PATCH only sets the error text; the dialog has no Close and its overlay covers Sign Out. The server answers 400 "Odometer already submitted for today." (`apps/web/app/api/driver/vehicles/odometer/route.ts:100-102`) when a driver sharing the vehicle submitted first or the first response was lost. A reload clears it. | On that 400, repeat the GET check and close the gate |
| BUG-07 | medium | Odometer readings are not validated and cannot be corrected | `apps/web/app/api/driver/vehicles/odometer/route.ts:60-63`, `apps/web/app/api/admin/vehicles/[id]/route.ts:60-65` | Any integer 0 to 9,999,999 is accepted with no comparison to the last reading; one write per vehicle per IST day; the admin PATCH cannot touch `odometer`. The chart hides negative deltas (`apps/web/app/admin/vehicles/[id]/page.tsx:124`). | Reject lower readings (with override); add an admin correction |
| BUG-08 | medium | A lost response can create duplicate ledger rows | `apps/web/app/driver/page.tsx:743-744`, `apps/web/app/api/driver/supplies/route.ts:246` | On a network error the form stays filled and the list is not refreshed; the server has no idempotency key and always inserts; drivers cannot edit or delete, so only the admin can remove the duplicate. | Client request id with a unique index; refetch on error |
| BUG-09 | medium | Disabling a vehicle does not unassign it | `apps/web/app/api/admin/vehicles/[id]/route.ts:86-88` | Saving the Edit Driver dialog for a driver assigned to it fails with 400 "Assigned vehicle is not available." unless another vehicle is picked, because the dialog re-sends the stored id (`apps/web/app/admin/drivers/page.tsx:116`, `apps/web/app/api/admin/drivers/[id]/route.ts:80-83`); the driver is still asked for its odometer daily; POST routes accept an inactive vehicle id (API only). | Unassign on disable, or skip the check when the id is unchanged |
| BUG-10 | medium | Photo (PNG) export totals cover rows that are not drawn | `apps/web/app/admin/supplies/exports.ts:212-213`, `:299` | Rows are cut to `MAX_PNG_ROWS = 250` (the page shows a notice), but totals and case counts use the full list and are printed as "Total Amount (rows shown)". | Total the drawn rows, or relabel |
| BUG-11 | medium | Sheet and Drive exports are silently cut at 5000 rows | `apps/web/app/api/admin/supplies/route.ts:25`, `:167-169` | The unpaginated request returns the newest 5000 rows as a bare array with no total; the CSV "Total" row uses what arrived, while `apps/web/README.md:67` says the sheet holds every matching entry. | Return a truncation flag or page the export |
| BUG-12 | medium | Admin list pages show failures as empty data and ignore 401 | `apps/web/app/admin/customers/page.tsx:38`, `:279`, `apps/web/app/admin/drivers/page.tsx:32`, `apps/web/app/admin/vehicles/page.tsx:16` | Only `data` and `isLoading` are read, so a network error, a 500 or an expired session renders "No customers found." and similar. No admin code reacts to 401; `StockModal` shows the text "Unauthorized" (`apps/web/app/components/StockModal.tsx:40-45`). | Render `isError`; shared client fetch that goes to `/login` on 401 |
| BUG-13 | medium | Home/Office choice for a "both" customer is not saved | `apps/web/app/driver/page.tsx:554-561`, `:722-729` | The picker shows two options for such a customer, but the POST body carries only `customerId` and `SupplyLog` has no location field. | Store the choice on the row, or show one option |
| BUG-14 | medium | A long-open driver app goes stale | `apps/web/app/providers.tsx:15-21`, `apps/web/app/driver/layout.tsx:53-76` | `refetchOnWindowFocus` is off and nothing polls: customers, rates and the recent list refresh only after the driver's own saves or a reload (or a network reconnect, if the React Query default applies: unverified). The odometer gate runs once on mount, so an app open across IST midnight never asks for the new day. | Refetch on visibility change; re-check the gate when the IST day changes |
| BUG-15 | low | Driver recent list is capped at 200 rows for the 5-day window | `apps/web/app/api/driver/supplies/route.ts:124` | No total or notice; above about 40 entries a day the oldest days drop out of the default view (the date filter still shows them). | Add an indicator or per-day paging |
| BUG-16 | low | Edit Customer cannot clear Email, Area or Location type | `apps/web/app/admin/customers/page.tsx:175`, `:177`, `:178` | Sent as `value \|\| undefined`, which `JSON.stringify` drops; the route treats a missing key as "not sent" (`apps/web/app/api/admin/customers/[id]/route.ts:55-77`). The dialog closes as if saved. | Send `""` or `null` for a cleared field |
| BUG-17 | low | Editing a quantity re-prices at the customer's current rate | `apps/web/app/api/admin/supplies/[id]/route.ts:138-142`, `:185-191` | With no amount sent, a quantity change recomputes the amount from today's `cashPerCan`, replacing a typed or historically priced amount; the hint says "Leave it as is to keep the saved amount" (`apps/web/app/admin/supplies/page.tsx:1597`). | Warn before overwriting, or store the rate on the row |
| BUG-18 | low | Soft delete is enforced inconsistently | `apps/web/app/api/admin/customers/[id]/route.ts:107`, `:133-136` | PATCH has no `isDeleted` guard and coerces `isActive` with `Boolean()`, so a deleted customer can become active for drivers while hidden from the admin. Changing a phone to one held by a deleted customer returns 409 for a record the admin cannot see. | Guard PATCH; offer restore on that 409 |
| BUG-19 | low | Server accepts values the forms would block | `apps/web/app/api/admin/supplies/route.ts:246-249`, `apps/web/lib/supplyProduct.ts:39-41`, `apps/web/lib/api.ts:43-47` | Admin `suppliedAt` is unbounded (a future row is invisible in the default window); no upper bound on quantities, prices, amounts or stock; `Number()` coercion (`true` -> 1 for quantities, whitespace-only string -> 0); unknown `logType` / `productType` / `paymentStatus` are coerced on POST; over-long text is silently truncated. | Bound and reject instead of coercing |
| BUG-20 | low | Ledger sort has no tiebreaker | `apps/web/app/api/admin/supplies/route.ts:165` | Sort is `{ suppliedAt: -1 }` with skip/limit, while every back-dated admin entry of a day is stored at exactly 12:00 IST (`apps/web/lib/istTime.ts:57-58`); equal keys can repeat or skip across pages (MongoDB behaviour, unverified). | Sort by `{ suppliedAt: -1, _id: -1 }` |
| BUG-21 | low | Sheet/Drive export on "Older records" pages exports the last 5 days | `apps/web/app/admin/supplies/page.tsx:355`, `:532` | `fetchAllSupplies` sends no page, so the server applies the recent window although the list shows older rows. | Disable or relabel the export on those pages |
| BUG-22 | low | Serial numbers are not stable references | `apps/web/app/admin/supplies/page.tsx:452-459`, `apps/web/app/admin/supplies/exports.ts:43` | On-screen S.No restarts per IST day and per page, newest first, and shifts as entries arrive; exports use a running index. | Never quote S.No as an identifier |
| BUG-23 | low | Check-then-write guards are not atomic | `apps/web/app/api/admin/vehicles/route.ts:47-57`, `apps/web/app/api/admin/drivers/[id]/route.ts:125-129` | Registration uniqueness is a regex `exists()` before create, with no unique index; delete guards check the ledger and then delete. If the legacy `vehicleNumber_1` index still exists, a second vehicle of the same model gets "A vehicle with this number already exists." | Unique index on a normalised registration |
| BUG-24 | low | A JSON body can reach the bill-image checks with a non-File value | `apps/web/app/api/driver/supplies/route.ts:82-83`, `:172` | A JSON `billImageFile` string makes `isAcceptedImage` throw outside the `try` (which starts at `:179`): unhandled 500 instead of 400. | Accept the file only from multipart |
| BUG-25 | low | Several admin dates follow the device time zone | `apps/web/app/admin/customers/[id]/page.tsx:61`, `apps/web/app/admin/drivers/page.tsx:399`, `apps/web/app/admin/vehicles/[id]/page.tsx:111`, `:183`, `:419`, `:443`, `:502` | `toLocaleDateString("en-IN")` without `timeZone`, against `apps/web/lib/format.ts:3-5`. A `registeredDate` stored at UTC midnight shows the previous day west of UTC. | Use `formatShortDate` |
| BUG-26 | low | Analytics range handling | `apps/web/lib/analyticsRange.ts:35-44`, `:49` | A reversed or half-given from/to silently returns the last 30 days and the range used is not echoed; a span over 731 days gives 400, shown only as "Failed to load analytics data." Chart labels crowd on long ranges (not seen in a browser). | Answer 400 for a bad pair; echo `fromDay` / `toDay` |
| BUG-27 | low | Screens are not refreshed by related changes | `apps/web/app/admin/supplies/page.tsx:629`, `apps/web/app/driver/page.tsx:742` | Nothing invalidates `["admin","analytics"]` (2 min stale), and customer, driver and vehicle edits do not invalidate `["admin","supplies"]` (30 s stale; `apps/web/app/admin/customers/page.tsx:108`); the Deliveries list has no refresh control; driver saves invalidate with `exact: true`, so the date-filtered list does not show the new entry. | Invalidate the related keys |
| BUG-28 | low | Login feedback and username matching | `apps/web/app/login/page.tsx:35-39`, `:82` | Every failure (wrong password, 15-minute lockout, deactivated, server error) shows "Invalid username or password." Usernames are stored trimmed but matched exactly and case-sensitively (`apps/web/lib/auth.ts:164-168`); the input has no keyboard hints. | Trim; add `autoCapitalize="none"`; tell lockout apart |
| BUG-29 | low | Driver error boundary shows the raw error message | `apps/web/app/driver/error.tsx:26` | The admin and root boundaries show fixed text (`apps/web/app/admin/error.tsx:26`). | Use the fixed text |
| BUG-30 | low | Driver form details | `apps/web/app/driver/page.tsx:791-798`, `:906`, `:981` | Cash submit says "Please attach the fuel bill image." while the first photo is still processing; "Cans Delivered *" is marked required although a taken-back-only or zero row is valid; customer options select only on `mousedown` (no keyboard). | Reorder the checks; relabel; add click and key handlers |
| BUG-31 | low | HEIC photos skip compression | `apps/web/app/driver/page.tsx:103-105`, `:676` | HEIC/HEIF files upload at full size (only the 4 MB check applies); the download helper names any non-PNG, non-WebP blob `.jpg` (UNV-01). | Convert on the server or through Cloudinary |
| BUG-32 | low | Odometer gate is skipped where `AbortSignal.timeout` is missing | `apps/web/app/driver/layout.tsx:57` | The call throws inside the `try`; the catch treats it as a network failure and the driver is never asked (UNV-10). | Use `AbortController` with a timer |
| BUG-33 | low | Google sign-in popup opens after awaits on first use | `apps/web/app/admin/supplies/page.tsx:550-557` | A dynamic import and a script load precede the popup, against the module's own comments (`apps/web/lib/googleDrive.ts:36-37`, `:58`); a blocker may refuse the first click (UNV-06). The cached token stays with the first Google account; no account switch. | Preload the script when the Download menu opens |
| BUG-34 | low | Deliveries dialog and row glitches | `apps/web/app/admin/supplies/page.tsx:180-185`, `:372-381`, `:1023` | Enter on the in-row "Fuel" button opens the details dialog; a stale `detailError` from the lightbox shows in the next details dialog; Escape or a backdrop click closes Add/Edit with no discard confirmation. | Stop key propagation; clear the error on open; confirm discard |
| BUG-35 | low | Admin forms cannot set fields the API supports | `apps/web/app/admin/supplies/page.tsx:613-622` | Add Delivery sends no `paymentStatus` or `vehicleId` (rows read as Cash, no vehicle); Edit cannot change date, driver, customer or vehicle; no admin screen adds a cash entry. | Add the fields |
| BUG-36 | low | Customer screens edge cases | `apps/web/app/admin/customers/page.tsx:159`, `:176`, `:203-204`, `:278-279`, `apps/web/app/admin/customers/[id]/page.tsx:235-249` | Every Edit save rewrites `registeredDate`; a legacy customer with no address cannot be saved; deleting the last row of the last page leaves "No customers found." with no pager; "Deleting..." never renders; the history page shows its error together with an empty state. | Send only changed fields; clamp the page |
| BUG-37 | low | Vehicle detail limits | `apps/web/app/api/admin/vehicles/[id]/route.ts:12`, `apps/web/app/admin/vehicles/[id]/page.tsx:140-141` | Only the newest 200 odometer entries are returned, yet the count is labelled "Total Entries"; bars keep a 12-unit minimum in a 476-unit plot, so they overlap from about 40 readings (derived from the code). | Label the cap; window the chart |
| BUG-38 | low | Export edge cases | `apps/web/app/admin/supplies/exports.ts:45`, `:254-269`, `apps/web/lib/csv.ts:10` | A row whose driver no longer exists prints " (@)"; PNG text wraps only on spaces, so a long unbroken word overflows; CSV text starting with `+` or `-` (a phone with a country prefix) gets an apostrophe; old notices stay after another export. | Fall back to "-"; break long tokens |
| BUG-39 | low | Layout issues derived from CSS, not seen on a device | `apps/web/app/page.tsx:11`, `:17`, `apps/web/app/driver/layout.tsx:313-318`, `:433`, `apps/web/app/globals.css:248` | Home page is `height: 100vh` with `overflow: hidden` (content can be clipped); the fixed tab bar moves while the odometer blur filter is on; odometer Submit uses `.w-full` (label left-aligned); inputs are 0.95rem (iOS may zoom). | `minHeight`; blur a wrapper; `.btn-full`; 16px inputs |
| BUG-40 | low | Small UI defects | `apps/web/app/admin/supplies/page.tsx:51`, `:819`, `apps/web/app/admin/layout.tsx:210-215`, `apps/web/app/components/InstallPrompt.tsx:37` | Names cut to 12 characters at every width; undefined CSS variable `--border-color`; profile menu shows the same label twice; dismissing the install prompt is permanent, and signed-in users never see it (both host pages redirect them). | As listed |
| BUG-41 | low | Accessibility and form semantics | `apps/web/app/admin/drivers/page.tsx:211-213`, `:266-336`, `apps/web/app/admin/customers/page.tsx:301-305` | Status is a coloured dot only; clickable customer rows are not keyboard-focusable; dialogs have no focus trap; edit dialogs are `<div>`s, so `required` / `min` do nothing and Enter does not save; the New Driver password has no length hint and cannot be revealed. | Real forms and focus management |
| BUG-42 | low | A renamed driver keeps the old name until the next sign-in | `apps/web/lib/auth.ts:196-200` | Name and username are copied into the token at sign-in and never refreshed; the header and the stock "updated by" text (`apps/web/app/api/stock/route.ts:53-54`) show the old name. | Refresh in the `jwt` re-check |
| BUG-43 | low | Admin PATCH can attach a vehicle to a cash row | `apps/web/app/api/admin/supplies/[id]/route.ts:76-77`, `:97-100`, `:121` | `vehicleId` is set without checking `logType`, and no PATCH value clears a vehicle once set; neither POST route stores one on a cash row (`apps/web/app/api/admin/supplies/route.ts:315`, `apps/web/app/api/driver/supplies/route.ts:233`). API only: no screen sends `vehicleId` on edit. Related: the list request would send a vehicle filter for the cash list too (`apps/web/app/hooks/useAdminQueries.ts:221`), where it could match only such rows; no control sets it today (DEBT-11). | Answer 400 for `vehicleId` on a cash row; send the filter for deliveries only |
| BUG-44 | low | A quantity edit that cannot be re-priced keeps the old amount | `apps/web/app/api/admin/supplies/[id]/route.ts:138-142`, `:185-191` | When a quantity changes with no amount sent and `autoAmount` returns nothing (a can row whose customer is missing or has no `cashPerCan`; a case row saved without `casePrice`), the amount is neither set nor cleared: `clearIfUnpriceable` is true only for a product switch or a cleared amount. The row keeps an amount worked out for the old quantity. | Clear the amount in that case, or answer 400 asking for one |
| BUG-45 | low | A row stored without `logType` shows on neither ledger tab | `apps/web/app/hooks/useAdminQueries.ts:217`, `apps/web/app/api/admin/supplies/route.ts:117-118`, `apps/web/app/api/admin/analytics/route.ts:47` | Both tabs always send `logType` and the API matches it exactly, as does Analytics, while other code reads a missing value as water (`apps/web/app/api/admin/supplies/[id]/route.ts:107`, `apps/web/app/driver/page.tsx:537`) and the payment and product filters include rows without their field (`apps/web/app/api/admin/supplies/route.ts:123-134`). The schema has set a default since the first commit (`de1f1c6`), so only rows written outside the app could lack it (UNV-23). | Match deliveries with `{ logType: { $ne: "cash" } }` |
| BUG-46 | low | Odometer PATCH says "already submitted" when the vehicle no longer exists | `apps/web/app/api/driver/vehicles/odometer/route.ts:78-102` | The conditional update matches nothing both when today's reading exists and when the assigned vehicle document is gone; both answer 400 "Odometer already submitted for today.", while GET reports the second case as `hasVehicle: false` (`:34-36`). Needs a dangling `assignedVehicle`: vehicle DELETE removes the document, then unassigns drivers in a separate write (`apps/web/app/api/admin/vehicles/[id]/route.ts:145-152`). | On no match, look the vehicle up and answer "No vehicle assigned to you." when it is missing |
| BUG-47 | low | Filters, tab and page number are lost on reload | `apps/web/app/admin/supplies/page.tsx:290-293`, `apps/web/app/admin/customers/page.tsx:18-21`, `apps/web/app/admin/amounts/page.tsx:719` | All list state is component `useState` and nothing is written to the URL, so a reload opens the default view and a filtered view cannot be bookmarked or shared. URL state is limited to `/login?role=` and the `[id]` routes. | Keep filters, tab and page in the query string |
| BUG-48 | low | A deep link is lost after sign-in | `apps/web/proxy.ts:18-24`, `apps/web/app/login/page.tsx:46-49` | The proxy redirects an unauthenticated request to `/login` with no return address, and the login page always opens `/admin/amounts` or `/driver`. A bookmarked customer or vehicle page, or the installed-app "Deliveries" shortcut (`apps/web/app/manifest.ts:35`), must be opened again by hand. | Pass the wanted path to `/login` and return to it after sign-in (same-origin paths only) |
| BUG-49 | low | An admin restore of a deleted customer drops who registered it | `apps/web/lib/customers.ts:27`, `:49`, `:65-67`, `apps/web/app/api/admin/customers/route.ts:121` | The admin route passes its session id as `createdBy`; it is not an ObjectId, so it is dropped, and the restore then unsets the stored driver id. The New Customers list afterwards shows that customer as added by the admin (`apps/web/app/api/admin/analytics/new-customers/route.ts:51-58`). | Leave `createdBy` out of the fields a restore clears |

### 16.5 Tech debt (DEBT)

| ID | Severity | Item | Location | Detail | Suggested fix |
|---|---|---|---|---|---|
| DEBT-01 | high | No automated tests, no CI, no pre-commit hook | `apps/web/package.json:10-11`, `apps/web/README.md:3` | No test framework or test file and no `.github/` directory. Lint and type-check run only when someone runs them, so nothing gates a merge to `main` or a deploy. | CI for lint, check-types and build; first tests for `lib/istTime.ts`, `lib/supplyProduct.ts`, `lib/customers.ts` |
| DEBT-02 | medium | Node engines floor is lower than the lockfile needs | `package.json:17`, `README.md:30` | `engines.node` says `>=20.9`; locked mongoose 9.9.0, mongodb 7.5.0, bson 7.3.1, mquery 6.0.0 and mongodb-connection-string-url 7.0.2 require `>=20.19.0`, and eslint-visitor-keys 5.0.1 a similar floor (6 `EBADENGINE` warnings on `npm ci` under Node 20.11.0; install, lint, types and build still passed). | Raise to `>=20.19`; fix the README; confirm the host (UNV-11) |
| DEBT-03 | medium | No audit trail | `apps/web/app/api/admin/supplies/[id]/route.ts:214`, `:241` | Ledger rows are edited in place and hard-deleted; one shared admin account means edits are not attributable; stock keeps only the last editor's name. | Append-only change log (who, when, before, after) |
| DEBT-04 | medium | History cannot be read from commit subjects | `git show e810079 --stat`, `git show 1ca3e0d --stat` | `e810079` (a "chore" about the Node engine) changes 82 files: removes five feature areas, hardens auth, adds the run-time drop of a legacy unique index. `1ca3e0d` (a "chore" about overrides) changes 48: Next upgrade and the IST rewrite. No tags, no changelog before this file. | One concern per commit; tag releases; keep §19 |
| DEBT-05 | medium | An open app is not told about a new build | `apps/web/app/components/PwaRegister.tsx:33-51`, `apps/web/public/sw.js:22` | The update banner reacts only to a byte change in `/sw.js`, whose `VERSION` is bumped by hand. A normal deploy shows nothing and the single-page driver portal keeps running the old bundle against the new API. | Stamp `sw.js` with the build id, or poll a version endpoint |
| DEBT-06 | medium | `SuppliesPage` is one 1,400-line component | `apps/web/app/admin/supplies/page.tsx:287` | 33 `useState` hooks, four export handlers and five inline dialogs; only the table is extracted and memoised. | Extract the dialogs before adding features |
| DEBT-07 | medium | A repo-wide format script with no Prettier config | `package.json:8` | `prettier --check` flags 59 of the 67 tracked files in scope even with line endings ignored (all 67 on a CRLF working copy); `npm run format` would rewrite them with defaults. No `.editorconfig` or `.gitattributes`, so line endings follow each machine's git settings (committed files are LF; a Windows checkout with `core.autocrlf` on has CRLF); indentation is mixed 2 and 4 spaces. | Choose a config; format once in its own commit (§12.5) |
| DEBT-08 | low | No shared client fetch helper | `apps/web/app/driver/page.tsx:174-182` | `driverGet` is local to one page; every other call site parses errors itself, and only the driver ones check 401 (BUG-12); `lib/api.ts` is server-only despite its name. | One client wrapper with 401 handling |
| DEBT-09 | low | Constants duplicated by hand | `apps/web/app/driver/page.tsx:169`, `:644`, `apps/web/app/admin/supplies/page.tsx:49`, `apps/web/app/api/driver/supplies/route.ts:22`, `:25` | `RECENT_DAYS = 5` in three files; the 4 MB image limit in two plus message strings; the IST offset as a literal (`apps/web/app/admin/supplies/exports.ts:385`); `/admin/amounts` in four files; the brand blue in five (§9). | Shared constants module |
| DEBT-10 | low | Duplicated logic | `apps/web/app/admin/supplies/page.tsx:401-424`, `apps/web/app/driver/page.tsx:669-689` | `downloadImageToDevice` twice; `safeJson` / `safeParseJson` three times and `maskName` twice in admin pages; export columns defined three times plus the CSV; three near-identical error boundaries. | Extract helpers |
| DEBT-11 | low | Dead or leftover code | `apps/web/app/api/admin/supplies/route.ts:54`, `:109-115`, `apps/web/app/admin/supplies/page.tsx:352` | `amountStatus` filter has no caller; `filters.vehicle` can never be set; `serialStart` unused on Deliveries; `data-testid="case-total"` without tests; User role enum allows a value that can never sign in (`apps/web/models/User.ts:23-27`); unused CSS tokens (`apps/web/app/globals.css:7`, `:14-15`). | Delete |
| DEBT-12 | low | Misleading names kept for compatibility | `apps/web/models/Vehicle.ts:23-28`, `apps/web/app/hooks/useAdminQueries.ts:243-245` | `Vehicle.name` is the registration and `vehicleNumber` the model; `/admin/amounts` is Analytics; key segments `added` / `cash-credits` mean the water and cash lists; cash "credits" are expenses. | Rename only with a data and cache plan (§2.3) |
| DEBT-13 | low | Session types overstate what is present | `apps/web/lib/auth.ts:94-117`, `:205-207`, `:218-221` | `id` and `role` are typed as required but are deleted from a deactivated driver's token, so `getServerUser()` can return an object that breaks its own type. | Make them optional |
| DEBT-14 | low | Updates never run schema validators | `apps/web/app/api/admin/supplies/[id]/route.ts:214` | No `runValidators` anywhere: schema `min` / `enum` protect only `create()` (Mongoose default, UNV-29), so each PATCH route validates by hand. | Keep route validation; consider `runValidators: true` |
| DEBT-15 | low | Unbounded lists, unindexed search, wasted requests | `apps/web/app/api/admin/customers/route.ts:18-22`, `:28-35`, `apps/web/app/api/driver/customers/route.ts:14-17` | Every customer is returned for dropdowns and to every driver (with phone numbers); search is an unanchored regex over four fields; a filter change on page N fires a request for the old page first (`apps/web/app/admin/supplies/page.tsx:427-430`). | Server-side search for pickers; reset the page with the filter |
| DEBT-16 | low | Bill-image cleanup is best-effort | `apps/web/app/api/admin/supplies/[id]/route.ts:246-249`, `apps/web/app/api/driver/supplies/route.ts:251-253` | Delete failures are logged or swallowed; nothing reconciles stored `billImagePublicId` values with the Cloudinary folder. | Periodic reconcile report |
| DEBT-17 | low | API response inconsistencies | `apps/web/app/api/admin/drivers/[id]/route.ts:132`, `apps/web/app/api/admin/customers/[id]/route.ts:160` | `{ success: true }` vs `{ ok: true }`; the same error text with and without a full stop; `/api/stock` keeps a private guard outside `lib/authHelpers.ts`; list endpoints return an array or an object depending on `page` / `limit`. | Standardise |
| DEBT-18 | low | Styling is scattered | `apps/web/app/admin/layout.tsx:315-325` | Inline styles and hex literals bypass the tokens; three components inject global CSS through `<style>`; z-index values and breakpoints are unrelated magic numbers (§9). | Move shared rules into `globals.css` |
| DEBT-19 | low | Shared lint config drift | `packages/eslint-config/package.json:9`, `:13`, `packages/eslint-config/next.js:17-20` | `@next/eslint-plugin-next` is `^15.5.0` (15.5.22 locked) while the app runs Next 16.2.12; `react-internal.js` and `packages/typescript-config/react-library.json` have no consumer; three rule sets are spread twice. | Bump the plugin; delete leftovers |
| DEBT-20 | low | Undeclared and unexplained packages | `package.json:24-27`, `apps/web/scripts/generate-pwa-icons.mjs:14` | `npm run icons` imports `sharp`, which no `package.json` declares (optional dependency of `next`); root `overrides` for `postcss` and `sharp` have no recorded reason; `npm ls` reports `@emnapi/runtime` and `@img/sharp-wasm32` as extraneous. | Declare `sharp`; document or drop the overrides |
| DEBT-21 | low | README and comment drift | `apps/web/README.md:21`, `:62`, `:69`, `:79` | README: every route uses the two guards (not `/api/stock`); separate export buttons (now one menu); a 24-hour sheet name (code is 12-hour); a "not set up" message (code: "This feature is not available yet."). Comments: `apps/web/lib/auth.ts:202-203` (proxy effect unverified, UNV-28); odometer "per driver-day" (`apps/web/app/api/driver/vehicles/odometer/route.ts:11-12`; the gate is per vehicle). | Correct the text |
| DEBT-22 | low | Stale system report in the repo root | `Royal-King-Water-Supply-System-Report.pdf` | 5 pages, "Prepared 14 July 2026", added in `07835b7`. Contradicts the code on collections, routes, upload limit, Next version and exports. | Delete it or mark it superseded |
| DEBT-23 | low | Index maintenance is narrow | `apps/web/lib/mongodb.ts:30-44` | Only indexes listed by exact name and still unique are dropped; a non-unique index removed from a schema stays in MongoDB; every cold start issues `createIndexes` for five models. | Record manual index changes in §10 |
| DEBT-24 | low | Admin pages are built inconsistently | `apps/web/app/admin/vehicles/[id]/page.tsx:217-235`, `:316` | Vehicle detail fetches with `useEffect` instead of React Query; vehicle delete uses `window.confirm` ("Permanently delete ...") although the server answers 409 when history exists, while other deletes use dialogs; form-closing timers are never cleared (`apps/web/app/admin/customers/page.tsx:139`). | Align with `useAdminQueries.ts` |
| DEBT-25 | low | No configuration check at build or start | `apps/web/lib/mongodb.ts:96-104`, `apps/web/lib/cloudinary.ts:26-30`, `apps/web/lib/auth.ts:17-21`, `:232` | `npm run build` succeeds with no env vars set (baseline 2026-10-11). A missing `MONGODB_URI` or `CLOUDINARY_URL` surfaces only on first use; a missing `ADMIN_PASSWORD` in production just makes the admin login fail with the generic message; `NEXTAUTH_SECRET` is passed through unchecked. | Validate required variables once at startup and fail loudly |
| DEBT-26 | low | Admin cash-entry API branch has no caller | `apps/web/app/api/admin/supplies/route.ts:240`, `:276-279`, `:320-323` | POST accepts `logType: "cash"` with a driver, an amount and a `cashType`; a `fuel` row needs no bill image here, while the driver route requires one (`apps/web/app/api/driver/supplies/route.ts:174`). The admin form only sends `logType: "water"` (`apps/web/app/admin/supplies/page.tsx:614`; BUG-35), so the branch is unexercised. | Remove it, or build the screen and apply the driver route's rules |

### 16.6 Unverified items (UNV)

Nothing below was observed; each row says how to observe it. Record the result in the owning section and in §19.

#### Real devices and browsers

| ID | What is unverified | Why it matters | How to verify |
|---|---|---|---|
| UNV-01 | Fuel-bill capture: `capture="environment"` under `Permissions-Policy: camera=()`; camera vs chooser with the mixed `accept` list; HEIC delivery and preview; photo orientation after compression | A fuel entry cannot be saved without the photo | Android Chrome and iOS Safari, tab and installed app: capture, submit, open the image as admin |
| UNV-02 | Install flow and installed-app look: `beforeinstallprompt` timing, the iOS hint in other iOS browsers, portrait lock, status bar, safe-area insets, launch screen | Drivers use the installed app daily | Install from the HTTPS deployment on both platforms |
| UNV-03 | Offline page on a cold start with no network; reload on reconnect | The only offline behaviour the app has | Airplane mode, then open the installed app |
| UNV-04 | Whether field phones run service worker `v2` and the version label matches the deployed build; how long a backgrounded app survives | Size of BUG-14 and DEBT-05 in practice | Compare the label next to Sign Out with `apps/web/package.json:3` |
| UNV-05 | Downloads on phones: blob links (PNG, CSV, bill image), print-to-PDF through `window.open` + `document.write`, canvas size at 250 rows | Exports may preview instead of saving, or fail | Try every Download menu item, tab and installed app |
| UNV-06 | Google sign-in popup: blocked on first click, behaviour in an installed app, `error_callback` always firing, declined scope | Save to Google Drive may fail or leave the button busy | Real browsers with `NEXT_PUBLIC_GOOGLE_CLIENT_ID` set |
| UNV-07 | Everything in BUG-39 and the chart thresholds in BUG-26 and BUG-37 | Derived from CSS and SVG geometry only | Short or landscape phone; a vehicle with 40+ readings |
| UNV-08 | Native controls: `type="month"` and `type="date"` fallbacks, `showPicker()`, `window.confirm` in a standalone app, password managers, auto-capitalised usernames | Fallback paths and login failures | Desktop Safari and Firefox, iOS |
| UNV-09 | Exact `Intl` `en-IN` text (the ", " the Drive sheet title splits on, `apps/web/app/admin/supplies/page.tsx:560`); how Sheets and Excel show the BOM, apostrophe-prefixed cells, date and time columns | Sheet title and cell types depend on it | Export once, open in both |
| UNV-10 | `AbortSignal.timeout` support on the phones in use | BUG-32 skips the gate silently | Check browser versions |

#### Hosting, consoles and accounts

| ID | What is unverified | Why it matters | How to verify |
|---|---|---|---|
| UNV-11 | Hosting provider and project settings (`apps/web/vercel.json` with region `bom1` implies Vercel): root directory, build command, Node.js version, production branch, live commit, preview deployments | No release is possible without them; Node must satisfy DEBT-02 | Hosting dashboard; record in §15 |
| UNV-12 | Which variables are set in each environment: `NEXTAUTH_URL` (never read by app code), `NEXT_PUBLIC_GOOGLE_CLIENT_ID`, `ADMIN_PASSWORD` outside production; whether any developer or Codespaces env file points `MONGODB_URI` at the live database | Decides whether SEC-02 is live and whether Drive export works; a dev server on the live database writes real data and runs the index build and obsolete-index drop on its first request | The owner checks the hosting env settings and each env file: names and target only, never copy values |
| UNV-13 | Platform limits: 4.5 MB body cap and its 413, function time limit vs the 20 s Cloudinary timeout (no `maxDuration` export), whether `after()` and the un-awaited index build finish after the response | Upload errors, orphaned images, missing indexes | Platform documentation and logs |
| UNV-14 | Whether the first `X-Forwarded-For` value is set by the platform; how many instances run; whether module state is shared between routes | Strength of SEC-03 and SEC-06 | Platform documentation; a test deployment |
| UNV-15 | Response headers as served in production; whether HSTS `includeSubDomains` is safe for every subdomain | A wrong HSTS lasts two years | `curl -I` on the production URL; DNS inventory |
| UNV-16 | GitHub settings: visibility, branch protection, required reviews, Actions, deploy hooks | Visibility decides the exposure of SEC-02 and SEC-12 | Repository settings (the GitHub CLI was not available) |
| UNV-17 | Google Cloud Console: Drive API enabled, consent screen status and test users, client type, authorised JavaScript origins | Only the README steps are recorded | Console; record in §14 |
| UNV-18 | Cloudinary account: `public_id` format, public readability of bill URLs, CORS for the download fetch, HEIC and non-image handling, result of destroying an unknown id | Bill images are business records | Console, plus one upload on a non-production account |
| UNV-19 | MongoDB Atlas: region vs `bom1`, network access, backups, whether the hostname in `apps/web/.env.example:2` is the production cluster | Latency, recovery, SEC-12 | Atlas console |
| UNV-20 | Whether each `npm audit` advisory applies here (the app sets `images.unoptimized`, does not use `next/og`, is not self-hosted as far as the code shows) | Urgency of SEC-01 | Read each advisory against `apps/web/next.config.js` |

#### Live database (read-only checks)

| ID | What is unverified | Why it matters | How to verify |
|---|---|---|---|
| UNV-21 | Index state: unique `phone_1` on customers and `username_1` on users exist; legacy `vehicleNumber_1` on vehicles is gone | BUG-03, BUG-23 | `getIndexes()`; search logs for `[mongodb] index build failed` and `[mongodb] dropped obsolete index` |
| UNV-22 | Duplicates: customer phones (exact and formatting variants), usernames differing by case, more than one Stock document | A duplicate blocks the unique index for good | Aggregation grouped by phone / username |
| UNV-23 | Legacy shapes: rows with `pointName` and no customer; rows without `logType`, `productType` or `paymentStatus`; customers with `cashPerCase` or no address; rows whose driver, vehicle or customer no longer exists | The tolerance rules in §2.3 exist for these | Count per shape |
| UNV-24 | Collection names (default pluralisation assumed; only `vehicles` is named in code) and leftovers `assignments`, `watersupplypoints`, `entries` | Remains of deleted models | `listCollections` |
| UNV-25 | Volumes: rows per 5 IST days per log type (500, BUG-01), per filter (5000, BUG-11), per driver (200, BUG-15), odometer entries per vehicle (200, BUG-37) | Which caps already bite | Counts |
| UNV-26 | States: drivers sharing a vehicle (BUG-06), drivers assigned to a disabled vehicle (BUG-09), User documents with a non-driver role | Trigger conditions of known bugs | Queries on `users` |
| UNV-27 | Whether the removed public `/api/db/ping` was probed while it existed (2026-06-15 to 2026-09-24) | It returned raw database error text | Hosting access logs, if retained |

#### Library and platform behaviour not read from source

| ID | What is unverified | Why it matters | How to verify |
|---|---|---|---|
| UNV-28 | next-auth 4.24.15 defaults: token lifetime (believed 30 days), cookie flags, `signOut` doing a full-page navigation, `withAuth` on the sign-in page, when a stripped role is written back to the cookie, error text returned when `authorize()` throws | §2.3 rules 3 and 5, SEC-04, SEC-06 | Read the installed package, or test on a throwaway deployment |
| UNV-29 | Mongoose 9 with `bufferCommands: false`: index build (claim at `apps/web/lib/mongodb.ts:46-52`) and early queries throwing (§2.3 rule 10); update validators off by default (DEBT-14); `Types.ObjectId.isValid` edge cases; bcryptjs handling of passwords over 72 bytes (200 characters are allowed) | Index guarantees, id validation, password strength | Library source or a throwaway database |
| UNV-30 | Whether Node 20.9 to 20.18 breaks the locked database driver at run time (the baseline built on 20.11.0 without connecting) | DEBT-02 | Connect to a throwaway database on that version |
| UNV-31 | Unrecorded reasons: root `overrides`, the exact pins, removal of `--webpack` from `dev`, the meaning of cash type `debit`, operational use of `subscriptionCans` and `securityDeposit` | Nobody can tell when they are safe to change | Ask the owner; record in §2.2 |
| UNV-32 | Build and tooling: `next build` with no access to Google Fonts (`next/font/google`, `apps/web/app/layout.tsx:2`); `npm run icons` after an install that omits optional dependencies (`sharp` is `optional`, `package-lock.json:4554`); Turborepo strict env mode and cache keys for undeclared and `NEXT_PUBLIC_*` variables; whether `next build` stops on type errors and skips ESLint | A build or an icon run can fail on a locked-down machine (DEBT-20); §2.3 rule 25 and §12 rest on the Turborepo claims | On a throwaway copy: build with the network blocked; `npm ci --omit=optional`, then `npm run icons`; read the Turborepo and Next.js documentation for the rest |
| UNV-33 | TanStack Query 5.101.4 defaults left unset in `apps/web/app/providers.tsx:14-22`: refetch of a stale query on remount and on network reconnect | How long an open screen can show old data (BUG-14, BUG-27) | Read the installed package, or watch the network tab while changing pages and toggling the connection |

### 16.7 Recently resolved (DONE)

PR numbers are the merges of `dev` into `main`. Each row was confirmed by comparing the commit with its parent.

| ID | Resolved in (commit, date) | What was fixed |
|---|---|---|
| DONE-01 | `e810079`, 2026-09-24 (PR #11) | Auth hardening: constant-time admin comparison (`safeEqual`), failed-login throttle, 200-character credential cap, string type checks. Before: plain `===`, no throttle. |
| DONE-02 | `e810079`, 2026-09-24 | Guards return `null` and each handler answers 401 through `unauthorized()`. Before: `requireAdmin` / `requireDriver` threw `Error("Unauthorized")`. |
| DONE-03 | `e810079`, 2026-09-24 | Deactivated or deleted drivers lose API access within about a minute (re-check in the `jwt` callback). |
| DONE-04 | `e810079`, 2026-09-24 | Delete guards: a driver or vehicle with ledger rows answers 409. Before: unconditional hard delete, which could orphan ledger references. |
| DONE-05 | `e810079`, 2026-09-24 | Registering a soft-deleted customer's phone restores the record (`lib/customers.ts`). Before: `Customer.create`, then 409 for a record the admin could not see. |
| DONE-06 | `e810079`, 2026-09-24 | Unique index on `Vehicle.vehicleNumber` (the model) removed from the schema and dropped at run time; uniqueness moved to the registration (`name`). |
| DONE-07 | `e810079`, 2026-09-24 | Atomic odometer gate: one conditional `findOneAndUpdate`. Before: read, check, then two writes. |
| DONE-08 | `e810079`, 2026-09-24 | Explicit index creation once per process (`ensureIndexes`). Before: reliance on Mongoose's automatic build, which the code comment says fails silently while `bufferCommands` is `false` (UNV-29). |
| DONE-09 | `e810079`, 2026-09-24 | `models/index.ts` registers every model, ending `MissingSchemaError` on cold instances (earlier patched one route at a time, e.g. `082f8c5`). |
| DONE-10 | `e810079`, 2026-09-24 | Public `/api/db/ping`, which returned the raw database error, removed. (`/api/test` went in `a5c19d6`, 2026-06-22.) |
| DONE-11 | `e810079`, 2026-09-24 | Bill-image limit 8 MB -> 4 MB to stay under the host's 4.5 MB body cap; 20 s timeout on Cloudinary calls. |
| DONE-12 | `e810079`, 2026-09-24 | Admin and root error boundaries stopped showing `error.message` (the driver one still does: BUG-29). |
| DONE-13 | `e810079`, 2026-09-24 | Stock GET no longer creates the document; can amounts rounded to paise; analytics custom window capped at 731 days; HSTS header added. |
| DONE-14 | `1ca3e0d`, 2026-07-31 (PR #8) | Day boundaries moved from server-local / UTC time to IST (`lib/istTime.ts`); screen formatting followed in `e810079`. |
| DONE-15 | `1ca3e0d`, 2026-07-31 | Print/PDF export escapes driver-entered text (`escapeHtml`). |
| DONE-16 | `1ca3e0d`, 2026-07-31 | Drivers with no assigned vehicle are no longer locked out by the odometer dialog (`hasVehicle: false`). |
| DONE-17 | `1ca3e0d`, 2026-07-31 | Image optimizer endpoint turned off (`images.unoptimized: true`); ids pre-cast for aggregation. |
| DONE-18 | `1ca3e0d`, 2026-07-31 | Template leftovers removed: `apps/docs`, `packages/ui`, the unused `Entry` model, unused `zod` and `react-hook-form`. |
| DONE-19 | `8ab02c5`, 2026-07-09 (PR #5) | Sign-out changed from `signOut({ redirect: false })` to `signOut({ callbackUrl: "/" })` (see §2.3 rule 5). |
| DONE-20 | `2e9a936`, 2026-06-29 (PR #4) | Customer delete changed from a hard delete to a soft delete. |

## 17. Testing, quality baselines and debugging recipes

### 17.1 Baselines on c251bc4

Measured 2026-10-11 on an isolated copy of `c251bc4`: Windows 11, Node v20.11.0, npm 10.8.1, no `.env` file, network available. That Node version is below the real floor (see §13.1), which is why the install warns. Re-run after every dependency or tooling change and update this table.

| Check | Command (repo root) | Result |
|---|---|---|
| Install | `npm ci` | Exit 0, 318 packages, 34 s. 6 `EBADENGINE` warnings: `mongoose@9.9.0`, `mongodb@7.5.0`, `bson@7.3.1`, `mquery@6.0.0`, `mongodb-connection-string-url@7.0.2` (need Node `>=20.19.0`) and `eslint-visitor-keys@5.0.1` (needs `^20.19.0 \|\| ^22.13.0 \|\| >=24`) |
| Lint | `npm run lint` | Exit 0, 0 problems, about 28 s |
| Types | `npm run check-types` | Exit 0, 0 errors, about 26 s |
| Build | `npm run build` | Exit 0 with NO env vars set, about 51 s (Next.js 16.2.12, Turbopack). `.next` is about 18 MB; 24 static pages generated |
| Format | `npx prettier --check "**/*.{ts,tsx,md}"` | Exit 1. On the measured copy (CRLF line endings from a Windows export) all 67 tracked files in scope were flagged, plus the generated `next-env.d.ts`. Re-run with `--end-of-line auto` it flags 59 of the 67, so the drift is real formatting, not only line endings. There is no Prettier config (see §12.5) |
| Audit | `npm audit --omit=dev` | Exit 1: 4 advisories = 1 critical + 3 high. `next` (critical; affected range reported up to 16.3.7; fix reported as `next@16.4.0`, outside the exact pin), `sharp` (high, <=0.35.5-rc.1, pulled in by next), `source-map-js` (high), `nanoid` (high, <3.3.18) |
| Tests | - | None exist (§17.2) |

- `next` advisory titles as npm reported them: RCE on Windows-hosted servers; RCE in the Image Optimization API with AVIF; RCE in `next/og` ImageResponse; cache poisoning of SSG/ISR in self-hosted apps (two advisories); information disclosure in the dev-server MCP endpoint; information disclosure in App Router metadata image routes; SSRF in Image Optimization.
- Applicability was NOT assessed in depth. Known from the code: `images.unoptimized: true` (`apps/web/next.config.js:22-24`), no `next/og` or `next/image` import anywhere in `apps/web`, hosting configured for Vercel rather than self-hosted or Windows. Treat as "needs review, upgrade recommended" (see §16).
- Build route table. Static: `/`, `/_not-found`, `/admin`, `/admin/amounts`, `/admin/customers`, `/admin/drivers`, `/admin/supplies`, `/admin/vehicles`, `/driver`, `/login`, `/apple-icon.png`, `/manifest.webmanifest`. Dynamic: `/admin/customers/[id]`, `/admin/vehicles/[id]` and every `/api/*` route (16 route paths). `Proxy (Middleware)` is listed for `apps/web/proxy.ts`.

Code-quality counts, counted with grep on the repository tree at `c251bc4` (2026-10-11, `apps/web` and `packages`):

| Pattern | Count | Where |
|---|---|---|
| `any` (`: any`, `as any`, `<any>`, `any[]`) | 0 | - |
| `@ts-ignore`, `@ts-expect-error`, `@ts-nocheck` | 0 | - |
| `TODO`, `FIXME`, `HACK`, `XXX` | 0 | Open work is tracked only in §16 |
| `eslint-disable` | 2 | File-level `@next/next/no-img-element`: `apps/web/app/admin/supplies/page.tsx:3`, `apps/web/app/driver/page.tsx:3` |
| Non-null `!` | 7 (on 6 lines) | `apps/web/app/admin/vehicles/[id]/page.tsx:50`, `:51`, `:63` (twice); `apps/web/lib/auth.ts:42`; `apps/web/app/admin/supplies/exports.ts:260`; `apps/web/app/api/admin/supplies/route.ts:305` |
| `as unknown as` | 2 | `apps/web/lib/customers.ts:72`, `:76` |
| `dangerouslySetInnerHTML` | 2 | Static CSS strings: `apps/web/app/admin/layout.tsx:315`, `apps/web/app/admin/amounts/page.tsx:867` |
| `data-testid` | 2 | Leftovers with no test behind them: `apps/web/app/admin/supplies/page.tsx:121`, `apps/web/app/driver/page.tsx:1026` |
| `console.log` | 1 | CLI output of `apps/web/scripts/generate-pwa-icons.mjs:86` |
| `console.error` / `console.warn` / `console.info` | 9 / 1 / 1 | Listed in §17.5 |

### 17.2 There are no automated tests

- No test runner is in any `package.json` or in the lockfile; there are no `*.test.*`, `*.spec.*` or `__tests__` files, no CI (`.github/` is absent) and no git hooks. "There is no test suite; `npm run check-types` and `npm run lint` are the static checks." (`apps/web/README.md:3`).
- What that means: nothing checks behaviour. Lint and the type-check catch static mistakes, `next build` catches build-time ones; pricing, permissions, date windows, uploads and the PWA are verified only by hand.
- Must pass before any merge to `main`, run by hand from the repo root: `npm run lint`, `npm run check-types`, `npm run build` (all exit 0), then §17.3 on a production build for every area touched.
- Write what was run, and what was not tried on a real phone, in the changelog entry's "Verified" line (§0.4).
- If tests are ever added, the cheapest start is the pure modules with no I/O: `apps/web/lib/supplyProduct.ts`, `apps/web/lib/istTime.ts`, `apps/web/lib/csv.ts`, `apps/web/lib/analyticsRange.ts`. Anything touching the database needs a throwaway MongoDB (§17.6).

### 17.3 Manual smoke test

Run against a production build (§13.5) pointed at a throwaway database, with two browsers or a desktop plus a phone. Steps marked (phone) only count when done on a real device. The expected results are read from the code; the walk-through was not executed when this handbook was written (unverified).

1. Signed out: `/` shows the Admin Portal and Driver Portal cards (plus the install card where the browser offers installation); opening `/admin/supplies` redirects to `/login`; `GET /api/admin/customers` answers 401 `{ "error": "Unauthorized" }`.
2. A wrong password shows "Invalid username or password."; the admin login lands on `/admin/amounts`; the profile menu shows `v<version>` under Sign Out.
3. Vehicles: add one (Number, Model, Capacity); adding the same Number again is refused with "A vehicle with this number already exists."; open its detail page.
4. Drivers: create one (password of 6+ characters) with that vehicle as default; edit the name; deactivate and reactivate.
5. Customers: add one, search for it, edit it, open its history page; delete it, then add the same phone again -> the old record is restored.
6. Stock (profile menu): change a count, Save Changes -> "Stock updated." and the "Last updated" line changes.
7. Second browser, driver login -> `/driver`; the blocking "Today's Odometer Reading" dialog appears; submit a reading; profile menu -> Odometer now says "Already submitted for today."
8. Driver, Supply tab: log a can delivery (amount = cans x the customer's rate) and a case delivery (size and price per case); both appear under "My Recent Deliveries".
9. Driver, Cash tab: a fuel entry without a photo is refused ("Please attach the fuel bill image."); with a photo it saves and the thumbnail shows; a debit entry saves without a photo. (phone) Use the camera option.
10. Driver, User tab: register a customer; it appears in the delivery form's customer picker.
11. Driver: pick an older day with the calendar filter; open Stock; Sign Out returns to `/`.
12. Admin, Deliveries: both tabs show the driver's rows; try the date, month, driver, customer, payment and product filters; open a row's details and the fuel-bill image; Add Delivery with a past date; edit quantity, amount, payment and remark; delete a row.
13. Admin, Download menu: Download Photo, Download PDF (print window), Download Sheet (CSV), Save to Google Drive (a sheet link, or "This feature is not available yet." when no client ID was built in).
14. Admin, Analytics: quick ranges and a custom range; the New Customers list shows the customer from step 10 as added by the driver.
15. Access control: deactivate the driver; within about a minute the driver's next action lands on `/login`. A signed-in driver opening `/admin` ends up back on `/driver`.
16. PWA: DevTools -> Application shows the manifest, an activated `/sw.js` and the `rk-static-v2` cache; offline + reload shows "You're offline" and recovers when the network returns. (phone, HTTPS deployment) Install to the home screen and open it full-screen.
17. Narrow viewport: the admin shows its bottom navigation at 860px and narrower (`apps/web/app/admin/layout.tsx:320`); the driver tab bar is fixed to the bottom below 768px (`apps/web/app/globals.css:534`).

### 17.4 Debugging recipes

Known defects behind several rows are tracked in §16; this table is for getting unstuck. "Host logs" are described in §17.5.

| Symptom | Likely cause | How to confirm | Fix |
|---|---|---|---|
| Sign-in always answers "Invalid username or password." | One message covers every failure (`apps/web/app/login/page.tsx:35-36`): wrong credentials; username differs in letter case or has a stray space (exact match, `apps/web/lib/auth.ts:164-168`); driver deactivated; database unreachable (drivers only); throttle - 10 failures per `username\|ip` within 15 min of the first one refuse even the correct password (`apps/web/lib/auth.ts:34-35`, `:143-144`) | Try the admin login: it needs no database. Look for a database error in the host logs. Count the recent attempts | Wait 15 min from the first failure, or restart the instance (the counter is in memory, `apps/web/lib/auth.ts:37`); retype the username exactly |
| The admin cannot sign in on production, drivers can | `ADMIN_PASSWORD` is unset or whitespace-only there, so `getAdminCredentials()` returns `null` (`apps/web/lib/auth.ts:11-21`); or `ADMIN_USERNAME` is not what is being typed | Hosting environment settings: check the names exist (never print the values) | Set them and redeploy |
| A driver is suddenly thrown to `/login` | The driver client signs out on ANY 401 from a driver route (`apps/web/app/driver/layout.tsx:19-25`, `apps/web/app/driver/page.tsx:174-182`; the shared Stock dialog only shows the error). Causes: account deactivated or deleted (role stripped, `apps/web/lib/auth.ts:201-208`); session expired; `NEXTAUTH_SECRET` changed; a new driver route that answers 401 for a business rule (none does today) | Admin -> Drivers: is the account Active? Network tab: which request returned 401? | Reactivate and sign in again. In code, answer 400 or 409 for rule failures, never 401 |
| Every API call answers 500 "Something went wrong. Please try again." | Database: `MONGODB_URI` missing ("Missing MONGODB_URI in environment variables.", `apps/web/lib/mongodb.ts:99-101`) or wrong, or the cluster refuses the connection; server selection gives up after 5 s (`apps/web/lib/mongodb.ts:80`) | Host logs: the real error is printed after the user-facing text (`apps/web/lib/api.ts:24`). Admin sign-in still works, driver sign-in does not | Fix the variable or the cluster access; the next request reconnects by itself (`apps/web/lib/mongodb.ts:85-90`) |
| `MissingSchemaError` on a `populate()`, usually only on the first request after a cold start | A new model is missing from `apps/web/models/index.ts:6-10`, or the code path never imported `apps/web/lib/mongodb.ts` (importing it loads that index, `:2-3`) | It disappears once another route has loaded the model | Add the import to `models/index.ts`; call `await connectToDatabase()` before any query (`bufferCommands` is off, `apps/web/lib/mongodb.ts:78`) |
| Fuel-bill save answers 400 | "Image is too large. Please keep it under 4 MB." (declared body over 4 MiB + 64 KiB, or file over 4 MiB, `apps/web/app/api/driver/supplies/route.ts:138-141`, `:173`); "Please upload a valid image file." (`:91-94`, `:172`); "Fuel bill image is required for fuel entries." (`:174`). A platform 413 shows "Photo is too large. Please retake it or take a screenshot of the bill." (`apps/web/app/driver/page.tsx:812-813`) | Read the `error` text of the response | Retake at a lower resolution or screenshot the bill. Do not raise the cap (see §15.1) |
| Fuel-bill save answers 502, or a generic 500 | 502: the Cloudinary upload timed out after 20 s, or failed with a message containing "upload" (the default text does); that message reaches the driver (`apps/web/app/api/driver/supplies/route.ts:256-259`; `apps/web/lib/cloudinary.ts:67`, `:102`, `:112`). 500 "Failed to save the entry. Please try again.": anything else whose message does not match the `/upload\|timed out/i` test, including a missing or malformed `CLOUDINARY_URL` (`apps/web/lib/cloudinary.ts:28-43`), a network failure, or a Cloudinary error worded differently | Host logs: `[driver supplies POST]` on the 502 path; the 500 path logs the real error | Fix `CLOUDINARY_URL` (nothing may follow the cloud name, `apps/web/lib/cloudinary.ts:32`); check the Cloudinary account and quota (unverified); retry |
| The installed app still runs the old code after a deploy | Expected: the update card appears only when the bytes of `/sw.js` change, and an open app keeps its bundle until a full page load (see §11.4). Or `version` was not bumped, so the label did not move | Compare the label under Sign Out with `apps/web/package.json:3` of the deployed commit | Close and reopen the app or reload. Bump `version` on every release |
| A new icon, manifest or offline page does not reach phones | Those files are precached or cache-first in `rk-static-<VERSION>` (`apps/web/public/sw.js:27-33`, `:77-83`) and `VERSION` was not bumped | Cache Storage still shows the old cache name | Bump `VERSION` (`apps/web/public/sw.js:22`), redeploy, tap Reload on the card |
| A date is off by one day, or a row sits under the wrong day | The device or server timezone was used instead of IST: `toLocaleDateString("en-IN")` with no `timeZone` (`apps/web/app/admin/customers/[id]/page.tsx:61`, `apps/web/app/admin/drivers/page.tsx:399`, `apps/web/app/admin/vehicles/[id]/page.tsx:419`); a date-only `registeredDate` is parsed as UTC midnight, 05:30 IST (`apps/web/app/api/admin/customers/route.ts:85-87`) | Set the device timezone west of UTC and reload; compare with a screen that uses `apps/web/lib/format.ts` | Client: `apps/web/lib/format.ts`. Server day boundaries: `apps/web/lib/istTime.ts` (see §6.11) |
| Rows are missing from the unfiltered Deliveries list | (a) More than 500 rows in the 5-day window: page 1 fetches `WINDOW_MAX_ROWS = 500` and page 2 starts before the window (`apps/web/app/api/admin/supplies/route.ts:27`, `:147-158`). (b) The row is dated in the future, outside the window that ends at `istDayEnd()` (`:149`) | The summary bar counts more than the rows shown; a date or month filter finds the row | Filter by date or month (normal 50-per-page paging). In the UI a wrong date can only be fixed by delete and re-add: the edit dialog has no date field, although PATCH accepts `suppliedAt` (`apps/web/app/api/admin/supplies/[id]/route.ts:74`) |
| Old rows vanish when new code filters by product or payment | Equality filter on a field legacy rows lack: no `productType` means can, no `paymentStatus` means cash | Compare with the existing filters at `apps/web/app/api/admin/supplies/route.ts:123-125`, `:132-134` | Filter cans with `{ $ne: "case" }` and cash with `{ $nin: ["upi", "not_paid"] }`. Never "repair" the rows with a migration (`apps/web/README.md:31`) |
| Adding a vehicle answers "A vehicle with this number already exists." although the number is new | The old unique index `vehicles.vehicleNumber_1` (on the MODEL field) still exists, so a second vehicle of the same model raises error 11000, which is mapped to that text (`apps/web/app/api/admin/vehicles/route.ts:55-57`). Or the number differs only in letter case (`:47`) | Host logs: `[mongodb] dropped obsolete index vehicles.vehicleNumber_1` or `[mongodb] obsolete index cleanup failed for Vehicle`; list the collection's indexes | The drop runs in the background on the first database call of each process (`apps/web/lib/mongodb.ts:30-44`): retry shortly; if the cleanup line shows an error, fix that |
| Save to Google Drive shows "This feature is not available yet." | `NEXT_PUBLIC_GOOGLE_CLIENT_ID` was empty when the bundle was BUILT (`apps/web/lib/googleDrive.ts:15`, `apps/web/app/admin/supplies/page.tsx:551-554`) | Is the name set for the build environment? Setting it later changes nothing until a rebuild | Set it and rebuild or redeploy. Popup blocked, origin not authorised, account not a test user: see §8.4 and `apps/web/README.md:71-77` (unverified in a browser) |
| A driver is asked for the odometer of a disabled vehicle | Disabling a vehicle does not clear `User.assignedVehicle` (`apps/web/app/api/admin/vehicles/[id]/route.ts:86-88`; only DELETE does, `:149-152`) and the odometer routes ignore `isActive` (`apps/web/app/api/driver/vehicles/odometer/route.ts:30`) | Admin -> Drivers: the Default Vehicle is the disabled one | Give the driver another active vehicle. Saving that driver's Edit dialog fails with "Assigned vehicle is not available." until another vehicle or none is picked (`apps/web/app/api/admin/drivers/[id]/route.ts:80-83`); the Activate / Deactivate button still works |
| A driver is stuck on "Today's Odometer Reading" with "Odometer already submitted for today." | The gate is per vehicle per IST day (`apps/web/app/api/driver/vehicles/odometer/route.ts:78-102`): another driver sharing the vehicle, or a first submit whose response was lost, already recorded it; the dialog has no close button | The vehicle's detail page shows today's reading | Reload or reopen the app: the gate is re-evaluated on load |
| An export has fewer rows than the summary bar | Caps. No truncation flag: sheet and Drive `EXPORT_MAX_ROWS = 5000` newest rows (`apps/web/app/api/admin/supplies/route.ts:25`, `:167-169`); the driver's own list `.limit(200)` (`apps/web/app/api/driver/supplies/route.ts:124`). With a notice ("The photo holds the first 250 rows. ...", `apps/web/app/admin/supplies/page.tsx:493-495`): photo `MAX_PNG_ROWS = 250` (`apps/web/app/admin/supplies/exports.ts:39`) | The row count is exactly 5000, 250 or 200 | Narrow the filter (month, driver, customer) and export in parts |
| `npm run build` fails while fetching a font | `next/font/google` downloads Inter at build time (`apps/web/app/layout.tsx:2`, `:7-11`); no network, or a proxy blocks Google Fonts (framework behaviour; the failure was not reproduced) | The build log names the font request | Build with network access. Moving to a local font file is a code change |
| `npm ci` prints `EBADENGINE` warnings | Node is older than the packages listed in §17.1 require, while `engines.node` only asks for `>=20.9` (`package.json:17`) | `node -v` | Upgrade Node (see §13.1). The install still exits 0 because `.npmrc` has no `engine-strict` |
| Lint prints only warnings but exits non-zero | `eslint-plugin-only-warn` turns every finding into a warning and the script runs `eslint --max-warnings 0` (`apps/web/package.json:10`) | The summary counts 0 errors and N warnings (ESLint's standard output, not reproduced here) | Fix every finding; a deliberate exception needs an `eslint-disable` comment (see §12.3) |
| Lint fails on a new `process.env.X`, or a build ignores a new or changed variable | The name is missing from `globalEnv` (`turbo.json:4-13`): `turbo/no-undeclared-env-vars` fires (expected from `packages/eslint-config/base.js:21`, not reproduced; `NEXT_PUBLIC_*` names are not flagged, see §12.3), and the turbo cache key does not include the variable, so a cached `.next` is replayed (Turborepo behaviour, unverified) | Lint names the rule; turbo reports a cache hit for the build | Add the name (see §13.7); force one rebuild with `npx turbo run build --force` (not run here) |
| A deactivated driver can still save entries for a short while | By design: the active check is cached for 60 s per server instance (`apps/web/lib/auth.ts:74-81`); on a database error it reuses the last cached answer and allows the driver when there is none (`:87-91`); the proxy itself runs no check, it only reads the role on the token (`apps/web/proxy.ts:7`) | Saves stop within about a minute; `[auth] driver active check failed` in the host logs means the check itself errored | Nothing to fix for the delay. If it persists, look at the database connection |
| Changing a customer's phone answers 409 "A customer with this phone number already exists." but no such customer is visible | The number belongs to a soft-deleted customer: the unique `phone` index covers deleted records (`apps/web/models/Customer.ts:24`) and PATCH does not restore (`apps/web/app/api/admin/customers/[id]/route.ts:134-136`) | Searching Admin -> Customers finds nothing, because deleted records are hidden | Add the number as a NEW customer: creation restores the deleted record in place (`apps/web/lib/customers.ts:54-73`); then edit that record |
| Admin lists look empty ("No customers found.") although data exists | The request failed or the session ended: the Customers, Drivers and Vehicles list pages never read `isError` (empty state at `apps/web/app/admin/customers/page.tsx:279`; Deliveries does, `apps/web/app/admin/supplies/page.tsx:362`, `:434-435`) and no admin code handles a 401 | Network tab shows 401 or 500 | Reload: the proxy sends an expired session to `/login` |
| Local files disagree with this handbook (for example `/admin/assignments` exists, `apps/web/lib/istTime.ts` does not) | Stale checkout, as found on 2026-10-11: local `dev` @ `e849df9`, 43 commits behind `origin/main` (31 non-merge plus 12 PR merges) | `git fetch origin`, then `git rev-list --count --no-merges HEAD..origin/main` (expect 0; without `--no-merges` a current `dev` shows the 12 PR merge commits) | Ask the owner to update the branch, then `npm ci` (see §13.2) |

### 17.5 Logs

Every server log is a plain `console` call; error handling is described in §6.12. No logging library, request ID or error tracker exists.

| Log line | Level | Emitted at | Meaning and action |
|---|---|---|---|
| `<message sent to the client> <error object>` (no prefix) | error | `apps/web/lib/api.ts:24`, from 29 `serverError(...)` call sites | Any handler's catch. The label is the text the user saw: "Something went wrong. Please try again." by default, or a route-specific one such as "Failed to load entries." or "Failed to save delivery log." Search the logs for the on-screen text |
| `[driver supplies POST]` | error | `apps/web/app/api/driver/supplies/route.ts:257` | Cloudinary upload failed or timed out; the driver received 502 |
| `[supplies DELETE] image cleanup` | error | `apps/web/app/api/admin/supplies/[id]/route.ts:248` | The ledger row was deleted but its Cloudinary image was not: an orphaned image to remove by hand |
| `[auth] driver active check failed` | error | `apps/web/lib/auth.ts:89` | Database error during the 60 s driver re-check; the last cached answer was reused (the driver is allowed when there is none) |
| `[mongodb] index build failed for <Model>` | error | `apps/web/lib/mongodb.ts:60` | A declared index could not be built (for a unique index, typically because duplicate values exist). Not retried until the process restarts, so the database is not enforcing that rule |
| `[mongodb] obsolete index cleanup failed for <Model>` | error | `apps/web/lib/mongodb.ts:63` | The drop of an obsolete index failed |
| `[mongodb] dropped obsolete index <collection>.<name>` | info | `apps/web/lib/mongodb.ts:41` | Expected once per database: `vehicles.vehicleNumber_1` removed |
| The raw error object | error, browser console | `apps/web/app/error.tsx:13`, `apps/web/app/admin/error.tsx:13`, `apps/web/app/driver/error.tsx:13` | An error boundary rendered. It never reaches the server |
| `Service worker registration failed` | warn, browser console | `apps/web/app/components/PwaRegister.tsx:78` | `/sw.js` could not be registered (production builds only) |

- Not logged at all: sign-ins, failed or throttled logins, admin edits and deletes (no audit trail), request timing.
- Where to read them: locally, the terminal running `npm run dev` or `npm run start`, and the browser console. In production, the hosting provider's function logs (Vercel implied); their location, retention and who can read them are unverified (see §15.2).
- On a phone the browser console needs remote debugging from a desktop browser (not tried for this project).

### 17.6 Safe-testing rules

- Never run the app, a script or a test against the live database: "`MONGODB_URI` points at the live database in production, so never run scripts or tests against it; use a throwaway MongoDB for anything that writes." (`README.md:34`). Treat any connection string you did not create yourself as live.
- Using the app is already a write: the first database call of each process runs `createIndexes()` for all five models and drops `vehicles.vehicleNumber_1` if it exists and is unique (`apps/web/lib/mongodb.ts:34-66`).
- Use a throwaway MongoDB (local, or a separate project) holding only invented data. It starts empty; build test data through the UI (§13.4).
- Fuel-bill uploads go to whichever Cloudinary account `CLOUDINARY_URL` names, into `royal-king-water-supply/fuel-bills` (`apps/web/lib/cloudinary.ts:83`). Use a separate account for tests, or delete the test rows from Admin -> Deliveries (the image delete is best-effort).
- Save to Google Drive creates a real file in the signed-in Google account on every use; nothing is overwritten.
- Never put real customer names, phone numbers or registration numbers in test data, screenshots, logs, commits or this file. Never log env values, passwords, tokens or request bodies.
- A dev server on a forwarded host can be reachable by others: set `ADMIN_PASSWORD` first (see §13.4).
- Do not "tidy" legacy or test rows with a migration or a bulk update: old documents are read with defaults on purpose (`apps/web/README.md:31`).
- Anything not tried on a real phone stays marked "unverified" (§0.2).

## 18. History, branches and versioning

### 18.1 Branch and merge model

- Remote `origin` has exactly two branches, `dev` and `main` (`git ls-remote`, 2026-10-11). There are no tags, no release, feature or hotfix branches, and no `git revert` commits: every removal in history is an edit inside an ordinary commit.
- `dev` is the working branch: 49 commits, strictly linear, no merge commits. All work is committed there.
- `main` receives `dev` only through GitHub pull requests (`dev` -> `main`, PRs #1-#12), each merged as a true two-parent merge commit with the subject `Merge pull request #N from OWNER/dev`: no squash, no rebase. `main` has never been merged back into `dev`; only `de1f1c6` and `a5c19d6` were committed directly on `main`, before the PR flow began.
- State at the documented commit: `main` @ `c251bc4` holds 61 commits = 49 work commits + 12 merge commits; `dev` @ `3458651` is an ancestor of `main` and has the IDENTICAL tree (`git diff 3458651 c251bc4` is empty). The branches differ only by merge commits, so nothing was waiting for release on 2026-10-11.
- A PR merge is the release event (§18.3); the only other release marker is the app version (§18.2). 7 of the 12 PRs were merged within 16 minutes of their last commit and git records no reviewer; the repo has no CI config and no tests (see §17). GitHub-side settings (branch protection, required reviews, what deploys from `main`) are unverified (see §15).
- Commit subjects: 39 `feat:`, 4 `fix:`, 2 `chore:`, 4 free-form. `feat:` is used for almost everything, including bug fixes and deletions, so subjects are NOT a reliable changelog: run `git show <hash> --stat` before trusting one (§18.4 marks the misleading ones).

### 18.2 Where versions are bumped

| What | File | Shown / used where | When to bump |
|---|---|---|---|
| App version (`0.2.2`) | `apps/web/package.json:3`, mirrored at `package-lock.json:22` | Read at build time by `apps/web/next.config.js:5`, exposed as `NEXT_PUBLIC_APP_VERSION` (`apps/web/next.config.js:9-11`), rendered as `v0.2.2` under Sign Out in both profile menus (`apps/web/app/admin/layout.tsx:307`, `apps/web/app/driver/layout.tsx:305`) | Every release, in the commit that goes into the PR. WHY: "so it is easy to tell which build a phone is running. Bump "version" in package.json for each release." (`apps/web/next.config.js:3-4`). With no tags it is the only release marker |
| Service-worker `VERSION` (`"v2"`) | `apps/web/public/sw.js:22` | Names the only cache, `rk-static-v2` (`apps/web/public/sw.js:23`); a new value installs a new worker and shows the update card (see §11.4) | Only when the worker's caching behaviour, `offline.html`, the icons or the manifest change (`apps/web/public/sw.js:17-19`, `:84-85`). Not for ordinary releases; independent of the app version |
| `next` exact pin (`16.2.12`) | `apps/web/package.json:18` | The framework; `npm audit` reports a fix that lies outside the pin (see §4.4) | Deliberately and by hand, then re-run the checks in §13 and re-check the overrides |
| All other dependencies (caret ranges, except `typescript`, `@types/react` and `@types/react-dom`, which are exact, and the two `@repo/*` workspace packages at `*`) | `apps/web/package.json:15-30`, `package.json:11-15`, `packages/eslint-config/package.json` | Real versions come from `package-lock.json` | The lockfile was refreshed exactly once (`1ca3e0d`). Never delete it: that one refresh moved mongoose (9.2.1 -> 9.9.0), next-auth (4.24.13 -> 4.24.15) and react-query (5.90.21 -> 5.101.4) in one step |
| Root `overrides` (`postcss`, `sharp`) | `package.json:24-27` | Force two transitive versions (see §12.1) | Re-check on every `next` upgrade; reason not recorded |
| Node engine `>=20.9`, `packageManager` `npm@10.8.1` | `package.json:17`, `package.json:19`; the engine is mirrored at `package-lock.json:18` | Warn-only (`.npmrc` is empty); quoted in `README.md:30` | When a dependency raises its floor: the lockfile already needs 20.19+ (see §4.4) |

- App version history (`git log -p -- apps/web/package.json` shows only three values): `0.1.0` from the starter in `de1f1c6` (2026-06-15), unchanged through PRs #1-#10; `0.2.1` set by `f4240d4` (2026-09-24, PR #11), the commit that introduced the label; `0.2.2` set by `3458651` (2026-09-24, PR #12). `0.2.0` was never committed. Ten of the twelve releases therefore share `0.1.0` and cannot be told apart by version.
- Service-worker history: `v1` in `9f9f5a5` (2026-09-21, PR #9); `v2` in `e810079` (2026-09-24, PR #11), which made the manifest cache-first.
- Other pins: `next` `16.1.5` -> `16.2.12` and both overrides in `1ca3e0d` (2026-07-31); Node `>=18` -> `>=20.9` and the `--webpack` dev flag dropped in `e810079`; `icons` script added in `9f9f5a5`. Reasons, where known: see §4.3. Release steps: see §13.

### 18.3 Releases

| PR | Merge commit | Date | What shipped (from the diffs) |
|---|---|---|---|
| none | `de1f1c6`, `a5c19d6` (direct commits on `main`) | 2026-06-15, 2026-06-22 | Import of an already-working tanker-supply app together with the create-turbo starter; then error boundaries, `/api/admin/stats`, Mongoose connection options, bcrypt cost 12 and security headers |
| #1 | `af4ef4d` | 2026-06-22 | 15 commits, 18 files. Pivot from supply points to customers and can deliveries: `Customer` model, admin Customers page and APIs, driver customer registration, `both` location type, cans taken back, auto-pricing, Amounts page rewritten as Analytics with its API and filters, bottom tab bar for drivers, admin profile dropdown |
| #2 | `b9c91f4` | 2026-06-22 | 1 commit, 12 files. try/catch and 500 on the analytics and supplies list APIs, API errors shown on admin pages, dead sidebar CSS and schema hacks removed, extra indexes |
| #3 | `5ae49dd` | 2026-06-26 | 5 commits, 12 files. Daily odometer gate and API, vehicle detail page, `Customer.registeredDate`, `$unset` on customer edit, customer picker labelled with full name and phone |
| #4 | `9486b19` | 2026-06-29 | 7 commits, 15 files. Admin Add Delivery, in-app confirm dialogs, customer soft delete, security deposit, camera capture for fuel bills, payment status, stock |
| #5 | `ec44b93` | 2026-07-10 | 3 commits, 18 files. Server-side pagination for customers (with search) and supplies, with aggregate stats, payment filter, Inter via `next/font`, Cloudinary thumbnail URLs, a populate fix |
| #6 | `f0a9986` | 2026-07-13 | 3 commits, 9 files. 5-day recent window in both portals, driver `?date=` lookup, customer history page, only the active tab queries |
| #7 | `0c7b1cb` | 2026-07-31 | 2 commits, 4 files. Per-day serial numbers, customer filter on Deliveries, the system-report PDF at the repo root |
| #8 | `526a143` | 2026-07-31 | 2 commits, 48 files. `next` 16.2.12 with the lockfile refresh and overrides, IST day boundaries (`apps/web/lib/istTime.ts`), starter app, UI package and unused dependencies removed, print-export escaping, totals row in exports |
| #9 | `9532b63` | 2026-09-21 | 2 commits, 24 files. Installable PWA (manifest, service worker v1, offline page, install prompt, icons); New Customers analytics |
| #10 | `9933a3a` | 2026-09-23 | 4 commits, 19 files. Driver-note preview; can/case products with case size and per-delivery case price; CSV download and Save to Google Drive |
| #11 | `aa33019` | 2026-09-24 | 2 commits, 82 files. The hardening and cleanup refactor `e810079` (see §18.4), service worker v2, app version label, version `0.2.1` |
| #12 | `c251bc4` | 2026-09-24 | 1 commit, 4 files. Download menu, collapsible filter panel, generic Drive-unavailable message, version `0.2.2` |

### 18.4 Timeline

| Date | Commit | Subject | What it really changed (from the diff). **M** = the subject misdescribes or understates it |
|---|---|---|---|
| 2026-06-15 | `de1f1c6` | feat: initialize monorepo with Turbo, ESLint, and TypeScript configurations | **M** 104 files: the create-turbo starter (`apps/docs`, `packages/ui`, config packages) AND a complete working app: admin pages (dashboard, amounts, assignments, drivers, supplies, supply-points, vehicles), driver portal, login, 17 API route files, six models (User, Vehicle, SupplyLog, Entry, Assignment, WaterSupplyPoint), next-auth, Cloudinary upload, `proxy.ts`, PNG and print-PDF export |
| 2026-06-22 | `a5c19d6` | feat: enhance API routes, improve error handling, and add NotFound component | Error boundaries and `not-found.tsx`; new `/api/admin/stats`; deletes `/api/test`; Mongoose options (`bufferCommands: false`, pool 10, timeouts) and retry after a failed connect; bcrypt cost 10 -> 12; first SupplyLog indexes; `poweredByHeader: false`, `images.remotePatterns`, four security headers |
| 2026-06-22 | `4b79842` | feat: add customer management functionality | The domain pivot: `Customer` model, admin Customers page, `/api/admin/customers` (+ `[id]`), `/api/driver/customers`; SupplyLog gains `customer` and `cansDelivered`; the driver route requires a customer instead of point name + vehicle and stops upserting `WaterSupplyPoint`; customer DELETE is a hard delete |
| 2026-06-22 | `29790e9` | feat: improve customer registration validation and success messages | `cashPerCan` becomes required when a driver registers a customer ("Cash per can is required."); copy changes |
| 2026-06-22 | `6b0c45c` | feat: implement driver tab bar and content layout adjustments | Driver tabs become `.driver-tab-bar`: fixed to the bottom on phones with safe-area padding, static from 768px |
| 2026-06-22 | `c8512db` | fix: update table cell width to 100% for better responsiveness | **M** One CSS line, and not a table cell: desktop `.driver-tab-bar` width `clamp(320px, 85vw, 1200px)` -> `100%` |
| 2026-06-22 | `6601167` | fix: update button label from 'Register' to 'User' for clarity | **M** Two driver tab labels, not one: "Delivery" -> "Supply" and "Register" -> "User" |
| 2026-06-22 | `91edbec` | fix: update cash type from 'debit' to 'fuel' in cash form | **M** Only the default selection of the driver cash form (2 lines). `debit` stays a valid value and option |
| 2026-06-22 | `d03c756` | feat: extend locationType to include 'both' option across customer models and forms | `locationType` enum gains `both` (model, three customer APIs, admin and driver forms) |
| 2026-06-22 | `6c5367c` | feat: enhance delivery options to support 'both' location type and improve customer selection UI | Searchable customer picker in the driver delivery form; one option per location (two for `both`) labelled "first name's House / Office"; cans pre-filled from `subscriptionCans` |
| 2026-06-22 | `0b8b0b3` | feat: add cansTakenBack field to DriverSupplyRequestBody and update related components | `SupplyLog.cansTakenBack` (min 0) in the model, driver API and driver form |
| 2026-06-22 | `d2a2590` | fix: update validation for cans delivered and taken back in driver supply request | Rule relaxed from "delivered >= 1" to "delivered or taken back, each a non-negative integer" (pickup-only rows become valid); also removes the pre-fill of cans from the subscription |
| 2026-06-22 | `a8e8fcb` | feat: add cansTakenBack field to SupplyLog interface for tracking returned cans | Admin Deliveries shows cans taken back (table, details, exports) |
| 2026-06-22 | `f466fa5` | feat: add editing fields for cans delivered and taken back in SuppliesPage | **M** Amounts page rewritten into Analytics (nav label changed, URL kept); new `/api/admin/analytics` (`days` 7-90, default 30); auto-pricing `cansDelivered x cashPerCan` on driver POST and admin PATCH; admin can edit both can counts |
| 2026-06-22 | `23bb7cf` | feat: implement filter modal for analytics page with date range and driver/vehicle selection | Analytics API accepts `from` / `to`, `driverId`, `vehicleId`; filter modal on the page |
| 2026-06-22 | `3567e46` | feat: enhance StatCard styling and layout for improved responsiveness | Styling only, inside `apps/web/app/admin/amounts/page.tsx`: stat cards always three columns |
| 2026-06-22 | `a3f70dc` | feat: add profile dropdown menu with navigation links and sign out functionality | Admin nav reduced to Analytics / Deliveries / Customers; Drivers, Vehicles and Sign Out move into a profile dropdown |
| 2026-06-22 | `e849df9` | feat: add error handling for API requests and improve user feedback in admin pages | **M** try/catch and 500 in the analytics and supplies GET; admin pages show API errors; also deletes dead admin-sidebar CSS, the duplicate Customer phone index declaration and a User-schema hot-patch; adds indexes |
| 2026-06-26 | `46d40eb` | sercah cust update with name | Typo for "search customer". Driver customer option label becomes the full name plus phone, replacing "first name's House / Office" |
| 2026-06-26 | `92f0c12` | feat: implement odometer tracking with history and validation for driver vehicles | Vehicle `odometer`, `odometerLastUpdated`, `odometerHistory[]`; GET/PATCH `/api/driver/vehicles/odometer` (one reading per UTC day at this point, last 5 shown); blocking daily dialog in the driver layout |
| 2026-06-26 | `ba4a0f3` | feat: add odometer data fetching and display in vehicle details | New `/admin/vehicles/[id]` page and GET on `/api/admin/vehicles/[id]`; list page slimmed |
| 2026-06-26 | `a278d1b` | feat: add registered date field to customer model and forms | `Customer.registeredDate` (default now) in the model, admin POST/PATCH, driver POST and the admin form |
| 2026-06-26 | `84f9a85` | feat: enhance date handling and update payload management in customer API | Customer PATCH `$unset`s cleared optional fields; `createdBy` is stored only when the session id is a valid ObjectId (the admin's is not) |
| 2026-06-29 | `f6cd17b` | feat: add delivery form and API handling for supplies management | Admin "Add Delivery" dialog and POST `/api/admin/supplies` (a delivery or cash row on behalf of a driver) |
| 2026-06-29 | `b7161dc` | feat: implement confirmation dialogs for deleting customers, drivers, and supply logs | `window.confirm()` replaced by in-app confirm dialogs on those three screens; vehicle delete still uses `window.confirm` (`apps/web/app/admin/vehicles/[id]/page.tsx:316`) |
| 2026-06-29 | `2e9a936` | feat: implement soft delete functionality for customers | Customer DELETE changes from `findByIdAndDelete` to `$set { isDeleted: true, isActive: false }`; lists filter `isDeleted: { $ne: true }` |
| 2026-06-29 | `e7057f4` | feat: add security deposit field to customer model and forms | `Customer.securityDeposit` (min 0) in the model, admin APIs and form |
| 2026-06-29 | `54b681f` | feat: add camera input option for fuel bill image upload in driver dashboard | Separate Camera (`capture="environment"`) and Gallery file inputs on touch devices |
| 2026-06-29 | `f61febf` | feat: add payment status field to supply logs and update related forms and APIs | `SupplyLog.paymentStatus` (`cash`, `upi`, `not_paid`); driver form (default cash, unknown values coerced to cash) and admin edit |
| 2026-06-29 | `c1e6c7e` | feat: add stock management functionality with modal and API integration | `Stock` model (cans, dispensers, stands, updatedBy); GET/PATCH `/api/stock` for any signed-in session; the dialog was duplicated in both layouts |
| 2026-07-09 | `082f8c5` | feat: import Vehicle model for supply log processing | **M** A one-line bug fix: side-effect import of the Vehicle model in the driver supplies route so `populate("vehicle")` stops failing |
| 2026-07-09 | `8ab02c5` | Refactor admin layout and supplies management | Server-side pagination for customers (`search`, `page`, `limit` up to 100, counts, areas) and supplies (no search; limit cap 100 -> 200, aggregate stats, `paymentStatus` filter where `cash` also matches rows without the field); `signOut({ callbackUrl: "/" })` |
| 2026-07-09 | `636e0b8` | feat: enhance admin and driver pages with improved data fetching and image handling | Inter via `next/font` (Google Fonts `@import` removed); `apps/web/lib/imageUrl.ts` Cloudinary thumbnail URLs; trimmed `select`s; `keepPreviousData`; deletes unused `app/page.module.css` |
| 2026-07-13 | `196db3b` | feat: implement recent days filter for supplies and driver logs, enhancing data retrieval | Admin `days` param (1-366; page 1 = the whole window up to 500 rows, later pages walk older rows) and `serialStart`; driver GET defaults to the last 5 days (limit 50 -> 200) with `?date=` for one day; `SUPPLIES_PAGE_LIMIT` 100 -> 50 |
| 2026-07-13 | `db4bea5` | feat: add customer history page with detailed view and filtering options | `/admin/customers/[id]` page, GET `/api/admin/customers/[id]`, `customer` param on the supplies API |
| 2026-07-13 | `41e8632` | feat: optimize supply and cash log fetching with conditional query execution | Created rows are populated in place instead of re-fetched; hooks take `enabled` so only the active tab queries |
| 2026-07-31 | `07835b7` | Refactor code structure for improved readability and maintainability | **M** Not a refactor: serial numbers restart at 1 per day (admin and driver lists), and the 173 KB binary `Royal-King-Water-Supply-System-Report.pdf` is added at the repo root (now stale, see §16) |
| 2026-07-31 | `a8fb281` | feat: add customer filter to supplies page and related queries | Customer dropdown filter on admin Deliveries (the API param came in `db4bea5`) |
| 2026-07-31 | `1ca3e0d` | chore: update package.json with overrides for postcss and sharp | **M** 48 files: deletes `apps/docs`, `packages/ui`, `models/Entry.ts`; removes `@repo/ui`, `zod`, `react-hook-form`; `next` 16.1.5 -> 16.2.12 with the only full lockfile refresh; root `overrides`; new `apps/web/lib/istTime.ts` and every day boundary moved from server-local / UTC to IST; ObjectId pre-casting for aggregates; `escapeHtml` in the print export; `hasVehicle` so drivers without a vehicle are not locked out; `images.unoptimized` |
| 2026-07-31 | `bc071a0` | feat: enhance export functionality to include detailed totals for delivered and taken back cans | Totals footer row (cans, taken back, amount) in the PNG and PDF exports |
| 2026-09-21 | `9f9f5a5` | feat: add PWA support with service worker, offline page, and icon generation script | `apps/web/app/manifest.ts`, `public/sw.js` (`VERSION` v1), `offline.html`, `PwaRegister`, `InstallPrompt`, icons with their generator and the `icons` script, `/sw.js` headers, viewport and theme colour; edits `apps/web/.env.example` and the app README |
| 2026-09-21 | `ded528d` | feat: implement new customers analytics feature with modal and API integration | GET `/api/admin/analytics/new-customers` (max 500; `addedBy` admin / driver / deleted-driver), shared `apps/web/lib/analyticsRange.ts`, modal on Analytics |
| 2026-09-22 | `6040156` | feat: add driver note preview and styling for supply log rows | Row highlight and one-line driver-note preview on admin Deliveries (`.supply-row-noted`, `.supply-note`) |
| 2026-09-22 | `6f579ca` | feat: enhance delivery management with product type differentiation | `SupplyLog.productType` (`can`, `case`) and `casesDelivered`; `Customer.cashPerCase`; `apps/web/lib/supplyProduct.ts`; `ProductPill`; product filter |
| 2026-09-22 | `c8787a5` | feat: implement Google Drive integration for exporting supply logs as Google Sheets | `apps/web/lib/csv.ts` (formula-injection guard, BOM), `apps/web/lib/googleDrive.ts` (browser token client, `drive.file` scope), unpaginated `fetchAllSupplies`, Download Sheet and Save to Google Drive buttons; `NEXT_PUBLIC_GOOGLE_CLIENT_ID` added to `turbo.json`; edits `apps/web/.env.example` and the app README |
| 2026-09-23 | `3e1ee58` | Refactor customer and supply handling to remove cashPerCase | Removes `Customer.cashPerCase`; adds `SupplyLog.caseSize` (300ml, 500ml, 1L, 2L) and `casePrice`; case amount = `casesDelivered x casePrice`, rounded to paise |
| 2026-09-24 | `e810079` | chore: update Node.js engine requirement to >=20.9 in package.json and package-lock.json | **M** The largest change in the repo (82 files, +3,559 / -4,237). Deletes assignments, supply points, the admin dashboard, eight API route files (see §7.9), models `Assignment` and `WaterSupplyPoint`, starter fonts and SVGs. Adds `lib/api.ts`, `lib/customers.ts`, `lib/format.ts`, `models/index.ts`, `StockModal`, `PaymentPill`, `useEscapeKey`, `exports.ts`, `vercel.json`. Auth hardening (constant-time compare, login throttle, 60 s deactivated-driver re-check, null-returning guards on every route); `ensureIndexes()` and the obsolete-index drop; 409 on deleting a driver or vehicle with ledger rows; vehicle uniqueness moved to `name` (a case-insensitive check in the routes, not a unique index); restore of soft-deleted customers; image cap 8 MB -> 4 MB; client dates in IST; service worker v2; `--webpack` dropped; both READMEs rewritten |
| 2026-09-24 | `f4240d4` | feat: display app version next to Sign Out in admin and driver layouts | `apps/web/next.config.js` reads the `package.json` version into `NEXT_PUBLIC_APP_VERSION`; label in both profile menus; version `0.1.0` -> `0.2.1` |
| 2026-09-24 | `3458651` | feat: enhance SuppliesPage with download menu and filter options | Four export buttons collapse into one "Download" menu; the filter card becomes a collapsible panel with an active-filter count; the Drive-not-configured text becomes "This feature is not available yet."; version `0.2.1` -> `0.2.2` |

### 18.5 Tried and removed

| Thing | Added | Removed / replaced | Reason (evidence, or "not recorded" + labelled inference) |
|---|---|---|---|
| `apps/docs` (starter Next.js app) and `packages/ui` (`@repo/ui`: Button, Card, Code) | `de1f1c6` | `1ca3e0d` | Commit body: "refactor: remove ui package and its components (Button, Card, Code)"; nothing is said about `apps/docs`. Fact: only `apps/docs` imported `@repo/ui`. Residue: `packages/eslint-config/react-internal.js` and `packages/typescript-config/react-library.json` have no consumer |
| `zod`, `react-hook-form` (dependencies of `web`) | `de1f1c6` | `1ca3e0d` | Not recorded. Fact: never imported by `apps/web` (checked at `de1f1c6` and `a8fb281`). Inference: unused. Validation is hand-written (see §6.10) |
| `Entry` model | `de1f1c6` | `1ca3e0d` | Not recorded. Fact: no file ever imported it. Whether an `entries` collection exists in the live database is unverified |
| `WaterSupplyPoint` model, `/admin/supply-points`, `/api/admin/supply-points` | `de1f1c6` | Driver upsert removed `4b79842`; files deleted `e810079` | Not recorded. Inference: customers replaced free-text supply points. Residue: `SupplyLog.pointName` is still read as a display fallback (see §10) |
| `Assignment` model, `/admin/assignments`, `/api/admin/assignments`, `/api/driver/assignments` | `de1f1c6` | `e810079` | Not recorded. Facts: never linked from the admin nav; the driver page never called its API. Inference: orphaned tanker-era feature |
| Admin dashboard at `/admin` and `/api/admin/stats` | Page `de1f1c6`; route `a5c19d6` | `e810079` | Comment: "There is no dashboard: nothing links to /admin and proxy.ts already sends signed-in admins to Analytics" (`apps/web/app/admin/page.tsx:3-4`). `/admin` now only redirects |
| "Amounts" workflow (the admin typed the amount for each pending supply) | `de1f1c6` | `f466fa5` (page rewritten as Analytics); hook `useAdminPendingSupplies` deleted `1ca3e0d` | Not recorded. Inference: replaced by auto-pricing in the same commit. Residue: the `/admin/amounts` slug, the dead `amountStatus` parameter (`apps/web/app/api/admin/supplies/route.ts:109-115`) and the `"added"` query key (see §9.7) |
| `/api/test`; `/api/db/ping` | `de1f1c6` | `a5c19d6`; `e810079` | Not recorded. Fact: both were unauthenticated database checks that returned the database error text. Inference: attack surface; do not re-add an unauthenticated health route |
| Driver edit / delete of own entries | Never existed | - | No commit ever gave drivers an edit or delete call. The only driver write to an existing entry was PATCH `/api/driver/supplies/[id]` (`de1f1c6` -> `e810079`): attach a bill photo once to an own cash entry, and no screen ever called it. Only the admin edits or deletes ledger rows |
| `Customer.cashPerCase` | `6f579ca` | `3e1ee58` | Commit body: "Removed cashPerCase ... Introduced caseSize and casePrice for case deliveries". Both commits shipped in PR #10, so it never reached `main` alone. The case price is typed per delivery |
| `images.remotePatterns` (Cloudinary host) | `a5c19d6` | `1ca3e0d` -> `images.unoptimized: true` | Comment: plain `<img>` tags are used, "so the /_next/image optimizer endpoint is pure attack surface — turn it off" (`apps/web/next.config.js:19-21`). Do not introduce `next/image` optimisation |
| `--webpack` flag on the `dev` script | `de1f1c6` | `e810079` | Not recorded, for the addition or the removal. Dev now runs Next's default bundler (`apps/web/package.json:7`) |
| `verify-final.txt`, `apps/web/app/page.module.css`, Geist font files, seven starter SVGs | `de1f1c6` | CSS `636e0b8`; the rest `e810079` | Text file, commit body: "remove verify-final.txt as it is no longer needed" (one line of counters). The others: not recorded; fact: never referenced by `apps/web` |
| Hard deletes: customers; drivers and vehicles that have ledger rows | `4b79842`; `de1f1c6` | `2e9a936` (customer soft delete); `e810079` (restore on re-registration; 409 for driver / vehicle) | Comments: re-registering restores "instead of failing on the unique index nobody can see past" (`apps/web/lib/customers.ts:1-4`); "The ledger keeps its driver attribution" (`apps/web/app/api/admin/drivers/[id]/route.ts:123-124`) |
| Unique index on `Vehicle.vehicleNumber` | `de1f1c6` | `e810079` | Comment: the field holds the model and "Two vehicles can share a model, so it carries no unique index" (`apps/web/models/Vehicle.ts:23-26`). The old index is dropped at runtime (`apps/web/lib/mongodb.ts:25-32`); rules: see §10 |
| Server-local and UTC day boundaries | `de1f1c6`, `92f0c12` | `1ca3e0d` -> `apps/web/lib/istTime.ts` | Comment: "Business days are IST days. The server may run in any timezone (usually UTC)" (`apps/web/lib/istTime.ts:1-4`) |
| 8 MB fuel-bill image limit | `de1f1c6` | `e810079` -> 4 MB | Comment: "Vercel refuses function request bodies over 4.5 MB, so stay under it." (`apps/web/app/api/driver/supplies/route.ts:21`) |
| `SessionProvider` in the root `Providers` | `de1f1c6` | `e810079` -> the two portal layouts | Comment: "so the home and login pages render without a session request" (`apps/web/app/providers.tsx:7-9`). A new top-level route that calls `useSession` needs its own provider |
| Per-route side-effect model imports | `f466fa5`, `082f8c5`, `1ca3e0d` | Superseded by `apps/web/models/index.ts` in `e810079` | Comment: avoids `MissingSchemaError` on "a fresh serverless instance" (`apps/web/models/index.ts:1-5`). Two redundant ones remain at `apps/web/app/api/admin/supplies/[id]/route.ts:20-21` |

### 18.6 Feature introduction map

| Feature (several in one row are in the same order as their commits) | Commit | Date |
|---|---|---|
| Customers: model, admin page and APIs, driver registration | `4b79842` | 2026-06-22 |
| Location type `both`; cans taken back | `d03c756`; `0b8b0b3` | 2026-06-22 |
| Auto-pricing (cans x rate); Analytics page and `/api/admin/analytics` | `f466fa5` | 2026-06-22 |
| Driver bottom tab bar; admin profile menu | `6b0c45c`; `a3f70dc` | 2026-06-22 |
| Daily odometer gate; vehicle detail page; registered ("Added") date | `92f0c12`; `ba4a0f3`; `a278d1b` | 2026-06-26 |
| Admin Add Delivery; in-app confirm dialogs; fuel-bill camera capture | `f6cd17b`; `b7161dc`; `54b681f` | 2026-06-29 |
| Customer soft delete (restore on re-registration came in `e810079`) | `2e9a936` | 2026-06-29 |
| Security deposit; payment status; stock | `e7057f4`; `f61febf`; `c1e6c7e` | 2026-06-29 |
| Server pagination and search; Cloudinary thumbnails and `next/font` | `8ab02c5`; `636e0b8` | 2026-07-09 |
| Recent-days window (5); customer history page | `196db3b`; `db4bea5` | 2026-07-13 |
| Per-day serial numbers; customer filter on Deliveries | `07835b7`; `a8fb281` | 2026-07-31 |
| IST business days on the server (client formatting came in `e810079`); export totals row | `1ca3e0d`; `bc071a0` | 2026-07-31 |
| PWA (manifest, service worker, offline page, install prompt); New Customers analytics | `9f9f5a5`; `ded528d` | 2026-09-21 |
| Driver-note preview; can/case products; CSV download and Save to Google Drive | `6040156`; `6f579ca`; `c8787a5` | 2026-09-22 |
| Case size and per-delivery case price | `3e1ee58` | 2026-09-23 |
| Login throttle, deactivated-driver cut-off, delete guards (409), `ensureIndexes()`, shared API helpers | `e810079` | 2026-09-24 |
| App version label; Download menu and collapsible filters | `f4240d4`; `3458651` | 2026-09-24 |

### 18.7 Working on more than one machine

- Fact (2026-10-11): the checkout on the machine where this handbook was written was STALE. Local `dev` was at `e849df9` (2026-06-22), 43 commits behind `origin/main` (31 work commits + the 12 merge commits); local `main` was at `a5c19d6`, 59 behind; `node_modules` matched the old lockfile. `git diff e849df9 c251bc4` is 128 files, +9,056 / -5,657. The handbook was therefore written from a read-only export of `c251bc4`, and nothing was pulled.
- Why it happens: work is done from more than one environment. History has two author identities (count only); the 18 commits up to `e849df9` carry +05:30 author timestamps and the 31 later ones UTC; `apps/web/next.config.js:14-18` and `apps/web/README.md:76` refer to GitHub Codespaces. That the later work was done in Codespaces is an inference (unverified).
- What a stale tree gets wrong: it still contains the removed routes and pages (see §7.9), server-local day boundaries instead of IST and a unique index on `Vehicle.vehicleNumber`, and has none of the auth hardening. Editing it reintroduces removed code or produces large conflicts, and the `file:line` references in this handbook do not match it.
- Rule: before reading or changing anything on any machine run `git fetch origin`, then `git status -sb` and `git rev-list --count HEAD..origin/dev`. If the count is not 0, stop: the owner pulls (agents never pull, commit or push unless asked, see §2), then `npm ci`, because `node_modules` still follows the old lockfile. `git merge-base --is-ancestor 3458651 HEAD` exiting 0 confirms the documented code is in the tree. Recommendation: push `dev` before leaving a machine so the next one can pull it.

## 19. Changelog

Newest first. Entries dated before 2026-10-11 were reconstructed from git (diffs, commit bodies and code comments) when this handbook was written; nobody recorded them at the time, so their "Why" and "Verified" lines say so. New entries use the template in §0.4.

### 2026-10-11 · dev (working tree, uncommitted) · Project handbook created
- **What:** `ROYALKINGADMIN.md`, `AGENTS.md` and `CLAUDE.md` (which contains only `@AGENTS.md`) added at the repo root, written from remote `main` @ `c251bc4`. No code changed.
- **Why:** a single source of truth for future developers and AI agents.
- **Verified:** baseline on an isolated copy of `c251bc4` (see §17): `npm ci`, `npm run lint`, `npm run check-types` and `npm run build` pass; `npx prettier --check` (59 of 67 files flagged with line endings ignored) and `npm audit --omit=dev` (1 critical + 3 high) do not. Every section was fact-checked against the code. Nothing was tested on a real device.
- **Follow-ups:** pull the stale local checkout before any work (see §18.7); open items are listed in §16.

### 2026-09-24 · main (PR #12) · Download menu and collapsible filters on Deliveries (0.2.2)
- **What:** commit `3458651`, merge `c251bc4`. In `apps/web/app/admin/supplies/page.tsx` the four export buttons became one "Download" menu (Download Photo, Download PDF, Download Sheet, Save to Google Drive); the always-visible filter card became a collapsible "Filter (n)" panel; the Drive-not-configured message changed from a setup hint naming the env var to "This feature is not available yet."; app version `0.2.1` -> `0.2.2`.
- **Why:** not recorded. Inference: a crowded toolbar on phones, and setup detail the admin cannot act on.
- **Verified:** not recorded (reconstructed from git).
- **Follow-ups:** `apps/web/README.md:62` and `apps/web/README.md:79` still describe the old buttons and message (see §16).

### 2026-09-24 · main (PR #11) · Hardening and cleanup refactor; app version label (0.2.1)
- **What:** commits `e810079`, `f4240d4`, merge `aa33019`; 82 files. Removed assignments, supply points, the admin dashboard and eight API route files (see §7.9). Added `apps/web/lib/api.ts`, `apps/web/lib/customers.ts`, `apps/web/lib/format.ts`, `apps/web/models/index.ts`, the shared `StockModal` and the lazy-loaded `apps/web/app/admin/supplies/exports.ts`. Login throttle, constant-time admin compare and a 60 s cut-off for deactivated drivers (`apps/web/lib/auth.ts`); `ensureIndexes()` and the drop of the old `vehicles.vehicleNumber_1` index (`apps/web/lib/mongodb.ts`); 409 when deleting a driver or vehicle that has ledger rows; restore of a soft-deleted customer on re-registration; image cap 8 MB -> 4 MB; client dates in IST; service worker `v2`; `apps/web/vercel.json` (region `bom1`); Node `>=20.9`; both READMEs rewritten; version label under Sign Out; version `0.1.0` -> `0.2.1`.
- **Why:** not recorded as a whole: the subject of `e810079` names only the Node engine bump. Individual reasons are in code comments, for example the 4 MB cap ("Vercel refuses function request bodies over 4.5 MB", `apps/web/app/api/driver/supplies/route.ts:21`) and the label ("so it is easy to tell which build a phone is running", `apps/web/next.config.js:3-4`).
- **Verified:** not recorded (reconstructed from git).
- **Follow-ups:** whether the old vehicle index was actually dropped in production, and whether installed apps picked up worker `v2`, are unverified (see §16).

### 2026-09-23 · main (PR #10) · Can and case products, sheet export and Google Drive, driver-note preview
- **What:** commits `6040156`, `6f579ca`, `c8787a5`, `3e1ee58`, merge `9933a3a`. `SupplyLog.productType` (`can`, `case`), `casesDelivered`, `caseSize` (300ml, 500ml, 1L, 2L) and `casePrice`, with shared rules in `apps/web/lib/supplyProduct.ts`; `Customer.cashPerCase` was added and removed again inside this PR; Download Sheet (`apps/web/lib/csv.ts`) and Save to Google Drive (`apps/web/lib/googleDrive.ts`, config key `NEXT_PUBLIC_GOOGLE_CLIENT_ID`); highlighted rows with a note preview on admin Deliveries.
- **Why:** not recorded; the body of `3e1ee58` only states the change ("Introduced caseSize and casePrice for case deliveries"). Inference: case prices vary per delivery, so a per-customer rate did not fit.
- **Verified:** not recorded (reconstructed from git).
- **Follow-ups:** the Google Cloud Console steps are in `apps/web/README.md:71-77`; whether they were carried out is unverified (see §14, §16).

### 2026-09-21 · main (PR #9) · Installable PWA and New Customers analytics
- **What:** commits `9f9f5a5`, `ded528d`, merge `9532b63`. `apps/web/app/manifest.ts`, `apps/web/public/sw.js` (`VERSION` `v1`), `apps/web/public/offline.html`, `PwaRegister`, `InstallPrompt`, icons and `npm run icons`, `/sw.js` response headers; GET `/api/admin/analytics/new-customers` with its dialog and the shared `apps/web/lib/analyticsRange.ts`.
- **Why:** not recorded in the commits. The service-worker header states the design goals: fast repeat opens "on weak mobile data", an offline page, and never touching `/api/*` or page HTML (`apps/web/public/sw.js:4-15`).
- **Verified:** not recorded (reconstructed from git).
- **Follow-ups:** install and update behaviour on real phones is unverified (see §11.8, §16).

### 2026-07-31 · main (PR #8) · Next.js 16.2.12, IST business days, starter cleanup, export totals
- **What:** commits `1ca3e0d`, `bc071a0`, merge `526a143`; 48 files. `next` `16.1.5` -> `16.2.12` with the only full lockfile refresh and the root `overrides` (`postcss`, `sharp`); new `apps/web/lib/istTime.ts`, with every day-boundary query moved from server-local or UTC time to IST; `apps/docs`, `packages/ui`, the `Entry` model, `zod` and `react-hook-form` removed; `images.unoptimized: true`; HTML escaping in the print export; drivers without a vehicle no longer blocked by the odometer gate; totals row in the PNG and PDF exports.
- **Why:** partly recorded in comments: "Business days are IST days. The server may run in any timezone (usually UTC)" (`apps/web/lib/istTime.ts:1-4`); the image optimizer endpoint "is pure attack surface" (`apps/web/next.config.js:19-21`). The upgrade and the overrides: not recorded (the subject mentions only the overrides).
- **Verified:** not recorded (reconstructed from git).
- **Follow-ups:** nobody can tell when the overrides are safe to remove (see §12.1, §16).

### 2026-07-31 · main (PR #7) · Per-day serial numbers, customer filter, system-report PDF
- **What:** commits `07835b7`, `a8fb281`, merge `0c7b1cb`. Serial numbers restart at 1 for each day in the admin and driver lists; customer dropdown filter on admin Deliveries; `Royal-King-Water-Supply-System-Report.pdf` added at the repo root.
- **Why:** not recorded (the subject of `07835b7` says only "Refactor code structure for improved readability and maintainability").
- **Verified:** not recorded (reconstructed from git).
- **Follow-ups:** the PDF is now stale and contradicts the code (see §16).

### 2026-07-13 · main (PR #6) · Five-day recent window and customer history page
- **What:** commits `196db3b`, `db4bea5`, `41e8632`, merge `f0a9986`. Admin lists default to a `days` window (page 1 = the last 5 days, up to 500 rows; later pages walk older rows); the driver list defaults to the last 5 days, with `?date=` for a single day; `/admin/customers/[id]` history page with GET `/api/admin/customers/[id]`; only the active tab queries.
- **Why:** not recorded. Inference: shorter lists and fewer requests on phones.
- **Verified:** not recorded (reconstructed from git).
- **Follow-ups:** `RECENT_DAYS` is declared in three files that must change together (see §20.1).

### 2026-07-10 · main (PR #5) · Server-side pagination and search, lighter images and font
- **What:** commits `082f8c5`, `8ab02c5`, `636e0b8`, merge `ec44b93`. Customers and supplies are paginated on the server (customers are also searched there), with aggregate stats; payment filter in which `cash` also matches rows without the field; Inter through `next/font` instead of a Google Fonts `@import`; Cloudinary thumbnail URLs (`apps/web/lib/imageUrl.ts`); a one-line fix so `populate("vehicle")` works.
- **Why:** not recorded in the commits. Comment in `apps/web/lib/imageUrl.ts:1-2`: "so lists and previews don't download the full-resolution original image".
- **Verified:** not recorded (reconstructed from git).
- **Follow-ups:** none recorded.

### 2026-06-29 · main (PR #4) · Admin add-delivery, soft delete, payment status, stock, camera capture
- **What:** commits `f6cd17b` to `c1e6c7e` (7), merge `9486b19`. Admin "Add Delivery" dialog and POST `/api/admin/supplies`; in-app confirm dialogs replace `window.confirm()` for customers, drivers and supply logs; customer DELETE becomes a soft delete (`isDeleted`); `Customer.securityDeposit`; separate Camera and Gallery inputs for the fuel bill; `SupplyLog.paymentStatus` (`cash`, `upi`, `not_paid`); `Stock` model and `/api/stock` with a dialog in both portals.
- **Why:** not recorded.
- **Verified:** not recorded (reconstructed from git).
- **Follow-ups:** none recorded.

### 2026-06-26 · main (PR #3) · Daily odometer, vehicle detail page, registered date
- **What:** commits `46d40eb`, `92f0c12`, `ba4a0f3`, `a278d1b`, `84f9a85`, merge `5ae49dd`. Odometer fields on `Vehicle`, GET/PATCH `/api/driver/vehicles/odometer` and the blocking daily dialog in the driver layout; `/admin/vehicles/[id]` page; `Customer.registeredDate`; customer PATCH `$unset`s cleared fields; the driver's customer picker shows the full name and phone.
- **Why:** not recorded.
- **Verified:** not recorded (reconstructed from git).
- **Follow-ups:** none recorded.

### 2026-06-22 · main (PR #1, PR #2) · Pivot to customer can deliveries, Analytics page, API error handling
- **What:** PR #1 = 15 commits `4b79842` to `a3f70dc`, merge `af4ef4d`; PR #2 = commit `e849df9`, merge `b9c91f4`, 16 minutes later. `Customer` model with an admin page, APIs and driver registration; deliveries recorded per customer with `cansDelivered` and `cansTakenBack`; location type `both`; auto-pricing `cansDelivered x cashPerCan`; the Amounts page rewritten as Analytics (URL `/admin/amounts` kept) with `/api/admin/analytics` and filters; bottom tab bar for drivers; admin profile dropdown. PR #2: try/catch and 500 in the list APIs, API errors shown on admin pages, dead CSS and schema hacks removed.
- **Why:** not recorded. Inference: the product was repurposed from tanker supply points to can deliveries to customers.
- **Verified:** not recorded (reconstructed from git).
- **Follow-ups:** none recorded.

### 2026-06-15 · main (direct commits, before the PR flow) · Initial import
- **What:** `de1f1c6` (2026-06-15, 104 files): the create-turbo starter together with an already-working tanker water-supply app (admin dashboard, amounts, assignments, supply points, drivers, vehicles and supplies pages; driver portal; next-auth; Cloudinary upload; PNG and print-PDF export). `a5c19d6` (2026-06-22): error boundaries and a 404 page, `/api/admin/stats`, Mongoose connection options, bcrypt cost 12, security headers; `/api/test` removed.
- **Why:** not recorded. The first commit already contained a working app, so earlier history is not in this repository.
- **Verified:** not recorded (reconstructed from git).
- **Follow-ups:** none recorded.

## 20. Glossary

### 20.1 Domain terms

| Term | Meaning | Where it appears |
|---|---|---|
| Can | The main product: a 20-litre water can. Stored as `productType: "can"`; a water row with no `productType` is also a can | `README.md:3`; `apps/web/lib/supplyProduct.ts:15-18`; `apps/web/models/SupplyLog.ts:61-66` |
| Case, case size | A case of bottled water (`productType: "case"`). Bottle sizes are `300ml`, `500ml`, `1L`, `2L` (`CASE_SIZES`), stored exactly as written | `apps/web/lib/supplyProduct.ts:20-22`; `apps/web/models/SupplyLog.ts:49-51` |
| Cans taken back | Cans collected from the customer on a can delivery (`cansTakenBack`). Optional; a row may hold only this number (a pickup); it never affects the amount | `apps/web/models/SupplyLog.ts:48`; `apps/web/lib/supplyProduct.ts:95-103` |
| Delivery / supply | The same thing: one water row (`logType: "water"`). The UI says "Deliveries" (admin) and "Supply" (driver tab); the model, URLs and API paths say "supply" / "supplies" | `apps/web/app/admin/layout.tsx:22-23`; `apps/web/app/driver/page.tsx:839` |
| Supply log / ledger | The `SupplyLog` collection: every delivery AND every cash credit, one document each. Comments and READMEs call it "the ledger" | `apps/web/models/SupplyLog.ts:31-77`; `apps/web/README.md:25` |
| Cash credit | UI name for a `logType: "cash"` row: an amount a driver logs, typed `debit` or `fuel`. It has no customer, product or payment status. It does NOT mean "paid in cash" (see Payment status) | `apps/web/app/admin/supplies/page.tsx:791`; `apps/web/app/driver/page.tsx:1129` |
| Debit | `cashType: "debit"`: a cash credit that is not a fuel purchase. The code does not define the business meaning further (unverified). Default type in the admin edit dialog | `apps/web/models/SupplyLog.ts:67-70`; `apps/web/app/admin/supplies/page.tsx:305` |
| Fuel entry | `cashType: "fuel"`: a fuel expense. The bill photo is mandatory when a driver logs one ("Fuel bill image is required for fuel entries."); the admin API does not ask for it. Default type in the driver form | `apps/web/app/api/driver/supplies/route.ts:174`; `apps/web/app/driver/page.tsx:436` |
| Bill photo | Photo of a fuel bill attached to a cash credit, stored on Cloudinary; the row keeps `billImageUrl` and `billImagePublicId`. Limit 4 MB | `apps/web/models/SupplyLog.ts:73-74`; `apps/web/app/api/driver/supplies/route.ts:21-22` |
| Amount, pending amount | `amount` is the rupee value of a row. "Pending" is a water row with no `amount` field, shown as "-"; it happens when auto-pricing lacks a factor. It is an API word only (`amountStatus=pending`); no screen says "pending" | `apps/web/lib/supplyProduct.ts:116-130`; `apps/web/app/api/admin/supplies/route.ts:109-110`; `apps/web/app/admin/supplies/page.tsx:200` |
| Payment status | How a delivery was paid: `cash`, `upi` or `not_paid` (really the payment method). Water rows only; a missing value counts as Cash | `apps/web/models/SupplyLog.ts:71`; `apps/web/app/components/PaymentPill.tsx:1-8` |
| Subscription cans | `Customer.subscriptionCans`: cans per day the customer normally takes (default 1, minimum 1). Display only: not used for pricing and not pre-filled into the delivery form. Driver registration always stores 1 | `apps/web/models/Customer.ts:29`; `apps/web/app/driver/page.tsx:936`; `apps/web/app/api/driver/customers/route.ts:57` |
| Cash per can | `Customer.cashPerCan`: rupees per can for that customer; the only rate used to auto-price can deliveries. Optional for the admin, required when a driver registers a customer | `apps/web/models/Customer.ts:30`; `apps/web/lib/supplyProduct.ts:127-129`; `apps/web/app/api/driver/customers/route.ts:43` |
| Case price | `SupplyLog.casePrice`: rupees for one case, typed with each delivery (label "Price per Case"); amount = `casesDelivered x casePrice`. There is no per-customer case rate | `apps/web/models/SupplyLog.ts:13-14`; `apps/web/lib/supplyProduct.ts:123-126` |
| Security deposit | `Customer.securityDeposit`: rupees, entered by the admin only and shown on the customer screens; no calculation uses it | `apps/web/models/Customer.ts:31`; `apps/web/app/admin/customers/page.tsx:466` |
| Location type | `Customer.locationType`: `home`, `office` or `both`. `both` gives two entries in the driver's customer picker, but the choice is not stored on the delivery | `apps/web/models/Customer.ts:28`; `apps/web/app/driver/page.tsx:548-564` |
| Location vs area | "Location" is the UI word for `Customer.address` (required at registration). `area` is a separate free-text field set by the admin; it feeds the area filter | `apps/web/models/Customer.ts:26-27`, `:41`; `apps/web/app/api/driver/customers/route.ts:42` |
| Registered date vs created date | `registeredDate` is the admin-editable "Added Date" (defaults to now). `createdAt` is the automatic timestamp; New Customers analytics count by `createdAt`, not by the Added Date | `apps/web/models/Customer.ts:34`; `apps/web/app/admin/customers/page.tsx:470`; `apps/web/lib/analyticsRange.ts:53-58` |
| Stock | One shared document with three hand-entered counters: `cans`, `dispensers`, `stands`. The admin and every driver can read and change it; deliveries never change it | `apps/web/models/Stock.ts:14-16`; `apps/web/app/api/stock/route.ts:9-14` |
| Odometer gate | The blocking dialog a driver gets when the app loads until today's reading is entered for the assigned vehicle. One reading per vehicle per IST day; skipped when no vehicle is assigned | `apps/web/app/driver/layout.tsx:65`; `apps/web/app/api/driver/vehicles/odometer/route.ts:24-39`, `:75-98` |
| Serial number | Display-only row number (`serialNo`) that restarts at 1 for each IST day in the admin and driver lists. Not stored. The customer history page numbers continuously instead | `apps/web/app/admin/supplies/page.tsx:452-458`; `apps/web/app/driver/page.tsx:212-220`; `apps/web/app/admin/customers/[id]/page.tsx:52` |
| Recent-days window | Default list range: today plus the 4 previous IST days. `RECENT_DAYS = 5` is declared three times and must be changed in all three | `apps/web/app/admin/supplies/page.tsx:49`; `apps/web/app/api/driver/supplies/route.ts:25`; `apps/web/app/driver/page.tsx:169` |
| IST day | The business day: midnight to midnight at UTC+05:30, whatever timezone the server or the phone uses | `apps/web/lib/istTime.ts:1-18`; `apps/web/lib/format.ts:1-9` |
| Soft delete / restore | Deleting a customer sets `isDeleted: true, isActive: false`; the document stays. Registering the same phone again restores it in place. Customers only: nothing else is soft-deleted | `apps/web/app/api/admin/customers/[id]/route.ts:155`; `apps/web/lib/customers.ts:57-73` |
| Deactivate / disable | `isActive: false` on a driver or vehicle: the record and its ledger history stay. It is what the API tells the admin to do instead of deleting a driver or vehicle that has ledger rows (409) | `apps/web/app/api/admin/drivers/[id]/route.ts:123-126`; `apps/web/app/api/admin/vehicles/[id]/route.ts:142` |
| Default vehicle | `User.assignedVehicle`: the vehicle pre-selected in that driver's delivery form and the one the odometer gate asks about. Optional | `apps/web/models/User.ts:29-33`; `apps/web/app/admin/drivers/page.tsx:216` |
| Driver note vs admin remark | `notes` is written by the driver; `adminRemark` only by the admin, and it is left out of every driver list | `apps/web/models/SupplyLog.ts:16`, `:24`; `apps/web/app/api/driver/supplies/route.ts:26-27` |
| Legacy row | A document written before a field existed: a ledger row with no `productType` (reads as can) or no `paymentStatus` (counts as cash), or a tanker-era row with `pointName` and no customer. Queries filter with `$ne` / `$nin` and reads apply defaults. Policy: "Never change that with a migration." | `apps/web/README.md:31`; `apps/web/lib/supplyProduct.ts:15-18`; `apps/web/models/SupplyLog.ts:46` |

### 20.2 Technical terms

| Term | Meaning | Where it appears |
|---|---|---|
| `proxy.ts` | The Next.js 16 file name for middleware. Here it is next-auth `withAuth`: it redirects signed-in users away from `/` and `/login` and keeps `/admin` and `/driver` role-gated. Its matcher does not cover `/api/*` | `apps/web/proxy.ts:1-37` |
| Route handler | A `route.ts` file under `apps/web/app/api/` that exports `GET`, `POST`, `PATCH` or `DELETE`. There are 16 | see §7 |
| Guard | `requireAdmin()` / `requireDriver()`: return the session user or `null` (they do not throw or respond), so each handler must answer `null` with `unauthorized()`. `/api/stock` has its own `requireAnyRole()` | `apps/web/lib/authHelpers.ts:16-26`; `apps/web/lib/api.ts:10-12`; `apps/web/app/api/stock/route.ts:11-14` |
| Role-stripped token | A driver's JWT after that driver was deactivated or deleted: the `jwt` callback deletes `role` and `id`, so the proxy and every guard treat the session as signed out. Re-checked at most once every 60 s | `apps/web/lib/auth.ts:72-92`, `:201-208` |
| JWT session | next-auth `session.strategy: "jwt"`: the session lives in a signed cookie; no session collection exists in the database | `apps/web/lib/auth.ts:229-231` |
| Admin session id | The admin is not a database user; its session `id` is a fixed non-ObjectId string. Code that treats a session id as an ObjectId must allow for it (`createdBy` is stored only for valid ObjectIds) | `apps/web/lib/auth.ts:154-159`; `apps/web/lib/customers.ts:49` |
| App Router | Next.js file-based routing under `apps/web/app/` (`page.tsx`, `layout.tsx`, `error.tsx`, `route.ts`). There is no `pages/` directory | `apps/web/README.md:3` |
| Client component | A file whose first line is `"use client"`; it runs in the browser. Every page and layout is one except `app/layout.tsx`, `app/admin/page.tsx` and `app/not-found.tsx`. There are no server actions | e.g. `apps/web/app/providers.tsx:1` |
| React Query key | The array that names a cached query, e.g. `["admin", "supplies", "added", filters, page]`. Invalidating the prefix `["admin", "supplies"]` refetches every list under it. Full table: see §6.4 | `apps/web/app/hooks/useAdminQueries.ts:245`, `:256` |
| Service worker `VERSION` | String constant that names the worker's only cache (`rk-static-v2`). Changing it is what makes open apps show "A new version of the app is ready." It is not the app version (see §18.2) | `apps/web/public/sw.js:17-23` |
| PWA / standalone | Progressive Web App: the site installed to a home screen. `display: "standalone"` makes the installed app open "full-screen with the Royal King icon" (README; real-device behaviour unverified, see §11.8); the install card hides itself when the page already runs standalone | `apps/web/app/manifest.ts:15`; `apps/web/README.md:38`; `apps/web/app/components/InstallPrompt.tsx:16-19` |
| Manifest shortcut | Long-press entry on the installed icon: "Log delivery" -> `/driver`, "Deliveries" -> `/admin/supplies`. A user with the wrong role is sent to `/login` by the proxy | `apps/web/app/manifest.ts:24-38` |
| `.lean()` | Mongoose query modifier that returns plain objects instead of Mongoose documents; schema defaults and document methods are then not applied to the result (library behaviour, unverified here). Used on almost every read (34 call sites) | e.g. `apps/web/lib/customers.ts:54` |
| `returnDocument: "after"` | Option on `findOneAndUpdate` / `findByIdAndUpdate` that returns the document as it is after the update. The code uses it at all 8 call sites and never `{ new: true }`, which it replaced in `e810079` | e.g. `apps/web/lib/customers.ts:70` |
| `bufferCommands: false` | Mongoose connect option: model calls are not queued until a connection exists (library behaviour, unverified here), so every handler calls `connectToDatabase()` first. The code comment adds that the automatic index build then "fails silently" | `apps/web/lib/mongodb.ts:46-52`, `:78` |
| `ensureIndexes()` | A local function (not the Mongoose method of that name) that calls `createIndexes()` once per process for every registered model, in the background. It only adds missing indexes and only logs a failure | `apps/web/lib/mongodb.ts:53-66` |
| Obsolete unique index | An index an older schema declared that the current one must not have. Removing `unique` from a schema does not remove the index in MongoDB, so its name is listed in `OBSOLETE_UNIQUE_INDEXES` and dropped at runtime while it is still unique. Today: `vehicles.vehicleNumber_1` | `apps/web/lib/mongodb.ts:25-44` |
| Duplicate key (11000) | MongoDB's error code for a unique-index violation; routes turn it into HTTP 409 | `apps/web/lib/customers.ts:29-31`; `apps/web/app/api/admin/vehicles/route.ts:55-57` |
| `globalEnv` | Turborepo's list of environment-variable names (8 here) that every task depends on. The lint rule `turbo/no-undeclared-env-vars` reports a `process.env.X` that is not declared, so add every new variable here (see §12.2) | `turbo.json:4-13`; `packages/eslint-config/base.js:20-22` |
| only-warn | `eslint-plugin-only-warn` reports every rule violation as a warning; `eslint --max-warnings 0` then makes any warning fail `npm run lint`. So there is no "harmless warning" (see §12.3) | `packages/eslint-config/base.js:24-28`; `apps/web/package.json:10` |
| Turbopack | Next.js's bundler. Nothing in the repo selects a bundler; the baseline `next build` reported Turbopack (see §17), and the `--webpack` flag was removed from the `dev` script in `e810079`. Not Turborepo (`turbo`), which is the task runner | `apps/web/package.json:7-8` |
| `bom1` | The Vercel region id set for the app; Mumbai (platform naming, unverified in the repo) | `apps/web/vercel.json:3` |
| typegen | `next typegen`, the first half of `npm run check-types`: "Next.js route typegen followed by `tsc --noEmit`". `.next/` and `next-env.d.ts` are git-ignored, so a clean checkout has no generated types until it runs (what exactly it emits: unverified) | `apps/web/package.json:11`; `README.md:27`; `apps/web/.gitignore:13`, `:37` |
| Overrides | npm `overrides` in the root `package.json`: force the version of a transitive dependency for the whole workspace. Two exist (`postcss`, `sharp`); the repo has no other patching mechanism (see §12.1) | `package.json:24-27` |
| The "amounts" page | `/admin/amounts` is the Analytics page and the admin landing page; the name survives from the removed Amounts workflow (see §18.5) | `apps/web/app/admin/amounts/page.tsx:718`; `apps/web/proxy.ts:11` |
| `Vehicle.name` vs `vehicleNumber` | Inverted names: `name` holds the registration number (UI label "Number"); `vehicleNumber` holds the model (UI label "Model") and is deliberately not unique | `apps/web/models/Vehicle.ts:23-28`; `apps/web/app/admin/vehicles/page.tsx:85`, `:96` |
