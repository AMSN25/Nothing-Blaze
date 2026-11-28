# CineBlaze

A Nothing-inspired film & series discovery platform. Browse, rate, and track films and series powered by [TMDB](https://www.themoviedb.org/), with [Supabase](https://supabase.com/) backing auth, watchlists, lists, ratings, and viewing history.

> Live demo: [ntblaze.netlify.app](https://ntblaze.netlify.app) · Repo: [github.com/AMSN25/Nothing-Blaze](https://github.com/AMSN25/Nothing-Blaze)

---

## Features

### Discovery
- **Home** — hero carousel, trending titles, mood-based grid, category rows (Movies, Web Series, Anime), editorial focus, stats, newsletter
- **Films / Series / Anime** — filterable, sortable catalogues with genre chips, provider filters, sort options, pagination
- **People** — popular actors/directors with profile pages and filmography
- **Search** — global search overlay (`Cmd+K` / `/`) with instant results
- **Platforms** — streaming service directory with region support

### Title details
- Metadata (poster, backdrop, rating, runtime, genres, tagline, overview, status, language, vote count), cast, seasons & episodes (TV), similar titles
- **Ratings & reviews** — public read, own-write (1–10 with written reviews and aggregate score)
- **Continue Watching** — resume from viewing history with progress tracking

### User (Supabase-backed)
- Email/password auth + profile (name, email, avatar)
- **Watchlist** — guests use localStorage; signed-in users sync to Supabase
- **Custom lists** — create, rename, delete, add/remove titles, drag-to-reorder
- **Viewing history** — auto-recorded on playback, with estimated progress
- **Admin panel** — account overview, per-user list/history counts, maintenance toggle
- **Maintenance mode** — non-admins see a maintenance page; admins bypass; `/login` and `/signup` stay reachable

### Playback
- Embedded player with season/episode selector for series
- Progress tracked (wall-clock time vs. runtime) and saved on interval, tab-hide, and close
- Resume via `?resume=s1e2` deep link

---

## Tech stack

| Layer | Choice |
|---|---|
| Framework | React 19 + TypeScript |
| Build | Vite 8 (rolldown) |
| Routing | React Router 7 |
| Styling | Single design-system stylesheet (`src/index.css`) — Nothing-inspired, dark-only |
| Icons | lucide-react |
| Auth & data | Supabase (Auth + Postgres + RLS) |
| Catalogue | TMDB API |
| Lint | oxlint |
| Desktop (optional) | Tauri 2 |

---

## Quick start

### Prerequisites
- Node.js 20+
- A [Supabase](https://supabase.com/) project
- A [TMDB](https://www.themoviedb.org/settings/api) API key

### Setup

```bash
git clone https://github.com/AMSN25/Nothing-Blaze.git
cd Nothing-Blaze
npm install
cp .env.example .env
# fill in VITE_TMDB_API_KEY, VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY
npm run dev
```

Dev server runs on `http://localhost:3000` (or `3100` depending on how you start it).

---

## Environment variables

| Variable | Description |
|---|---|
| `VITE_TMDB_API_KEY` | TMDB API key (v3) |
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase publishable/anon key (never the `service_role` key) |

See `.env.example` for placeholders. Never commit `.env`.

---

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Vite dev server |
| `npm run build` | TypeScript check + production build → `dist/` |
| `npm run lint` | oxlint |
| `npm run preview` | Preview the production build |
| `npm run tauri:build` | Desktop app (Tauri) |

---

## Project structure

```
src/
├── components/       # Reusable UI (Nav, Hero, PosterCard, Player, SearchOverlay, …)
├── pages/            # Route-level screens
├── context/          # AuthContext, WatchlistProvider, MockStoreContext
├── hooks/            # useAsync, useWatchlist
├── lib/              # tmdb, supabase, supabaseData, streaming, maintenance, …
├── index.css         # Complete design system
└── App.tsx           # Routes + providers

supabase/
├── config.jsonc
└── migrations/       # Schema, RLS, ratings, watch progress
```

---

## Supabase setup

1. Create a Supabase project and grab the URL + anon key into `.env`.
2. Link the CLI: `npx supabase link --project-ref <your-ref>`
3. Push migrations: `npx supabase db push --remote`
4. (Optional) seed demo admin: `admin@cineblaze.com` / `password` is seeded by `20261128000000_initial_schema.sql`.

### Schema

Tables: `profiles`, `watchlist`, `lists`, `list_items`, `ratings`, `watch_history`, `site_settings`.

- RLS enabled on all tables; ratings are publicly readable, writes are own-only.
- `profiles` auto-created via trigger on signup; admin role set by email.
- Maintenance state lives in `site_settings` (key `maintenance`).

---

## Deployment

The build output is a static SPA in `dist/` — deployable to any static host.

- **Coolify (self-hosted, recommended):** static-site resource, build command `npm run build`, publish dir `dist`, set the three `VITE_*` env vars, add your domain for auto-HTTPS.
- **Any static host (Vercel, Netlify, Cloudflare Pages, GitHub Pages):** standard Vite SPA — ensure `/* → /index.html` fallback (see `public/_redirects`).

> Note: Netlify's free tier credit limit can block deploys; see [Coolify](https://coolify.io) for a self-hosted alternative.

---

## Known limitations

- Progress tracking is an estimate (wall-clock time vs. runtime) because embedded sources expose no `currentTime`.
- No test suite configured.
- Client-only SPA (no SSR).
- Dark theme only.

---

## License

No license file is currently included. Add one before distributing.
