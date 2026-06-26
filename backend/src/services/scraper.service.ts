// Scraper service — spawns Python scrapers and collects results
// Node.js <-> Python communication via child_process.spawn

import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';

export interface ScrapedProduct {
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


export interface ProductDetail {
  price: number;
  originalPrice?: number;
  inStock: boolean;
  name: string;
  imageUrl: string;
  rating: number;
  reviewsCount: number;
  description: string;
  specs: { key: string; value: string }[];
  reviews: { author: string; rating: number; text: string; date: string }[];
  store?: string;
}

const SCRAPERS_DIR = path.join(__dirname, '../../scrapers');
const VENV_PYTHON = path.join(SCRAPERS_DIR, '.venv', 'bin', 'python3');
const PYTHON_BIN = fs.existsSync(VENV_PYTHON) ? VENV_PYTHON : 'python3';
const STORES = ['daraz', 'shophive', 'telemart'];
const SCRAPER_TIMEOUT = 30000;

function scrapeStore(keyword: string, store: string, page: number = 1): Promise<ScrapedProduct[]> {
  return new Promise((resolve) => {
    const proc = spawn(PYTHON_BIN, [
      path.join(SCRAPERS_DIR, 'run_search.py'),
      '--keyword', keyword,
      '--store', store,
      '--page', String(page),
    ], {
      timeout: SCRAPER_TIMEOUT,
      env: { ...process.env, PYTHONIOENCODING: 'utf-8' },
    });

    let stdout = '';
    let stderr = '';

    proc.stdout.on('data', (data) => { stdout += data.toString(); });
    proc.stderr.on('data', (data) => { stderr += data.toString(); });

    proc.on('close', (code) => {
      if (code === 0 && stdout.trim()) {
        try {
          const products: ScrapedProduct[] = JSON.parse(stdout);
          resolve(products);
        } catch (e) {
          console.error(`Failed to parse ${store} scraper output:`, stdout.slice(0, 200));
          resolve([]);
        }
      } else {
        if (stderr) console.error(`${store} scraper error:`, stderr.slice(0, 300));
        resolve([]);
      }
    });

    proc.on('error', (err) => {
      console.error(`Failed to spawn ${store} scraper:`, err.message);
      resolve([]);
    });
  });
}

export async function searchAllStores(keyword: string, page: number = 1): Promise<ScrapedProduct[]> {
  const results = await Promise.allSettled(
    STORES.map(store => scrapeStore(keyword, store, page))
  );

  const allProducts: ScrapedProduct[] = [];
  for (const result of results) {
    if (result.status === 'fulfilled' && result.value.length > 0) {
      allProducts.push(...result.value);
    }
  }

  return allProducts;
}

/**
 * Scrape a single product page for full details.
 */
export function scrapeProductDetail(url: string, store: string): Promise<ProductDetail | null> {
  return new Promise((resolve) => {
    const proc = spawn(PYTHON_BIN, [
      path.join(SCRAPERS_DIR, 'run_search.py'),
      '--url', url,
      '--store', store,
      '--mode', 'product',
    ], {
      timeout: SCRAPER_TIMEOUT,
      env: { ...process.env, PYTHONIOENCODING: 'utf-8' },
    });

    let stdout = '';
    let stderr = '';

    proc.stdout.on('data', (data) => { stdout += data.toString(); });
    proc.stderr.on('data', (data) => { stderr += data.toString(); });

    proc.on('close', (code) => {
      if (code === 0 && stdout.trim()) {
        try {
          const data: ProductDetail = JSON.parse(stdout);
          data.store = data.store || store;
          resolve(data);
        } catch (e) {
          console.error('Failed to parse product detail:', stdout.slice(0, 200));
          resolve(null);
        }
      } else {
        if (stderr) console.error(`Product detail error (${store}):`, stderr.slice(0, 300));
        resolve(null);
      }
    });
    proc.on('error', (err) => {
      console.error(`Failed to spawn product detail scraper:`, err.message);
      resolve(null);
    });
  });
}

// Backward compat
export const scrapeProductPage = scrapeProductDetail;
