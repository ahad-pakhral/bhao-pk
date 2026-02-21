// Product ranking algorithm with Bayesian average and composite scoring
//
// Solves the "50 reviews @ 4.5 vs 5 reviews @ 5.0" problem:
// Products with few reviews get pulled toward the global average,
// while products with many reviews stay close to their raw rating.

export interface RankingConfig {
  confidenceThreshold: number;  // C: reviews needed to trust rating halfway (default: 25)
  globalAverageRating: number;  // m: prior assumption (computed from data)
  weights: {
    rating: number;      // quality of rating (default: 0.30)
    price: number;       // price competitiveness (default: 0.30)
    popularity: number;  // review volume (default: 0.20)
    store: number;       // store reliability (default: 0.10)
    discount: number;    // discount bonus (default: 0.10)
  };
}

export const DEFAULT_RANKING_CONFIG: RankingConfig = {
  confidenceThreshold: 25,
  globalAverageRating: 4.0,
  weights: {
    rating: 0.30,
    price: 0.30,
    popularity: 0.20,
    store: 0.10,
    discount: 0.10,
  },
};

const STORE_RELIABILITY: Record<string, number> = {
  'Daraz': 0.85,
  'Telemart': 0.80,
  'Shophive': 0.75,
  'Mega': 0.70,
  'PriceOye': 0.80,
};
const DEFAULT_STORE_RELIABILITY = 0.50;

/**
 * Bayesian average rating.
 * Formula: (C * m + n * R) / (C + n)
 */
export function bayesianAverage(
  rawRating: number,
  reviewCount: number,
  globalAverage: number,
  confidenceThreshold: number
): number {
  return (
    (confidenceThreshold * globalAverage + reviewCount * rawRating) /
    (confidenceThreshold + reviewCount)
  );
}

/** Parse "Rs. 345,000" → 345000 */
export function parsePrice(priceStr: string): number {
  return parseInt(priceStr.replace(/[^0-9]/g, ''), 10) || 0;
}

/** Weighted global average rating across all products. */
export function computeGlobalAverage(
  products: Array<{ rating?: number; reviewsCount?: number }>
): number {
  const withRatings = products.filter(p => p.rating != null && p.rating > 0);
  if (withRatings.length === 0) return 4.0;

  let totalWeighted = 0;
  let totalReviews = 0;
  for (const p of withRatings) {
    const n = p.reviewsCount || 1;
    totalWeighted += (p.rating || 0) * n;
    totalReviews += n;
  }
  return totalWeighted / totalReviews;
}

/**
 * Composite score for a single product (0–1, higher is better).
 */
export function calculateProductScore(
  product: {
    rating?: number;
    reviewsCount?: number;
    price?: string;
    store?: string;
    originalPrice?: string;
  },
  context: {
    minPrice: number;
    maxPrice: number;
    maxReviewsCount: number;
    globalAverageRating: number;
  },
  config: RankingConfig = DEFAULT_RANKING_CONFIG
): number {
  const { weights, confidenceThreshold } = config;
  const rating = product.rating || 0;
  const reviewCount = product.reviewsCount || 0;
  const price = product.price ? parsePrice(product.price) : 0;

  // 1. Bayesian rating → 0-1
  const bayesian = bayesianAverage(
    rating,
    reviewCount,
    context.globalAverageRating,
    confidenceThreshold
  );
  const normalizedRating = Math.max(0, (bayesian - 1) / 4);

  // 2. Price score (lower = better) → 0-1
  let normalizedPrice = 1.0;
  if (context.maxPrice > context.minPrice && price > 0) {
    normalizedPrice = 1 - (price - context.minPrice) / (context.maxPrice - context.minPrice);
  }

  // 3. Popularity (log-dampened reviews) → 0-1
  let normalizedPopularity = 0;
  if (context.maxReviewsCount > 0 && reviewCount > 0) {
    normalizedPopularity =
      Math.log(1 + reviewCount) / Math.log(1 + context.maxReviewsCount);
  }

  // 4. Store reliability → 0-1
  const storeScore = STORE_RELIABILITY[product.store || ''] ?? DEFAULT_STORE_RELIABILITY;

  // 5. Discount bonus → 0-1
  let discountBonus = 0;
  if (product.originalPrice) {
    const original = parsePrice(product.originalPrice);
    if (original > price && original > 0) {
      discountBonus = (original - price) / original;
    }
  }

  return (
    weights.rating * normalizedRating +
    weights.price * normalizedPrice +
    weights.popularity * normalizedPopularity +
    weights.store * storeScore +
    weights.discount * discountBonus
  );
}

/**
 * Rank products by composite score (descending).
 * Use this for "relevance" sorting.
 */
export function rankByRelevance<
  T extends {
    rating?: number;
    reviewsCount?: number;
    price?: string;
    store?: string;
    originalPrice?: string;
  }
>(products: T[], config?: RankingConfig): T[] {
  if (products.length === 0) return [];

  const globalAvg = computeGlobalAverage(products);
  const cfg: RankingConfig = config || {
    ...DEFAULT_RANKING_CONFIG,
    globalAverageRating: globalAvg,
  };

  let minPrice = Infinity;
  let maxPrice = 0;
  let maxReviewsCount = 0;

  for (const p of products) {
    const price = p.price ? parsePrice(p.price) : 0;
    if (price > 0 && price < minPrice) minPrice = price;
    if (price > maxPrice) maxPrice = price;
    if ((p.reviewsCount || 0) > maxReviewsCount) {
      maxReviewsCount = p.reviewsCount || 0;
    }
  }
  if (minPrice === Infinity) minPrice = 0;

  const context = { minPrice, maxPrice, maxReviewsCount, globalAverageRating: cfg.globalAverageRating };

  const scored = products.map(p => ({
    product: p,
    score: calculateProductScore(p, context, cfg),
  }));

  scored.sort((a, b) => b.score - a.score);
  return scored.map(s => s.product);
}
