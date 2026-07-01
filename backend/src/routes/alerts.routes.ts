import { Router, Response } from 'express';
import { requireAuth } from '../middleware/auth.middleware';
import { db } from '../services/db.service';
import { scrapeProductDetail } from '../services/scraper.service';
import { cacheGet, cacheSet } from '../services/cache.service';
import { sendPriceDropEmail } from '../services/email.service';
import { supabaseAdmin } from '../services/supabase.service';



function snakeToCamel(obj: any): Record<string, any> {
  if (!obj || typeof obj !== 'object') return {};
  const result: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    const camelKey = key.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
    result[camelKey] = value;
  }
  return result;
}

async function ensureUserProfile(req: any, userId: string) {
  const { data: existing, error: findError } = await db.findUser(userId);
  if (existing) return;
  if (findError && (findError as any).code && (findError as any).code !== 'PGRST116') {
    throw findError;
  }
  const email = req.user?.email || '';
  const name = req.user?.user_metadata?.name || '';
  const { error: createError } = await db.createUser(userId, email, name);
  if (createError && (createError as any).code !== '23505') {
    throw createError;
  }
}

function detectStore(url: string): string | null {
  const lower = url.toLowerCase();
  if (lower.includes('daraz')) return 'daraz';
  if (lower.includes('telemart')) return 'telemart';
  if (lower.includes('shophive')) return 'shophive';
  return null;
}

const router = Router();

// All alert routes require authentication
router.use(requireAuth);

// GET /api/alerts — list user's alerts
router.get('/', async (req, res: Response) => {
  try {
    // @ts-ignore - set by authMiddleware
    const userId = req.user.id;
    await ensureUserProfile(req, userId);
    const { data: alerts, error } = await db.getAlerts(userId);

    if (error) {
      console.error('Get alerts error:', error);
      return res.status(500).json({ error: 'Failed to fetch alerts' });
    }

    res.json({ alerts: (alerts || []).map(snakeToCamel) });
  } catch (error) {
    console.error('Get alerts error:', error);
    res.status(500).json({ error: 'Failed to fetch alerts' });
  }
});

// POST /api/alerts — create new alert
router.post('/', async (req, res: Response) => {
  try {
    // @ts-ignore - set by authMiddleware
    const userId = req.user.id;
    const { keyword, productUrl, targetPrice } = req.body;

    if (!targetPrice || (!keyword && !productUrl)) {
      return res.status(400).json({ error: 'targetPrice and either keyword or productUrl are required' });
    }

    await ensureUserProfile(req, userId);

    let { data: alert, error } = await db.createAlert(userId, {
      targetPrice,
      keyword,
      productUrl,
    });

    if (error) {
      const code = (error as any).code;
      if (code === '23503') {
        // FK violation: user profile row missing
        try {
          await ensureUserProfile(req, userId);
          const retry = await db.createAlert(userId, { targetPrice, keyword, productUrl });
          alert = retry.data as any;
          error = retry.error as any;
        } catch {
          // fall through
        }
      }
    }

    if (error) {
      console.error('Create alert error:', error);
      return res.status(500).json({ error: 'Failed to create alert' });
    }

    if (!alert) {
      return res.status(500).json({ error: 'Failed to create alert (no row returned)' });
    }

    // Evaluate the target price immediately in the background so the user gets notified right away if met
    if (productUrl) {
      const storeName = detectStore(productUrl);
      if (storeName) {
        (async () => {
          try {
            const scraped = await scrapeProductDetail(productUrl, storeName);
            const currentPrice = scraped ? scraped.price : 0;
            const targetNum = Number(targetPrice);

            if (scraped && currentPrice > 0 && currentPrice <= targetNum) {
              console.log(`[Alerts API] Immediate trigger met for alert ${alert.id} (Rs. ${currentPrice} <= Rs. ${targetNum})`);
              
              // Fetch user profile email
              const { data: userProfile } = await db.findUser(userId);
              const email = (userProfile as any)?.email;

              if (email) {
                await sendPriceDropEmail(email, {
                  productName: scraped.name || 'Tracked product',
                  productUrl: productUrl,
                  newPrice: currentPrice,
                  targetPrice: targetNum,
                  store: storeName,
                });

                await db.updateAlert(alert.id, {
                  is_notified: true,
                  notified_at: new Date().toISOString(),
                  last_notified_price: currentPrice,
                });

                console.log(`[Alerts API] Immediate email sent + alert marked notified: ${alert.id}`);
              }
            }
          } catch (e: any) {
            console.warn(`[Alerts API] Immediate alert check failed for alert ${alert.id}:`, e?.message || e);
          }
        })();
      }
    }

    res.status(201).json({ alert: snakeToCamel(alert) });
  } catch (error) {
    console.error('Create alert error:', error);
    res.status(500).json({ error: 'Failed to create alert' });
  }
});

// GET /api/alerts/enriched — list user's alerts with live product data
// MUST be before /:id to avoid Express matching "enriched" as :id
router.get('/enriched', async (req, res: Response) => {
  try {
    // @ts-ignore - set by authMiddleware
    const userId = req.user.id;
    await ensureUserProfile(req, userId);
    const { data: alerts, error } = await db.getAlerts(userId);

    if (error) {
      console.error('Get enriched alerts error:', error);
      return res.status(500).json({ error: 'Failed to fetch alerts' });
    }

    const rawAlerts = (alerts || []).map(snakeToCamel);

    // Enrich each alert with live product data in parallel
    const enrichedResults = await Promise.allSettled(
      rawAlerts.map(async (alert: any) => {
        if (!alert.productUrl) {
          return { ...alert, product: null };
        }

        // Check cache first (24hr TTL for alert enrichment)
        const cacheKey = `alert-enrich:${alert.productUrl}`;
        const cached = await cacheGet(cacheKey);
        if (cached) {
          return { ...alert, product: cached };
        }

        const storeName = detectStore(alert.productUrl);
        if (!storeName) {
          return { ...alert, product: null };
        }

        // Cache miss — perform fast DB lookup
        let dbProduct: any = null;
        try {
          // Check recently viewed
          const { data: recent } = await supabaseAdmin
            .from('recently_viewed')
            .select('name, image_url, store')
            .eq('user_id', userId)
            .eq('product_url', alert.productUrl)
            .maybeSingle();

          if (recent) {
            dbProduct = {
              name: recent.name,
              imageUrl: recent.image_url,
              store: recent.store || storeName,
              price: alert.lastNotifiedPrice || alert.last_notified_price || 0,
            };
          } else {
            // Check wishlist items
            const { data: wish } = await supabaseAdmin
              .from('wishlist_items')
              .select('name, image_url, store, price')
              .eq('user_id', userId)
              .eq('product_url', alert.productUrl)
              .maybeSingle();

            if (wish) {
              dbProduct = {
                name: wish.name,
                imageUrl: wish.image_url,
                store: wish.store || storeName,
                price: wish.price || alert.lastNotifiedPrice || alert.last_notified_price || 0,
              };
            }
          }

          if (dbProduct) {
            // Retrieve latest recorded price from history
            const { data: latestHistory } = await supabaseAdmin
              .from('price_history')
              .select('price')
              .eq('product_url', alert.productUrl)
              .order('day', { ascending: false })
              .limit(1)
              .maybeSingle();
            if (latestHistory && latestHistory.price) {
              dbProduct.price = latestHistory.price;
            }
          }
        } catch (e) {
          console.warn('[Alerts Enrichment] Database fallback lookup failed:', e);
        }

        const responseProduct = dbProduct || {
          name: alert.keyword || 'Tracked Product',
          imageUrl: '',
          price: alert.lastNotifiedPrice || alert.last_notified_price || 0,
          store: storeName,
        };

        // Fire background scrape to populate/update the cache asynchronously
        (async () => {
          try {
            const product = await scrapeProductDetail(alert.productUrl!, storeName);
            if (product) {
              const productData = {
                name: product.name,
                imageUrl: product.imageUrl,
                price: product.price,
                store: product.store || storeName,
              };
              await cacheSet(cacheKey, productData, 86400); // Cache for 24 hours
              console.log(`[Alerts Enrichment] Background scrape populated cache for ${alert.productUrl}`);
            }
          } catch (err: any) {
            console.warn(`[Alerts Enrichment] Background scrape failed for ${alert.productUrl}:`, err?.message || err);
          }
        })();

        return { ...alert, product: responseProduct };
      })
    );

    const enrichedAlerts = enrichedResults.map((result) =>
      result.status === 'fulfilled' ? result.value : { ...result.reason, product: null }
    );

    res.json({ alerts: enrichedAlerts });
  } catch (error) {
    console.error('Get enriched alerts error:', error);
    res.status(500).json({ error: 'Failed to fetch enriched alerts' });
  }
});

// DELETE /api/alerts/:id — remove alert
router.delete('/:id', async (req, res: Response) => {
  try {
    // @ts-ignore - set by authMiddleware
    const userId = req.user.id;

    const { error } = await db.deleteAlert(req.params.id, userId);

    if (error) {
      console.error('Delete alert error:', error);
      return res.status(500).json({ error: 'Failed to delete alert' });
    }

    res.json({ deleted: true });
  } catch (error) {
    console.error('Delete alert error:', error);
    res.status(500).json({ error: 'Failed to delete alert' });
  }
});

export { router as alertsRoutes };
