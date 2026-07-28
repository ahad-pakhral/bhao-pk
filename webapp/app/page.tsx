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
    <div style={{ position: 'relative', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Link href={productHref} className="card product-card" style={{ textDecoration: 'none', color: 'inherit', height: '100%', display: 'flex', flexDirection: 'column' }}>
        <div className="product-image" style={{ width: '100%', aspectRatio: '1 / 1', marginBottom: '10px', position: 'relative', overflow: 'hidden', padding: '10px' }}>
          {img ? (
            <img src={img} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} referrerPolicy="no-referrer" />
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-3)', fontSize: '12px' }}>No image</div>
          )}
          {origNum > 0 && priceNum < origNum && (
            <span className="badge badge-hot" style={{ position: 'absolute', top: '8px', left: '8px', zIndex: 1 }}>
              -{Math.round((1 - priceNum / origNum) * 100)}%
            </span>
          )}
        </div>
        <div className="product-info" style={{ padding: '0 2px', display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
          <div className="product-title">{product.name}</div>
          <div className="product-price tabular" style={{ display: 'flex', alignItems: 'baseline', gap: '6px', flexWrap: 'wrap', marginTop: 'auto' }}>
            {formatPrice(priceNum)}
            {origNum > 0 && origNum > priceNum && (
              <span style={{ color: 'var(--text-3)', fontSize: '12px', fontWeight: 500, textDecoration: 'line-through' }}>
                {formatPrice(origNum)}
              </span>
            )}
          </div>
          <div className="product-store">
            <span>{product.store}</span>
            {product.rating > 0 ? <span style={{ color: 'var(--star)', fontWeight: 600 }}>★ {Number(product.rating).toFixed(1)}</span> : null}
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
        aria-label={inWl ? 'Remove from wishlist' : 'Add to wishlist'}
        className="product-card-wishlist-btn"
        style={{
          position: 'absolute', top: '10px', right: '10px', zIndex: 2,
          background: 'color-mix(in srgb, var(--surface) 88%, transparent)',
          backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)',
          border: '1px solid var(--border)', borderRadius: '999px',
          width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
        }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill={inWl ? 'var(--danger)' : 'none'} stroke={inWl ? 'var(--danger)' : 'var(--text-2)'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
        </svg>
      </button>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="card product-card" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div className="skeleton" style={{ width: '100%', aspectRatio: '1 / 1', borderRadius: 'var(--r-md)', marginBottom: '10px' }} />
      <div style={{ padding: '0 2px', display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
        <div className="skeleton" style={{ height: '16px', width: '85%' }} />
        <div className="skeleton" style={{ height: '18px', width: '45%', marginTop: 'auto' }} />
        <div className="skeleton" style={{ height: '12px', width: '60%' }} />
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

  useEffect(() => {
    if (!isAuthenticated) return;
    const token = localStorage.getItem('sb-token');

    setRecLoading(true);

    const fetchRecs = async () => {
      let historyKeywords: string[] = [];
      if (token) {
        try {
          const res = await fetch(`${API_BASE}/auth/history`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (res.ok) {
            const data = await res.json();
            if (data?.history?.length) {
              historyKeywords = Array.from(new Set(data.history.slice(0, 5).map((h: any) => h.query)));
            }
          }
        } catch {}
      }

      const results: TrendingProduct[] = [];
      if (historyKeywords.length > 0) {
        const searchPromises = historyKeywords.slice(0, 3).map(kw =>
          fetch(`${API_BASE}/search`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            body: JSON.stringify({ keyword: kw }),
          })
            .then(res => res.ok ? res.json() : null)
            .then(d => d?.results || [])
            .catch(() => [])
        );

        const allResults = await Promise.all(searchPromises);
        const seenUrls = new Set<string>();
        for (const list of allResults) {
          for (const p of list) {
            if (p.url && !seenUrls.has(p.url)) {
              seenUrls.add(p.url);
              results.push({
                name: p.name,
                price: p.priceValue || p.price,
                originalPrice: p.originalPrice,
                url: p.url,
                imageUrl: p.image || (p as any).imageUrl,
                rating: p.rating || 0,
                reviewsCount: p.reviewsCount || 0,
                store: p.store,
                inStock: p.inStock,
              });
            }
          }
        }
      }

      // Fallback: If no history recommendations yet, use trending products so logged-in users ALWAYS see recommendations
      if (results.length === 0 && trending.length > 0) {
        results.push(...trending.slice(0, 8));
      }

      setRecommendations(results.slice(0, 8));
      setRecLoading(false);
    };

    fetchRecs();
  }, [isAuthenticated, trending]);

  const recentlyViewedProducts = useMemo(() => {
    return recentlyViewed.slice(0, 8).map(rv => ({
      name: rv.name,
      price: rv.priceValue || rv.price || '0',
      originalPrice: rv.originalPrice,
      url: rv.url,
      imageUrl: rv.image || (rv as any).imageUrl,
      rating: rv.rating || 0,
      reviewsCount: rv.reviewsCount || 0,
      store: rv.store || 'Store',
      inStock: rv.inStock,
      id: rv.id,
    }));
  }, [recentlyViewed]);

  const filteredSuggestions = search.trim()
    ? trending.filter(product =>
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
      <section className="hero-section rise-in">
        <p className="eyebrow" style={{ marginBottom: '20px' }}>Price comparison for Pakistan</p>
        <h1 className="hero-title">
          Find the best price,<br />
          before you buy.
        </h1>
        <p style={{ color: 'var(--text-2)', fontSize: '17px', marginBottom: '40px', maxWidth: '460px', marginLeft: 'auto', marginRight: 'auto', lineHeight: 1.5 }}>
          Search any product. We compare live prices across Pakistani stores so you always pay less.
        </p>

        <div style={{ maxWidth: '620px', margin: '0 auto', position: 'relative' }} className="search-bar-wrapper">
          <div style={{
            position: 'relative',
            background: 'var(--surface)',
            border: '1px solid var(--border-strong)',
            borderRadius: 'var(--r-pill)',
            padding: '7px 7px 7px 8px',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            boxShadow: 'var(--shadow-md)',
          }}>
            <div style={{ padding: '0 10px 0 12px', color: 'var(--text-3)', display: 'flex' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
            </div>
            <input
              type="text"
              placeholder="Search a product..."
              className="input-field"
              style={{
                background: 'transparent', border: 'none', height: '48px', minHeight: '48px',
                fontSize: '15px', padding: '0', color: 'var(--text)', boxShadow: 'none'
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
            <button className="btn btn-primary" style={{ borderRadius: 'var(--r-pill)', padding: '0 24px', height: '46px', flexShrink: 0 }} onClick={handleSearch}>
              Search
            </button>
          </div>

          {showSuggestions && filteredSuggestions.length > 0 && (
            <div style={{
              position: 'absolute', top: 'calc(100% + 8px)', left: 0, right: 0,
              background: 'var(--surface)', border: '1px solid var(--border)',
              borderRadius: 'var(--r-lg)', padding: '6px',
              zIndex: 10, textAlign: 'left', overflow: 'hidden', boxShadow: 'var(--shadow-lg)'
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
                    display: 'flex', alignItems: 'center', gap: '12px', padding: '11px 14px',
                    borderRadius: 'var(--r-md)', cursor: 'pointer', textDecoration: 'none', color: 'inherit'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'var(--surface-2)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--text-3)', flexShrink: 0 }}>
                    <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
                  </svg>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '14px', marginBottom: '2px', color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{product.name}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-3)' }}>{product.store} &bull; {formatPrice(product.price)}</div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Trending Section */}
      <section style={{ marginBottom: '80px' }}>
        <div className="section-title">
          <h3>Trending now</h3>
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
