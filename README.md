# HiredTogether

Track your job search, and your squad's, in one place. Log applications, watch your pipeline move from applied → interview → offer, and see how your friends are doing without prying into their private notes.

## Stack

- **Frontend**: Vite + React + TypeScript + Tailwind CSS
- **API**: Cloudflare Pages Functions (`functions/api/**`)
- **Database**: Cloudflare D1 (SQLite)
- **Auth**: email/password, PBKDF2-hashed, session cookie stored in D1 (no third-party auth provider)

## Local development

```bash
npm install
npx wrangler d1 execute hired-together-db --local --file=schema.sql
npx wrangler pages dev dist --port 8788   # after npm run build, serves API + static build
```

Or run `npm run dev` for the Vite dev server (proxies `/api` to `localhost:8788`) alongside `wrangler pages dev` in a second terminal.

## Deploy

```bash
npm run deploy
```

Requires `wrangler` to be authenticated (`npx wrangler login`) and the `hired-together-db` D1 database to exist (`npx wrangler d1 create hired-together-db`, then apply `schema.sql` with `--remote`).

## Features

- **My Search** — dashboard with stage counts, pipeline balance bar, filterable application list, add/edit/delete
- **Squad** — create or join a squad with an invite code, see every member's aggregate stage counts side by side (no private notes shared)
