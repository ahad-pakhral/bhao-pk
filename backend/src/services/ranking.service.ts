// Server-side ranking — Bayesian average + composite scoring
// Mirrors the frontend ranking.ts logic for consistency

interface ScrapedProduct {
  name: string;
  price: number;
  originalPrice?: number;
  url: string;
  imageUrl: string;
  rating: number;
  reviewsCount: number;
  store: string;
  inStock: boolean;
  category?: string;
}

const CONFIDENCE_THRESHOLD = 25;

const STORE_RELIABILITY: Record<string, number> = {
  Daraz: 0.85,
  Telemart: 0.80,
  Shophive: 0.75,
  Mega: 0.70,
  PriceOye: 0.80,
};

const WEIGHTS = {
  bayesianRating: 0.30,
  priceScore: 0.30,
  popularity: 0.20,
  storeReliability: 0.10,
  discountBonus: 0.10,
};

function bayesianAverage(rating: number, reviewCount: number, globalAvg: number): number {
  return (CONFIDENCE_THRESHOLD * globalAvg + reviewCount * rating) /
         (CONFIDENCE_THRESHOLD + reviewCount);
}

export function rankProducts(products: ScrapedProduct[]): ScrapedProduct[] {
  if (products.length === 0) return [];

  // Compute global averages
  const totalRating = products.reduce((sum, p) => sum + p.rating, 0);
  const globalAvg = totalRating / products.length;

  const prices = products.map(p => p.price).filter(p => p > 0);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const priceRange = maxPrice - minPrice || 1;

  const maxReviews = Math.max(...products.map(p => p.reviewsCount), 1);

  // Score each product
  const scored = products.map(product => {
    const bayesian = bayesianAverage(product.rating, product.reviewsCount, globalAvg);
    const normalizedBayesian = Math.max(0, Math.min(1, (bayesian - 1) / 4));

    const priceScore = product.price > 0
      ? 1 - (product.price - minPrice) / priceRange
      : 0;

    const popularity = maxReviews > 1
      ? Math.log(1 + product.reviewsCount) / Math.log(1 + maxReviews)
      : 0;

    const storeReliability = STORE_RELIABILITY[product.store] || 0.70;

    const discountBonus = product.originalPrice && product.originalPrice > product.price
      ? (product.originalPrice - product.price) / product.originalPrice
      : 0;

    const score =
      WEIGHTS.bayesianRating * normalizedBayesian +
      WEIGHTS.priceScore * priceScore +
      WEIGHTS.popularity * popularity +
      WEIGHTS.storeReliability * storeReliability +
      WEIGHTS.discountBonus * discountBonus;

    return { ...product, _score: score };
  });

  scored.sort((a, b) => b._score - a._score);

  // Strip internal score before returning
  return scored.map(({ _score, ...product }) => product);
}
