"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { PriceHistoryChart } from "@/components/PriceHistoryChart";
import { useWishlist } from "../../../hooks/useWishlist";
import { alertsStorage } from "../../../services/storage.service";

export default function ProductDetail({ params }: { params: { id: string } }) {
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [alertType, setAlertType] = useState<'every' | 'specific' | null>(null);
  const [targetPrice, setTargetPrice] = useState('');
  const [priceError, setPriceError] = useState('');
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [showAlert, setShowAlert] = useState(false);
  const { isInWishlist, toggleWishlist } = useWishlist();

  // In a real app, you'd fetch data based on params.id
  const product = {
    id: params.id,
    name: "iPhone 15 Pro",
    specs: "256GB • Titanium • Space Black",
    price: "Rs. 345,000",
    rating: 4.9,
    reviewsCount: 120,
    store: "Daraz.pk",
    description: "The iPhone 15 Pro features a strong and light aerospace-grade titanium design with a textured matte-glass back. It also features a Ceramic Shield front that's tougher than any smartphone glass.",
    specifications: [
      { key: "Display", value: "6.1\" Super Retina XDR" },
      { key: "Processor", value: "A17 Pro chip" },
      { key: "Camera", value: "48MP Main | Ultra Wide | Telephoto" },
      { key: "Battery", value: "Up to 23 hours video playback" },
    ],
    reviews: [
      { user: "Ali Khan", rating: 5, comment: "Best phone I've ever used. The titanium finish is amazing and it's so light!" },
      { user: "Sara Ahmed", rating: 4.5, comment: "Great performance but battery life could be better. Camera is top notch though." },
    ]
  };

  // Mock price history data (last 30 days)
  const [priceHistory, setPriceHistory] = useState<any[]>([]);

  useEffect(() => {
    const history = Array.from({ length: 30 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (29 - i));
      const basePrice = 345000;
      const variation = Math.sin(i / 5) * 15000 + Math.random() * 5000;
      return {
        date: `${date.getDate()}/${date.getMonth() + 1}`,
        price: Math.round(basePrice + variation),
      };
    });
    setPriceHistory(history);
  }, []);

  const parsePrice = (priceStr: string): number => {
    return parseInt(priceStr.replace(/[^0-9]/g, ''), 10) || 0;
  };

  const saveAlert = (tPrice: number) => {
    const newAlert = {
      id: `alert_${product.id}_${Date.now()}`,
      userId: 'user_1',
      productId: product.id,
      productName: product.name,
      productImage: '/images/iphone-15-pro.png',
      currentPrice: parsePrice(product.price),
      targetPrice: tPrice,
      store: product.store,
      isActive: true,
      createdAt: new Date(),
    };
    alertsStorage.addAlert(newAlert);
  };

  const handleSetAlert = (type: 'every' | 'specific') => {
    setAlertType(type);
    if (type === 'every') {
      const currentPrice = parsePrice(product.price);
      saveAlert(currentPrice);
      setSuccessMessage(`You'll be notified of every price change for ${product.name}`);
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

    saveAlert(price);
    setSuccessMessage(`You'll be notified when price reaches Rs. ${price.toLocaleString()}`);
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
            <img src="/images/iphone-15-pro.png" alt="iPhone 15 Pro" style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '40px' }} />
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
                onClick={() => window.open('https://daraz.pk', '_blank')}
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
                onClick={() => toggleWishlist(product.id)}
                style={{
                  height: '56px', width: '56px', border: '1px solid var(--border-light)',
                  borderRadius: '12px', background: 'transparent', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill={isInWishlist(product.id) ? '#FF4444' : 'none'} stroke={isInWishlist(product.id) ? '#FF4444' : '#fff'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
            {product.reviews.map((review, i) => (
              <div key={i} className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontWeight: '700' }}>{review.user}</span>
                  <span style={{ color: 'var(--accent-primary)' }}>★ {review.rating}</span>
                </div>
                <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: '1.6' }}>{review.comment}</p>
              </div>
            ))}
            <button className="btn btn-secondary" style={{ width: '100%' }}>View All Reviews</button>
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
