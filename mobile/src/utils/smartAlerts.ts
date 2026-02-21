// Smart alerts: cross-store price tracking with alternative discovery

import { SmartAlert, StoreSnapshot, AlternativeProduct } from '../types/models';
import { calculateProductScore, computeGlobalAverage, parsePrice, rankByRelevance } from './ranking';

/**
 * Build store snapshots for products with the same name across different stores.
 */
export function buildStoreSnapshots(
  productName: string,
  allProducts: Array<{ name: string; store?: string; price?: string }>,
  originalPrice: number
): StoreSnapshot[] {
  return allProducts
    .filter(p => p.name.toLowerCase() === productName.toLowerCase())
    .map(p => {
      const price = p.price ? parsePrice(p.price) : 0;
      return {
        store: p.store || 'Unknown',
        price,
        url: '',
        inStock: true,
        lastUpdated: new Date(),
        priceChange: price - originalPrice,
        priceChangePercent: originalPrice > 0
          ? ((price - originalPrice) / originalPrice) * 100
          : 0,
      };
    })
    .sort((a, b) => a.price - b.price);
}

function generateReason(
  alt: { price?: string; rating?: number; reviewsCount?: number },
  originalPrice: number,
  originalRating?: number
): string {
  const altPrice = alt.price ? parsePrice(alt.price) : 0;
  const priceDiff = originalPrice - altPrice;
  const pricePct = originalPrice > 0
    ? Math.round((priceDiff / originalPrice) * 100)
    : 0;

  if (pricePct >= 10) return `${pricePct}% cheaper`;
  if (priceDiff > 0) return `Rs. ${priceDiff.toLocaleString()} less`;
  if ((alt.rating || 0) > (originalRating || 0)) return 'Higher rated';
  if ((alt.reviewsCount || 0) > 100) return `More trusted (${alt.reviewsCount} reviews)`;
  return 'Better overall value';
}

/**
 * Find alternative products in the same category that are better deals.
 */
export function findAlternatives(
  alertedProduct: {
    id: string;
    name: string;
    category?: string;
    price?: string;
    rating?: number;
    reviewsCount?: number;
    store?: string;
  },
  allProducts: Array<{
    id: string;
    name: string;
    image: string;
    category?: string;
    price?: string;
    rating?: number;
    reviewsCount?: number;
    store?: string;
  }>,
  maxAlternatives: number = 3
): AlternativeProduct[] {
  const alertedPrice = alertedProduct.price ? parsePrice(alertedProduct.price) : 0;
  const alertedCategory = alertedProduct.category || '';

  // Same category, different product (not just different store listing of same product)
  const candidates = allProducts.filter(
    p => p.id !== alertedProduct.id &&
      p.name.toLowerCase() !== alertedProduct.name.toLowerCase() &&
      p.category &&
      p.category.toLowerCase() === alertedCategory.toLowerCase()
  );

  if (candidates.length === 0) return [];

  const ranked = rankByRelevance(candidates);
  const alternatives: AlternativeProduct[] = [];

  for (const candidate of ranked) {
    if (alternatives.length >= maxAlternatives) break;

    const candidatePrice = candidate.price ? parsePrice(candidate.price) : 0;
    const isCheaper = candidatePrice < alertedPrice;
    const isHigherRated = (candidate.rating || 0) > (alertedProduct.rating || 0);

    if (isCheaper || isHigherRated) {
      alternatives.push({
        productId: candidate.id,
        productName: candidate.name,
        productImage: candidate.image,
        price: candidatePrice,
        store: candidate.store || '',
        url: '',
        rating: candidate.rating || 0,
        reviewsCount: candidate.reviewsCount || 0,
        reason: generateReason(candidate, alertedPrice, alertedProduct.rating),
        score: 0,
      });
    }
  }

  return alternatives;
}

/**
 * Check if a smart alert should trigger.
 */
export function shouldAlertTrigger(alert: SmartAlert): boolean {
  if (!alert.isActive || alert.isTriggered) return false;

  if (alert.alertType === 'target_price') {
    return alert.bestCurrentPrice <= alert.targetPrice;
  }

  if (alert.alertType === 'every_change') {
    return alert.bestCurrentPrice !== alert.originalPrice;
  }

  return false;
}

/**
 * Create a SmartAlert from the product detail screen context.
 */
export function createSmartAlert(
  product: {
    id: string;
    name: string;
    image: string;
    price?: string;
    store?: string;
    category?: string;
    rating?: number;
    reviewsCount?: number;
  },
  alertType: 'every_change' | 'target_price',
  targetPrice: number | undefined,
  allProducts: Array<{
    id: string;
    name: string;
    image: string;
    category?: string;
    price?: string;
    rating?: number;
    reviewsCount?: number;
    store?: string;
  }>
): SmartAlert {
  const currentPrice = product.price ? parsePrice(product.price) : 0;
  const resolvedTarget = alertType === 'every_change'
    ? currentPrice
    : (targetPrice || currentPrice);

  // Build cross-store snapshots
  const trackedStores = buildStoreSnapshots(
    product.name,
    allProducts,
    currentPrice
  );

  // If no cross-store matches found, add the current product's store
  if (trackedStores.length === 0) {
    trackedStores.push({
      store: product.store || 'Unknown',
      price: currentPrice,
      url: '',
      inStock: true,
      lastUpdated: new Date(),
    });
  }

  const bestSnapshot = trackedStores.reduce(
    (best, s) => s.price < best.price ? s : best,
    trackedStores[0]
  );

  // Find alternatives
  const alternatives = findAlternatives(product, allProducts, 3);

  return {
    id: `smart_alert_${product.id}_${Date.now()}`,
    userId: 'user_1',
    productId: product.id,
    productName: product.name,
    productImage: product.image,
    category: product.category || '',
    originalPrice: currentPrice,
    targetPrice: resolvedTarget,
    alertType,
    trackedStores,
    bestCurrentPrice: bestSnapshot.price,
    bestCurrentStore: bestSnapshot.store,
    alternatives,
    isActive: true,
    isTriggered: false,
    createdAt: new Date(),
    lastCheckedAt: new Date(),
  };
}
