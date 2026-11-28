<div align="center">

# ◈ CINEBLAZE ◈

### *A Nothing-inspired film & series discovery platform.*

[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=white)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Vite](https://img.shields.io/badge/Vite-8-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev)
[![Supabase](https://img.shields.io/badge/Supabase-Auth%20%2B%20DB-3FCF8E?style=flat-square&logo=supabase&logoColor=white)](https://supabase.com)
[![TMDB](https://img.shields.io/badge/TMDB-Catalogue-01B4E4?style=flat-square&logo=themoviedatabase&logoColor=white)](https://www.themoviedb.org)
[![License](https://img.shields.io/badge/License-MIT-black?style=flat-square)](#license)

<br>

*Browse. Rate. Track. Resume.*

<br>

</div>

---

## ✦ What is CineBlaze?

A dark, minimal, **Nothing-inspired** discovery platform for films and series. Powered by the TMDB catalogue, backed by Supabase for real auth, watchlists, lists, ratings, and viewing history — all wrapped in a single-file design system that breathes.

> Built for people who want their movie app to feel like a piece of hardware.

---

## ✦ Features

<table>
<tr>
<td width="50%">

### 🔍 Discovery
- Hero carousel + trending
- Mood-based discovery grid
- Films / Series / Anime catalogues
- Genre, sort & provider filters
- People directory + filmography
- Global search (`⌘K` / `/`)
- Platforms by region

</td>
<td width="50%">

### 🎬 Title details
- Rich metadata & cast
- Seasons & episodes (TV)
- Similar titles
- Ratings & reviews (public read)
- Continue Watching with resume
- Embedded player

</td>
</tr>
<tr>
<td width="50%">

### 👤 User (Supabase)
- Email/password auth
- Profile management
- Watchlist (guest → localStorage, signed-in → Supabase)
- Custom lists with drag-reorder
- Viewing history + progress
- Admin panel & maintenance mode

</td>
<td width="50%">

### ⚡ Under the hood
- React 19 + TypeScript
- Vite 8 (rolldown)
- React Router 7
- Single design system (`index.css`)
- RLS-secured Postgres
- TMDB API client with LRU cache
- oxlint

</td>
</tr>
</table>

---

## ✦ Quick start

```bash
git clone https://github.com/AMSN25/Nothing-Blaze.git
cd Nothing-Blaze
npm install
cp .env.example .env   # add your keys
npm run dev
```

Open **http://localhost:3000** and start exploring.

---

## ✦ Environment

| Variable | What it is |
|---|---|
| `VITE_TMDB_API_KEY` | TMDB v3 API key |
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase publishable key *(never the service_role key)* |

---

## ✦ Scripts

```bash
npm run dev        # dev server
npm run build      # type-check + production build → dist/
npm run lint       # oxlint
npm run preview    # preview production build
npm run tauri:build # desktop app (Tauri)
```

---

## ✦ Architecture

```
src/
├── components/     # Nav, Hero, PosterCard, Player, SearchOverlay, …
├── pages/          # Home, Details, Browse, People, Profile, Admin, …
├── context/        # AuthContext, WatchlistProvider, MockStoreContext
├── hooks/          # useAsync, useWatchlist
├── lib/            # tmdb, supabase, supabaseData, streaming, maintenance
├── index.css       # the entire design system
└── App.tsx         # routes + providers

supabase/
├── config.jsonc
└── migrations/     # schema · RLS · ratings · watch progress
```

### Data flow

```
TMDB API ──► tmdb.ts (LRU cache) ──► useAsync ──► pages
                                              │
                                              ▼
                              React Context (Auth · Watchlist · Store)
                                              │
                                              ▼
                              Supabase (signed-in) · localStorage (guest)
```

---

## ✦ Supabase setup

1. Create a Supabase project → copy URL + anon key into `.env`
2. Link: `npx supabase link --project-ref <ref>`
3. Push schema: `npx supabase db push --remote`

**Tables:** `profiles` · `watchlist` · `lists` · `list_items` · `ratings` · `watch_history` · `site_settings`

- RLS on every table; ratings are public-read, writes are own-only
- `profiles` auto-created on signup via trigger
- Maintenance state lives in `site_settings (key = 'maintenance')`
- Demo admin: `admin@cineblaze.com` / `password` (seeded in `20261128000000_initial_schema.sql`)

---

## ✦ Deployment

Static SPA output in `dist/` — works on any static host.

- **Coolify (self-hosted):** static-site resource · build `npm run build` · publish `dist` · set `VITE_*` env vars · add domain for auto-HTTPS
- **Vercel / Netlify / Cloudflare Pages / GitHub Pages:** standard Vite SPA — ensure `/* → /index.html` fallback

---

## ✦ Known limitations

- Progress tracking is an estimate (wall-clock vs. runtime — embedded sources expose no `currentTime`)
- No test suite yet
- Client-only SPA (no SSR)
- Dark theme only

---

## ✦ Roadmap

- [ ] Real streaming integration (JustWatch)
- [ ] Image optimization (Cloudinary/Imgix)
- [ ] PWA manifest + service worker
- [ ] Dark/light theme toggle
- [ ] Unit & E2E tests (Vitest + Playwright)

---

<div align="center">

**Made with ☕ and a lot of black pixels.**

*Nothing-inspired. Everything functional.*

</div>
