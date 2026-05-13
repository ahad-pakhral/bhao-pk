"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useWishlist } from "../hooks/useWishlist";
import { useAuthStore } from "../store/authStore";
import { useSearchStore } from "../store/searchStore";
import { useToast } from "../components/Toast";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

interface TrendingProduct {
  name: string;
  price: number | string;
  originalPrice?: number | string | null;
  url?: string;
  imageUrl?: string;
  image?: string;
  rating: number;
  reviewsCount?: number;
  store: string;
  inStock?: boolean;
}

function toNum(val: number | string | undefined | null): number {
  if (typeof val === 'number') return val;
  if (typeof val === 'string') return parseInt(val.replace(/[^\d]/g, ''), 10) || 0;
  return 0;
}

function formatPrice(price: number | string): string {
  return 'Rs. ' + toNum(price).toLocaleString('en-PK');
}

function ProductCard({ product, index }: { product: TrendingProduct; index: number }) {
  const { isInWishlist, toggleWishlist } = useWishlist();
  const { showToast } = useToast();
  const inWl = isInWishlist(product.url || '');
  const img = product.imageUrl || product.image;
  const priceNum = toNum(product.price);
  const origNum = toNum(product.originalPrice);
  const productId = product.url ? encodeURIComponent(product.url) : `trending-${index}`;
  const productHref = product.url
    ? `/product/${encodeURIComponent(product.url)}?url=${encodeURIComponent(product.url)}&store=${encodeURIComponent(product.store)}`
    : `/product/${productId}`;

  return (
    <div style={{ position: 'relative' }}>
      <Link href={productHref} className="card product-card" style={{ background: '#121212', border: '1px solid #222', textDecoration: 'none', color: 'inherit' }}>
        <div className="product-image" style={{ height: '240px', background: '#1a1a1a', marginBottom: '16px', position: 'relative', overflow: 'hidden' }}>
          {img ? (
            <img src={img} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} referrerPolicy="no-referrer" />
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#444', fontSize: '12px' }}>No Image</div>
          )}
          {origNum > 0 && priceNum < origNum && (
            <span className="badge badge-hot" style={{ position: 'absolute', top: '12px', left: '12px' }}>
              -{Math.round((1 - priceNum / origNum) * 100)}%
            </span>
          )}
        </div>
        <div className="product-info" style={{ padding: '0 4px' }}>
          <div className="product-title" style={{ fontSize: '16px', marginBottom: '4px' }}>{product.name}</div>
          <div className="product-price" style={{ color: 'var(--accent-primary)', fontSize: '18px', marginBottom: '8px' }}>
            {formatPrice(priceNum)}
            {origNum > 0 && origNum > priceNum && (
              <span style={{ color: '#666', fontSize: '13px', textDecoration: 'line-through', marginLeft: '8px' }}>
                {formatPrice(origNum)}
              </span>
            )}
          </div>
          <div className="product-store" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#666', fontFamily: 'var(--font-mono)' }}>
            <span>{product.store}</span>
            {product.rating > 0 ? <span style={{ color: '#FFB800' }}>★ {product.rating}</span> : null}
          </div>
        </div>
      </Link>
      <button
        onClick={async (e) => {
          e.preventDefault();
          e.stopPropagation();
          if (!useAuthStore.getState().isAuthenticated) {
            showToast("Please login to save to your wishlist", "info");
            return;
          }
          const result = await toggleWishlist({ name: product.name, url: product.url, store: product.store, imageUrl: img });
          if (result === 'added') showToast("Added to wishlist", "success");
          else if (result === 'removed') showToast("Removed from wishlist", "error");
          else if (result === 'error') showToast("Failed to add to wishlist", "error");
        }}
        style={{
          position: 'absolute', top: '12px', right: '12px', zIndex: 2,
          background: 'rgba(0,0,0,0.6)', border: 'none', borderRadius: '50%',
          width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
        }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill={inWl ? '#FF4444' : 'none'} stroke={inWl ? '#FF4444' : '#fff'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
        </svg>
      </button>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="card product-card" style={{ background: '#121212', border: '1px solid #222' }}>
      <div style={{ height: '240px', background: '#1a1a1a' }} />
      <div style={{ padding: '0 4px' }}>
        <div style={{ height: '20px', background: '#222', borderRadius: '4px', marginBottom: '8px', width: '80%' }} />
        <div style={{ height: '24px', background: '#222', borderRadius: '4px', marginBottom: '8px', width: '50%' }} />
        <div style={{ height: '14px', background: '#1a1a1a', borderRadius: '4px', width: '60%' }} />
      </div>
    </div>
  );
}

const TRENDING_CACHE_KEY = 'bhao_trending';
const TRENDING_CACHE_TTL = 10 * 60 * 1000; // 10 minutes

export default function Home() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const { recentlyViewed, setTrendingProducts } = useSearchStore();
  const [search, setSearch] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [trending, setTrending] = useState<TrendingProduct[]>([]);
  const [recommendations, setRecommendations] = useState<TrendingProduct[]>([]);
  const [trendingLoading, setTrendingLoading] = useState(true);
  const [recLoading, setRecLoading] = useState(false);

  // Fetch trending — use localStorage cache with 10-min TTL
  useEffect(() => {
    const toSearchProduct = (p: any, idx: number) => ({
      id: p.url ? encodeURIComponent(p.url) : `trending-${idx}`,
      name: p.name || '',
      specs: p.store || '',
      price: typeof p.price === 'string' ? p.price : `Rs. ${toNum(p.price).toLocaleString()}`,
      rating: p.rating || 0,
      reviews: p.reviewsCount || 0,
      reviewsCount: p.reviewsCount || 0,
      priceValue: toNum(p.price),
      image: p.imageUrl || p.image || '',
      store: p.store || 'Unknown',
      url: p.url,
      inStock: p.inStock !== false,
      originalPrice: p.originalPrice ? (typeof p.originalPrice === 'string' ? p.originalPrice : `Rs. ${toNum(p.originalPrice).toLocaleString()}`) : undefined,
    });

    try {
      const cached = localStorage.getItem(TRENDING_CACHE_KEY);
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < TRENDING_CACHE_TTL) {
          const normalized = data.map(toSearchProduct);
          setTrending(data);
          setTrendingProducts(normalized);
          setTrendingLoading(false);
          return;
        }
      }
    } catch {}

    fetch(`${API_BASE}/search/trending`)
      .then(res => res.json())
      .then(data => {
        const results = data.results || [];
        const normalized = results.map(toSearchProduct);
        setTrending(results);
        setTrendingProducts(normalized);
        localStorage.setItem(TRENDING_CACHE_KEY, JSON.stringify({ data: results, timestamp: Date.now() }));
        setTrendingLoading(false);
      })
      .catch(() => setTrendingLoading(false));
  }, []);

  // Fetch recommendations from last 3-5 search history keywords
  useEffect(() => {
    if (!isAuthenticated) return;
    const token = localStorage.getItem('sb-token');
    if (!token) return;

    fetch(`${API_BASE}/auth/history`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => res.ok ? res.json() : null)
      .then(async (data) => {
        if (!data?.history?.length) return;
        // Get unique keywords from last 5 searches
        const keywords = Array.from(new Set(data.history.slice(0, 5).map((h: any) => h.query)));
        if (keywords.length === 0) return;

        setRecLoading(true);
        // Search for the top 2-3 keywords and combine results
        const results: TrendingProduct[] = [];
        const searchPromises = keywords.slice(0, 3).map(kw =>
          fetch(`${API_BASE}/search`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            body: JSON.stringify({ keyword: kw }),
          }).then(res => res.ok ? res.json() : null)
            .then(d => { if (d?.results) results.push(...d.results.slice(0, 4)); })
            .catch(() => {})
        );
        await Promise.all(searchPromises);
        // Deduplicate by name+store
        const seen = new Set<string>();
        const unique = results.filter(p => {
          const key = `${p.name}-${p.store}`;
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });
        setRecommendations(unique.slice(0, 8));
        setRecLoading(false);
      })
      .catch(() => {});
  }, [isAuthenticated]);

  const recentlyViewedProducts = useMemo(() => recentlyViewed.slice(0, 4), [recentlyViewed]);

  const allForSuggestions = [...trending, ...recentlyViewedProducts];
  const filteredSuggestions = search.trim()
    ? allForSuggestions.filter(product =>
        product.name.toLowerCase().includes(search.toLowerCase()) ||
        product.store.toLowerCase().includes(search.toLowerCase())
      ).slice(0, 5)
    : [];

  const handleSearch = () => {
    if (search.trim()) {
      router.push(`/search?q=${encodeURIComponent(search)}`);
      setShowSuggestions(false);
    }
  };

  return (
    <div className="container">
      {/* Hero Section */}
      <section style={{ textAlign: 'center', padding: '100px 0 60px', marginBottom: '40px' }}>
        <h1 style={{ fontSize: '72px', lineHeight: '0.9', marginBottom: '20px', letterSpacing: '-0.03em' }}>
          INTELLIGENT PRICE<br />
          DISCOVERY
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '16px', marginBottom: '48px', fontFamily: 'var(--font-mono)' }}>
          Track prices. Compare deals. Save money.
        </p>

        <div style={{ maxWidth: '600px', margin: '0 auto', position: 'relative' }} className="search-bar-wrapper">
          <div style={{
            position: 'relative',
            background: '#0A0A0A',
            border: '1px solid #333',
            borderRadius: '12px',
            padding: '8px',
            display: 'flex',
            alignItems: 'center',
          }}>
            <div style={{ padding: '0 16px', color: '#666' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
            </div>
            <input
              type="text"
              placeholder="Search product name or paste URL..."
              className="input-field"
              style={{
                background: 'transparent', border: 'none', height: '48px',
                fontSize: '15px', padding: '0', color: '#fff', fontFamily: 'var(--font-body)'
              }}
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setShowSuggestions(e.target.value.trim().length > 0);
              }}
              onFocus={() => search.trim() && setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
            <button className="btn btn-primary" style={{ padding: '8px 24px', height: '40px', fontSize: '12px' }} onClick={handleSearch}>
              SEARCH
            </button>
          </div>

          {showSuggestions && filteredSuggestions.length > 0 && (
            <div style={{
              position: 'absolute', top: '100%', left: 0, right: 0,
              background: 'var(--bg-surface)', border: '1px solid var(--border-light)',
              borderRadius: '0 0 12px 12px', borderTop: 'none', marginTop: '-12px', paddingTop: '12px',
              zIndex: 10, textAlign: 'left', overflow: 'hidden', boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
            }}>
              {filteredSuggestions.map((product, i) => (
                <Link
                  key={`${product.url}-${i}`}
                  href={
                    product.url
                      ? `/product/${encodeURIComponent(product.url)}?url=${encodeURIComponent(product.url)}&store=${encodeURIComponent(product.store)}`
                      : `/product/trending-${i}`
                  }
                  style={{
                    display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 20px',
                    cursor: 'pointer', borderBottom: '1px solid #1a1a1a', textDecoration: 'none', color: 'inherit'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-surface-hover)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#666' }}>
                    <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
                  </svg>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '14px', marginBottom: '2px' }}>{product.name}</div>
                    <div style={{ fontSize: '12px', color: '#666' }}>{product.store} &bull; {formatPrice(product.price)}</div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Trending Section */}
      <section style={{ marginBottom: '80px' }}>
        <div className="section-title" style={{ marginBottom: '24px' }}>
          <h3 style={{ fontSize: '13px', color: '#666', letterSpacing: '0.1em' }}>TRENDING NOW</h3>
        </div>
        {trendingLoading ? (
          <div className="product-grid">{[...Array(4)].map((_, i) => <SkeletonCard key={i} />)}</div>
        ) : trending.length > 0 ? (
          <div className="product-grid">{trending.slice(0, 8).map((product, i) => <ProductCard key={`trending-${product.url}-${i}`} product={product} index={i} />)}</div>
        ) : (
          <div className="card" style={{ padding: '40px', textAlign: 'center' }}>
            <p style={{ color: 'var(--text-secondary)' }}>Unable to load trending products. Try again later.</p>
          </div>
        )}
      </section>

      {/* Recently Viewed */}
      {recentlyViewedProducts.length > 0 && (
        <section style={{ marginBottom: '80px' }}>
          <div className="section-title"><h3>Recently Viewed</h3></div>
          <div className="product-grid">
            {recentlyViewedProducts.map((product, i) => (
              <ProductCard key={`recent-${String(product.id)}-${i}`} product={product} index={i} />
            ))}
          </div>
        </section>
      )}

      {/* Recommended For You */}
      {isAuthenticated && (recLoading || recommendations.length > 0) && (
        <section>
          <div className="section-title"><h3>Recommended For You</h3></div>
          {recLoading ? (
            <div className="product-grid">{[...Array(4)].map((_, i) => <SkeletonCard key={i} />)}</div>
          ) : (
            <div className="product-grid">
              {recommendations.map((product, i) => (
                <ProductCard key={`rec-${product.url}-${i}`} product={product} index={i} />
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
