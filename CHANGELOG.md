# Changelog

All notable changes to this project are documented here.

For detailed engineering notes (rationale, file-level breakdown, and testing), see `docs/DEVLOG.md`.

## 2026-04-21

- Fix product deep-linking so opening product pages in a new tab no longer depends on an in-memory search session.
- Normalize store keys (`Daraz` vs `daraz`) for product detail and matches endpoints to prevent "Product Not Found" when deep-linking.
- Improve wishlist API/client handling (proper duplicate status code + safer server response handling).
- Remove dummy fallback wishlist URLs from the web search UI.
- Add stricter alert creation validation/guards on the backend.
- Phase 3: email notifications on alert trigger (Resend integration) with DB tracking to prevent duplicate sends.
- Phase 3: admin auth (role=ADMIN) + `GET /api/admin/stats` + admin dashboard wired to real stats.
- Remove admin dashboard dummy activity + dummy health widgets; add real `/api/admin/activity`, `/api/admin/health`, and `/api/admin/run-alert-check`.
- Admin dashboard now polls every 5 seconds for realtime stats/activity/health (pause/resume supported).
- Fix `Searches Today` staying at 0 by sending Authorization header on web searches; add `/admin/health` page so health JSON works without “Missing token”.
- Phase 4 (Mobile Integration): plan + execution notes added; mobile now uses backend (no dummy data).
- Phase 4 (Mobile Integration): replace mobile dummy Home/Wishlist/Alerts/Product pages with real backend data (search, trending, wishlist, alerts, history).
- Phase 4: add backend "recently viewed" storage + API (`/api/recently-viewed`) and wire mobile to record + display it.
- Enable graphify knowledge graph usage in Codex (adds `.codex/hooks.json` + AGENTS.md section).
- Implement Phase 2 price history: daily Supabase snapshots, `GET /api/history`, and real charts on web + mobile product pages.
- Fix `/api/history` store filtering to be case-insensitive (avoids empty points due to `Daraz` vs `daraz`).

## 2026-04-22

- Mobile: bring feature parity with webapp (excluding admin): real Profile stats, Search History, Settings actions, and Change Password screen.
- Mobile: Product page now supports cross-store price comparisons via `GET /api/search/matches`.
- Mobile: Wishlist now supports "Visit Store" and improved item actions; Alerts show store badge + "TARGET REACHED" status.
- Mobile: Search store filters now include Mega + PriceOye.
