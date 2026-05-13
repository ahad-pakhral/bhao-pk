"use client";

import { useState, useEffect, useMemo, useCallback, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { rankByRelevance } from "../../utils/ranking";
import { LayoutGrid, List as ListIcon, Search } from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

import { useSearchStore } from "../../store/searchStore";
import { useAuthStore } from "../../store/authStore";
import { useWishlist } from "../../hooks/useWishlist";
import { useToast } from "../../components/Toast";

export interface SearchProduct {
  id: number | string;
  name: string;
  specs: string;
  price: string;
  rating: number;
  reviews: number;
  reviewsCount: number;
  badge?: string;
  priceDrop?: string;
  priceValue: number;
  image: string;
  store: string;
  url?: string;
  inStock?: boolean;
  originalPrice?: string;
}


/** Convert backend scraped product into our display format */
function normalizeProduct(p: any, idx: number): SearchProduct {
  const price = typeof p.price === "number" ? p.price : parseFloat(String(p.price).replace(/[^0-9.]/g, "")) || 0;
  return {
    id: p.id || `scraped-${idx}`,
    name: p.name || "",
    specs: p.store || "",
    price: `Rs. ${price.toLocaleString()}`,
    rating: p.rating || 0,
    reviews: p.reviewsCount || 0,
    reviewsCount: p.reviewsCount || 0,
    priceValue: price,
    image: p.imageUrl || "/images/iphone-15-pro.png",
    store: p.store || "Unknown",
    url: p.url,
    inStock: p.inStock !== false,
    originalPrice: p.originalPrice && p.originalPrice > price
      ? `Rs. ${Number(p.originalPrice).toLocaleString()}`
      : undefined,
    priceDrop: p.originalPrice && p.originalPrice > price
      ? `-${Math.round(((p.originalPrice - price) / p.originalPrice) * 100)}%`
      : undefined,
  };
}

const stores = ["Daraz", "Telemart", "Shophive"];

function SearchContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryParam = searchParams?.get("q") || "";

  const [searchInput, setSearchInput] = useState(queryParam);
  const [sort, setSort] = useState("Relevance");
  const [selectedStores, setSelectedStores] = useState<string[]>([]);
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [liveProducts, setLiveProducts] = useState<SearchProduct[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [dataSource, setDataSource] = useState<"live" | "cache" | "error" | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // Global search cache
  const { lastQuery, lastResults, lastFetchTime, setSearchResults } = useSearchStore();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const { showToast } = useToast();

  useEffect(() => {
    if (queryParam) {
      setSearchInput(queryParam);
      fetchFromAPI(queryParam);
    } else {
      setSearchInput("");
      fetchFromAPI("");
    }
  }, [queryParam]);

  // Fetch from backend API
  const fetchFromAPI = useCallback(async (keyword: string) => {
    if (!keyword.trim()) {
      setLiveProducts([]);
      setDataSource(null);
      return;
    }

    // Check frontend cache to prevent re-scraping on back navigation
    const { lastQuery, lastResults, lastFetchTime } = useSearchStore.getState();
    if (lastQuery === keyword && lastResults.length > 0 && Date.now() - lastFetchTime < 30 * 60 * 1000) {
      console.log("[Search] Using frontend cache for:", keyword);
      setLiveProducts(lastResults);
      setDataSource("cache");
      return;
    }

    setIsLoading(true);
    try {
      // Include auth token (if logged in) so backend can log search_history for admin stats.
      const token = useAuthStore.getState().token;
      const res = await fetch(`${API_BASE}/search`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ keyword }),
      });

      if (!res.ok) throw new Error(`API error: ${res.status}`);

      const data = await res.json();
      const normalized = (data.results || []).map(normalizeProduct);
      setLiveProducts(normalized);
      setDataSource(data.source === "cache" ? "cache" : "live");

      // Save results to frontend cache
      setSearchResults(keyword, normalized);
    } catch (err) {
      console.warn("[Search] Backend unavailable:", err);
      setLiveProducts([]);
      setDataSource("error");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const toggleStore = (store: string) => {
    setSelectedStores(prev =>
      prev.includes(store) ? prev.filter(s => s !== store) : [...prev, store]
    );
  };

  const clearAll = () => {
    setSelectedStores([]);
    setMinPrice("");
    setMaxPrice("");
    setSort("Relevance");
  };

  const results = useMemo(() => {
    let filtered = [...liveProducts];

    // Filter by stores
    if (selectedStores.length > 0) {
      filtered = filtered.filter(p => selectedStores.includes(p.store));
    }

    // Filter by price range
    const min = minPrice ? parseInt(minPrice) : 0;
    const max = maxPrice ? parseInt(maxPrice) : Infinity;
    if (minPrice || maxPrice) {
      filtered = filtered.filter(p => p.priceValue >= min && p.priceValue <= max);
    }

    // Sort
    if (sort === "Price: Low to High") {
      filtered.sort((a, b) => a.priceValue - b.priceValue);
    } else if (sort === "Price: High to Low") {
      filtered.sort((a, b) => b.priceValue - a.priceValue);
    } else if (sort === "Top Rated") {
      filtered.sort((a, b) => b.rating - a.rating);
    } else {
      // Relevance — backend already ranks by Bayesian composite
      // Add client-side ranking fallback here if needed in future
    }

    return filtered;
  }, [queryParam, selectedStores, minPrice, maxPrice, sort, liveProducts]);

  // Collect unique stores from base results for the filter sidebar so filters don't disappear
  const availableStores = useMemo(() => {
    const storeSet = new Set(liveProducts.map(p => p.store));
    return stores.filter(s => storeSet.has(s));
  }, [liveProducts]);

  return (
    <div style={{ padding: '20px 40px', maxWidth: '100%' }}>
      <div style={{ display: 'flex', gap: '40px' }}>
        {/* Filters Sidebar */}
        <aside style={{ width: '280px', flexShrink: 0 }}>
          <div className="section-title"><h3>Filters</h3></div>

          <div style={{ marginBottom: '32px' }}>
            <h5 style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '16px' }}>Store</h5>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {(availableStores.length > 0 ? availableStores : stores.slice(0, 3)).map(store => (
                <label key={store} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={selectedStores.includes(store)}
                    onChange={() => toggleStore(store)}
                  /> {store}
                </label>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: '32px' }}>
            <h5 style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '16px' }}>Price Range</h5>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="number"
                placeholder="Min"
                className="input-field"
                style={{ padding: '8px' }}
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
              />
              <input
                type="number"
                placeholder="Max"
                className="input-field"
                style={{ padding: '8px' }}
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
              />
            </div>
          </div>

          <button className="btn btn-secondary" style={{ width: '100%' }} onClick={clearAll}>Clear All</button>
        </aside>

        {/* Results Area */}
        <div style={{ flex: 1 }}>
          <div style={{ marginBottom: '24px' }}>
            <div style={{ position: 'relative', width: '100%', marginBottom: '16px' }}>
              <input
                type="text"
                placeholder="Search products across all Pakistani stores..."
                className="input-field"
                style={{ width: '100%', paddingRight: '48px' }}
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && searchInput.trim()) {
                    router.push(`/search?q=${encodeURIComponent(searchInput.trim())}`);
                  }
                }}
              />
              <button
                style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                onClick={() => {
                  if (searchInput.trim()) {
                    router.push(`/search?q=${encodeURIComponent(searchInput.trim())}`);
                  }
                }}
              >
                <Search size={20} />
              </button>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2 style={{ fontSize: '24px' }}>
                  Search Results
                  {isLoading && <span style={{ fontSize: '14px', color: 'var(--text-muted)', marginLeft: '12px' }}>Scraping stores...</span>}
                </h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
                  Found {results.length} items{queryParam && ` for "${queryParam}"`}
                  {dataSource && dataSource !== "error" && (
                    <span className={`badge ${dataSource === "live" ? "badge-live" : "badge-cached"}`} style={{ marginLeft: '8px', verticalAlign: 'middle' }}>
                      {dataSource === "live" ? "LIVE" : "CACHED"}
                    </span>
                  )}
                </p>
              </div>
              <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                <div style={{ display: 'flex', background: 'var(--bg-surface)', borderRadius: '8px', padding: '4px' }}>
                  <button
                    onClick={() => setViewMode('grid')}
                    style={{
                      background: viewMode === 'grid' ? 'var(--border-light)' : 'transparent',
                      border: 'none', padding: '8px', borderRadius: '4px', cursor: 'pointer', color: viewMode === 'grid' ? '#fff' : '#666'
                    }}
                  >
                    <LayoutGrid size={18} />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    style={{
                      background: viewMode === 'list' ? 'var(--border-light)' : 'transparent',
                      border: 'none', padding: '8px', borderRadius: '4px', cursor: 'pointer', color: viewMode === 'list' ? '#fff' : '#666'
                    }}
                  >
                    <ListIcon size={18} />
                  </button>
                </div>
                <select
                  className="input-field"
                  style={{ width: '200px', background: 'var(--bg-surface)' }}
                  value={sort}
                  onChange={(e) => setSort(e.target.value)}
                >
                  <option>Relevance</option>
                  <option>Price: Low to High</option>
                  <option>Price: High to Low</option>
                  <option>Top Rated</option>
                </select>
              </div>
            </div>
          </div>

          <div style={{ display: viewMode === 'grid' ? 'grid' : 'flex', gridTemplateColumns: viewMode === 'grid' ? 'repeat(auto-fill, minmax(280px, 1fr))' : 'none', flexDirection: 'column', gap: '16px' }}>
            {isLoading && results.length === 0 && (
              Array.from({ length: 8 }).map((_, idx) => (
                <div key={`skeleton-${idx}`} className="card" style={{ display: 'flex', gap: '24px', flexDirection: viewMode === 'grid' ? 'column' : 'row', height: viewMode === 'grid' ? '100%' : 'auto' }}>
                  <div style={{
                    width: viewMode === 'grid' ? '100%' : '140px',
                    height: viewMode === 'grid' ? '240px' : '140px',
                    background: '#222', borderRadius: '8px', flexShrink: 0,
                    animation: 'pulse 1.5s infinite'
                  }}></div>
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '12px', justifyContent: 'center' }}>
                    <div style={{ height: '24px', background: '#222', borderRadius: '4px', width: '80%', animation: 'pulse 1.5s infinite' }}></div>
                    <div style={{ height: '20px', background: '#222', borderRadius: '4px', width: '40%', animation: 'pulse 1.5s infinite' }}></div>
                    <div style={{ height: '12px', background: '#222', borderRadius: '4px', width: '60%', animation: 'pulse 1.5s infinite', marginTop: 'auto' }}></div>
                  </div>
                </div>
              ))
            )}

            {results.map((item, idx) => (
              <Link href={item.url ? `/product/${item.id}?url=${encodeURIComponent(item.url)}&store=${encodeURIComponent(item.store)}` : `/product/${item.id}`} key={`${item.store}-${item.id}-${idx}`} className="card" style={{ display: 'flex', flexDirection: viewMode === 'grid' ? 'column' : 'row', gap: '24px', textDecoration: 'none', color: 'inherit', position: 'relative' }}>
                <div style={{ width: viewMode === 'grid' ? '100%' : '140px', height: viewMode === 'grid' ? '240px' : '140px', background: '#1a1a1a', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '40px', position: 'relative', overflow: 'hidden', flexShrink: 0 }}>
                  <img
                    src={item.image}
                    alt={item.name}
                    referrerPolicy="no-referrer"
                    style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '12px' }}
                    onError={(e) => { (e.target as HTMLImageElement).src = '/images/iphone-15-pro.png'; }}
                  />
                  {item.badge && <span className="badge badge-best" style={{ position: 'absolute', top: '8px', left: '8px' }}>{item.badge}</span>}
                  {item.priceDrop && <span className="badge badge-hot" style={{ position: 'absolute', top: '8px', right: '8px' }}>{item.priceDrop}</span>}
                </div>

                <button
                  onClick={async (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (!item.url) {
                      showToast("Product URL missing; can't add to wishlist", "error");
                      return;
                    }
                    const result = await toggleWishlist({ name: item.name, url: item.url, store: item.store, imageUrl: item.image });
                    if (result === 'added') showToast("Added to wishlist", "success");
                    else if (result === 'removed') showToast("Removed from wishlist", "error");
                    else if (result === 'error') showToast("Failed to add to wishlist", "error");
                    else if (result === 'auth_required') showToast("Please login to save to your wishlist", "info");
                  }}
                  style={{
                    position: 'absolute', top: '12px', right: '12px', zIndex: 2,
                    background: 'rgba(0,0,0,0.6)', border: 'none', borderRadius: '50%',
                    width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                  }}
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill={item.url && isInWishlist(item.url) ? '#FF4444' : 'none'}
                    stroke={item.url && isInWishlist(item.url) ? '#FF4444' : '#fff'}
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                  </svg>
                </button>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', marginBottom: '8px' }}>
                    <h4 className="product-title" style={{ fontSize: '18px', marginBottom: '6px' }}>{item.name}</h4>
                    <div className="product-price">{item.price}</div>
                  </div>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: 'auto' }}>{item.store}</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '12px', color: 'var(--text-muted)', marginTop: '24px' }}>
                    {item.rating > 0 && <span>&#9733; {item.rating.toFixed(1)} ({item.reviews} reviews)</span>}
                    {item.inStock !== false && <span style={{ color: 'var(--accent-success)' }}>In Stock</span>}
                    {item.originalPrice && (
                      <span style={{ textDecoration: 'line-through', color: 'var(--text-muted)' }}>
                        {item.originalPrice}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            ))}

            {!isLoading && dataSource === "error" && (
              <div className="card" style={{ padding: '60px 40px', textAlign: 'center' }}>
                <h3 style={{ fontSize: '24px', marginBottom: '12px', color: 'var(--accent-alert)' }}>Connection Error</h3>
                <p style={{ color: 'var(--text-secondary)' }}>Could not reach the Bhao.pk backend scrapers.</p>
              </div>
            )}

            {!isLoading && dataSource !== "error" && results.length === 0 && queryParam && (
              <div className="card" style={{ padding: '60px 40px', textAlign: 'center' }}>
                <h3 style={{ fontSize: '24px', marginBottom: '12px' }}>No results found</h3>
                <p style={{ color: 'var(--text-secondary)' }}>Try adjusting your filters or search query</p>
              </div>
            )}

            {!isLoading && dataSource !== "error" && results.length === 0 && !queryParam && (
              <div className="card" style={{ padding: '60px 40px', textAlign: 'center' }}>
                <h3 style={{ fontSize: '24px', marginBottom: '12px' }}>Search for a product</h3>
                <p style={{ color: 'var(--text-secondary)' }}>Enter a keyword above to compare prices across Pakistani stores.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="container">Loading...</div>}>
      <SearchContent />
    </Suspense>
  );
}
