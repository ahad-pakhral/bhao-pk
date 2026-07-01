type PriceDropEmailPayload = {
  productName: string;
  productUrl: string;
  oldPrice?: number;
  newPrice: number;
  targetPrice: number;
  store: string;
};

function getBhaoBaseUrl(): string {
  // Used in email deep-links back to the webapp.
  return (process.env.BHAO_WEBAPP_BASE_URL || 'http://localhost:3000').replace(/\/+$/, '');
}

function buildBhaoProductLink(productUrl: string, store: string): string {
  const base = getBhaoBaseUrl();
  const u = encodeURIComponent(productUrl);
  const s = encodeURIComponent(store);
  return `${base}/product/${u}?url=${u}&store=${s}`;
}

function assertEmailConfigured() {
  const apiKey = process.env.BREVO_API_KEY || process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  if (!apiKey || !from) {
    throw new Error('Email provider not configured (missing BREVO_API_KEY/RESEND_API_KEY and/or EMAIL_FROM)');
  }
  return { apiKey, from };
}

function formatMoney(n: number | undefined): string {
  if (typeof n !== 'number' || !Number.isFinite(n)) return '—';
  return `Rs. ${Math.round(n).toLocaleString('en-PK')}`;
}

/**
 * Send a price-drop / target-reached email via Brevo or Resend.
 *
 * Contract:
 * - If env vars are missing, throws a clear error (caller must NOT mark notified).
 * - If provider call fails, throws.
 */
export async function sendPriceDropEmail(to: string, data: PriceDropEmailPayload): Promise<void> {
  const { apiKey, from } = assertEmailConfigured();

  const link = buildBhaoProductLink(data.productUrl, data.store);
  const subject = `Price alert: ${data.productName} is now ${formatMoney(data.newPrice)}`;

  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.4;">
      <h2 style="margin: 0 0 8px 0;">Bhao.pk Price Alert</h2>
      <p style="margin: 0 0 12px 0;"><strong>${data.productName}</strong></p>
      <table style="border-collapse: collapse; margin: 0 0 12px 0;">
        <tr><td style="padding: 4px 8px; color: #666;">Store</td><td style="padding: 4px 8px;">${data.store}</td></tr>
        <tr><td style="padding: 4px 8px; color: #666;">Old price</td><td style="padding: 4px 8px;">${formatMoney(data.oldPrice)}</td></tr>
        <tr><td style="padding: 4px 8px; color: #666;">New price</td><td style="padding: 4px 8px;"><strong>${formatMoney(data.newPrice)}</strong></td></tr>
        <tr><td style="padding: 4px 8px; color: #666;">Target price</td><td style="padding: 4px 8px;">${formatMoney(data.targetPrice)}</td></tr>
      </table>
      <p style="margin: 0 0 12px 0;">
        <a href="${link}" style="display:inline-block; padding: 10px 14px; background:#4f46e5; color:#fff; text-decoration:none; border-radius:6px;">
          View on Bhao.pk
        </a>
      </p>
      <p style="margin: 0; color:#888; font-size: 12px;">You are receiving this email because you set a price alert on Bhao.pk.</p>
    </div>
  `.trim();

  if (process.env.BREVO_API_KEY) {
    const res = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'api-key': apiKey,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        sender: {
          name: 'Bhao.pk',
          email: from,
        },
        to: [{ email: to }],
        subject,
        htmlContent: html,
      }),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => '');
      throw new Error(`Brevo Email send failed (${res.status}): ${body || res.statusText}`);
    }
  } else {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: [to],
        subject,
        html,
      }),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => '');
      throw new Error(`Resend Email send failed (${res.status}): ${body || res.statusText}`);
    }
  }
}


