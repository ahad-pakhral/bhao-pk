import cron from 'node-cron';
import { prisma } from './prisma.service';
import { scrapeProductPage } from './scraper.service';

async function checkAlerts() {
  console.log(`[Alert Checker] Starting check at ${new Date().toISOString()}`);

  try {
    const alerts = await prisma.priceAlert.findMany({
      where: { isNotified: false }
    });

    console.log(`[Alert Checker] Checking ${alerts.length} active alerts`);

    for (const alert of alerts) {
      try {
        if (!alert.productUrl) continue;

        // Split store namespace out since our DB doesn't have an explicit store column in PriceAlert right now
        const storeName = alert.productUrl.includes('daraz') ? 'daraz' :
          (alert.productUrl.includes('mega') ? 'mega' : 'unknown');

        if (storeName === 'unknown') continue;

        const scraped = await scrapeProductPage(alert.productUrl, storeName);

        if (!scraped) {
          console.warn(`[Alert Checker] Failed to scrape alert ${alert.id}`);
          continue;
        }

        const currentPrice = scraped.price;

        if (currentPrice <= alert.targetPrice) {
          console.log(
            `[Alert Checker] TRIGGERED: Alert ${alert.id} — ` +
            `Rs. ${currentPrice} ` +
            `(target: Rs. ${alert.targetPrice})`
          );

          await prisma.priceAlert.update({
            where: { id: alert.id },
            data: { isNotified: true }
          });

          // TODO: Send push notification (Expo) and/or email (SendGrid/nodemailer)
          // For now, just log the trigger
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

/**
 * Start the periodic alert checker cron job.
 * Runs every 30 minutes.
 */
export function startAlertChecker() {
  // Every 30 minutes
  cron.schedule('*/30 * * * *', () => {
    checkAlerts();
  });

  console.log('[Alert Checker] Scheduled to run every 30 minutes');
}
