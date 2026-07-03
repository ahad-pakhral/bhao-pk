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
  brand?: string;
  isOutlier?: boolean;
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
    brand: p.brand || "Unknown",
    isOutlier: p.isOutlier === true,
  };
}

const stores = ["Daraz", "Telemart", "Shophive"];

function SearchContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryParam = searchParams?.get("q") || "";
  const pageParam = parseInt(searchParams?.get("page") || "1", 10) || 1;

  const [sort, setSort] = useState("Relevance");
  const [selectedStores, setSelectedStores] = useState<string[]>([]);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [hideOutliers, setHideOutliers] = useState(true);
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [liveProducts, setLiveProducts] = useState<SearchProduct[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [dataSource, setDataSource] = useState<"live" | "cache" | "error" | null>(null);
  const [isFiltersExpanded, setIsFiltersExpanded] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [interpretedQuery, setInterpretedQuery] = useState<string | null>(null);

  // Global search cache
  const { lastQuery, lastResults, lastInterpretedQuery, lastFetchTime, setSearchResults } = useSearchStore();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const { showToast } = useToast();

  // Fetch from backend API
  const fetchFromAPI = useCallback(async (keyword: string, page: number = 1) => {
    if (!keyword.trim()) {
      setLiveProducts([]);
      setDataSource(null);
      return;
    }

    const cacheKey = `${keyword}:p${page}`;

    // Check frontend cache to prevent re-scraping on back navigation
    const { resultsCache } = useSearchStore.getState();
    const cachedPage = resultsCache[cacheKey];
    if (cachedPage && cachedPage.results.length > 0 && Date.now() - cachedPage.fetchTime < 30 * 60 * 1000) {
      console.log("[Search] Using frontend cache map for:", cacheKey);
      setLiveProducts(cachedPage.results);
      setInterpretedQuery(cachedPage.interpretedQuery);
      setDataSource("cache");
      return;
    }

    setIsLoading(true);
    setLiveProducts([]);
    setInterpretedQuery(null);
    try {
      // Include auth token (if logged in) so backend can log search_history for admin stats.
      const token = useAuthStore.getState().token;
      const res = await fetch(`${API_BASE}/search`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ keyword, page }),
      });

      if (!res.ok) throw new Error(`API error: ${res.status}`);

      const data = await res.json();
      
      // Log classification details to browser console
      if (data.routeLabel) {
        console.log(
          `%c[QueryRouter]%c Routed query "${keyword}" (page ${page}) to %c${data.routeLabel}%c (Accuracy: ${(data.routingAccuracy * 100).toFixed(0)}%)`,
          "color: #6366f1; font-weight: bold;",
          "color: inherit;",
          `color: ${data.routeLabel === 'NL' ? '#f43f5e' : '#10b981'}; font-weight: bold;`,
          "color: inherit;"
        );
        if (data.routeLabel === 'NL') {
          console.log(
            `%c[QueryRouter]%c Gemini inferred query: "%c${data.interpretedQuery || 'None'}%c"`,
            "color: #6366f1; font-weight: bold;",
            "color: inherit;",
            "color: #a855f7; font-weight: bold;",
            "color: inherit;"
          );
        }
      }

      const normalized = (data.results || []).map(normalizeProduct);
      setLiveProducts(normalized);
      setDataSource(data.source === "cache" ? "cache" : "live");

      const hasInterpreted = data.interpretedQuery && data.interpretedQuery.toLowerCase() !== keyword.toLowerCase();
      const finalInterpreted = hasInterpreted ? data.interpretedQuery : null;
      setInterpretedQuery(finalInterpreted);

      // Save results to frontend cache
      setSearchResults(cacheKey, normalized, finalInterpreted);
    } catch (err) {
      console.warn("[Search] Backend unavailable:", err);
      setLiveProducts([]);
      setInterpretedQuery(null);
      setDataSource("error");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    setSelectedBrands([]);
    setSelectedStores([]);
    fetchFromAPI(queryParam, pageParam);
  }, [queryParam, pageParam, fetchFromAPI]);

  const toggleStore = (store: string) => {
    setSelectedStores(prev =>
      prev.includes(store) ? prev.filter(s => s !== store) : [...prev, store]
    );
  };

  const clearAll = () => {
    setSelectedStores([]);
    setSelectedBrands([]);
    setHideOutliers(true);
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

    // Filter by brands
    if (selectedBrands.length > 0) {
      filtered = filtered.filter(p => p.brand && selectedBrands.includes(p.brand));
    }

    // Filter by outliers
    if (hideOutliers) {
      filtered = filtered.filter(p => !p.isOutlier);
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
    }

    return filtered;
  }, [selectedStores, selectedBrands, hideOutliers, minPrice, maxPrice, sort, liveProducts]);

  // Collect unique stores from base results for the filter sidebar so filters don't disappear
  const availableStores = useMemo(() => {
    const storeSet = new Set(liveProducts.map(p => p.store));
    return stores.filter(s => storeSet.has(s));
  }, [liveProducts]);

  // Collect unique brands dynamically from active search results
  const availableBrands = useMemo(() => {
    const brandSet = new Set<string>();
    liveProducts.forEach(p => {
      if (p.brand && p.brand !== "Unknown" && p.brand !== "Generic" && p.brand !== "Other") {
        brandSet.add(p.brand);
      }
    });
    return Array.from(brandSet).sort();
  }, [liveProducts]);

  return (
    <div className="container" style={{ maxWidth: '100%' }}>
      <div className="search-layout">
        {/* Filters Sidebar */}
        <aside className={`search-sidebar ${isFiltersExpanded ? 'expanded' : 'collapsed'}`}>
          <div className="section-title mobile-filter-header" onClick={() => setIsFiltersExpanded(!isFiltersExpanded)}>
            <h3>Filters</h3>
            <button className="mobile-filter-toggle-btn">
              {isFiltersExpanded ? 'Hide' : 'Show'}
            </button>
          </div>

          <div className="filter-content-wrapper">
            {/* Store Filter */}
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

            {/* Brand Filter */}
            {availableBrands.length > 0 && (
              <div style={{ marginBottom: '32px' }}>
                <h5 style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '16px' }}>Brand</h5>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '200px', overflowY: 'auto', paddingRight: '8px' }}>
                  {availableBrands.map(brand => (
                    <label key={brand} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={selectedBrands.includes(brand)}
                        onChange={() => {
                          setSelectedBrands(prev =>
                            prev.includes(brand) ? prev.filter(b => b !== brand) : [...prev, brand]
                          );
                        }}
                      /> {brand}
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Price Options & Range */}
            <div style={{ marginBottom: '32px' }}>
              <h5 style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '16px' }}>Price Options</h5>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '16px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={hideOutliers}
                    onChange={(e) => setHideOutliers(e.target.checked)}
                  /> Hide Price Outliers
                </label>
              </div>
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
          </div>
        </aside>

        {/* Results Area */}
        <div className="search-main">
          <div style={{ marginBottom: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2 style={{ fontSize: '24px' }}>
                  Search Results
                  {isLoading && <span style={{ fontSize: '14px', color: 'var(--text-muted)', marginLeft: '12px' }}>Scraping stores...</span>}
                </h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
                  Found {results.length} items{(interpretedQuery || queryParam) && ` for "${interpretedQuery || queryParam}"`}
                  {dataSource && dataSource !== "error" && (
                    <span className={`badge ${dataSource === "live" ? "badge-live" : "badge-cached"}`} style={{ marginLeft: '8px', verticalAlign: 'middle' }}>
                      {dataSource === "live" ? "LIVE" : "CACHED"}
                    </span>
                  )}
                </p>
              </div>
              <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                <div style={{ display: 'flex', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', padding: '3px', gap: '2px' }}>
                  <button
                    onClick={() => setViewMode('grid')}
                    aria-label="Grid view"
                    style={{
                      background: viewMode === 'grid' ? 'var(--surface)' : 'transparent',
                      boxShadow: viewMode === 'grid' ? 'var(--shadow-sm)' : 'none',
                      border: 'none', padding: '8px', borderRadius: 'var(--r-sm)', cursor: 'pointer', color: viewMode === 'grid' ? 'var(--text)' : 'var(--text-3)', display: 'flex'
                    }}
                  >
                    <LayoutGrid size={18} />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    aria-label="List view"
                    style={{
                      background: viewMode === 'list' ? 'var(--surface)' : 'transparent',
                      boxShadow: viewMode === 'list' ? 'var(--shadow-sm)' : 'none',
                      border: 'none', padding: '8px', borderRadius: 'var(--r-sm)', cursor: 'pointer', color: viewMode === 'list' ? 'var(--text)' : 'var(--text-3)', display: 'flex'
                    }}
                  >
                    <ListIcon size={18} />
                  </button>
                </div>
                <select
                  className="input-field"
                  style={{ width: '190px', minHeight: 'auto', padding: '10px 12px' }}
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
                <div key={`skeleton-${idx}`} className="card" style={{ display: 'flex', gap: '20px', flexDirection: viewMode === 'grid' ? 'column' : 'row', height: viewMode === 'grid' ? '100%' : 'auto' }}>
                  <div className="skeleton" style={{
                    width: viewMode === 'grid' ? '100%' : '140px',
                    height: viewMode === 'grid' ? '220px' : '140px',
                    flexShrink: 0,
                  }}></div>
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '12px', justifyContent: 'center' }}>
                    <div className="skeleton" style={{ height: '18px', width: '80%' }}></div>
                    <div className="skeleton" style={{ height: '20px', width: '40%' }}></div>
                    <div className="skeleton" style={{ height: '12px', width: '60%', marginTop: 'auto' }}></div>
                  </div>
                </div>
              ))
            )}

            {results.map((item, idx) => (
              <Link href={item.url ? `/product/${item.id}?url=${encodeURIComponent(item.url)}&store=${encodeURIComponent(item.store)}` : `/product/${item.id}`} key={`${item.store}-${item.id}-${idx}`} className="card" style={{ display: 'flex', flexDirection: viewMode === 'grid' ? 'column' : 'row', gap: '24px', textDecoration: 'none', color: 'inherit', position: 'relative' }}>
                <div style={{ width: viewMode === 'grid' ? '100%' : '140px', height: viewMode === 'grid' ? '220px' : '140px', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden', flexShrink: 0 }}>
                  <img
                    src={item.image}
                    alt={item.name}
                    referrerPolicy="no-referrer"
                    style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '14px' }}
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
                  aria-label={item.url && isInWishlist(item.url) ? 'Remove from wishlist' : 'Add to wishlist'}
                  style={{
                    position: 'absolute', top: '12px', right: '12px', zIndex: 2,
                    background: 'color-mix(in srgb, var(--surface) 82%, transparent)',
                    backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)',
                    border: '1px solid var(--border)', borderRadius: '999px',
                    width: '38px', height: '38px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                  }}
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill={item.url && isInWishlist(item.url) ? 'var(--danger)' : 'none'}
                    stroke={item.url && isInWishlist(item.url) ? 'var(--danger)' : 'var(--text-2)'}
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

          {/* Pagination Controls */}
          {queryParam && dataSource !== "error" && (liveProducts.length > 0 || pageParam > 1) && (
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '16px',
              marginTop: '40px',
              paddingTop: '20px',
              borderTop: '1px solid var(--border-light)'
            }}>
              <button
                className="btn btn-secondary"
                disabled={pageParam <= 1 || isLoading}
                onClick={() => {
                  const newPage = pageParam - 1;
                  router.push(`/search?q=${encodeURIComponent(queryParam)}&page=${newPage}`);
                }}
                style={{
                  padding: '8px 16px',
                  borderRadius: '8px',
                  cursor: pageParam <= 1 || isLoading ? 'not-allowed' : 'pointer',
                  opacity: pageParam <= 1 || isLoading ? 0.5 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'all 0.2s ease',
                }}
              >
                &larr; Previous Page
              </button>

              <span style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text-secondary)' }}>
                Page {pageParam}
              </span>

              <button
                className="btn btn-secondary"
                disabled={liveProducts.length < 15 || isLoading}
                onClick={() => {
                  const newPage = pageParam + 1;
                  router.push(`/search?q=${encodeURIComponent(queryParam)}&page=${newPage}`);
                }}
                style={{
                  padding: '8px 16px',
                  borderRadius: '8px',
                  cursor: liveProducts.length < 15 || isLoading ? 'not-allowed' : 'pointer',
                  opacity: liveProducts.length < 15 || isLoading ? 0.5 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'all 0.2s ease',
                }}
              >
                Next Page &rarr;
              </button>
            </div>
          )}

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
