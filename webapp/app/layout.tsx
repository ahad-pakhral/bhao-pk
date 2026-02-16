"use client";

import "./globals.css";
import Link from "next/link";
import { Logo } from "../components/Logo";
import { useState } from "react";
import { useRouter } from "next/navigation";

const allProducts = [
  { id: 1, name: "iPhone 15 Pro", price: "Rs. 345k", store: "Daraz" },
  { id: 2, name: "Samsung S24", price: "Rs. 320k", store: "Telemart" },
  { id: 3, name: "AirPods Pro", price: "Rs. 65k", store: "Daraz" },
  { id: 4, name: "MacBook Air", price: "Rs. 285k", store: "Shophive" },
  { id: 5, name: "iPad Pro", price: "Rs. 245k", store: "Daraz" },
  { id: 6, name: "Sony XM5", price: "Rs. 85k", store: "Telemart" },
];

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const router = useRouter();
  const [searchExpanded, setSearchExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);

  const filteredSuggestions = searchQuery.trim()
    ? allProducts.filter(product =>
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.store.toLowerCase().includes(searchQuery.toLowerCase())
      ).slice(0, 5)
    : [];

  const handleNavSearch = () => {
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
      setShowSuggestions(false);
      setSearchExpanded(false);
      setSearchQuery("");
    }
  };

  return (
    <html lang="en">
      <head>
        <title>BHAO.PK | Intelligent Price Discovery</title>
        <meta name="description" content="Track prices. Compare deals. Save money." />
      </head>
      <body>
        <nav className="navbar">
          <Link href="/" className="nav-logo" style={{ textDecoration: 'none' }}>
            <Logo size="md" showText={true} />
          </Link>

          {!searchExpanded ? (
            <>
              <div className="nav-links">
                <Link href="/" className="nav-link">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>
                  Home
                </Link>
                <button
                  onClick={() => setSearchExpanded(true)}
                  className="nav-link"
                  style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
                  Search
                </button>
                <Link href="/wishlist" className="nav-link">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" /></svg>
                  Wishlist
                </Link>
                <Link href="/alerts" className="nav-link">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#CCFF00" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>
                  Alerts
                </Link>
                <Link href="/profile" className="nav-link">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                  Profile
                </Link>
              </div>
              <div className="nav-auth">
                <Link href="/login" className="btn btn-secondary">LOGIN</Link>
                <Link href="/signup" className="btn btn-primary">SIGN UP</Link>
              </div>
            </>
          ) : (
            <div style={{ flex: 1, marginLeft: '20px', marginRight: '20px', position: 'relative' }} className="search-bar-wrapper">
              <div style={{
                position: 'relative',
                background: '#0a0a0a',
                border: '1px solid #333',
                borderRadius: '12px',
                padding: '6px 12px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
              }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#666' }}>
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.3-4.3" />
                </svg>
                <input
                  type="text"
                  placeholder="Search products..."
                  autoFocus
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setShowSuggestions(e.target.value.trim().length > 0);
                  }}
                  onFocus={() => searchQuery.trim() && setShowSuggestions(true)}
                  onBlur={() => {
                    setTimeout(() => {
                      setShowSuggestions(false);
                      if (!searchQuery) {
                        setSearchExpanded(false);
                      }
                    }, 200);
                  }}
                  onKeyDown={(e) => e.key === 'Enter' && handleNavSearch()}
                  style={{
                    flex: 1,
                    background: 'transparent',
                    border: 'none',
                    color: '#fff',
                    fontFamily: 'var(--font-body)',
                    fontSize: '14px',
                    outline: 'none',
                  }}
                />
                <button
                  onClick={() => {
                    setSearchExpanded(false);
                    setSearchQuery("");
                    setShowSuggestions(false);
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#666',
                    cursor: 'pointer',
                    padding: '4px',
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
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
                  marginTop: '4px',
                  zIndex: 1000,
                  overflow: 'hidden',
                  boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
                }}>
                  <div style={{
                    padding: '8px 16px',
                    fontSize: '10px',
                    color: '#666',
                    textTransform: 'uppercase',
                    borderBottom: '1px solid #1a1a1a',
                  }}>
                    Suggestions
                  </div>
                  {filteredSuggestions.map((product) => (
                    <Link
                      key={product.id}
                      href={`/product/${product.id}`}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '12px 16px',
                        cursor: 'pointer',
                        borderBottom: '1px solid #1a1a1a',
                        textDecoration: 'none',
                        color: 'inherit',
                      }}
                      onClick={() => {
                        setShowSuggestions(false);
                        setSearchExpanded(false);
                        setSearchQuery("");
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-surface-hover)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#666', flexShrink: 0 }}>
                        <circle cx="11" cy="11" r="8" />
                        <path d="m21 21-4.3-4.3" />
                      </svg>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '13px', marginBottom: '2px' }}>{product.name}</div>
                        <div style={{ fontSize: '11px', color: '#666' }}>
                          {product.store} • {product.price}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}
        </nav>

        <main>{children}</main>

        <footer>
          <div className="footer-content">
            <div className="footer-col">
              <h4>BHAO.PK</h4>
              <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Intelligent price comparison engine for the savvy shopper.</p>
            </div>
            <div className="footer-col">
              <h4>Platform</h4>
              <ul>
                <li><Link href="/search">Search Products</Link></li>
                <li><Link href="/trending">Trending Now</Link></li>
                <li><Link href="/alerts">Price Alerts</Link></li>
              </ul>
            </div>
            <div className="footer-col">
              <h4>Company</h4>
              <ul>
                <li><Link href="/about">About Us</Link></li>
                <li><Link href="/privacy">Privacy Policy</Link></li>
                <li><Link href="/admin/login">Admin Access</Link></li>
              </ul>
            </div>
          </div>
          <div className="footer-bottom">
            &copy; 2025 BHAO.PK - Data. No Fluff.
          </div>
        </footer>
      </body>
    </html>
  );
}
