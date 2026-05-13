# Ranking Algorithm Reference

Use this when modifying, tuning, or explaining the ranking algorithm.

## The Problem

"5 reviews at 5.0 stars" vs "50 reviews at 4.5 stars" — which is better?

Raw average says 5.0 > 4.5. But 5 reviews isn't trustworthy. The Bayesian average solves this by pulling low-confidence ratings toward the global average.

## Bayesian Average Formula

```
bayesianRating = (C * m + n * R) / (C + n)
```

- **C** = 25 (confidence threshold — how many reviews before we trust halfway)
- **m** = global average rating (computed dynamically from all products)
- **n** = number of reviews for this product
- **R** = raw rating (1-5)

### Examples with C=25, m=4.0:

| Product | Raw Rating | Reviews | Bayesian | Rank |
|---------|-----------|---------|----------|------|
| No-Name TWS | 5.0 | 3 | 4.11 | Low (untrusted) |
| Samsung Watch | 4.6 | 15 | 4.22 | Medium |
| JBL Tune | 4.3 | 450 | 4.30 | High (trusted) |
| iPhone 15 Pro | 4.9 | 120 | 4.83 | Highest |

## Composite Score

```
score = 0.50 * relevance
      + 0.20 * priceScore
      + 0.10 * bayesianRating
      + 0.10 * popularity
      + 0.05 * storeReliability
      + 0.05 * discountBonus
```

### Components (all normalized to 0-1):

| Component | Formula | Why |
|-----------|---------|-----|
| relevance | `calculateRelevance(name, query)` | Textual match (exact vs tokens) |
| priceScore | `1 - (log(price) - log(min)) / (log(max) - log(min))` | Log-scale price (favors value) |
| bayesianRating | `(bayesian - 1) / 4` | Quality with confidence |
| popularity | `log(1+reviews) / log(1+maxReviews)` | Log-dampened reviews count |
| storeReliability | Lookup table (0.5-0.85) | Trust signal per store |
| discountBonus | `(original - current) / original` | Rewards deals |

### Penalties (Multipliers):

| Penalty | Trigger | Multiplier | Effect |
|---------|---------|------------|--------|
| **Hard Elimination** | <40% of query tokens match (`MIN_MATCH_RATIO`) | `score = 0` | Removes unrelated products entirely |
| **Partial Match** | Some query tokens missing | `0.1x` on relevance | Moves junk results down |
| **Out of Stock** | `inStock === false` | `0.1x` on score | Buries unavailable items |
| **Generation Mismatch** | Query "16" vs product "17" (adjacent) | `0.03x` on score | Wrong generation sinks below correct |
| **Generation Mismatch** | Query "16" vs product "14" (far) | `0.01x` on score | Near-elimination |
| **Model Variant Mismatch** | "pro max" vs "pro", "ultra" vs base | `0.3-0.4x` on score | Wrong tier penalized |
| **Accessory** | Accessory keyword in name but query doesn't want accessories | `0.03x` on score | Devices rank above cases/covers |
| **Prefix Accessory** | Name starts with query words + accessory keywords after | `0.03x` on score | "iPhone 16 Camera Rings" ranked below iPhone 16 |
| **Generic Mention** | "better than", "alternative to", "like iphone" | `0.02x` on relevance | Comparison products eliminated |

### Relevance Calculation (`calculateRelevance`):

1. **Token matching**: Each query token matched via word boundary regex (supports typo tolerance for tokens >4 chars)
2. **Hard cutoff**: If `matchRatio < 0.4` → relevance = 0
3. **Base relevance**: Full match (all tokens) → `max(0.85, 1 - (nameLen - queryLen)/100)`. Partial match → `matchRatio * 0.1`
4. **Position weight** (critical for single-word queries like "iphone"):
   - Position 0 (name starts with query) → `1.2x` boost
   - Position <10 → `1.0x` (neutral)
   - Position <30 → `0.6x` (could be accessory)
   - Position 30+ → `0.15x` (mentioned in passing)

### Generation Penalty (`calculateGenerationPenalty`):

Applied to the **final composite score** (not just relevance) so ALL factors are penalized:
- Extracts numbers ≥5 from query and product name
- If query has a number not in the product, and product has a different number ≥5 → mismatch
- Adjacent generations (±1): `0.03x` | Far generations: `0.01x`
- Also checks model variants: pro/max (0.4x), plus/mini/ultra (0.3x)

### Accessory Detection:

- **60+ keywords** in `ACCESSORY_KEYWORDS`: cases, covers, protectors, chargers, cables, skins, holders, mounts, repair parts, decorative parts (camera ring, arrow, bezel, button), protection materials (360 protection, carbon fiber, matte, glossy, etc.)
- **`isPrefixAccessory()`**: Detects accessories that start with the device name (e.g., "Iphone 16 Pro Max Arrow Camera Rings"). Checks text after the last matched query token — if it contains specs (GB, TB) it's the device; if it contains accessory keywords it's an accessory.
- **Query-aware**: If the query itself contains accessory keywords (e.g., "iphone case"), the penalty is disabled.

### Store Reliability Scores:
```
Daraz: 0.85, Telemart: 0.80, PriceOye: 0.80, Shophive: 0.75, Mega: 0.70
Unknown: 0.50
```

## Where the Algorithm Lives

| Location | Used When |
|----------|-----------|
| `backend/src/services/ranking.service.ts` | Server-side (after scraping) |
| `webapp/utils/ranking.ts` | Client-side fallback |
| `mobile/src/utils/ranking.ts` | Client-side fallback |

All three implementations are functionally identical. Changes should be made to all three.

## Tuning the Algorithm

### Change weights:
Edit `WEIGHTS` or `DEFAULT_RANKING_CONFIG.weights` in the ranking files.
Weights must sum to 1.0.

### Change confidence threshold:
Edit `CONFIDENCE_THRESHOLD` (backend) or `DEFAULT_RANKING_CONFIG.confidenceThreshold`.
- Lower C → trust ratings sooner (more volatile for new products)
- Higher C → require more reviews (penalizes new listings)

### Add a new store reliability score:
Add to `STORE_RELIABILITY` in all three ranking files.

## Experiments to Validate

1. **NDCG** — Create golden set of 50 queries with human-labeled relevance, measure ranking quality
2. **A/B Test CTR** — 50/50 split, measure click-through on top 3 results
3. **Weight sensitivity** — Grid search over weight combinations
4. **C threshold tuning** — Test C = 5, 10, 25, 50, measure user satisfaction
