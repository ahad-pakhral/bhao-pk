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
score = 0.30 * bayesianRating
      + 0.30 * priceScore
      + 0.20 * popularity
      + 0.10 * storeReliability
      + 0.10 * discountBonus
```

### Components (all normalized to 0-1):

| Component | Formula | Why |
|-----------|---------|-----|
| bayesianRating | `(bayesian - 1) / 4` | Quality with confidence |
| priceScore | `1 - (price - min) / (max - min)` | Lower price = higher score |
| popularity | `log(1+reviews) / log(1+maxReviews)` | Log-dampened so 10K reviews doesn't dominate 100 |
| storeReliability | Lookup table (0.5-0.85) | Trust signal per store |
| discountBonus | `(original - current) / original` | Rewards deals |

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
