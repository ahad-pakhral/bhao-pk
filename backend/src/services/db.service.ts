// Database service — Supabase wrapper replacing Prisma
// Uses supabaseAdmin (service role) to bypass RLS for backend operations

import { supabaseAdmin } from './supabase.service';

export const db = {
  // ==========================================
  // Users
  // ==========================================
  createUser: (id: string, email: string, name?: string) =>
    supabaseAdmin
      .from('users')
      .insert({ id, email, name })
      .select()
      .single(),

  findUser: (id: string) =>
    supabaseAdmin.from('users').select('*').eq('id', id).single(),

  // ==========================================
  // Wishlist
  // ==========================================
  getWishlist: (userId: string) =>
    supabaseAdmin
      .from('wishlist_items')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false }),

  addWishlistItem: (userId: string, data: { store: string; url: string; name: string; imageUrl?: string | null }) =>
    supabaseAdmin
      .from('wishlist_items')
      .insert({
        user_id: userId,
        store: data.store,
        url: data.url,
        name: data.name,
        image_url: data.imageUrl || null,
      })
      .select()
      .single(),

  removeWishlistItem: (id: string, userId: string) =>
    supabaseAdmin
      .from('wishlist_items')
      .delete()
      .eq('id', id)
      .eq('user_id', userId),

  // ==========================================
  // Price Alerts
  // ==========================================
  getAlerts: (userId: string) =>
    supabaseAdmin
      .from('price_alerts')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false }),

  getActiveAlerts: () =>
    supabaseAdmin
      .from('price_alerts')
      .select('*')
      .eq('is_notified', false),

  createAlert: (userId: string, data: { targetPrice: number; keyword?: string; productUrl?: string }) =>
    supabaseAdmin
      .from('price_alerts')
      .insert({
        user_id: userId,
        target_price: data.targetPrice,
        keyword: data.keyword,
        product_url: data.productUrl,
      })
      .select()
      .single(),

  updateAlert: (id: string, data: { is_notified?: boolean; notified_at?: string | null; last_notified_price?: number | null }) =>
    supabaseAdmin
      .from('price_alerts')
      .update(data)
      .eq('id', id),

  deleteAlert: (id: string, userId: string) =>
    supabaseAdmin
      .from('price_alerts')
      .delete()
      .eq('id', id)
      .eq('user_id', userId),

  // ==========================================
  // Search History
  // ==========================================
  logSearch: (userId: string, query: string) =>
    supabaseAdmin
      .from('search_history')
      .insert({ user_id: userId, query }),

  getSearchHistory: (userId: string) =>
    supabaseAdmin
      .from('search_history')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50),

  clearSearchHistory: (userId: string) =>
    supabaseAdmin
      .from('search_history')
      .delete()
      .eq('user_id', userId),

  // ==========================================
  // Recently Viewed (User-specific)
  // ==========================================
  upsertRecentlyViewed: (userId: string, data: { productUrl: string; store: string; name: string; imageUrl?: string | null }) =>
    supabaseAdmin
      .from('recently_viewed')
      .upsert({
        user_id: userId,
        product_url: data.productUrl,
        store: data.store,
        name: data.name,
        image_url: data.imageUrl || null,
        last_viewed_at: new Date().toISOString(),
      }, { onConflict: 'user_id,product_url' }),

  getRecentlyViewed: (userId: string, limit: number = 20) =>
    supabaseAdmin
      .from('recently_viewed')
      .select('*')
      .eq('user_id', userId)
      .order('last_viewed_at', { ascending: false })
      .limit(limit),

  // ==========================================
  // Price History (Daily Snapshots)
  // ==========================================
  recordPriceSnapshot: (input: { productUrl: string; store: string; price: number; day: string; scrapedAt?: string }) =>
    supabaseAdmin
      .from('price_history')
      .upsert({
        product_url: input.productUrl,
        store: input.store,
        price: input.price,
        day: input.day,
        scraped_at: input.scrapedAt || new Date().toISOString(),
      }, { onConflict: 'product_url,store,day' }),

  recordPriceSnapshots: (inputs: Array<{ productUrl: string; store: string; price: number; day: string; scrapedAt?: string }>) => {
    if (!inputs || inputs.length === 0) {
      // Keep the call sites simple (best-effort no-op).
      return supabaseAdmin.from('price_history').select('id', { head: true, count: 'exact' }).limit(0);
    }
    return supabaseAdmin
      .from('price_history')
      .upsert(inputs.map(i => ({
        product_url: i.productUrl,
        store: i.store,
        price: i.price,
        day: i.day,
        scraped_at: i.scrapedAt || new Date().toISOString(),
      })), { onConflict: 'product_url,store,day' });
  },

  getPriceHistory: (productUrl: string, store?: string | null) => {
    let q = supabaseAdmin
      .from('price_history')
      .select('day,price,store')
      .eq('product_url', productUrl)
      .order('day', { ascending: true });
    // Store casing is not guaranteed (e.g., "Daraz" vs "daraz"), so filter case-insensitively.
    if (store) q = q.ilike('store', store);
    return q;
  },

  getLatestPriceHistoryPoints: (productUrl: string, store?: string | null, limit: number = 2) => {
    let q = supabaseAdmin
      .from('price_history')
      .select('day,price,store')
      .eq('product_url', productUrl)
      .order('day', { ascending: false })
      .limit(limit);
    if (store) q = q.ilike('store', store);
    return q;
  },

  // ==========================================
  // User Updates
  // ==========================================
  updateUser: (id: string, data: { name?: string }) =>
    supabaseAdmin
      .from('users')
      .update(data)
      .eq('id', id)
      .select()
      .single(),

  getUserStats: async (userId: string) => {
    const [wishlistRes, alertsRes, historyRes] = await Promise.all([
      supabaseAdmin.from('wishlist_items').select('id', { count: 'exact', head: true }).eq('user_id', userId),
      supabaseAdmin.from('price_alerts').select('id', { count: 'exact', head: true }).eq('user_id', userId).eq('is_notified', false),
      supabaseAdmin.from('search_history').select('id', { count: 'exact', head: true }).eq('user_id', userId),
    ]);
    return {
      wishlistCount: wishlistRes.count || 0,
      activeAlertsCount: alertsRes.count || 0,
      searchesCount: historyRes.count || 0,
    };
  },

  getAdminStats: async () => {
    // Use the server's local day boundary (developer machine timezone) so
    // "today" matches what the admin expects in the dashboard.
    // (Supabase stores timestamptz in UTC; we convert local midnight to ISO/UTC.)
    const startLocal = new Date();
    startLocal.setHours(0, 0, 0, 0);
    const startIso = startLocal.toISOString();

    const [usersRes, wishlistRes, activeAlertsRes, searchesTodayRes] = await Promise.all([
      supabaseAdmin.from('users').select('id', { count: 'exact', head: true }),
      supabaseAdmin.from('wishlist_items').select('id', { count: 'exact', head: true }),
      supabaseAdmin.from('price_alerts').select('id', { count: 'exact', head: true }).eq('is_notified', false),
      supabaseAdmin.from('search_history').select('id', { count: 'exact', head: true }).gte('created_at', startIso),
    ]);

    return {
      totalUsers: usersRes.count || 0,
      wishlistItems: wishlistRes.count || 0,
      activeAlerts: activeAlertsRes.count || 0,
      searchesToday: searchesTodayRes.count || 0,
      startIso,
    };
  },

  getAdminActivity: async (input: { limit?: number; before?: string | null }) => {
    const limit = Math.min(Math.max(Number(input.limit || 20), 1), 50);
    const before = input.before ? new Date(input.before) : new Date();
    const beforeIso = isNaN(before.getTime()) ? new Date().toISOString() : before.toISOString();

    // Fetch from multiple tables, then merge-sort in memory for a unified activity feed.
    const perSource = Math.min(limit, 25);
    const [usersRes, searchesRes, wishlistRes, alertsRes] = await Promise.all([
      supabaseAdmin
        .from('users')
        .select('id,email,created_at')
        .lt('created_at', beforeIso)
        .order('created_at', { ascending: false })
        .limit(perSource),
      supabaseAdmin
        .from('search_history')
        .select('id,user_id,query,created_at')
        .lt('created_at', beforeIso)
        .order('created_at', { ascending: false })
        .limit(perSource),
      supabaseAdmin
        .from('wishlist_items')
        .select('id,user_id,store,name,url,created_at')
        .lt('created_at', beforeIso)
        .order('created_at', { ascending: false })
        .limit(perSource),
      supabaseAdmin
        .from('price_alerts')
        .select('id,user_id,keyword,product_url,target_price,is_notified,notified_at,created_at')
        .lt('created_at', beforeIso)
        .order('created_at', { ascending: false })
        .limit(perSource),
    ]);

    const events: Array<{ ts: string; code: string; detail: string }> = [];

    for (const u of (usersRes.data || []) as any[]) {
      events.push({
        ts: String(u.created_at),
        code: 'USER_CREATED',
        detail: `${u.email || u.id}`,
      });
    }

    for (const s of (searchesRes.data || []) as any[]) {
      events.push({
        ts: String(s.created_at),
        code: 'SEARCH',
        detail: `${s.query} (user: ${s.user_id})`,
      });
    }

    for (const w of (wishlistRes.data || []) as any[]) {
      events.push({
        ts: String(w.created_at),
        code: 'WISHLIST_ADD',
        detail: `${w.name} (${w.store}) (user: ${w.user_id})`,
      });
    }

    for (const a of (alertsRes.data || []) as any[]) {
      const hasNotifiedAt = Boolean(a.notified_at);
      const ts = hasNotifiedAt ? String(a.notified_at) : String(a.created_at);
      const code = hasNotifiedAt ? 'ALERT_NOTIFIED' : 'ALERT_CREATED';
      const subject = a.product_url ? a.product_url : (a.keyword || 'custom');
      events.push({
        ts,
        code,
        detail: `${subject} (target: ${a.target_price}) (user: ${a.user_id})`,
      });
    }

    events.sort((a, b) => (a.ts > b.ts ? -1 : a.ts < b.ts ? 1 : 0));

    const page = events.slice(0, limit);
    const nextCursor = page.length > 0 ? page[page.length - 1].ts : null;

    return { before: beforeIso, limit, events: page, nextCursor };
  },
};
