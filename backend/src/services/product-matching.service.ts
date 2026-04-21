// Product matching service — fuzzy cross-store matching using fuse.js
// Finds the same product listed on different stores for price comparison

import Fuse from 'fuse.js';
import { ScrapedProduct } from './scraper.service';

// Store-specific suffixes that add noise to product names
export const STORE_SUFFIXES = [
  'free delivery',
  'official warranty',
  'best price',
  'cash on delivery',
  'genuine product',
  'brand new',
  'imported',
  'local stock',
  'online shopping',
  'buy now',
  'order now',
  'limited stock',
  'best deals',
  'daraz',
  'telemart',
  'shophive',
];

// Accessory keywords — duplicated here to keep matching service self-contained
// (avoids cross-boundary coupling with ranking.service.ts)
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
  'camera ring', 'arrow', 'lens ring', 'bezel', 'button',
  'antenna', 'speaker mesh', 'earpiece', 'microphone mesh',
  'volume button', 'power button', 'sim tray', 'sim slot',
  // Additional non-device keywords
  'matte', 'glossy', 'transparent', 'clear', 'tinted',
  'hybrid', 'armor', 'defender', 'rugged',
];

// Build regex patterns from suffixes for stripping
const SUFFIX_PATTERNS = STORE_SUFFIXES.map(suffix => {
  const escaped = suffix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`\\s*[-|\\u2013|,]?\\s*${escaped}`, 'gi');
});

/**
 * Clean a product name by stripping store-specific suffixes.
 */
export function cleanProductName(name: string): string {
  let cleaned = name;
  for (const pattern of SUFFIX_PATTERNS) {
    cleaned = cleaned.replace(pattern, '');
  }
  return cleaned.trim();
}

/**
 * Check if a product is an accessory based on its name.
 */
function isAccessory(name: string): boolean {
  const nameLower = name.toLowerCase();
  return ACCESSORY_KEYWORDS.some(kw => {
    const idx = nameLower.indexOf(kw);
    return idx !== -1;
  });
}

/**
 * Find matching products across stores using fuzzy name matching.
 *
 * Given a source product and a list of candidate search results, returns only
 * those products that match the source product name (excluding the source itself
 * and accessories).
 *
 * Results are sorted by price ascending (cheapest first) for Best Value.
 */
export function findMatchingProducts(
  sourceProduct: { name: string; url: string },
  searchResults: ScrapedProduct[],
  threshold: number = 0.3
): ScrapedProduct[] {
  // 1. Exclude the source product (no self-match)
  const filtered = searchResults.filter(p => p.url !== sourceProduct.url);

  // 2. Filter out accessories
  const nonAccessories = filtered.filter(p => !isAccessory(p.name));

  // 3. Clean product names and attach cleanedName
  const cleanedResults = nonAccessories.map(p => ({
    ...p,
    cleanedName: cleanProductName(p.name),
  }));

  // 4. Fuzzy match using fuse.js
  const fuse = new Fuse(cleanedResults, {
    keys: [{ name: 'cleanedName', weight: 1.0 }],
    threshold,
    includeScore: true,
    minMatchCharLength: 4,
  });

  const sourceCleaned = cleanProductName(sourceProduct.name);
  const fuseMatches = fuse.search(sourceCleaned);

  // 5. Post-filter: require at least one distinguishing word from source to appear in match
  // Extract meaningful words (length >= 3, not common filler words) from source name
  const fillerWords = new Set(['the', 'and', 'for', 'with', 'new', 'buy', 'best', 'official', 'warranty', 'free', 'delivery', 'price', 'gb', 'tb', 'ram', 'storage']);
  const sourceWords = sourceCleaned
    .toLowerCase()
    .split(/\s+/)
    .filter(w => w.length >= 3 && !fillerWords.has(w));

  const matches = fuseMatches.filter(m => {
    const matchNameLower = (m.item.cleanedName || m.item.name || '').toLowerCase();
    // At least one source word (length >= 3) must appear in the match name
    return sourceWords.some(w => matchNameLower.includes(w));
  });

  // 6. Return matches sorted by price ascending (cheapest first)
  return matches
    .map(m => m.item)
  // 6. Return matches sorted by price ascending (cheapest first)
  return matches
    .map(m => m.item)
    .sort((a, b) => a.price - b.price);
}
