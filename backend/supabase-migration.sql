-- Bhao.pk Supabase Migration
-- Run this in the Supabase Dashboard > SQL Editor

-- ============================================
-- 1. USERS TABLE (profiles linked to Supabase Auth)
-- ============================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT,
  role TEXT DEFAULT 'USER',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- 2. WISHLIST ITEMS
-- ============================================
CREATE TABLE IF NOT EXISTS wishlist_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  store TEXT NOT NULL,
  url TEXT NOT NULL,
  name TEXT NOT NULL,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, url)
);

-- ============================================
-- 3. PRICE ALERTS
-- ============================================
CREATE TABLE IF NOT EXISTS price_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  target_price REAL NOT NULL,
  keyword TEXT,
  product_url TEXT,
  is_notified BOOLEAN DEFAULT false,
  notified_at TIMESTAMPTZ,
  last_notified_price REAL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Make migration re-runnable for Phase 3 additions
ALTER TABLE price_alerts ADD COLUMN IF NOT EXISTS notified_at TIMESTAMPTZ;
ALTER TABLE price_alerts ADD COLUMN IF NOT EXISTS last_notified_price REAL;

-- ============================================
-- 4. SEARCH HISTORY
-- ============================================
CREATE TABLE IF NOT EXISTS search_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  query TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- 4b. PRICE HISTORY (Daily Snapshots)
-- ============================================
-- Stores daily price snapshots so product pages can render real charts.
-- Uniqueness is per product_url + store + day (idempotent upserts).
CREATE TABLE IF NOT EXISTS price_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_url TEXT NOT NULL,
  store TEXT NOT NULL,
  price REAL NOT NULL,
  day DATE NOT NULL,
  scraped_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(product_url, store, day)
);

-- ============================================
-- 4c. RECENTLY VIEWED (User-specific)
-- ============================================
-- Stores the last products a user opened (for mobile Home "Recently Viewed").
-- Idempotent per user+product_url; updates last_viewed_at on re-view.
CREATE TABLE IF NOT EXISTS recently_viewed (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_url TEXT NOT NULL,
  store TEXT NOT NULL,
  name TEXT NOT NULL,
  image_url TEXT,
  last_viewed_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, product_url)
);

-- ============================================
-- 5. ROW LEVEL SECURITY
-- ============================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE wishlist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE search_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE recently_viewed ENABLE ROW LEVEL SECURITY;

-- Users can read their own profile
DROP POLICY IF EXISTS "Users can view own profile" ON users;
CREATE POLICY "Users can view own profile" ON users FOR SELECT USING (auth.uid() = id);
DROP POLICY IF EXISTS "Users can update own profile" ON users;
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid() = id);

-- Wishlist: users can CRUD their own items
DROP POLICY IF EXISTS "Users can view own wishlist" ON wishlist_items;
CREATE POLICY "Users can view own wishlist" ON wishlist_items FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can add own wishlist" ON wishlist_items;
CREATE POLICY "Users can add own wishlist" ON wishlist_items FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can delete own wishlist" ON wishlist_items;
CREATE POLICY "Users can delete own wishlist" ON wishlist_items FOR DELETE USING (auth.uid() = user_id);

-- Alerts: users can CRUD their own alerts
DROP POLICY IF EXISTS "Users can view own alerts" ON price_alerts;
CREATE POLICY "Users can view own alerts" ON price_alerts FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can add own alerts" ON price_alerts;
CREATE POLICY "Users can add own alerts" ON price_alerts FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update own alerts" ON price_alerts;
CREATE POLICY "Users can update own alerts" ON price_alerts FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can delete own alerts" ON price_alerts;
CREATE POLICY "Users can delete own alerts" ON price_alerts FOR DELETE USING (auth.uid() = user_id);

-- Search history: users can read/write their own
DROP POLICY IF EXISTS "Users can view own history" ON search_history;
CREATE POLICY "Users can view own history" ON search_history FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can add own history" ON search_history;
CREATE POLICY "Users can add own history" ON search_history FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Price history: public read (history points are not user-private)
DROP POLICY IF EXISTS "Public can read price history" ON price_history;
CREATE POLICY "Public can read price history" ON price_history FOR SELECT USING (true);

-- Recently viewed: users can read/write only their own
DROP POLICY IF EXISTS "Users can view own recently viewed" ON recently_viewed;
CREATE POLICY "Users can view own recently viewed" ON recently_viewed FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can add own recently viewed" ON recently_viewed;
CREATE POLICY "Users can add own recently viewed" ON recently_viewed FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update own recently viewed" ON recently_viewed;
CREATE POLICY "Users can update own recently viewed" ON recently_viewed FOR UPDATE USING (auth.uid() = user_id);

-- ============================================
-- 6. AUTO-UPDATE updated_at TRIGGER
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS users_updated_at ON users;
CREATE TRIGGER users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS price_alerts_updated_at ON price_alerts;
CREATE TRIGGER price_alerts_updated_at BEFORE UPDATE ON price_alerts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- 7. BRAND RULES (Self-learning classification rules)
-- ============================================
CREATE TABLE IF NOT EXISTS brand_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  keyword TEXT UNIQUE NOT NULL,
  brand TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE brand_rules ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read brand rules" ON brand_rules;
CREATE POLICY "Public can read brand rules" ON brand_rules FOR SELECT USING (true);

-- ============================================
-- 8. SEARCH TRAINING DATA (AI model training logs)
-- ============================================
CREATE TABLE IF NOT EXISTS search_training_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  raw_query TEXT NOT NULL,
  query_type VARCHAR(10) NOT NULL, -- 'KW' or 'NL'
  interpreted_query TEXT,          -- Null if KW, or interpreted keywords if NL
  user_id UUID,                    -- Nullable for guest searches
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS for training logs
ALTER TABLE search_training_data ENABLE ROW LEVEL SECURITY;


