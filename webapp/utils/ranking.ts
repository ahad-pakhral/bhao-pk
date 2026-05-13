// Frontend ranking — mirrors backend/src/services/ranking.service.ts

export interface RankingConfig {
  confidenceThreshold: number;
  weights: {
    relevance: number;
    bayesianRating: number;
    priceScore: number;
    popularity: number;
    storeReliability: number;
    discountBonus: number;
  };
  storeReliabilityTable: Record<string, number>;
}

export const DEFAULT_RANKING_CONFIG: RankingConfig = {
  confidenceThreshold: 25,
  weights: {
    relevance: 0.50,
    bayesianRating: 0.10,
    priceScore: 0.20,
    popularity: 0.10,
    storeReliability: 0.05,
    discountBonus: 0.05,
  },
  storeReliabilityTable: {
    Daraz: 0.85,
    Telemart: 0.80,
    Shophive: 0.75,
  },
};

// Minimum fraction of query tokens that must match for a product to be considered relevant
const MIN_MATCH_RATIO = 0.4;

// 1. Text Relevance Score (Substring + Token Match + Position Weight)
function calculateRelevance(productName: string, query: string): number {
  if (!query) return 1.0;

  const normalizedName = productName.toLowerCase();
  const normalizedQuery = query.toLowerCase().trim();

  const queryTokens = normalizedQuery.split(/\s+/).filter(t => t.trim().length > 0);
  if (queryTokens.length === 0) return 1.0;

  const escapeRegExp = (str: string) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  let matches = 0;
  let firstMatchIndex = normalizedName.length; // Track earliest match position

  for (const token of queryTokens) {
    const escapedToken = escapeRegExp(token);
    const regex = new RegExp(`\\b${escapedToken}\\b`, 'i');
    const match = regex.exec(normalizedName);

    if (match) {
      matches++;
      firstMatchIndex = Math.min(firstMatchIndex, match.index);
    } else if (token.length > 4) {
      let partialMatch = false;
      for (let i = 0; i < token.length; i++) {
        const typoToken = token.substring(0, i) + token.substring(i + 1);
        if (typoToken.length >= 4) {
          const typoRegex = new RegExp(`\\b${escapeRegExp(typoToken)}\\b`, 'i');
          const typoMatch = typoRegex.exec(normalizedName);
          if (typoMatch) {
            partialMatch = true;
            firstMatchIndex = Math.min(firstMatchIndex, typoMatch.index);
            break;
          }
        }
      }
      if (partialMatch) matches += 0.8;
    }
  }

  const matchRatio = matches / queryTokens.length;

  // Hard cutoff: if too few tokens match, this product is unrelated — eliminate it
  if (matchRatio < MIN_MATCH_RATIO) {
    return 0;
  }

  // Base relevance from match ratio
  let relevance: number;
  if (matchRatio < 1.0) {
    relevance = matchRatio * 0.1;
  } else {
    relevance = Math.max(0.85, 1 - (normalizedName.length - normalizedQuery.length) / 100);
  }

  // Position weight: query found early in the name = likely the actual product
  if (firstMatchIndex === 0) {
    relevance *= 1.2; // Name starts with query word — very likely the actual product
  } else if (firstMatchIndex < 10) {
    relevance *= 1.0; // Near the start — fine
  } else if (firstMatchIndex < 30) {
    relevance *= 0.6; // Middle of name — could be accessory or related product
  } else {
    relevance *= 0.15; // Far into name — query word mentioned in passing
  }

  return Math.min(relevance, 1.0);
}

/**
 * Detect generation/version mismatches.
 * If query contains "16" and product contains "17", it's a different generation.
 * Also handles: pro vs non-pro, max vs mini, plus vs base model.
 */
function calculateGenerationPenalty(query: string, productName: string): number {
  const queryNumbers = query.match(/\b(\d{1,2})\b/g) || [];
  const productNumbers = productName.match(/\b(\d{1,2})\b/g) || [];

  // Check for direct generation mismatch (e.g. query "16" vs product "17")
  for (const qNum of queryNumbers) {
    const qn = parseInt(qNum, 10);
    if (qn < 5) continue; // Skip low numbers (e.g. "iphone 4", "galaxy s3")

    // Does the product contain this exact generation number?
    if (!productNumbers.some(pNum => parseInt(pNum, 10) === qn)) {
      // Product doesn't have query's generation — check if it has a DIFFERENT generation
      const productGeneration = productNumbers.find(pNum => {
        const pn = parseInt(pNum, 10);
        return pn >= 5 && pn !== qn;
      });
      if (productGeneration) {
        const pn = parseInt(productGeneration, 10);
        // Adjacent generations (e.g. 16 vs 17) — strong penalty, wrong generation
        if (Math.abs(pn - qn) <= 1) {
          return 0.03;
        }
        // Far generations (e.g. 16 vs 14) — near-elimination
        return 0.01;
      }
    }
  }

  const queryHasMax = /\bmax\b/.test(query);
  const productHasMax = /\bmax\b/.test(productName);
  const queryHasPro = /\bpro\b/.test(query) && !queryHasMax;
  const productHasPro = /\bpro\b/.test(productName) && !productHasMax;
  const queryHasPlus = /\bplus\b/.test(query);
  const productHasPlus = /\bplus\b/.test(productName);
  const queryHasMini = /\bmini\b/.test(query);
  const productHasMini = /\bmini\b/.test(productName);
  const queryHasUltra = /\bultra\b/.test(query);
  const productHasUltra = /\bultra\b/.test(productName);

  if (queryHasMax && !productHasMax && productHasPro) return 0.4;
  if (queryHasPro && productHasMax) return 0.4;
  if (queryHasPlus && !productHasPlus) return 0.3;
  if (queryHasMini && !productHasMini) return 0.3;
  if (queryHasUltra && !productHasUltra) return 0.3;

  return 1.0;
}

const ACCESSORY_KEYWORDS = [
  // Cases and covers
  'case', 'cover', 'shell', 'bumper', 'holster', 'pouch',
  'back cover', 'face plate', 'flip cover', 'rear cover',
  // Screen protection
  'protector', 'glass', 'tempered glass', 'screen protector',
  'lens protector', 'camera lens', 'film',
  // Skins, wraps, decals (non-device)
  'skin', 'wrap', 'sticker', 'decal', 'membrane', 'back sheet',
  // Cables and charging
  'cable', 'charger', 'adapter', 'cord', 'dock',
  // Wearables attachments
  'strap', 'band', 'silicone',
  // Mounts and stands
  'holder', 'mount', 'stand', 'car mount',
  // Non-device / repair parts
  'housing', 'convert to', 'converter', 'body housing', 'replacement',
  'back housing', 'front glass', 'frame', 'battery replacement',
  'back protection', 'full protection', '360 protection', 'carbon fiber',
  // Repair/conversion
  'repair', 'fix', 'service pack', 'tool kit',
  // Compatibility markers (universal accessory)
  'compatible with', 'for iphone', 'for samsung', 'fits',
  // Accessories often bundled
  'bundle', 'combo pack', 'accessory kit',
  // Small decorative parts that follow device names
  'camera ring', 'ring', 'arrow', 'lens ring', 'bezel', 'button',
  'antenna', 'speaker mesh', 'earpiece', 'microphone mesh',
  'volume button', 'power button', 'sim tray', 'sim slot',
  // Additional non-device keywords
  'matte', 'glossy', 'transparent', 'clear', 'tinted',
  'hybrid', 'armor', 'defender', 'rugged',
];

/**
 * Check if a product is a "prefix accessory" — the product name contains the query
 * words but also contains accessory keywords, indicating it's an accessory FOR the
 * queried device, not the device itself.
 */
function isPrefixAccessory(nameLower: string, queryLower: string): boolean {
  const queryTokens = queryLower.split(/\s+/).filter(t => t.length > 1);
  if (queryTokens.length === 0) return false;

  const lastTokenMatch = queryTokens.slice().reverse().find(token => {
    const escaped = token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return new RegExp(escaped, 'i').test(nameLower);
  });

  if (!lastTokenMatch) return false;

  const escaped = lastTokenMatch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const lastMatch = new RegExp(escaped, 'i').exec(nameLower);
  if (!lastMatch) return false;

  const afterLastQuery = nameLower.substring(lastMatch.index + lastMatch[0].length).trim();

  if (afterLastQuery.length === 0) return false;

  // Check if what follows contains only specs/variants (GB, TB, etc.)
  const onlySpecs = /^(\/?\s*\d+\s*(gb|tb|gbps|mh[zs]|inch|mp|px|pt|mah|watt|v|a|g|kg|oz|mm|cm)\s*[\/,]?\s*)+$/i.test(afterLastQuery);
  if (onlySpecs) return false;

  return ACCESSORY_KEYWORDS.some(kw => afterLastQuery.includes(kw));
}

// Stop-words that are too generic to indicate a specific product
const GENERIC_IN_DESCRIPTION = [
  'better than', 'alternative to', 'like iphone', 'unlike',
];

export const parsePrice = (val: string | number): number => {
  if (typeof val === 'number') return val;
  return parseFloat(val.replace(/[^0-9.]/g, '')) || 0;
};

export function rankByRelevance<T extends {
  price: number | string;
  rating: number;
  reviewsCount: number;
  store: string;
  originalPrice?: string | number;
  inStock?: boolean;
  name?: string;
}>(
  products: T[],
  query: string = "",
  config: RankingConfig = DEFAULT_RANKING_CONFIG
): T[] {
  if (products.length === 0) return [];

  // Compute global averages
  const totalRating = products.reduce((sum, p) => sum + p.rating, 0);
  const globalAvg = totalRating / products.length;

  // 2. Outlier Filtering for Price Range (IQR Method)
  const validPrices = products.map(p => parsePrice(p.price)).filter(p => p > 0).sort((a, b) => a - b);
  let minPrice = 1;
  let maxPrice = 1;

  if (validPrices.length > 0) {
    if (validPrices.length > 3) {
      const q1 = validPrices[Math.floor(validPrices.length * 0.25)];
      const q3 = validPrices[Math.floor(validPrices.length * 0.75)];
      const iqr = q3 - q1;

      const lowerBound = q1 - 1.5 * iqr;
      const upperBound = q3 + 1.5 * iqr;

      const filteredPrices = validPrices.filter(p => p >= lowerBound && p <= upperBound);
      minPrice = filteredPrices.length > 0 ? Math.min(...filteredPrices) : validPrices[0];
      maxPrice = filteredPrices.length > 0 ? Math.max(...filteredPrices) : validPrices[validPrices.length - 1];
    } else {
      minPrice = validPrices[0];
      maxPrice = validPrices[validPrices.length - 1];
    }
  }

  if (maxPrice <= minPrice) maxPrice = minPrice + 1;

  const maxReviews = Math.max(...products.map(p => p.reviewsCount), 1);

  const normalizedQuery = query.toLowerCase().trim();
  const queryWantsAccessory = ACCESSORY_KEYWORDS.some(kw => normalizedQuery.includes(kw));

  // Score each product
  const scored = products.map(product => {
    const rawOrig = product.originalPrice ? parsePrice(product.originalPrice) : 0;
    const currentPrice = parsePrice(product.price);

    const relevance = calculateRelevance(product.name || "", query);

    // Hard elimination: if relevance is 0, product doesn't match the query at all
    if (relevance === 0) {
      return { product, score: 0 };
    }

    // Extra penalty: product name contains generic comparison phrases
    const nameLower = (product.name || "").toLowerCase();
    const isGenericMention = GENERIC_IN_DESCRIPTION.some(phrase => nameLower.includes(phrase));
    if (isGenericMention) {
      return { product, score: relevance * 0.02 };
    }

    const bayesian = (config.confidenceThreshold * globalAvg + product.reviewsCount * product.rating) /
      (config.confidenceThreshold + product.reviewsCount);
    const normalizedBayesian = Math.max(0, Math.min(1, (bayesian - 1) / 4));

    let priceScore = 0;
    if (currentPrice > 0) {
      const clampedPrice = Math.max(minPrice, Math.min(currentPrice, maxPrice));
      const logPrice = Math.log(clampedPrice);
      const logMin = Math.log(minPrice);
      const logMax = Math.log(maxPrice);

      priceScore = logMax > logMin
        ? 1 - ((logPrice - logMin) / (logMax - logMin))
        : 1;
    }

    const popularity = maxReviews > 1
      ? Math.log(1 + product.reviewsCount) / Math.log(1 + maxReviews)
      : 0;

    const storeReliability = config.storeReliabilityTable[product.store] || 0.70;

    const discountBonus = rawOrig > currentPrice
      ? (rawOrig - currentPrice) / rawOrig
      : 0;

    let score =
      config.weights.relevance * relevance +
      config.weights.bayesianRating * normalizedBayesian +
      config.weights.priceScore * priceScore +
      config.weights.popularity * popularity +
      config.weights.storeReliability * storeReliability +
      config.weights.discountBonus * discountBonus;

    // Stock Penalization
    if (product.inStock === false) {
      score *= 0.1;
    }

    // Generation mismatch — applied to final score so it affects ALL factors
    const genPenalty = calculateGenerationPenalty(normalizedQuery, nameLower);
    score *= genPenalty;

    // Accessory Penalization — very strong
    const isAccessory = ACCESSORY_KEYWORDS.some(kw => nameLower.includes(kw));
    const isPrefixedAcc = isPrefixAccessory(nameLower, normalizedQuery);
    if (!queryWantsAccessory && (isAccessory || isPrefixedAcc)) {
      score *= 0.03; // 97% penalty — accessories sink to the bottom
    }

    return { product, score };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored.map(item => item.product);
}
