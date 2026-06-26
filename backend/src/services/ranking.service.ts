// Server-side ranking — Bayesian average + composite scoring
// Mirrors the frontend ranking.ts logic for consistency

import { db } from './db.service';
import { aiService } from './ai.service';

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
  merchantName?: string;
  merchantRating?: number;
  merchantTrust?: number;
  brand?: string;
  isOutlier?: boolean;
}

interface BrandRule {
  keyword: string;
  brand: string;
}

let brandRulesCache: BrandRule[] = [];
let brandRulesCacheTimestamp = 0;
const CACHE_TTL = 1 * 60 * 60 * 1000; // 1 hour

async function loadBrandRules(): Promise<BrandRule[]> {
  if (brandRulesCache.length > 0 && Date.now() - brandRulesCacheTimestamp < CACHE_TTL) {
    return brandRulesCache;
  }
  const rules = await db.getBrandRules();
  brandRulesCache = rules as BrandRule[];
  brandRulesCacheTimestamp = Date.now();
  return brandRulesCache;
}

const CONFIDENCE_THRESHOLD = 25;

const STORE_RELIABILITY: Record<string, number> = {
  Daraz: 0.85,
  Telemart: 0.80,
  Shophive: 0.75,
};

// Updated Weights to include Relevance and Merchant Trust
const WEIGHTS = {
  relevance: 0.50,
  priceScore: 0.20,
  bayesianRating: 0.10,
  popularity: 0.07, // reduced from 0.10 to accommodate merchant trust
  storeReliability: 0.05,
  discountBonus: 0.05,
  merchantTrust: 0.03, // new
};

function bayesianAverage(rating: number, reviewCount: number, globalAvg: number): number {
  return (CONFIDENCE_THRESHOLD * globalAvg + reviewCount * rating) /
    (CONFIDENCE_THRESHOLD + reviewCount);
}

// Minimum fraction of query tokens that must match for a product to be considered relevant
const MIN_MATCH_RATIO = 0.4;

// 1. Text Relevance Score (Substring + Token Match + Generation Check + Position Weight)
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
  // Query at position 0 = "iPhone 16 Pro Max" for query "iphone" → actual device
  // Query at position 40+ = "GOOGLE PIXEL camera better than iphone" → mentioned in passing
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
 * E.g. "Iphone 16 Pro Max Arrow Camera Rings" → accessory (has "ring")
 * E.g. "iPhone 16 Pro Max 256GB" → NOT accessory (no accessory keywords)
 */
function isPrefixAccessory(nameLower: string, queryLower: string): boolean {
  // Extract non-stopword tokens from the query
  const queryTokens = queryLower.split(/\s+/).filter(t => t.length > 1);
  if (queryTokens.length === 0) return false;

  // Find the portion of the product name beyond the query words
  // Strategy: find the earliest position where accessory keywords appear
  // after the last query token match
  const lastTokenMatch = queryTokens.slice().reverse().find(token => {
    const escaped = token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return new RegExp(escaped, 'i').test(nameLower);
  });

  if (!lastTokenMatch) return false;

  // Find position of the last matched query token
  const escaped = lastTokenMatch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const lastMatch = new RegExp(escaped, 'i').exec(nameLower);
  if (!lastMatch) return false;

  const afterLastQuery = nameLower.substring(lastMatch.index + lastMatch[0].length).trim();

  // If there's nothing after the query words, it's likely the actual product
  if (afterLastQuery.length === 0) return false;

  // Check if what follows contains only specs/variants (GB, TB, MHz, PTA, etc.)
  // or if it contains accessory keywords
  const onlySpecs = /^(\/?\s*\d+\s*(gb|tb|gbps|mh[zs]|inch|mp|px|pt|mah|watt|v|a|g|kg|oz|mm|cm)\s*[\/,]?\s*)+$/i.test(afterLastQuery);
  if (onlySpecs) return false;

  return ACCESSORY_KEYWORDS.some(kw => afterLastQuery.includes(kw));
}

// Stop-words that are too generic to indicate a specific product
const GENERIC_IN_DESCRIPTION = [
  'better than', 'alternative to', 'like iphone', 'unlike',
];


function getQueryBrands(query: string, brandRules: BrandRule[]): string[] {
  const queryLower = query.toLowerCase();
  const foundBrands = new Set<string>();
  
  const commonBrands = [
    "Apple", "Samsung", "Xiaomi", "Casio", "Infinix", "Tecno", "Realme", "OnePlus",
    "Vivo", "Oppo", "Lenovo", "HP", "Dell", "Asus", "Acer", "Sony", "Canon", "Nikon",
    "Seiko", "Citizen", "Rolex", "Huawei", "Google", "Motorola", "Nokia", "LG", "TCL"
  ];
  
  for (const b of commonBrands) {
    if (queryLower.includes(b.toLowerCase())) {
      foundBrands.add(b);
    }
  }

  for (const rule of brandRules) {
    const escaped = rule.keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`\\b${escaped}\\b`, 'i');
    if (regex.test(queryLower)) {
      foundBrands.add(rule.brand);
    }
  }
  
  if (queryLower.includes("iphone") || queryLower.includes("ipad") || queryLower.includes("macbook")) {
    foundBrands.add("Apple");
  }

  return Array.from(foundBrands);
}

function fallbackBrandDetector(name: string): string {
  const commonBrands = [
    "Apple", "Samsung", "Xiaomi", "Casio", "Infinix", "Tecno", "Realme", "OnePlus",
    "Vivo", "Oppo", "Lenovo", "HP", "Dell", "Asus", "Acer", "Sony", "Canon", "Nikon",
    "Seiko", "Citizen", "Rolex", "Huawei", "Google", "Motorola", "Nokia", "LG", "TCL"
  ];
  const nameLower = name.toLowerCase();
  for (const b of commonBrands) {
    if (nameLower.includes(b.toLowerCase())) {
      return b;
    }
  }
  return "Generic";
}

export async function rankProducts(products: ScrapedProduct[], query: string = ""): Promise<ScrapedProduct[]> {
  if (products.length === 0) return [];

  let brandRules: BrandRule[] = [];
  // 1. Dynamic Brand Classification
  try {
    brandRules = await loadBrandRules();
    
    // Classify using existing cached rules
    for (const product of products) {
      let matchedBrand: string | null = null;
      const nameLower = product.name.toLowerCase();
      for (const rule of brandRules) {
        const escaped = rule.keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(`\\b${escaped}\\b`, 'i');
        if (regex.test(nameLower)) {
          matchedBrand = rule.brand;
          break;
        }
      }
      if (matchedBrand) {
        product.brand = matchedBrand;
      }
    }

    // Identify unclassified products
    const unclassified = products.filter(p => !p.brand);
    if (unclassified.length > 0) {
      // Instantly assign fallback brand detector so search returns immediately
      for (const p of unclassified) {
        p.brand = fallbackBrandDetector(p.name);
      }

      // Perform AI brand extraction and DB caching in the background
      (async () => {
        try {
          console.log(`[Ranking-Background] Performing AI brand extraction for ${unclassified.length} products...`);
          const mappedBrands = await aiService.extractBrands(
            unclassified.map((p, i) => ({ id: i.toString(), name: p.name }))
          );
          
          const newRulesToSave: Array<{ keyword: string; brand: string }> = [];
          for (let i = 0; i < unclassified.length; i++) {
            const extracted = mappedBrands[i.toString()];
            if (extracted && extracted !== 'Generic') {
              const kw = extracted.toLowerCase().trim();
              if (kw && !brandRules.some(r => r.keyword === kw)) {
                const newRule = { keyword: kw, brand: extracted };
                newRulesToSave.push(newRule);
                brandRules.push(newRule); // update local cache list
              }
            }
          }

          if (newRulesToSave.length > 0) {
            await db.insertBrandRules(newRulesToSave);
            console.log(`[Ranking-Background] Cached ${newRulesToSave.length} new brand rules to DB:`, newRulesToSave.map(r => r.brand));
          }
        } catch (bgErr) {
          console.error('[Ranking-Background] Async brand extraction failed:', bgErr);
        }
      })();
    }
  } catch (e) {
    console.error('[Ranking] Brand rules loading failed, falling back to local detection:', e);
    for (const p of products) {
      if (!p.brand) p.brand = fallbackBrandDetector(p.name);
    }
  }

  // Detect if the query specifies exactly one brand
  let singleQueryBrand: string | null = null;
  if (query) {
    const queryBrands = getQueryBrands(query, brandRules);
    if (queryBrands.length === 1) {
      singleQueryBrand = queryBrands[0];
      console.log(`[Ranking] Detected single brand in query: "${singleQueryBrand}"`);
    }
  }

  // Compute global averages
  const totalRating = products.reduce((sum, p) => sum + p.rating, 0);
  const globalAvg = totalRating / products.length;

  // 2. Outlier Filtering for Price Range (Percentile Method)
  const validPrices = products.map(p => p.price).filter(p => p > 0).sort((a, b) => a - b);
  let minPrice = 1;
  let maxPrice = 1;
  let lowerBound = 0;
  let upperBound = Infinity;

  if (validPrices.length > 0) {
    if (validPrices.length > 3) {
      // 5th and 95th percentiles
      lowerBound = validPrices[Math.floor(validPrices.length * 0.05)];
      upperBound = validPrices[Math.floor(validPrices.length * 0.95)];

      const filteredPrices = validPrices.filter(p => p >= lowerBound && p <= upperBound);
      minPrice = filteredPrices.length > 0 ? Math.min(...filteredPrices) : validPrices[0];
      maxPrice = filteredPrices.length > 0 ? Math.max(...filteredPrices) : validPrices[validPrices.length - 1];
    } else {
      minPrice = validPrices[0];
      maxPrice = validPrices[validPrices.length - 1];
      lowerBound = minPrice;
      upperBound = maxPrice;
    }
  }

  if (maxPrice <= minPrice) maxPrice = minPrice + 1;

  const maxReviews = Math.max(...products.map(p => p.reviewsCount), 1);

  const normalizedQuery = query.toLowerCase().trim();
  const queryWantsAccessory = ACCESSORY_KEYWORDS.some(kw => normalizedQuery.includes(kw));

  // Score each product
  const scored = products.map((product) => {
    const relevance = calculateRelevance(product.name, query);

    // Hard elimination: if relevance is 0, product doesn't match the query at all
    if (relevance === 0) {
      return { ...product, _score: 0, isOutlier: product.price < lowerBound || product.price > upperBound };
    }

    // Hard brand mismatch elimination:
    // If the query specified exactly one brand (e.g. "Apple")
    // and the product brand is a known competitor brand (e.g. "Samsung", "Infinix")
    // then eliminate the product.
    if (singleQueryBrand && product.brand && product.brand !== "Generic" && product.brand !== "Unknown") {
      if (product.brand.toLowerCase() !== singleQueryBrand.toLowerCase()) {
        return { ...product, _score: 0, isOutlier: product.price < lowerBound || product.price > upperBound };
      }
    }

    // Extra penalty: product name contains generic comparison phrases
    const nameLower = product.name.toLowerCase();
    const isGenericMention = GENERIC_IN_DESCRIPTION.some(phrase => nameLower.includes(phrase));
    if (isGenericMention) {
      return { ...product, _score: relevance * 0.02, isOutlier: product.price < lowerBound || product.price > upperBound };
    }

    // Merchant Trust Blend
    let ratingVal = product.rating;
    let reviewsVal = product.reviewsCount;
    const merchantRating = product.merchantRating || 4.2;
    const merchantTrust = product.merchantTrust || 0.70;

    if (reviewsVal === 0) {
      ratingVal = merchantRating;
      reviewsVal = 5 * merchantTrust;
    } else {
      ratingVal = (product.rating * reviewsVal + merchantRating * 3) / (reviewsVal + 3);
      reviewsVal = reviewsVal + 3 * merchantTrust;
    }

    const bayesian = bayesianAverage(ratingVal, reviewsVal, globalAvg);
    const normalizedBayesian = Math.max(0, Math.min(1, (bayesian - 1) / 4));

    let priceScore = 0;
    if (product.price > 0) {
      const clampedPrice = Math.max(minPrice, Math.min(product.price, maxPrice));
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

    const storeReliability = STORE_RELIABILITY[product.store] || 0.70;

    const discountBonus = product.originalPrice && product.originalPrice > product.price
      ? (product.originalPrice - product.price) / product.originalPrice
      : 0;

    let score =
      WEIGHTS.relevance * relevance +
      WEIGHTS.bayesianRating * normalizedBayesian +
      WEIGHTS.priceScore * priceScore +
      WEIGHTS.popularity * popularity +
      WEIGHTS.storeReliability * storeReliability +
      WEIGHTS.discountBonus * discountBonus +
      WEIGHTS.merchantTrust * merchantTrust;

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
      return { ...product, _score: 0, isOutlier: product.price < lowerBound || product.price > upperBound };
    }

    const isOutlier = product.price < lowerBound || product.price > upperBound;

    return { ...product, _score: score, isOutlier };
  });

  // Filter out completely irrelevant/mismatched products (score <= 0)
  const filteredScored = scored.filter(p => p._score > 0);

  filteredScored.sort((a, b) => b._score - a._score);

  // Strip internal score before returning
  return filteredScored.map(({ _score, ...product }) => product);
}
