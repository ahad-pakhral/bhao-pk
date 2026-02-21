"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { PriceHistoryChart } from "@/components/PriceHistoryChart";
import { useWishlist } from "../../../hooks/useWishlist";
import { smartAlertsStorage } from "../../../services/storage.service";
import { createSmartAlert } from "../../../utils/smartAlerts";
import { ALL_PRODUCTS } from "../../../constants/dummyData";
import { useSearchStore } from "../../../store/searchStore";

export default function ProductDetail({ params }: { params: { id: string } }) {
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [alertType, setAlertType] = useState<'every' | 'specific' | null>(null);
  const [targetPrice, setTargetPrice] = useState('');
  const [priceError, setPriceError] = useState('');
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [showAlert, setShowAlert] = useState(false);
  const { lastResults } = useSearchStore();
  const { isInWishlist, toggleWishlist } = useWishlist();

  // Find the product in the cached search results
  const scrapedProduct = lastResults.find((p) => String(p.id) === String(params.id));

  if (!scrapedProduct) {
    return (
      <div className="container" style={{ padding: '100px 0', textAlign: 'center' }}>
        <h2 style={{ fontSize: '32px', marginBottom: '16px' }}>Product Not Found</h2>
        <p style={{ color: "var(--text-secondary)", fontSize: '18px' }}>Your search session may have expired, or this product doesn't exist.</p>
        <Link href="/search" className="btn btn-primary" style={{ marginTop: '32px', display: 'inline-flex', alignItems: 'center', height: '48px', padding: '0 24px' }}>
          Return to Search
        </Link>
      </div>
    );
  }

  // Map scraped product to the detail view structure
  const product = {
    ...scrapedProduct,
    description: "This product was discovered dynamically by Bhao.pk's intelligent scrapers. Pricing and availability vary by merchant. Detailed specifications are only available on the merchant's external website.",
    specifications: [
      { key: "Merchant", value: scrapedProduct.store },
      { key: "Details", value: scrapedProduct.specs || "N/A" }
    ],
    reviewsDetails: []
  };

  // Mock price history data (last 30 days) based on the actual price
  const [priceHistory, setPriceHistory] = useState<any[]>([]);

  useEffect(() => {
    const history = Array.from({ length: 30 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (29 - i));
      const basePrice = product.priceValue || 50000;
      const variation = Math.sin(i / 5) * (basePrice * 0.05) + Math.random() * (basePrice * 0.02);
      return {
        date: `${date.getDate()}/${date.getMonth() + 1}`,
        price: Math.round(basePrice + variation),
      };
    });
    setPriceHistory(history);
  }, []);

  const saveSmartAlert = (alertType: 'every_change' | 'target_price', tPrice?: number) => {
    const productData = {
      ...product,
      image: '/images/iphone-15-pro.png',
      category: 'Smartphones',
    };
    const smartAlert = createSmartAlert(productData, alertType, tPrice, ALL_PRODUCTS);
    smartAlertsStorage.addAlert(smartAlert);
  };

  const handleSetAlert = (type: 'every' | 'specific') => {
    setAlertType(type);
    if (type === 'every') {
      saveSmartAlert('every_change');
      setSuccessMessage(`Tracking ${product.name} across all stores`);
      setShowSuccessToast(true);
      setShowAlertModal(false);
      setAlertType(null);
      setTimeout(() => setShowSuccessToast(false), 3000);
    }
  };

  const handleSpecificPriceSubmit = () => {
    setPriceError('');

    if (!targetPrice || targetPrice.trim() === '') {
      setPriceError('Please enter a target price');
      return;
    }

    const price = parseFloat(targetPrice);
    if (isNaN(price) || price <= 0) {
      setPriceError('Please enter a valid price greater than 0');
      return;
    }

    saveSmartAlert('target_price', price);
    setSuccessMessage(`Tracking across stores — target Rs. ${price.toLocaleString()}`);
    setShowSuccessToast(true);
    setShowAlertModal(false);
    setAlertType(null);
    setTargetPrice('');
    setTimeout(() => setShowSuccessToast(false), 3000);
  };

  return (
    <div className="container">
      <div style={{ display: 'flex', gap: '60px', marginBottom: '80px' }}>
        {/* Product Image */}
        <div style={{ flex: 1 }}>
          <div style={{ aspectRatio: '1/1', background: '#1a1a1a', borderRadius: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '120px', position: 'sticky', top: '100px', overflow: 'hidden' }}>
            {product.image ? (
              <img src={product.image} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '40px' }} />
            ) : (
              <div style={{ opacity: 0.1 }}>🛍️</div>
            )}
          </div>
        </div>

        {/* Product Info */}
        <div style={{ flex: 1 }}>
          <div style={{ marginBottom: '32px' }}>
            <span className="badge badge-best" style={{ marginBottom: '12px', display: 'inline-block' }}>Best Deal</span>
            <h1 style={{ fontSize: '48px', marginBottom: '8px' }}>{product.name}</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '18px', marginBottom: '16px' }}>{product.specs}</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
              <span style={{ fontSize: '14px' }}>★ {product.rating}</span>
              <span style={{ color: 'var(--text-muted)', fontSize: '14px' }}>{product.reviewsCount} verified reviews</span>
            </div>
            <div className="product-price" style={{ fontSize: '40px', marginBottom: '32px' }}>{product.price}</div>

            <div style={{ display: 'flex', gap: '16px' }}>
              <button
                className="btn btn-primary"
                style={{ flex: 1, height: '56px' }}
                onClick={() => {
                  if (product.url) window.open(product.url, '_blank');
                  else alert("Store URL not available for this scraped product.");
                }}
              >
                Buy on {product.store}
              </button>
              <button
                className="btn btn-secondary"
                style={{ flex: 1, height: '56px' }}
                onClick={() => setShowAlertModal(true)}
              >
                Set Price Alert
              </button>
              <button
                onClick={() => toggleWishlist(String(product.id))}
                style={{
                  height: '56px', width: '56px', border: '1px solid var(--border-light)',
                  borderRadius: '12px', background: 'transparent', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill={isInWishlist(String(product.id)) ? '#FF4444' : 'none'} stroke={isInWishlist(String(product.id)) ? '#FF4444' : '#fff'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                </svg>
              </button>
            </div>
          </div>

          <div style={{ padding: '32px', background: 'var(--bg-surface)', borderRadius: '16px', border: '1px solid var(--border-light)' }}>
            <h4 style={{ marginBottom: '16px' }}>Price History (30 Days)</h4>
            <PriceHistoryChart data={priceHistory} />
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '60px' }}>
        <div>
          <div className="section-title"><h3>Features</h3></div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {product.specifications.map((spec, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '16px', background: 'var(--bg-surface)', borderRadius: '8px', border: '1px solid var(--border-light)' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '14px' }}>{spec.key}</span>
                <span style={{ fontWeight: '600', fontSize: '14px' }}>{spec.value}</span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="section-title"><h3>User Reviews</h3></div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {product.reviewsDetails.length > 0 ? product.reviewsDetails.map((review: any, i: number) => (
              <div key={i} className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontWeight: '700' }}>{review.user}</span>
                  <span style={{ color: 'var(--accent-primary)' }}>★ {review.rating}</span>
                </div>
                <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: '1.6' }}>{review.comment}</p>
              </div>
            )) : (
              <div className="card" style={{ textAlign: 'center', padding: '32px' }}>
                <p style={{ color: 'var(--text-secondary)' }}>No detailed reviews scraped for this product yet.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Alert Modal */}
      {showAlertModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={() => { setShowAlertModal(false); setAlertType(null); setTargetPrice(''); setPriceError(''); }}>
          <div style={{ background: 'var(--bg-surface)', borderRadius: '16px', padding: '32px', maxWidth: '440px', width: '90%', border: '1px solid var(--border-light)' }}
            onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3 style={{ fontSize: '20px' }}>Set Price Alert</h3>
              <button onClick={() => { setShowAlertModal(false); setAlertType(null); setTargetPrice(''); setPriceError(''); }}
                style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '20px' }}>✕</button>
            </div>

            {alertType === null ? (
              <>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', fontSize: '14px' }}>
                  Choose how you'd like to be notified about price changes for {product.name}
                </p>
                <button onClick={() => handleSetAlert('every')} style={{
                  width: '100%', padding: '16px', background: '#0a0a0a', border: '1px solid var(--border-light)',
                  borderRadius: '12px', color: '#fff', cursor: 'pointer', textAlign: 'left', marginBottom: '12px',
                }}>
                  <div style={{ fontWeight: '700', marginBottom: '4px' }}>Every Price Change</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Get notified whenever the price changes</div>
                </button>
                <button onClick={() => handleSetAlert('specific')} style={{
                  width: '100%', padding: '16px', background: '#0a0a0a', border: '1px solid var(--border-light)',
                  borderRadius: '12px', color: '#fff', cursor: 'pointer', textAlign: 'left',
                }}>
                  <div style={{ fontWeight: '700', marginBottom: '4px' }}>Specific Price</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Set a target price and get notified when reached</div>
                </button>
              </>
            ) : (
              <>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '16px', fontSize: '14px' }}>Enter your target price</p>
                <input
                  type="number"
                  placeholder="e.g., 300000"
                  className="input-field"
                  value={targetPrice}
                  onChange={(e) => { setTargetPrice(e.target.value); setPriceError(''); }}
                  autoFocus
                  style={{ marginBottom: priceError ? '4px' : '24px' }}
                />
                {priceError && <p style={{ color: 'var(--accent-alert)', fontSize: '12px', marginBottom: '16px' }}>{priceError}</p>}
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button onClick={() => { setAlertType(null); setTargetPrice(''); setPriceError(''); }}
                    className="btn btn-secondary" style={{ flex: 1 }}>Back</button>
                  <button onClick={handleSpecificPriceSubmit}
                    className="btn btn-primary" style={{ flex: 1 }}>Set Alert</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Success Toast */}
      {showSuccessToast && (
        <div style={{
          position: 'fixed', bottom: '40px', right: '40px',
          background: 'var(--bg-surface-active)', borderLeft: '4px solid var(--accent-primary)',
          padding: '16px 24px', borderRadius: '8px', boxShadow: '0 10px 30px rgba(0,0,0,0.5)', zIndex: 1000,
        }}>
          <h4 style={{ fontSize: '14px', marginBottom: '4px' }}>Alert Set</h4>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{successMessage}</p>
        </div>
      )}
    </div>
  );
}
