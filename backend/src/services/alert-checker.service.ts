import cron from 'node-cron';
import { db } from './db.service';
import { scrapeProductPage } from './scraper.service';
import { sendPriceDropEmail } from './email.service';

/**
 * Detect store name from product URL
 */
function detectStore(url: string): string | null {
  const lower = url.toLowerCase();
  if (lower.includes('daraz')) return 'daraz';
  if (lower.includes('telemart')) return 'telemart';
  if (lower.includes('shophive')) return 'shophive';
  if (lower.includes('mega.pk')) return 'mega';
  if (lower.includes('priceoye')) return 'priceoye';
  return null;
}

function toNum(n: any): number {
  const v = typeof n === 'number' ? n : Number(n);
  return Number.isFinite(v) ? v : 0;
}

async function checkAlerts() {
  console.log(`[Alert Checker] Starting check at ${new Date().toISOString()}`);

  try {
    const { data: alerts, error } = await db.getActiveAlerts();

    if (error) {
      console.error('[Alert Checker] Failed to fetch alerts:', error);
      return;
    }

    console.log(`[Alert Checker] Checking ${alerts?.length || 0} active alerts`);

    for (const alert of (alerts || [])) {
      try {
        if (!alert.product_url) continue;
        // Duplicate prevention: skip anything already notified (defensive, even though getActiveAlerts filters).
        if (alert.is_notified || alert.notified_at) continue;

        const storeName = detectStore(alert.product_url);
        if (!storeName) {
          console.warn(`[Alert Checker] Unknown store for URL: ${alert.product_url}`);
          continue;
        }

        const scraped = await scrapeProductPage(alert.product_url, storeName);

        if (!scraped) {
          console.warn(`[Alert Checker] Failed to scrape alert ${alert.id}`);
          continue;
        }

        const currentPrice = toNum(scraped.price);

        const targetPrice = toNum(alert.target_price);
        if (!currentPrice || !targetPrice) continue;

        if (currentPrice <= targetPrice) {
          console.log(
            `[Alert Checker] TRIGGERED: Alert ${alert.id} — ` +
            `Rs. ${currentPrice} ` +
            `(target: Rs. ${targetPrice})`
          );

          // Fetch destination email (stored in our `users` profile table).
          const userId = String(alert.user_id || '');
          if (!userId) {
            console.warn(`[Alert Checker] Missing user_id for alert ${alert.id}`);
            continue;
          }

          const userRes = await db.findUser(userId);
          const email = (userRes.data as any)?.email as string | undefined;
          if (!email) {
            console.warn(`[Alert Checker] No email found for user ${userId} (alert ${alert.id}). Not marking notified.`);
            continue;
          }

          // Best-effort previous price from price_history (previous day point).
          let oldPrice: number | undefined = undefined;
          try {
            const hist = await db.getLatestPriceHistoryPoints(alert.product_url, storeName, 2);
            const pts = hist.data || [];
            if (pts.length >= 2) {
              oldPrice = toNum((pts[1] as any).price) || undefined;
            }
          } catch {
            // non-critical
          }

          try {
            await sendPriceDropEmail(email, {
              productName: String(scraped.name || 'Tracked product'),
              productUrl: String(alert.product_url),
              oldPrice,
              newPrice: currentPrice,
              targetPrice,
              store: storeName,
            });
          } catch (e: any) {
            console.warn(`[Alert Checker] Email send failed for alert ${alert.id}. Not marking notified.`, e?.message || e);
            continue;
          }

          await db.updateAlert(alert.id, {
            is_notified: true,
            notified_at: new Date().toISOString(),
            last_notified_price: currentPrice,
          });

          console.log(`[Alert Checker] Email sent + alert marked notified: ${alert.id}`);
        }
      } catch (err) {
        console.error(`[Alert Checker] Error checking alert ${alert.id}:`, err);
      }
    }

    console.log(`[Alert Checker] Check complete`);
  } catch (error) {
    console.error('[Alert Checker] Fatal error:', error);
  }
}

// For manual verification / debugging (e.g. run once in a script or REPL).
export async function runAlertCheckOnce() {
  return checkAlerts();
}

/**
 * Start the periodic alert checker cron job.
 * Runs every 30 minutes.
 */
export function startAlertChecker() {
  cron.schedule('*/30 * * * *', () => {
    checkAlerts();
  });

  console.log('[Alert Checker] Scheduled to run every 30 minutes');
}
