"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { PriceHistoryChart } from "@/components/PriceHistoryChart";
import { useWishlist } from "../../../hooks/useWishlist";
import { useSmartAlerts } from "../../../hooks/useSmartAlerts";
import { useAuthStore } from "../../../store/authStore";
import { useSearchStore } from "../../../store/searchStore";
import { useToast } from "../../../components/Toast";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

function inferStoreFromUrl(url: string): string | null {
  const lower = (url || "").toLowerCase();
  if (lower.includes("daraz")) return "daraz";
  if (lower.includes("shophive")) return "shophive";
  if (lower.includes("telemart")) return "telemart";
  if (lower.includes("mega")) return "mega";
  if (lower.includes("priceoye")) return "priceoye";
  return null;
}

function normalizeStoreKey(store: string | null | undefined): string | null {
  if (!store) return null;
  const s = String(store).trim().toLowerCase();
  if (!s) return null;
  if (s.includes("daraz")) return "daraz";
  if (s.includes("shophive")) return "shophive";
  if (s.includes("telemart")) return "telemart";
  if (s.includes("mega")) return "mega";
  if (s.includes("priceoye")) return "priceoye";
  return s;
}

function VendorCard({ product, isBestValue }: { product: any; isBestValue: boolean }) {
  const price = typeof product.price === 'number' ? product.price : parseInt(String(product.price || '0').replace(/[^\d]/g, ''), 10) || 0;
  return (
    <div className="vendor-card" style={{ position: 'relative', padding: '20px', borderRadius: 'var(--r-lg)', border: `1px solid ${isBestValue ? 'var(--accent)' : 'var(--border)'}`, boxShadow: isBestValue ? 'var(--shadow-md)' : 'none', transition: 'border-color var(--dur-2) var(--ease)' }}>
      {isBestValue && (
        <span className="badge badge-best" style={{ position: 'absolute', top: '-10px', left: '16px' }}>
          Best price
        </span>
      )}
      {/* Store badge */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
        <span style={{ fontSize: '12px', fontWeight: 600, padding: '4px 10px', borderRadius: 'var(--r-pill)', background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text-2)' }}>
          {product.store}
        </span>
        {product.inStock === false && (
          <span style={{ fontSize: '12px', color: 'var(--danger)', fontWeight: 600 }}>Out of stock</span>
        )}
      </div>
      {/* Product name */}
      <h4 style={{ fontFamily: 'var(--font-sans)', fontSize: '14px', fontWeight: 500, lineHeight: '1.45', marginBottom: '14px', color: 'var(--text-2)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
        {product.name}
      </h4>
      {/* Price */}
      <div className="product-price tabular" style={{ fontSize: '22px', marginBottom: '14px' }}>
        Rs. {price.toLocaleString('en-PK')}
      </div>
      {/* Rating */}
      {product.rating > 0 && (
        <div style={{ fontSize: '13px', color: 'var(--text-3)', marginBottom: '16px' }}>
          <span style={{ color: 'var(--star)' }}>{'★'.repeat(Math.round(product.rating))}</span><span style={{ color: 'var(--border-strong)' }}>{'★'.repeat(5 - Math.round(product.rating))}</span> {product.rating.toFixed(1)} ({product.reviewsCount || 0})
        </div>
      )}
      {/* Visit store link */}
      <a href={product.url} target="_blank" rel="noopener noreferrer" className={`btn ${isBestValue ? 'btn-primary' : 'btn-secondary'} btn-block`} style={{ gap: '8px' }}>
        Visit {product.store}
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
      </a>
    </div>
  );
}

function StarRating({ rating, count }: { rating: number; count: number }) {
  const stars = [];
  for (let i = 1; i <= 5; i++) {
    if (i - 0.5 <= rating) {
      stars.push(<span key={i} style={{ color: "var(--star)" }}>&#9733;</span>);
    } else {
      stars.push(<span key={i} style={{ color: "var(--border-strong)" }}>&#9733;</span>);
    }
  }
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
      <span style={{ fontSize: "15px", display: "flex", gap: "2px" }}>{stars}</span>
      <span style={{ color: "var(--text-2)", fontSize: "13px" }}>{rating.toFixed(1)} ({count} reviews)</span>
    </div>
  );
}

interface ProductDetailData {
  price: number;
  originalPrice?: number;
  inStock: boolean;
  name: string;
  imageUrl: string;
  rating: number;
  reviewsCount: number;
  description: string;
  specs: { key: string; value: string }[];
  reviews: { author: string; rating: number; text: string; date: string }[];
  store?: string;
}

export default function ProductDetail({ params }: { params: { id: string } }) {
  const searchParams = useSearchParams();
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [alertType, setAlertType] = useState<"every" | "specific" | null>(null);
  const [targetPrice, setTargetPrice] = useState("");
  const [priceError, setPriceError] = useState("");
  const [scrapedProduct, setScrapedProduct] = useState<any>(null);
  const [productDetails, setProductDetails] = useState<ProductDetailData | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { isAuthenticated } = useAuthStore();
  const { addAlert } = useSmartAlerts();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const { getProductById, addRecentlyViewed } = useSearchStore();
  const { showToast } = useToast();
  const [priceHistory, setPriceHistory] = useState<any[]>([]);
  const [matchedProducts, setMatchedProducts] = useState<any[]>([]);
  const [matchesLoading, setMatchesLoading] = useState(false);

  // Step 1: Find product from cache (search results, trending, recently viewed)
  useEffect(() => {
    const cached = getProductById(params.id);
    if (cached) {
      setScrapedProduct(cached);
      addRecentlyViewed(cached);
      setIsLoading(false);
    } else {
      // Try to scrape from URL+store query params (supports opening in new tab).
      // Also supports older links where params.id is actually encodeURIComponent(product.url).
      const decodedId = decodeURIComponent(params.id);
      const inferredStore = inferStoreFromUrl(decodedId);
      const queryUrl = searchParams?.get('url') || (decodedId.startsWith('http') ? decodedId : null);
      const queryStore = normalizeStoreKey(searchParams?.get('store') || inferredStore);
      if (queryUrl && queryStore) {
        fetch(`${API_BASE}/search/product?url=${encodeURIComponent(queryUrl)}&store=${encodeURIComponent(queryStore)}`)
          .then(res => res.ok ? res.json() : null)
          .then(data => {
            if (data?.product) {
              const p = data.product;
              const product = {
                ...p,
                id: params.id,
                url: p.url || queryUrl,
                store: p.store || queryStore,
                priceValue: p.price || 0,
                image: p.imageUrl || p.image || "",
                price: typeof p.price === "number" ? `Rs. ${p.price.toLocaleString()}` : String(p.price),
              };
              setScrapedProduct(product);
              addRecentlyViewed(product);
            }
          })
          .catch(() => {})
          .finally(() => setIsLoading(false));
      } else {
        // Try the old API endpoint as fallback
        fetch(`${API_BASE}/search/${params.id}`)
          .then(res => res.json())
          .then(data => {
            if (data.product) {
              setScrapedProduct(data.product);
              addRecentlyViewed(data.product);
            }
          })
          .catch(() => {})
          .finally(() => setIsLoading(false));
      }
    }
  }, [params.id]);

  // Step 2: If we have a product URL and store, fetch detailed info from the product page
  useEffect(() => {
    if (!scrapedProduct) return;
    const url = scrapedProduct.url;
    const storeKey = normalizeStoreKey(scrapedProduct.store) || inferStoreFromUrl(url);
    if (!url || !storeKey) return;

    setDetailsLoading(true);
    fetch(`${API_BASE}/search/product?url=${encodeURIComponent(url)}&store=${encodeURIComponent(storeKey)}`)
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data?.product) {
          setProductDetails(data.product);
          // Merge details into the main product (update name, image, rating from product page)
          setScrapedProduct((prev: any) => {
            if (!prev) return prev;
            const d = data.product;
            return {
              ...prev,
              name: d.name || prev.name,
              image: d.imageUrl || prev.image,
              rating: d.rating || prev.rating,
              reviewsCount: d.reviewsCount || prev.reviewsCount,
              priceValue: d.price || prev.priceValue,
              originalPrice: d.originalPrice || prev.originalPrice,
            };
          });
        }
      })
      .catch(() => {})
      .finally(() => setDetailsLoading(false));
  }, [scrapedProduct?.url]);

  // Fetch real price history points (falls back to a single-point "today" view if empty).
  useEffect(() => {
    if (!scrapedProduct?.url || !scrapedProduct?.store) return;

    const url = scrapedProduct.url;
    const store = normalizeStoreKey(scrapedProduct.store) || inferStoreFromUrl(url);
    if (!store) return;

    fetch(`${API_BASE}/history?url=${encodeURIComponent(url)}&store=${encodeURIComponent(store)}`)
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        const points = Array.isArray(data?.points) ? data.points : [];
        const normalized = points
          .filter((p: any) => p && typeof p.price === 'number' && (p.day || p.date))
          .map((p: any) => ({
            date: String(p.day || p.date),
            price: Number(p.price),
          }));

        if (normalized.length > 0) {
          setPriceHistory(normalized);
          return;
        }

        // Fallback: show a single real-time point derived from the currently displayed price.
        const price = scrapedProduct.priceValue || scrapedProduct.price || 0;
        const numericPrice = typeof price === "number" ? price : parseInt(String(price).replace(/[^\d]/g, ""), 10) || 0;
        if (numericPrice > 0) {
          const day = new Date().toISOString().slice(0, 10);
          setPriceHistory([{ date: day, price: numericPrice }]);
        } else {
          setPriceHistory([]);
        }
      })
      .catch(() => {
        // Keep UI usable even if backend is down.
        setPriceHistory([]);
      });
  }, [scrapedProduct?.url, scrapedProduct?.store, scrapedProduct?.priceValue]);

  // Step 4: Fetch cross-store matches for comparison
  useEffect(() => {
    if (!scrapedProduct?.url || !scrapedProduct?.store) return;
    setMatchesLoading(true);
    const store = normalizeStoreKey(scrapedProduct.store) || inferStoreFromUrl(scrapedProduct.url);
    if (!store) {
      setMatchesLoading(false);
      return;
    }
    fetch(`${API_BASE}/search/matches?url=${encodeURIComponent(scrapedProduct.url)}&store=${encodeURIComponent(store)}&name=${encodeURIComponent(scrapedProduct.name)}`)
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data?.matches) {
          setMatchedProducts(data.matches);
        }
      })
      .catch(() => {})
      .finally(() => setMatchesLoading(false));
  }, [scrapedProduct?.url, scrapedProduct?.store]);

  if (isLoading) {
    return (
      <div className="container" style={{ padding: "100px 0", textAlign: "center" }}>
        <h2 style={{ fontSize: "24px", color: "var(--text-muted)" }}>Loading product...</h2>
      </div>
    );
  }

  if (!scrapedProduct) {
    return (
      <div className="container" style={{ padding: "100px 0", textAlign: "center" }}>
        <h2 style={{ fontSize: "32px", marginBottom: "16px" }}>Product Not Found</h2>
        <p style={{ color: "var(--text-secondary)", fontSize: "18px" }}>Your search session may have expired, or this product doesn't exist.</p>
        <Link href="/search" className="btn btn-primary" style={{ marginTop: "32px", display: "inline-flex", alignItems: "center", height: "48px", padding: "0 24px", textDecoration: "none" }}>
          Return to Search
        </Link>
      </div>
    );
  }

  const priceNum = scrapedProduct.priceValue || (typeof scrapedProduct.price === "number" ? scrapedProduct.price : parseInt(String(scrapedProduct.price || "0").replace(/[^\d]/g, ""), 10) || 0);
  const origNum = scrapedProduct.originalPrice ? (typeof scrapedProduct.originalPrice === "number" ? scrapedProduct.originalPrice : parseInt(String(scrapedProduct.originalPrice).replace(/[^\d]/g, ""), 10) || 0) : (productDetails?.originalPrice ? productDetails.originalPrice : 0);
  const hasDiscount = origNum > 0 && origNum > priceNum;
  const discountPct = hasDiscount ? Math.round((1 - priceNum / origNum) * 100) : 0;

  const product = {
    ...scrapedProduct,
    priceValue: priceNum,
    rating: scrapedProduct.rating || 0,
    reviewsCount: scrapedProduct.reviewsCount || scrapedProduct.reviews || 0,
    image: scrapedProduct.imageUrl || scrapedProduct.image || "",
    originalPrice: origNum,
    displayPrice: typeof scrapedProduct.price === "string" ? scrapedProduct.price : `Rs. ${priceNum.toLocaleString("en-PK")}`,
  };

  const handleToggleWishlist = async () => {
    if (!isAuthenticated) {
      showToast("Please login to save to your wishlist", "info");
      return;
    }
    const result = await toggleWishlist({
      store: product.store,
      url: product.url,
      name: product.name,
      imageUrl: product.image,
    });
    if (result === "added") showToast("Added to wishlist", "success");
    else if (result === "removed") showToast("Removed from wishlist", "error");
    else if (result === "error") showToast("Failed to add to wishlist", "error");
  };

  const saveAlert = async (type: "every_change" | "target_price", tPrice?: number) => {
    if (!isAuthenticated) {
      setPriceError("Please login to set price alerts.");
      return false;
    }
    const numericTarget = typeof tPrice === "number"
      ? tPrice
      : (typeof product.priceValue === "number" ? Math.round(product.priceValue * 0.99) : 0);
    const productUrl = product.url || searchParams?.get('url') || null;
    if (!productUrl) {
      setPriceError("Product URL missing; can't create alert.");
      return false;
    }
    if (!numericTarget || numericTarget <= 0) {
      setPriceError("Couldn't detect a valid price for this product.");
      return false;
    }
    try {
      await addAlert({
        targetPrice: numericTarget,
        productUrl,
        keyword: null,
      });
      return true;
    } catch (e: any) {
      showToast(e?.message || "Failed to create alert", "error");
      return false;
    }
  };

  const handleSetAlert = async (type: "every" | "specific") => {
    setAlertType(type);
    if (type === "every") {
      const ok = await saveAlert("every_change");
      if (ok) {
        showToast(`Now tracking ${product.name}`, "success");
        setShowAlertModal(false);
        setAlertType(null);
      }
    }
  };

  const handleSpecificPriceSubmit = async () => {
    setPriceError("");
    if (!targetPrice || targetPrice.trim() === "") {
      setPriceError("Please enter a target price");
      return;
    }
    const price = parseFloat(targetPrice);
    if (isNaN(price) || price <= 0) {
      setPriceError("Please enter a valid price greater than 0");
      return;
    }
    const ok = await saveAlert("target_price", price);
    if (ok) {
      showToast(`Alert set — target Rs. ${price.toLocaleString()}`, "success");
      setShowAlertModal(false);
      setAlertType(null);
      setTargetPrice("");
    }
  };

  const wlUrl = product.url || "";
  const inWl = isInWishlist(wlUrl);

  const specs = productDetails?.specs || [];
  const description = productDetails?.description || "";
  const reviews = productDetails?.reviews || [];

  return (
    <div className="container" style={{ paddingTop: "32px" }}>
      {/* Breadcrumb */}
      <div style={{ marginBottom: "24px", display: "flex", alignItems: "center", gap: "8px", fontSize: "13px" }}>
        <Link href="/" style={{ color: "var(--text-muted)", textDecoration: "none" }}>Home</Link>
        <span style={{ color: "var(--text-muted)" }}>/</span>
        <Link href="/search" style={{ color: "var(--text-muted)", textDecoration: "none" }}>Search</Link>
        <span style={{ color: "var(--text-muted)" }}>/</span>
        <span style={{ color: "var(--text-secondary)" }}>{product.name.slice(0, 40)}{product.name.length > 40 ? "..." : ""}</span>
      </div>

      <div className="product-layout">
        {/* Product Image */}
        <div className="product-image-col">
          <div style={{ aspectRatio: "1/1", background: "var(--surface-2)", borderRadius: "var(--r-xl)", display: "flex", alignItems: "center", justifyContent: "center", position: "sticky", top: "100px", overflow: "hidden", border: "1px solid var(--border)" }}>
            {product.image ? (
              <img src={product.image} alt={product.name} style={{ width: "100%", height: "100%", objectFit: "contain", padding: "40px" }} referrerPolicy="no-referrer" />
            ) : (
              <div style={{ color: "var(--text-3)", fontSize: "14px" }}>No image available</div>
            )}
            {hasDiscount && (
              <span className="badge badge-hot" style={{ position: "absolute", top: "16px", left: "16px" }}>
                -{discountPct}%
              </span>
            )}
          </div>
        </div>

        {/* Product Info */}
        <div className="product-info-col">
          {/* Store badge + rating */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "18px", flexWrap: "wrap" }}>
            <span style={{
              fontSize: "12px", fontWeight: 600,
              padding: "5px 12px", borderRadius: "var(--r-pill)",
              background: "var(--surface-2)", border: "1px solid var(--border)",
              color: "var(--text-2)",
            }}>
              {product.store}
            </span>
            {product.rating > 0 && <StarRating rating={product.rating} count={product.reviewsCount} />}
            {product.inStock !== false && (
              <span className="badge badge-live">In stock</span>
            )}
          </div>

          <h1 style={{ fontSize: "clamp(28px, 4vw, 38px)", marginBottom: "22px", lineHeight: "1.12" }}>
            {product.name}
          </h1>

          <div style={{ marginBottom: "28px" }}>
            <div className="product-price tabular" style={{ fontSize: "40px", fontWeight: 700, letterSpacing: "-0.02em" }}>
              {product.displayPrice}
            </div>
            {hasDiscount && (
              <div style={{ display: "flex", alignItems: "center", gap: "12px", marginTop: "10px" }}>
                <span style={{ fontSize: "16px", color: "var(--text-3)", textDecoration: "line-through" }}>
                  Rs. {origNum.toLocaleString("en-PK")}
                </span>
                <span className="badge badge-live" style={{ fontSize: "13px" }}>
                  Save Rs. {(origNum - priceNum).toLocaleString("en-PK")}
                </span>
              </div>
            )}
          </div>

          <div style={{ display: "flex", gap: "12px", marginBottom: "28px", flexWrap: "wrap" }}>
            <button
              className="btn btn-primary btn-lg"
              style={{ flex: "2 1 200px", minHeight: "52px" }}
              onClick={() => {
                if (product.url) window.open(product.url, "_blank");
                else showToast("Store URL not available", "info");
              }}
            >
              Buy on {product.store}
            </button>
            <button
              className="btn btn-secondary btn-lg"
              style={{ flex: "1 1 140px", minHeight: "52px" }}
              onClick={() => setShowAlertModal(true)}
            >
              Track price
            </button>
            <button
              onClick={handleToggleWishlist}
              title={inWl ? "Remove from wishlist" : "Add to wishlist"}
              aria-label={inWl ? "Remove from wishlist" : "Add to wishlist"}
              style={{
                minHeight: "52px", width: "52px",
                border: inWl ? "1px solid var(--danger)" : "1px solid var(--border-strong)",
                borderRadius: "var(--r-md)",
                background: inWl ? "var(--danger-soft)" : "var(--surface)",
                cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                transition: "all var(--dur-1) var(--ease)",
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill={inWl ? "var(--danger)" : "none"} stroke={inWl ? "var(--danger)" : "var(--text-2)"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
            </button>
          </div>

          {/* Price History */}
          <div style={{ padding: "24px", background: "var(--surface)", borderRadius: "var(--r-lg)", border: "1px solid var(--border)" }}>
            <h4 className="eyebrow" style={{ marginBottom: "16px" }}>Price history</h4>
            <PriceHistoryChart data={priceHistory} />
          </div>
        </div>
      </div>

      {/* Multi-vendor Comparison */}
      {matchesLoading && (
        <div style={{ marginBottom: '60px', padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
          Searching other stores...
        </div>
      )}
      {!matchesLoading && matchedProducts.length > 1 && (
        <div style={{ marginBottom: '60px' }}>
          <div className="section-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3>Compare Prices</h3>
            <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{matchedProducts.length} stores</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
            {matchedProducts.map((p, idx) => (
              <VendorCard key={p.url} product={p} isBestValue={idx === 0} />
            ))}
          </div>
        </div>
      )}

      {/* Description */}
      {description && (
        <div style={{ marginBottom: "60px" }}>
          <div className="section-title"><h3>Description</h3></div>
          <div style={{ padding: "24px", background: "var(--bg-surface)", borderRadius: "16px", border: "1px solid var(--border-light)" }}>
            <p style={{ color: "var(--text-secondary)", fontSize: "14px", lineHeight: "1.7" }}>{description}</p>
          </div>
        </div>
      )}

      {/* Specifications */}
      {specs.length > 0 && (
        <div style={{ marginBottom: "60px" }}>
          <div className="section-title"><h3>Specifications</h3></div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "1px", background: "var(--border-light)", borderRadius: "12px", overflow: "hidden" }}>
            {specs.map((spec, i) => (
              <DetailRow key={i} label={spec.key} value={spec.value} />
            ))}
          </div>
        </div>
      )}

      {/* Product Details Grid */}
      <div className="section-title"><h3>Product Details</h3></div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "1px", background: "var(--border-light)", borderRadius: "12px", overflow: "hidden", marginBottom: "60px" }}>
        <DetailRow label="Store" value={product.store} />
        <DetailRow label="Price" value={product.displayPrice} valueColor="var(--text)" />
        {hasDiscount && <DetailRow label="Original Price" value={`Rs. ${origNum.toLocaleString("en-PK")}`} valueStyle={{ textDecoration: "line-through", color: "var(--text-3)" }} />}
        {hasDiscount && <DetailRow label="You Save" value={`Rs. ${(origNum - priceNum).toLocaleString("en-PK")} (${discountPct}%)`} valueColor="var(--success)" />}
        {product.rating > 0 && <DetailRow label="Rating" value={`${product.rating.toFixed(1)} out of 5 (${product.reviewsCount} reviews)`} valueColor="var(--star)" />}
        <DetailRow label="Availability" value={product.inStock !== false ? "In Stock" : "Out of Stock"} valueColor={product.inStock !== false ? "var(--success)" : "var(--danger)"} />
      </div>

      {/* Reviews */}
      {reviews.length > 0 && (
        <div style={{ marginBottom: "60px" }}>
          <div className="section-title"><h3>Customer Reviews</h3></div>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {reviews.map((review, i) => (
              <div key={i} style={{ padding: "20px 24px", background: "var(--bg-surface)", borderRadius: "12px", border: "1px solid var(--border-light)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                  <span style={{ fontWeight: "600", fontSize: "14px" }}>{review.author || "Anonymous"}</span>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    {review.rating > 0 && (
                      <span style={{ color: "var(--star)", fontSize: "13px" }}>
                        {"★".repeat(Math.round(review.rating))}{"☆".repeat(5 - Math.round(review.rating))}
                      </span>
                    )}
                    {review.date && <span style={{ color: "var(--text-muted)", fontSize: "12px" }}>{review.date}</span>}
                  </div>
                </div>
                <p style={{ color: "var(--text-secondary)", fontSize: "14px", lineHeight: "1.6" }}>{review.text}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Loading indicator for details */}
      {detailsLoading && (
        <div style={{ marginBottom: "60px", padding: "24px", textAlign: "center", color: "var(--text-muted)", fontSize: "13px" }}>
          Loading product details from {product.store}...
        </div>
      )}

      {/* View on Store */}
      {product.url && (
        <div style={{ marginBottom: "60px", padding: "24px", background: "var(--bg-surface)", borderRadius: "16px", border: "1px solid var(--border-light)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
          <div>
            <h4 style={{ fontSize: "14px", marginBottom: "4px" }}>View full details on {product.store}</h4>
            <p style={{ color: "var(--text-secondary)", fontSize: "13px" }}>See the complete product page with all specifications and reviews.</p>
          </div>
          <a href={product.url} target="_blank" rel="noopener noreferrer" className="btn btn-secondary" style={{ border: "1px solid var(--border-light)", gap: "8px", flexShrink: 0 }}>
            Visit {product.store}
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
            </svg>
          </a>
        </div>
      )}

      {/* Alert Modal */}
      {showAlertModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(3px)", WebkitBackdropFilter: "blur(3px)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}
          onClick={() => { setShowAlertModal(false); setAlertType(null); setTargetPrice(""); setPriceError(""); }}>
          <div className="rise-in" style={{ background: "var(--surface)", borderRadius: "var(--r-lg)", padding: "28px", maxWidth: "440px", width: "100%", border: "1px solid var(--border)", boxShadow: "var(--shadow-lg)" }}
            onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h3 style={{ fontSize: "20px" }}>Track this price</h3>
              <button onClick={() => { setShowAlertModal(false); setAlertType(null); setTargetPrice(""); setPriceError(""); }}
                aria-label="Close"
                style={{ background: "none", border: "none", color: "var(--text-3)", cursor: "pointer", padding: "4px", display: "flex" }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            {alertType === null ? (
              <>
                <p style={{ color: "var(--text-2)", marginBottom: "20px", fontSize: "14px" }}>
                  We&rsquo;ll let you know when the price moves in your favour.
                </p>
                <button onClick={() => handleSetAlert("every")} style={{ width: "100%", padding: "16px", background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: "var(--r-md)", color: "var(--text)", cursor: "pointer", textAlign: "left", marginBottom: "12px", transition: "border-color var(--dur-1) var(--ease)" }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = "var(--accent)")}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = "var(--border)")}>
                  <div style={{ fontWeight: 600, marginBottom: "4px", fontSize: "15px" }}>Every price change</div>
                  <div style={{ fontSize: "13px", color: "var(--text-2)" }}>Get notified whenever the price changes</div>
                </button>
                <button onClick={() => handleSetAlert("specific")} style={{ width: "100%", padding: "16px", background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: "var(--r-md)", color: "var(--text)", cursor: "pointer", textAlign: "left", transition: "border-color var(--dur-1) var(--ease)" }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = "var(--accent)")}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = "var(--border)")}>
                  <div style={{ fontWeight: 600, marginBottom: "4px", fontSize: "15px" }}>Specific price</div>
                  <div style={{ fontSize: "13px", color: "var(--text-2)" }}>Set a target and get notified when it&rsquo;s reached</div>
                </button>
              </>
            ) : (
              <>
                <p style={{ color: "var(--text-2)", marginBottom: "16px", fontSize: "14px" }}>Enter your target price</p>
                <input type="number" placeholder="e.g. 300000" className="input-field" value={targetPrice} onChange={(e) => { setTargetPrice(e.target.value); setPriceError(""); }} autoFocus style={{ marginBottom: priceError ? "4px" : "24px" }} />
                {priceError && <p style={{ color: "var(--danger)", fontSize: "13px", marginBottom: "16px" }}>{priceError}</p>}
                <div style={{ display: "flex", gap: "12px" }}>
                  <button onClick={() => { setAlertType(null); setTargetPrice(""); setPriceError(""); }} className="btn btn-secondary" style={{ flex: 1 }}>Back</button>
                  <button onClick={handleSpecificPriceSubmit} className="btn btn-primary" style={{ flex: 1 }}>Set Alert</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function DetailRow({ label, value, valueColor, valueStyle }: { label: string; value: string; valueColor?: string; valueStyle?: React.CSSProperties }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 20px", background: "var(--bg-surface)" }}>
      <span style={{ color: "var(--text-muted)", fontSize: "13px" }}>{label}</span>
      <span style={{ fontWeight: "600", fontSize: "13px", color: valueColor || "var(--text-main)", ...valueStyle }}>{value}</span>
    </div>
  );
}
