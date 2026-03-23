# ThatShitHard — Changelog

## [Unreleased]
- MP3 upload to Supabase Storage with progress bar
- SoundCloud embed integration
- Direct REST API calls to bypass RLS auth issues

---

## [0.4.0] — 2026-03-23
### Fixed
- Track DB insert now uses direct REST API (bypasses Supabase Auth RLS issue)
- Storage upload uses XHR with progress tracking instead of Supabase client
- Upload progress bar added (pink → yellow, shows % + status)
- Fixed favicon 404 (vite.svg → favicon.svg)

### Added
- Two-tab upload modal: MP3 Upload + SoundCloud Link
- Cover art upload support
- soundcloud_url + embed_url columns in tracks table

---

## [0.3.0] — 2026-03-23
### Fixed
- Auth completely rewritten — Supabase Auth with `username@tsh-app.com` email pattern
- Fixed authLoading hang (3s timeout + instant localStorage restore)
- Tracks cached in localStorage for instant load on repeat visits
- Font preconnect added for faster Google Fonts load

### Added
- Real Supabase backend (replaced localStorage-only prototype)
- profiles, tracks, votes, comments, reactions tables
- Supabase Storage buckets: audio + covers
- Real votes persisted per user in DB
- Real comments with live data
- Real reactions stored in DB

---

## [0.2.0] — 2026-03-23
### Added
- Swipe fire animation (🔥 burst on right swipe)
- Trash can animation (🗑️ pops up on left swipe)
- Graffiti SVG logo in header
- BETA badge next to logo
- Animated canvas background (twinkling pixel stars + color blobs)
- Comment section in TrackModal (localStorage, per track)
- SoundCloud URL upload (iframe embed, no API key needed)

### Fixed
- Card content z-index fixed (no longer hidden behind background canvas)
- Play button pointer event capture fixed
- Audio switched to local WAV files (no CORS issues)

---

## [0.1.0] — 2026-03-23
### Added
- Initial prototype — Tinder-style swipe UI for music
- 20 mock tracks across 10 genres
- Custom drag-to-swipe card component (no libraries)
- Animated waveform visualizer (40 SVG bars)
- LocalStorage auth (username + password)
- Swipe cards with 15s audio snippet playback
- HARD 🔥 / TRASH 💀 swipe mechanic
- Leaderboard page (top tracks by hards)
- Weekly Charts page
- Collections page (5 curated collections)
- Trending page
- Profile page with taste score + badges
- Genre filter bar
- Quick reactions (🔥 😤 💯 🥶 😭 💀)
- Taste Match (genre overlap with mock users)
- Snippet Picker UI
- Seller/upload dashboard
- Track analytics (hard %, ratio bar, top reaction)
- Pin a track on profile
- Bottom tab navigation
- Graffiti + Neocities aesthetic
- Press Start 2P + VT323 pixel fonts
- Deployed to Vercel: thatshithard.vercel.app
