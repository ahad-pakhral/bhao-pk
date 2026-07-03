# Design

Visual system for bhao.pk. Warm-neutral, editorial, effortless-premium. Full light + dark. No glow, no neon, no mechanical/terminal cues. Typography and space are the statement.

## Theme

- **Mood:** timeless, calm, considered — fine stationery / boutique retail, not gamer/cyber/SaaS.
- **Two modes, equal citizens.** Light = warm bone/paper. Dark = warm soft charcoal (never pure black). Both driven by the same token names via `[data-theme="light"]` / `[data-theme="dark"]` on `<html>`. Default follows system; user override persists in `localStorage` under `bhao-theme`.
- **Accent:** a single muted ink/navy, used sparingly for primary actions, links, current selection, and the "best price" signal. Never as decoration.
- **No glow, no neon, no heavy shadows.** Depth comes from hairline borders, gentle warm shadows, and layered neutrals.

## Color

Values are the source of truth for `webapp/app/globals.css`. Naming is semantic; the same name resolves per theme.

### Neutrals — Light (`[data-theme="light"]`)
- `--bg`            `#F4F1EA`  page base (warm bone)
- `--bg-subtle`     `#EDE9E0`  recessed areas, subtle fills
- `--surface`       `#FBFAF6`  cards, panels (warm paper white)
- `--surface-2`     `#F1EDE4`  nested surface / hover fill
- `--border`        `#E2DCD0`  hairline dividers
- `--border-strong` `#D2CABB`  input borders, stronger separation
- `--text`          `#211E1A`  primary (warm near-black)
- `--text-2`        `#5C574D`  secondary
- `--text-3`        `#8A8477`  muted / captions
- `--shadow-color`  `28 22 12` (rgb triplet for warm shadows)

### Neutrals — Dark (`[data-theme="dark"]`)
- `--bg`            `#171512`  page base (warm charcoal, not black)
- `--bg-subtle`     `#131210`
- `--surface`       `#201D19`  cards, panels
- `--surface-2`     `#282420`  nested surface / hover fill
- `--border`        `rgba(255,255,255,0.08)`
- `--border-strong` `rgba(255,255,255,0.14)`
- `--text`          `#F1ECE2`  primary (warm off-white)
- `--text-2`        `#ADA596`  secondary
- `--text-3`        `#78715F`  muted / captions
- `--shadow-color`  `0 0 0`

### Accent (ink/navy) — resolves per theme
- Light: `--accent #2C3E5C`  · `--accent-hover #22314A`  · `--on-accent #F7F5EF`  · `--accent-soft #E7EAF0` (tint fill) · `--accent-ring rgba(44,62,92,0.28)`
- Dark:  `--accent #A9BBDD`  · `--accent-hover #BECEE9`  · `--on-accent #14171F`  · `--accent-soft rgba(169,187,221,0.12)` · `--accent-ring rgba(169,187,221,0.30)`
- The accent is muted and matte in both modes. In dark it lifts to a soft desaturated periwinkle so it stays calm but legible — never a glow.

### Semantic (muted, desaturated; earned not decorative)
- Success (price drop / in stock): Light `#3F7A57` on `#E6EFE8` · Dark `#7FB392` on `rgba(127,179,146,0.12)`
- Warning: Light `#9A6B22` on `#F2E9D6` · Dark `#D4A356` on `rgba(212,163,86,0.12)`
- Danger (remove / out of stock): Light `#A6453F` on `#F3E1DE` · Dark `#DB8A83` on `rgba(219,138,131,0.12)`
- Star rating: warm ochre `#C08A2E` (light) / `#D9AE63` (dark). Not the accent.

## Typography

Two families. Editorial serif for display moments; a clean humanist sans for everything functional. **No monospace, no uppercase-everything, no letter-spacing tricks as personality.**

- `--font-display: 'Fraunces', Georgia, serif` — hero headline, page titles, section headers, big prices on the product page. Optical, warm, high-quality; weight 400–600, `font-optical-sizing: auto`. Sentence case or Title Case, never ALL CAPS for headings.
- `--font-sans: 'Inter', system-ui, sans-serif` — all UI, body, labels, buttons, data, and prices. Use `font-feature-settings: 'ss01','cv05'` and `font-variant-numeric: tabular-nums` for prices/data alignment.
- **Scale (rem, fixed — not fluid for UI):** 12 / 13 / 14 (base) / 15 / 16 / 18 / 20 / 24 / 30 / 38 / 48 / 64. Display hero may use `clamp()` ONLY on the marketing hero, nowhere else.
- **Weights:** Inter 400/500/600/700. Fraunces 400/500/600. Body 400, UI labels 500, emphasis 600.
- **Line-height:** 1.5 body prose, 1.35 UI, 1.05–1.15 display. Prose max 68ch.
- Tiny UPPERCASE eyebrow labels are allowed sparingly (section kicker, 11–12px, `letter-spacing: 0.08em`, `--text-3`) — as a quiet accent, not the default heading style.

## Spacing & Layout

- Base unit 4px. Scale: 2 4 6 8 12 16 20 24 32 40 48 64 80 96 128 (`--space-*`).
- Content container max-width **1200px**; a wider **1320px** for nav. Generous gutters: 16px mobile, 24px tablet, 40px desktop.
- Section rhythm is large — 64–96px vertical between major sections; whitespace is the premium signal.
- Grids: product grid `repeat(auto-fill, minmax(232px, 1fr))`, gap 20–24px; drops to 2-up then 1-up on mobile with comfortable gaps.
- **Mobile-first & thumb-first:** design each layout for ≤430px first. Sticky, reachable primary actions; a mobile bottom-safe CTA on the product page; ≥44px tap targets; sidebars collapse to sheets/stacked sections, tables to cards.

## Radius, Border, Elevation

- Radius: `--r-sm 8px` · `--r-md 12px` · `--r-lg 16px` · `--r-xl 22px` · `--r-pill 999px`. Cards `--r-lg`, buttons/inputs `--r-md`.
- Borders are hairline (1px, `--border`); they do most of the separation work, especially in dark mode.
- Elevation is soft and warm, never a glow:
  - `--shadow-sm: 0 1px 2px rgba(var(--shadow-color)/0.06)`
  - `--shadow-md: 0 2px 6px rgba(var(--shadow-color)/0.06), 0 12px 28px -14px rgba(var(--shadow-color)/0.18)`
  - `--shadow-lg: 0 4px 12px rgba(var(--shadow-color)/0.08), 0 24px 48px -20px rgba(var(--shadow-color)/0.24)`
  - Dark mode: shadows nearly invisible — rely on `--surface`/`--border` contrast instead.

## Components

Every interactive element ships all states: default, hover, focus-visible, active, disabled, loading. One vocabulary everywhere.

- **Buttons:** `.btn` base (radius md, 500–600 weight, sentence case). `.btn-primary` = accent fill + `--on-accent`. `.btn-secondary` = surface + border. `.btn-ghost` = transparent, text-2 → text on hover. Press = 1px translate + slightly darker, no glow. Focus-visible = 2px `--accent-ring` offset ring.
- **Inputs:** surface fill, `--border-strong`, radius md, 44px min height on mobile; focus = accent border + soft ring (no lime). Clear placeholder in `--text-3`.
- **Product card:** warm surface, hairline border, `--r-lg`; image in a neutral framed well with graceful "no image" state (since imagery is weak); title in sans 15–16/600, price prominent (Fraunces or Inter tabular 600), store + rating muted. Hover = gentle 2px lift + `--shadow-md` + border-strong. Wishlist heart is a real 40px tap target with quiet default state.
- **Vendor comparison card (product page):** the hero of the app — clean row/card with store, price, delta vs best, rating, and a clear CTA. "Best price" marked with a calm accent-soft chip + label, never a neon badge.
- **Badges/chips:** low-saturation, `accent-soft`/semantic-soft fills, 11–12px sans 600, radius pill. Discount = muted success/danger, not hot pink.
- **Loading:** skeletons that match final layout (shimmer via `--surface-2`), never centered spinners in content.
- **Empty states:** teach the next action (e.g. wishlist empty → “Search for something you’re tracking” + CTA), with a small quiet illustration/glyph, never “nothing here.”
- **Nav:** slim top bar, logo + minimal links + search + theme toggle + auth; frosted `--surface` on scroll with hairline border. Mobile: compact bar + full sheet menu with large tap rows.

## Motion

- 150–240ms, `cubic-bezier(0.2, 0, 0, 1)` (calm ease-out) for most; 240–320ms for larger reveals.
- Purpose only: hover/press feedback, focus rings, skeleton shimmer, gentle section fade/rise-in on first paint (small, ≤12px, staggered), smooth theme cross-fade, count-context for price where cheap. No orchestrated page-load shows, no parallax, no infinite motion.
- Honor `prefers-reduced-motion: reduce` → disable transforms/reveals, keep instant state changes.

## Tokens → Implementation

All of the above lives as CSS custom properties in `webapp/app/globals.css` under `:root` + `[data-theme="light"]` / `[data-theme="dark"]`. Pages and components must consume tokens (`var(--surface)`, `var(--text-2)`, `var(--accent)`…) — no hardcoded hex in JSX. Existing inline hex (`#121212`, `#fff`, `#666`, `#CCFF00`…) is being migrated to tokens as part of this overhaul. Backend/data code and API calls are out of scope and untouched.
