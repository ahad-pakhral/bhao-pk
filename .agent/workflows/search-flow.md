# Search Flow — End-to-End Reference

Use this when debugging search issues or modifying the search pipeline.

## The Full Pipeline

```
[User types query]
    → [Frontend debounce 400ms]
    → POST /api/search { keyword: "iPhone 15" }
    → [Backend: check Redis cache]
    → [Cache miss: spawn Python scrapers]
    → [5 scrapers run in parallel, 30s timeout each]
    → [Merge results from all stores]
    → [Rank with Bayesian composite algorithm]
    → [Cache in Redis, TTL 1 hour]
    → [Return JSON: { results: [...], source: "live"|"cache", count: N }]
    → [Frontend displays results with filters/sort]
```

## Key Files in Order

| Step | File | What it does |
|------|------|-------------|
| 1 | `webapp/app/search/page.tsx` | Debounces input, calls API, renders results |
| 2 | `backend/src/routes/search.routes.ts` | Receives POST, checks cache, calls scraper |
| 3 | `backend/src/services/cache.service.ts` | Redis get/set with TTL |
| 4 | `backend/src/services/scraper.service.ts` | Spawns Python via child_process |
| 5 | `backend/scrapers/run_search.py` | CLI entry, dispatches to store scraper |
| 6 | `backend/scrapers/stores/daraz_scraper.py` | Daraz JSON API |
| 7 | `backend/scrapers/stores/shophive_scraper.py` | Shophive HTML parsing |
| 8 | `backend/src/services/ranking.service.ts` | Bayesian avg + composite scoring |
| 9 | `webapp/utils/ranking.ts` | Client-side ranking (fallback) |

## Data Shape at Each Stage

### Python scraper output (JSON to stdout):
```json
[{
  "name": "iPhone 15 Pro 256GB",
  "price": 345000,
  "originalPrice": 410000,
  "url": "https://daraz.pk/products/...",
  "imageUrl": "https://static-01.daraz.pk/...",
  "rating": 4.9,
  "reviewsCount": 120,
  "store": "Daraz",
  "inStock": true
}]
```

### Backend API response:
```json
{
  "results": [/* same shape as above, but ranked */],
  "source": "live",
  "count": 56
}
```

### Frontend normalized product:
```typescript
{
  id: "scraped-0",
  name: "iPhone 15 Pro 256GB",
  price: "Rs. 345,000",        // Formatted string
  priceValue: 345000,           // Numeric for sorting
  rating: 4.9,
  reviews: 120,
  reviewsCount: 120,
  store: "Daraz",
  image: "https://static-01.daraz.pk/...",
  url: "https://daraz.pk/products/...",
  inStock: true,
  originalPrice: "Rs. 410,000", // String for ranking util
  priceDrop: "-16%",            // Computed
}
```

## Debugging Tips

1. **No results?** Test scraper directly: `python3 run_search.py --keyword "X" --store daraz`
2. **Wrong ranking?** Check `ranking.service.ts` weights and `computeGlobalAverage()`
3. **Slow search?** Check if Redis is running (cache miss = ~15s for all scrapers)
4. **Frontend not updating?** Check debounce timer (400ms), check API_BASE URL
5. **CORS error?** Backend has `app.use(cors())` — should allow all origins
