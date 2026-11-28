# CineBlaze — Project Overview

A Nothing-inspired film & series discovery platform built with React 19, TypeScript, Vite, and TMDB API.

---

## Core Features

### Discovery & Browsing
- **Home**: Hero carousel with trending titles, mood-based grid, category sections (Movies, Web Series, Anime), editorial focus, stats, newsletter
- **Films / Series / Anime**: Filterable, sortable catalogues with genre chips, provider filters, sort options, pagination
- **People**: Popular actors/directors with profile pages and filmography
- **Search**: Global search overlay (Cmd+K / /) with instant results
- **Platforms**: Streaming service directory with region support

### Title Details
- **Metadata**: Poster, backdrop, rating, runtime, genres, tagline, overview, status, language, vote count
- **Cast**: Horizontal scrollable cast list with character names
- **Seasons & Episodes** (TV): Season pills, episode list with air dates, ratings, play actions
- **Similar Titles**: "More Like This" row
- **Ratings & Reviews**: Local user ratings (1–10), written reviews, aggregate score

### User Features
- **Authentication**: Email/password signup & login (localStorage, no backend)
- **Watchlist**: Add/remove titles, persists per user
- **Custom Lists**: Create named lists, add titles, manage items
- **Viewing History**: Auto-recorded when playing
- **Profile**: Avatar, name, email, manage lists
- **Admin Panel**: Basic user/content management (role-gated)

### Playback
- **Embedded Player**: iframe-based with season/episode selector for series
- **Continue Watching**: Resume from history

---

## Technical Architecture

```
src/
├── components/       # Reusable UI components
│   ├── Nav.tsx           # Top navigation + mobile menu
│   ├── Footer.tsx        # Site footer with links
│   ├── Hero.tsx          # Hero carousel with trending
│   ├── PosterCard.tsx    # Title card (grid)
│   ├── MoodGrid.tsx      # Mood-based discovery cards
│   ├── TitleRow.tsx      # Horizontal scrolling row
│   ├── Player.tsx        # Embedded video player
│   ├── SearchOverlay.tsx # Global search modal
│   └── ...
├── pages/            # Route-level components
│   ├── Home.tsx
│   ├── Details.tsx       # Title detail page
│   ├── Browse.tsx        # Films/Series/Anime catalogues
│   ├── People.tsx
│   ├── Person.tsx
│   ├── Platforms.tsx
│   ├── Watchlist.tsx
│   ├── Lists.tsx / ListDetail.tsx
│   ├── Profile.tsx
│   ├── Login.tsx / Signup.tsx
│   └── Admin.tsx
├── context/          # React Context providers
│   ├── AuthContext.tsx       # User auth state
│   ├── WatchlistProvider.tsx # Watchlist state
│   └── MockStoreContext.tsx  # Lists, history, ratings
├── hooks/            # Custom hooks
│   ├── useAsync.ts      # Async data fetching with loading/error
│   └── useWatchlist.ts  # Watchlist actions
├── lib/              # External API & utilities
│   ├── tmdb.ts          # TMDB API client with caching
│   ├── streaming.ts     # Provider mapping
│   ├── moods.ts         # Mood categories
│   ├── localAuth.ts     # Local auth helpers
│   └── mockStore.ts     # localStorage helpers
├── index.css         # Complete design system (4.6k lines)
└── App.tsx           # Routes + providers
```

### Data Flow
```
TMDB API → tmdb.ts (cache) → useAsync hook → Page Components
                    ↓
            React Context (Auth, Watchlist, MockStore)
                    ↓
            localStorage persistence
```

---

## Design System (index.css)

- **Palette**: Black canvas (`#000`), warm off-white (`#f2f2ef`), muted grays, blue accent (`#2563eb`), red accent (`#e01a22`)
- **Typography**: Doto (display), Space Grotesk (UI), Space Mono (technical labels)
- **Spacing**: Fluid `clamp()` values, `--pad` responsive padding, `--maxw: 1480px`
- **Components**: Buttons (solid/ghost), chips, cards, skeletons, forms, nav, footer
- **Motion**: `cubic-bezier(0.22, 1, 0.36, 1)` easing, entrance animations, hover transitions
- **Responsive**: Breakpoints at 900px, 720px, 520px, 420px, 320px

---

## Key Implementation Details

### TMDB Integration (`src/lib/tmdb.ts`)
- In-memory LRU cache (200 entries)
- Type-safe mappers for all endpoints
- Discover with genre, sort, provider, region filters
- Trending, search, details, credits, videos, episodes, people

### State Management
- **AuthContext**: User, token, login/signup/logout, profile updates
- **WatchlistProvider**: Per-user watchlist (localStorage keyed by username)
- **MockStoreContext**: Custom lists, viewing history, ratings/reviews

### Routing (`src/App.tsx`)
- Public: `/`, `/films`, `/series`, `/anime`, `/people`, `/person/:id`, `/title/:kind/:id`, `/platforms`
- Guest-only: `/login`, `/signup`
- Protected: `/profile`, `/watchlist`, `/lists`, `/list/:id`, `/admin`

### Build & Deploy
```bash
npm run dev      # Vite dev server (port 3100)
npm run build    # TypeScript + Vite production build
npm run lint     # oxlint
npm run preview  # Preview production build
npm run tauri:build  # Desktop app (Tauri)
```
- Output: `dist/` (static, deployable to Netlify/Vercel/any static host)
- Netlify config: `netlify.toml` with SPA redirect

---

## Environment Setup

```env
VITE_TMDB_API_KEY=your_tmdb_api_key
```

Get key at: https://www.themoviedb.org/settings/api

---

## Known Limitations

| Area | Limitation |
|------|------------|
| **Auth** | Local-only (no backend, no JWT, no password reset) |
| **Streaming** | No direct playback — TMDB provides provider links only |
| **Images** | TMDB CDN only (no optimization/transform) |
| **Cache** | In-memory only (lost on refresh) |
| **Tests** | No test suite configured |
| **SSR** | Client-only (Vite SPA) |

---

## Roadmap Ideas

- [ ] Backend auth (Supabase/Firebase/Node)
- [ ] Server-side rendering (Next.js / React Router 7 framework mode)
- [ ] Real streaming integration (JustWatch API)
- [ ] Image optimization (Cloudinary/Imgix)
- [ ] Redis/DB cache layer
- [ ] Unit/integration tests (Vitest + Playwright)
- [ ] PWA manifest + service worker
- [ ] Dark/light theme toggle (currently dark-only)

---

## Team Handoff Notes

1. **Design system is in one file** (`src/index.css`) — split by feature when scaling
2. **TMDB key is in `.env`** — never commit real keys
3. **All data is client-fetched** — no API routes, CORS handled by TMDB
4. **Mobile nav** uses hamburger menu (≤720px), desktop shows full links
5. **Cast/row scrolling** uses native scroll + snap + hidden scrollbar + nav arrows
6. **Error boundaries missing** — wrap async sections for production
7. **Accessibility**: skip link, ARIA labels, focus-visible, semantic HTML

---

## Quick Start for New Developers

```bash
git clone <repo>
cd nothing-cineblaze
npm install
cp .env.example .env   # add your TMDB key
npm run dev
```

Open http://localhost:3100