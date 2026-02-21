// Scraper service — spawns Python scrapers and collects results
// Node.js <-> Python communication via child_process.spawn

import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';

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

const SCRAPERS_DIR = path.join(__dirname, '../../scrapers');
const VENV_PYTHON = path.join(SCRAPERS_DIR, '.venv', 'bin', 'python3');
// Use venv python if available, fall back to system python3
const PYTHON_BIN = fs.existsSync(VENV_PYTHON) ? VENV_PYTHON : 'python3';
const STORES = ['daraz', 'shophive', 'mega', 'priceoye'];
const SCRAPER_TIMEOUT = 30000; // 30s per store

/**
 * Scrape a single store for a keyword.
 * Spawns the Python scraper as a child process, reads JSON from stdout.
 */
function scrapeStore(keyword: string, store: string): Promise<ScrapedProduct[]> {
  return new Promise((resolve, reject) => {
    const proc = spawn(PYTHON_BIN, [
      path.join(SCRAPERS_DIR, 'run_search.py'),
      '--keyword', keyword,
      '--store', store,
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
          resolve([]); // Don't fail the whole search for one store
        }
      } else {
        if (stderr) console.error(`${store} scraper error:`, stderr.slice(0, 300));
        resolve([]); // Graceful degradation — skip failed stores
      }
    });

    proc.on('error', (err) => {
      console.error(`Failed to spawn ${store} scraper:`, err.message);
      resolve([]);
    });
  });
}

/**
 * Scrape all stores in parallel for a keyword.
 * Uses Promise.allSettled so one store failure doesn't block others.
 */
export async function searchAllStores(keyword: string): Promise<ScrapedProduct[]> {
  const results = await Promise.allSettled(
    STORES.map(store => scrapeStore(keyword, store))
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
 * Scrape a single product page to get current price (used by alert checker).
 */
export function scrapeProductPage(url: string, store: string): Promise<{ price: number; inStock: boolean } | null> {
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

    proc.stdout.on('data', (data) => { stdout += data.toString(); });
    proc.on('close', (code) => {
      if (code === 0 && stdout.trim()) {
        try {
          resolve(JSON.parse(stdout));
        } catch {
          resolve(null);
        }
      } else {
        resolve(null);
      }
    });
    proc.on('error', () => resolve(null));
  });
}
