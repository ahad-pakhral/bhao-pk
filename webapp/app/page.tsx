"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useWishlist } from "../hooks/useWishlist";

const trendingProducts = [
  { id: 1, name: "iPhone 15 Pro", price: "Rs. 345k", store: "Daraz", rating: 4.9, badge: "HOT", image: "/images/iphone-15-pro.png" },
  { id: 2, name: "Samsung S24", price: "Rs. 320k", store: "Telenart", rating: 4.8, image: "/images/samsung-s24.png" },
  { id: 3, name: "AirPods Pro", price: "Rs. 65k", store: "Daraz", rating: 4.7, image: "/images/airpods-pro.png" },
  { id: 4, name: "MacBook Air", price: "Rs. 285k", store: "Shophive", rating: 4.9, image: "/images/macbook-air.png" },
];

const recentlyViewed = [
  { id: 5, name: "iPad Pro 12.9\"", price: "Rs. 245,000", store: "Daraz", rating: 4.8, image: "/images/ipad-pro.png" },
  { id: 6, name: "Sony XM5", price: "Rs. 85,000", store: "Telemart", rating: 4.6, image: "/images/sony-xm5.png" },
];

const allProducts = [
  ...trendingProducts,
  ...recentlyViewed,
  { id: 7, name: "iPad Mini", price: "Rs. 145,000", store: "Shophive", rating: 4.7, image: "/images/ipad-mini.png" },
  { id: 8, name: "Galaxy Buds", price: "Rs. 35,000", store: "Daraz", rating: 4.5, image: "/images/galaxy-buds.png" },
  { id: 9, name: "iPhone 14", price: "Rs. 285,000", store: "Telemart", rating: 4.8, image: "/images/iphone-14.png" },
];

export default function Home() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const { isInWishlist, toggleWishlist } = useWishlist();

  const filteredSuggestions = search.trim()
    ? allProducts.filter(product =>
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
      <section style={{ textAlign: 'center', padding: '120px 0 80px', marginBottom: '40px' }}>
        <h1 style={{ fontSize: '80px', lineHeight: '0.9', marginBottom: '24px', letterSpacing: '-0.03em' }}>
          INTELLIGENT PRICE<br />
          DISCOVERY
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '18px', marginBottom: '60px', fontFamily: 'var(--font-mono)' }}>
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
            boxShadow: '0 0 0 1px rgba(255,255,255,0.05)'
          }}>
            <div style={{ padding: '0 16px', color: '#666' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
            </div>
            <input
              type="text"
              placeholder="Search product name or paste URL..."
              className="input-field"
              style={{
                background: 'transparent',
                border: 'none',
                height: '48px',
                fontSize: '16px',
                padding: '0',
                color: '#fff',
                fontFamily: 'var(--font-mono)'
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
            <button
              className="btn btn-primary"
              style={{ padding: '8px 24px', height: '40px', fontSize: '13px' }}
              onClick={handleSearch}
            >
              SEARCH
            </button>
          </div>

          {showSuggestions && filteredSuggestions.length > 0 && (
            <div style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-light)',
              borderRadius: '0 0 12px 12px',
              borderTop: 'none',
              marginTop: '-12px',
              paddingTop: '12px',
              zIndex: 10,
              textAlign: 'left',
              overflow: 'hidden',
              boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
            }}>
              {filteredSuggestions.map((product) => (
                <Link
                  key={product.id}
                  href={`/product/${product.id}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '12px 20px',
                    cursor: 'pointer',
                    borderBottom: '1px solid #1a1a1a',
                    textDecoration: 'none',
                    color: 'inherit'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-surface-hover)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#666' }}>
                    <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
                  </svg>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '14px', marginBottom: '2px' }}>{product.name}</div>
                    <div style={{ fontSize: '12px', color: '#666' }}>
                      {product.store} • {product.price}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Trending Section */}
      <section style={{ marginBottom: '80px' }}>
        <div className="section-title" style={{ marginBottom: '32px' }}>
          <h3 style={{ fontSize: '14px', color: '#666', letterSpacing: '0.1em' }}>TRENDING NOW</h3>
        </div>
        <div className="product-grid">
          {trendingProducts.map(product => (
            <div key={product.id} style={{ position: 'relative' }}>
              <Link href={`/product/${product.id}`} className="card product-card" style={{ background: '#121212', border: '1px solid #222' }}>
                <div className="product-image" style={{ height: '240px', background: '#1a1a1a', marginBottom: '16px', position: 'relative', overflow: 'hidden' }}>
                  <img
                    src={product.image}
                    alt={product.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                  {product.badge && <span className="badge badge-hot" style={{ position: 'absolute', top: '12px', left: '12px' }}>{product.badge}</span>}
                </div>
                <div className="product-info" style={{ padding: '0 4px' }}>
                  <div className="product-title" style={{ fontSize: '16px', marginBottom: '4px' }}>{product.name}</div>
                  <div className="product-price" style={{ color: 'var(--accent-primary)', fontSize: '18px', marginBottom: '8px' }}>{product.price}</div>
                  <div className="product-store" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#666', fontFamily: 'var(--font-mono)' }}>
                    <span>{product.store}</span>
                    <span style={{ color: '#6D5ACF' }}>★ {product.rating}</span>
                  </div>
                </div>
              </Link>
              <button
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleWishlist(String(product.id)); }}
                style={{
                  position: 'absolute', top: '12px', right: '12px', zIndex: 2,
                  background: 'rgba(0,0,0,0.6)', border: 'none', borderRadius: '50%',
                  width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill={isInWishlist(String(product.id)) ? '#FF4444' : 'none'} stroke={isInWishlist(String(product.id)) ? '#FF4444' : '#fff'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Recently Viewed */}
      <section style={{ marginBottom: '80px' }}>
        <div className="section-title">
          <h3>Recently Viewed</h3>
        </div>
        <div className="product-grid">
          {recentlyViewed.map(product => (
            <div key={product.id} style={{ position: 'relative' }}>
              <Link href={`/product/${product.id}`} className="card product-card">
                <div className="product-image" style={{ height: '240px', background: '#1a1a1a', marginBottom: '16px', position: 'relative', overflow: 'hidden' }}>
                  <img
                    src={product.image}
                    alt={product.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                </div>
                <div className="product-title">{product.name}</div>
                <div className="product-price">{product.price}</div>
                <div className="product-store">
                  <span>{product.store}</span>
                  <span>★ {product.rating}</span>
                </div>
              </Link>
              <button
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleWishlist(String(product.id)); }}
                style={{
                  position: 'absolute', top: '12px', right: '12px', zIndex: 2,
                  background: 'rgba(0,0,0,0.6)', border: 'none', borderRadius: '50%',
                  width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill={isInWishlist(String(product.id)) ? '#FF4444' : 'none'} stroke={isInWishlist(String(product.id)) ? '#FF4444' : '#fff'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Recommended */}
      <section>
        <div className="section-title">
          <h3>Recommended For You</h3>
        </div>
        <div className="card" style={{ display: 'flex', gap: '24px', alignItems: 'center', padding: '32px' }}>
          <div style={{ width: '120px', height: '120px', background: '#1a1a1a', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '40px', overflow: 'hidden' }}>
            <img src="/images/galaxy-watch-6.png" alt="Galaxy Watch 6" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
          <div style={{ flex: 1 }}>
            <span className="badge badge-best" style={{ marginBottom: '8px', display: 'inline-block' }}>Save 15%</span>
            <h4 style={{ fontSize: '24px', marginBottom: '8px' }}>Galaxy Watch 6</h4>
            <div className="product-price" style={{ marginBottom: '8px' }}>Rs. 75,000</div>
            <div className="product-store">Daraz • ★ 4.5</div>
          </div>
          <Link href="/product/7" className="btn btn-secondary">View Deal</Link>
        </div>
      </section>
    </div>
  );
}
