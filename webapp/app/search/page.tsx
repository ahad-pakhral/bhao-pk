"use client";

import { useState, useEffect, useMemo, useCallback, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { rankByRelevance } from "../../utils/ranking";
import { LayoutGrid, List as ListIcon } from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

interface SearchProduct {
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

// Fallback dummy data (used when backend is unavailable)
const fallbackProducts: SearchProduct[] = [
  { id: 1, name: "iPhone 15 Pro", specs: "256GB \u2022 5G \u2022 Daraz", price: "Rs. 345,000", rating: 4.9, reviews: 120, reviewsCount: 120, badge: "BEST", priceValue: 345000, image: "/images/iphone-15-pro.png", store: "Daraz" },
  { id: 8, name: "MacBook Air M2", specs: "13\" \u2022 8GB RAM \u2022 256GB", price: "Rs. 285,000", rating: 4.9, reviews: 78, reviewsCount: 78, priceDrop: "-5%", priceValue: 285000, image: "/images/macbook-air.png", store: "Shophive" },
  { id: 9, name: "Sony WH-1000XM5", specs: "Noise Cancelling \u2022 30hr", price: "Rs. 85,000", rating: 4.6, reviews: 203, reviewsCount: 203, priceValue: 85000, image: "/images/sony-xm5.png", store: "Telemart" },
  { id: 10, name: "iPhone 15", specs: "128GB \u2022 Telemart", price: "Rs. 315,000", rating: 4.5, reviews: 89, reviewsCount: 89, priceValue: 315000, image: "/images/iphone-15-pro.png", store: "Telemart" },
  { id: 11, name: "iPhone 15 Plus", specs: "256GB \u2022 Shophive", price: "Rs. 335,000", rating: 4.7, reviews: 56, reviewsCount: 56, priceValue: 335000, image: "/images/iphone-15-pro.png", store: "Shophive" },
  { id: 3, name: "AirPods Pro", specs: "Active Noise Cancellation", price: "Rs. 65,000", rating: 4.8, reviews: 156, reviewsCount: 156, priceValue: 65000, image: "/images/airpods-pro.png", store: "Daraz" },
  { id: 5, name: "iPad Pro 12.9\"", specs: "M2 \u2022 256GB", price: "Rs. 245,000", rating: 4.8, reviews: 92, reviewsCount: 92, priceValue: 245000, image: "/images/ipad-pro.png", store: "Daraz" },
  { id: 12, name: "No-Name TWS Earbuds", specs: "Bluetooth 5.0", price: "Rs. 2,500", rating: 5.0, reviews: 3, reviewsCount: 3, priceValue: 2500, image: "/images/airpods-pro.png", store: "Daraz" },
  { id: 13, name: "JBL Tune 230NC", specs: "ANC \u2022 JBL Pure Bass", price: "Rs. 12,000", rating: 4.3, reviews: 450, reviewsCount: 450, priceValue: 12000, image: "/images/sony-xm5.png", store: "Telemart" },
];

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

const stores = ["Daraz", "Telemart", "Shophive", "Mega", "PriceOye"];

function SearchContent() {
  const searchParams = useSearchParams();
  const queryParam = searchParams?.get("q") || "";

  const [searchQuery, setSearchQuery] = useState(queryParam);
  const [sort, setSort] = useState("Relevance");
  const [selectedStores, setSelectedStores] = useState<string[]>([]);
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [liveProducts, setLiveProducts] = useState<SearchProduct[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [dataSource, setDataSource] = useState<"live" | "cache" | "fallback">("fallback");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  useEffect(() => {
    if (queryParam) {
      setSearchQuery(queryParam);
    }
  }, [queryParam]);

  // Fetch from backend API when search query changes (debounced)
  const fetchFromAPI = useCallback(async (keyword: string) => {
    if (!keyword.trim()) {
      setLiveProducts(null);
      setDataSource("fallback");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/search`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keyword }),
      });

      if (!res.ok) throw new Error(`API error: ${res.status}`);

      const data = await res.json();
      const normalized = (data.results || []).map(normalizeProduct);
      setLiveProducts(normalized);
      setDataSource(data.source === "cache" ? "cache" : "live");
    } catch (err) {
      console.warn("[Search] Backend unavailable, using fallback data:", err);
      setLiveProducts(null);
      setDataSource("fallback");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Debounce API calls
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchFromAPI(searchQuery);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery, fetchFromAPI]);

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
    // Use live products if available, otherwise fallback
    const baseProducts = liveProducts !== null ? liveProducts : fallbackProducts;
    let filtered = [...baseProducts];

    // For fallback data, filter by search query client-side
    if (liveProducts === null && searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.specs.toLowerCase().includes(q) ||
        p.store.toLowerCase().includes(q)
      );
    }

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
      // Relevance — backend already ranks by Bayesian composite,
      // but re-rank client-side for fallback data or after filtering
      if (liveProducts === null) {
        filtered = rankByRelevance<SearchProduct>(filtered);
      }
    }

    return filtered;
  }, [searchQuery, selectedStores, minPrice, maxPrice, sort, liveProducts]);

  // Collect unique stores from base results for the filter sidebar so filters don't disappear
  const availableStores = useMemo(() => {
    const baseProducts = liveProducts !== null ? liveProducts : fallbackProducts;
    const storeSet = new Set(baseProducts.map(p => p.store));
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
            <input
              type="text"
              placeholder="Search products across all Pakistani stores..."
              className="input-field"
              style={{ width: '100%', marginBottom: '16px' }}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2 style={{ fontSize: '24px' }}>
                  Search Results
                  {isLoading && <span style={{ fontSize: '14px', color: 'var(--text-muted)', marginLeft: '12px' }}>Scraping stores...</span>}
                </h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
                  Found {results.length} items{searchQuery && ` for "${searchQuery}"`}
                  {dataSource !== "fallback" && (
                    <span style={{ marginLeft: '8px', fontSize: '11px', padding: '2px 8px', borderRadius: '4px', background: dataSource === "live" ? 'var(--accent-success)' : 'var(--accent-primary)', color: '#fff' }}>
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
              <Link href={`/product/${item.id}`} key={`${item.store}-${item.id}-${idx}`} className="card" style={{ display: 'flex', flexDirection: viewMode === 'grid' ? 'column' : 'row', gap: '24px', textDecoration: 'none', color: 'inherit' }}>
                <div style={{ width: viewMode === 'grid' ? '100%' : '140px', height: viewMode === 'grid' ? '240px' : '140px', background: '#1a1a1a', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '40px', position: 'relative', overflow: 'hidden', flexShrink: 0 }}>
                  <img
                    src={item.image}
                    alt={item.name}
                    style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '12px' }}
                    onError={(e) => { (e.target as HTMLImageElement).src = '/images/iphone-15-pro.png'; }}
                  />
                  {item.badge && <span className="badge badge-best" style={{ position: 'absolute', top: '8px', left: '8px' }}>{item.badge}</span>}
                  {item.priceDrop && <span className="badge badge-hot" style={{ position: 'absolute', top: '8px', right: '8px' }}>{item.priceDrop}</span>}
                </div>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <h4 style={{ fontSize: '18px' }}>{item.name}</h4>
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

            {!isLoading && results.length === 0 && (
              <div className="card" style={{ padding: '60px 40px', textAlign: 'center' }}>
                <h3 style={{ fontSize: '24px', marginBottom: '12px' }}>No results found</h3>
                <p style={{ color: 'var(--text-secondary)' }}>Try adjusting your filters or search query</p>
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
