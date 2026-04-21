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
  return null;
}

function VendorCard({ product, isBestValue }: { product: any; isBestValue: boolean }) {
  const price = typeof product.price === 'number' ? product.price : parseInt(String(product.price || '0').replace(/[^\d]/g, ''), 10) || 0;
  return (
    <div className="vendor-card" style={{ position: 'relative', padding: '20px', background: 'var(--bg-surface)', borderRadius: '16px', border: `1px solid ${isBestValue ? 'var(--accent-primary)' : 'var(--border-light)'}`, transition: 'border-color 0.2s' }}>
      {isBestValue && (
        <span className="badge badge-best" style={{ position: 'absolute', top: '-8px', left: '16px', fontSize: '11px', fontWeight: 700, padding: '4px 10px', letterSpacing: '0.05em' }}>
          BEST VALUE
        </span>
      )}
      {/* Store badge */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
        <span style={{ fontSize: '11px', fontFamily: 'var(--font-display)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', padding: '3px 8px', borderRadius: '4px', background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border-light)', color: 'var(--text-secondary)' }}>
          {product.store}
        </span>
        {product.inStock === false && (
          <span style={{ fontSize: '11px', color: '#FF4444', fontWeight: 600 }}>Out of Stock</span>
        )}
      </div>
      {/* Product name */}
      <h4 style={{ fontSize: '14px', lineHeight: '1.4', marginBottom: '12px', color: 'var(--text-main)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
        {product.name}
      </h4>
      {/* Price */}
      <div className="product-price" style={{ fontSize: '20px', marginBottom: '16px' }}>
        Rs. {price.toLocaleString('en-PK')}
      </div>
      {/* Rating */}
      {product.rating > 0 && (
        <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '16px' }}>
          {'★'.repeat(Math.round(product.rating))}{'☆'.repeat(5 - Math.round(product.rating))} {product.rating.toFixed(1)} ({product.reviewsCount || 0})
        </div>
      )}
      {/* Visit store link */}
      <a href={product.url} target="_blank" rel="noopener noreferrer" className="btn btn-secondary" style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', height: '40px', fontSize: '12px' }}>
        Visit {product.store}
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
      </a>
    </div>
  );
}

function StarRating({ rating, count }: { rating: number; count: number }) {
  const stars = [];
  for (let i = 1; i <= 5; i++) {
    if (i <= Math.floor(rating)) {
      stars.push(<span key={i} style={{ color: "#FFB800" }}>&#9733;</span>);
    } else if (i - 0.5 <= rating) {
      stars.push(<span key={i} style={{ color: "#FFB800" }}>&#9733;</span>);
    } else {
      stars.push(<span key={i} style={{ color: "#333" }}>&#9733;</span>);
    }
  }
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
      <span style={{ fontSize: "16px", display: "flex", gap: "2px" }}>{stars}</span>
      <span style={{ color: "var(--text-secondary)", fontSize: "13px" }}>{rating.toFixed(1)} ({count} reviews)</span>
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
      const queryStore = searchParams?.get('store') || inferredStore;
      if (queryUrl && queryStore) {
        fetch(`${API_BASE}/search/product?url=${encodeURIComponent(queryUrl)}&store=${encodeURIComponent(queryStore)}`)
          .then(res => res.ok ? res.json() : null)
          .then(data => {
            if (data?.product) {
              const p = data.product;
              const product = {
                ...p,
                id: params.id,
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
    const store = scrapedProduct.store;
    if (!url || !store) return;

    setDetailsLoading(true);
    fetch(`${API_BASE}/search/product?url=${encodeURIComponent(url)}&store=${encodeURIComponent(store)}`)
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

  // Generate price history
  useEffect(() => {
    if (!scrapedProduct) return;
    const price = scrapedProduct.priceValue || scrapedProduct.price || 0;
    const numericPrice = typeof price === "number" ? price : parseInt(String(price).replace(/[^\d]/g, ""), 10) || 0;
    if (numericPrice > 0) {
      const now = new Date();
      setPriceHistory([{
        date: `${now.getDate()}/${now.getMonth() + 1}`,
        price: numericPrice,
      }]);
    }
  }, [scrapedProduct?.priceValue]);

  // Step 4: Fetch cross-store matches for comparison
  useEffect(() => {
    if (!scrapedProduct?.url || !scrapedProduct?.store) return;
    setMatchesLoading(true);
    fetch(`${API_BASE}/search/matches?url=${encodeURIComponent(scrapedProduct.url)}&store=${encodeURIComponent(scrapedProduct.store)}`)
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

      <div style={{ display: "flex", gap: "60px", marginBottom: "80px" }}>
        {/* Product Image */}
        <div style={{ flex: "0 0 440px" }}>
          <div style={{ aspectRatio: "1/1", background: "#0a0a0a", borderRadius: "20px", display: "flex", alignItems: "center", justifyContent: "center", position: "sticky", top: "100px", overflow: "hidden", border: "1px solid var(--border-light)" }}>
            {product.image ? (
              <img src={product.image} alt={product.name} style={{ width: "100%", height: "100%", objectFit: "contain", padding: "40px" }} referrerPolicy="no-referrer" />
            ) : (
              <div style={{ opacity: 0.1, fontSize: "80px" }}>🛍️</div>
            )}
            {hasDiscount && (
              <span className="badge badge-hot" style={{ position: "absolute", top: "16px", left: "16px", fontSize: "13px", padding: "6px 12px" }}>
                -{discountPct}%
              </span>
            )}
          </div>
        </div>

        {/* Product Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Store badge + rating */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px", flexWrap: "wrap" }}>
            <span style={{
              fontSize: "11px", fontFamily: "var(--font-display)", fontWeight: 700,
              textTransform: "uppercase", letterSpacing: "0.08em",
              padding: "4px 10px", borderRadius: "6px",
              background: "rgba(255,255,255,0.06)", border: "1px solid var(--border-light)",
              color: "var(--text-secondary)",
            }}>
              {product.store}
            </span>
            {product.rating > 0 && <StarRating rating={product.rating} count={product.reviewsCount} />}
            {product.inStock !== false && (
              <span style={{ fontSize: "11px", fontWeight: 600, color: "var(--accent-success)", fontFamily: "var(--font-display)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                In Stock
              </span>
            )}
          </div>

          <h1 style={{ fontSize: "32px", marginBottom: "20px", lineHeight: "1.25", letterSpacing: "-0.01em" }}>
            {product.name}
          </h1>

          <div style={{ marginBottom: "32px" }}>
            <div className="product-price" style={{ fontSize: "36px" }}>
              {product.displayPrice}
            </div>
            {hasDiscount && (
              <div style={{ display: "flex", alignItems: "center", gap: "12px", marginTop: "8px" }}>
                <span style={{ fontSize: "16px", color: "#666", textDecoration: "line-through", fontFamily: "var(--font-mono)" }}>
                  Rs. {origNum.toLocaleString("en-PK")}
                </span>
                <span style={{ fontSize: "13px", color: "#FF0055", fontWeight: 700, fontFamily: "var(--font-display)" }}>
                  Save Rs. {(origNum - priceNum).toLocaleString("en-PK")}
                </span>
              </div>
            )}
          </div>

          <div style={{ display: "flex", gap: "12px", marginBottom: "32px" }}>
            <button
              className="btn btn-primary"
              style={{ flex: 1, height: "52px", fontSize: "13px" }}
              onClick={() => {
                if (product.url) window.open(product.url, "_blank");
                else showToast("Store URL not available", "info");
              }}
            >
              Buy on {product.store}
            </button>
            <button
              className="btn btn-secondary"
              style={{ flex: 1, height: "52px", border: "1px solid var(--border-light)" }}
              onClick={() => setShowAlertModal(true)}
            >
              Price Alert
            </button>
            <button
              onClick={handleToggleWishlist}
              title={inWl ? "Remove from wishlist" : "Add to wishlist"}
              style={{
                height: "52px", width: "52px",
                border: inWl ? "1px solid #FF4444" : "1px solid var(--border-light)",
                borderRadius: "12px",
                background: inWl ? "rgba(255,68,68,0.08)" : "transparent",
                cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                transition: "all 0.2s",
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill={inWl ? "#FF4444" : "none"} stroke={inWl ? "#FF4444" : "var(--text-secondary)"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
            </button>
          </div>

          {/* Price History */}
          {priceHistory.length > 0 && (
            <div style={{ padding: "24px", background: "var(--bg-surface)", borderRadius: "16px", border: "1px solid var(--border-light)" }}>
              <h4 style={{ marginBottom: "16px", fontSize: "12px", color: "var(--text-muted)", letterSpacing: "0.06em", textTransform: "uppercase" }}>Price History</h4>
              <PriceHistoryChart data={priceHistory} />
            </div>
          )}
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
        <DetailRow label="Price" value={product.displayPrice} valueColor="var(--accent-primary)" />
        {hasDiscount && <DetailRow label="Original Price" value={`Rs. ${origNum.toLocaleString("en-PK")}`} valueStyle={{ textDecoration: "line-through", color: "#666" }} />}
        {hasDiscount && <DetailRow label="You Save" value={`Rs. ${(origNum - priceNum).toLocaleString("en-PK")} (${discountPct}%)`} valueColor="#FF0055" />}
        {product.rating > 0 && <DetailRow label="Rating" value={`${product.rating.toFixed(1)} out of 5 (${product.reviewsCount} reviews)`} valueColor="#FFB800" />}
        <DetailRow label="Availability" value={product.inStock !== false ? "In Stock" : "Out of Stock"} valueColor={product.inStock !== false ? "var(--accent-success)" : "#FF4444"} />
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
                      <span style={{ color: "#FFB800", fontSize: "13px" }}>
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
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}
          onClick={() => { setShowAlertModal(false); setAlertType(null); setTargetPrice(""); setPriceError(""); }}>
          <div style={{ background: "var(--bg-surface)", borderRadius: "16px", padding: "32px", maxWidth: "440px", width: "90%", border: "1px solid var(--border-light)" }}
            onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
              <h3 style={{ fontSize: "18px" }}>Set Price Alert</h3>
              <button onClick={() => { setShowAlertModal(false); setAlertType(null); setTargetPrice(""); setPriceError(""); }}
                style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", padding: "4px" }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            {alertType === null ? (
              <>
                <p style={{ color: "var(--text-secondary)", marginBottom: "24px", fontSize: "14px" }}>
                  Get notified when the price drops for this product
                </p>
                <button onClick={() => handleSetAlert("every")} style={{ width: "100%", padding: "16px", background: "#0a0a0a", border: "1px solid var(--border-light)", borderRadius: "12px", color: "#fff", cursor: "pointer", textAlign: "left", marginBottom: "12px", transition: "border-color 0.2s" }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = "rgba(204,255,0,0.3)")}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = "var(--border-light)")}>
                  <div style={{ fontWeight: "700", marginBottom: "4px", fontFamily: "var(--font-display)", fontSize: "14px" }}>Every Price Change</div>
                  <div style={{ fontSize: "12px", color: "var(--text-secondary)" }}>Get notified whenever the price changes</div>
                </button>
                <button onClick={() => handleSetAlert("specific")} style={{ width: "100%", padding: "16px", background: "#0a0a0a", border: "1px solid var(--border-light)", borderRadius: "12px", color: "#fff", cursor: "pointer", textAlign: "left", transition: "border-color 0.2s" }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = "rgba(204,255,0,0.3)")}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = "var(--border-light)")}>
                  <div style={{ fontWeight: "700", marginBottom: "4px", fontFamily: "var(--font-display)", fontSize: "14px" }}>Specific Price</div>
                  <div style={{ fontSize: "12px", color: "var(--text-secondary)" }}>Set a target price and get notified when reached</div>
                </button>
              </>
            ) : (
              <>
                <p style={{ color: "var(--text-secondary)", marginBottom: "16px", fontSize: "14px" }}>Enter your target price</p>
                <input type="number" placeholder="e.g., 300000" className="input-field" value={targetPrice} onChange={(e) => { setTargetPrice(e.target.value); setPriceError(""); }} autoFocus style={{ marginBottom: priceError ? "4px" : "24px" }} />
                {priceError && <p style={{ color: "#FF4444", fontSize: "12px", marginBottom: "16px" }}>{priceError}</p>}
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
