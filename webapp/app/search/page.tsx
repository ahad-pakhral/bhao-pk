"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

const allProducts = [
  { id: 1, name: "iPhone 15 Pro", specs: "256GB • 5G • Daraz", price: "Rs. 345,000", rating: 4.9, reviews: 120, badge: "BEST", priceValue: 345000, image: "/images/iphone-15-pro.png", store: "Daraz" },
  { id: 8, name: "MacBook Air M2", specs: "13\" • 8GB RAM • 256GB", price: "Rs. 285,000", rating: 4.9, reviews: 78, priceDrop: "-5%", priceValue: 285000, image: "/images/macbook-air.png", store: "Shophive" },
  { id: 9, name: "Sony WH-1000XM5", specs: "Noise Cancelling • 30hr", price: "Rs. 85,000", rating: 4.6, reviews: 203, priceValue: 85000, image: "/images/sony-xm5.png", store: "Telemart" },
  { id: 10, name: "iPhone 15", specs: "128GB • Telemart", price: "Rs. 315,000", rating: 4.5, reviews: 89, priceValue: 315000, image: "/images/iphone-15-pro.png", store: "Telemart" },
  { id: 11, name: "iPhone 15 Plus", specs: "256GB • Shophive", price: "Rs. 335,000", rating: 4.7, reviews: 56, priceValue: 335000, image: "/images/iphone-15-pro.png", store: "Shophive" },
  { id: 3, name: "AirPods Pro", specs: "Active Noise Cancellation", price: "Rs. 65,000", rating: 4.8, reviews: 156, priceValue: 65000, image: "/images/airpods-pro.png", store: "Daraz" },
  { id: 5, name: "iPad Pro 12.9\"", specs: "M2 • 256GB", price: "Rs. 245,000", rating: 4.8, reviews: 92, priceValue: 245000, image: "/images/ipad-pro.png", store: "Daraz" },
];

const stores = ["Daraz", "Telemart", "Shophive"];

export default function SearchPage() {
  const searchParams = useSearchParams();
  const queryParam = searchParams?.get("q") || "";

  const [searchQuery, setSearchQuery] = useState(queryParam);
  const [sort, setSort] = useState("Relevance");
  const [selectedStores, setSelectedStores] = useState<string[]>([]);
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");

  useEffect(() => {
    if (queryParam) {
      setSearchQuery(queryParam);
    }
  }, [queryParam]);

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
    let filtered = [...allProducts];

    // Filter by search query
    if (searchQuery.trim()) {
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
    }

    return filtered;
  }, [searchQuery, selectedStores, minPrice, maxPrice, sort]);

  return (
    <div className="container">
      <div style={{ display: 'flex', gap: '40px' }}>
        {/* Filters Sidebar */}
        <aside style={{ width: '280px', flexShrink: 0 }}>
          <div className="section-title"><h3>Filters</h3></div>

          <div style={{ marginBottom: '32px' }}>
            <h5 style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '16px' }}>Store</h5>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {stores.map(store => (
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
              placeholder="Search products..."
              className="input-field"
              style={{ width: '100%', marginBottom: '16px' }}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2 style={{ fontSize: '24px' }}>Search Results</h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
                  Found {results.length} items{searchQuery && ` for "${searchQuery}"`}
                </p>
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

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {results.map(item => (
              <Link href={`/product/${item.id}`} key={item.id} className="card" style={{ display: 'flex', gap: '24px', textDecoration: 'none', color: 'inherit' }}>
                <div style={{ width: '120px', height: '120px', background: '#1a1a1a', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '40px', position: 'relative', overflow: 'hidden' }}>
                  <img src={item.image} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '12px' }} />
                  {item.badge && <span className="badge badge-best" style={{ position: 'absolute', top: '8px', left: '8px' }}>{item.badge}</span>}
                  {item.priceDrop && <span className="badge badge-hot" style={{ position: 'absolute', top: '8px', right: '8px' }}>{item.priceDrop}</span>}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <h4 style={{ fontSize: '18px' }}>{item.name}</h4>
                    <div className="product-price">{item.price}</div>
                  </div>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '12px' }}>{item.specs}</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '12px', color: 'var(--text-muted)' }}>
                    <span>★ {item.rating} ({item.reviews} reviews)</span>
                    <span style={{ color: 'var(--accent-success)' }}>In Stock</span>
                  </div>
                </div>
              </Link>
            ))}

            {results.length === 0 && (
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
