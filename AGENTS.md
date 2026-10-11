# AGENTS.md — Royal King Water Supply (`royalkingadmin`)

The project handbook is [ROYALKINGADMIN.md](ROYALKINGADMIN.md). It is the single source of truth for this repository.

## Before you start

1. Read handbook sections 0-4 (how to use it, snapshot, golden rules, product, stack). Then read the section for the area you will touch; the table of contents is at the top.
2. Follow the golden rules in section 2. If a rule and your task conflict, stop and ask the owner.
3. Check that the checkout is current: `git status -sb` and `git ls-remote --heads origin`. This repository is worked on from more than one machine. If the local branch is behind, tell the owner; do not pull unless asked.
4. If the handbook and the code disagree, the code wins. Fix the handbook as part of your change.

## After every change

A change is not done until these are done (details in handbook section 0.3):

1. Add a changelog entry at the top of section 19, using the template in section 0.4.
2. Fix every handbook section the change made stale (map in section 0.5).
3. Update the open-items list in section 16: move resolved items to 16.7, add new ones with new IDs, never reuse an ID.
4. Bump the "Last updated" line at the top of the handbook (date · branch · commit).

## Never

- Never open, print or copy `.env` files, keystores, private keys, service-account JSON or similar. Never write secret values or personal data (names, emails, phone numbers, credentials) into code, comments, docs, logs or commit messages. Name the config key and say where the secret lives; for a hard-coded secret give `file:line` and its type only.
- Never run scripts, seeds or tests against the database in `MONGODB_URI` unless the owner confirms it is a throwaway database. It can be the live one.
- Never commit, push, pull, merge or rebase unless the owner asks. The owner reviews and commits.
- Never run `npm run format` inside an unrelated change. There is no Prettier config, so it rewrites most source files.

## Checks

`npm run lint`, `npm run check-types` and `npm run build` (from the repo root) must pass before you call a change done. There are no automated tests. Mark anything you did not try on a real phone as "unverified".
