"use client";

import Link from "next/link";
import { useSmartAlerts, EnrichedAlertData } from "../../hooks/useSmartAlerts";
import { useAuthStore } from "../../store/authStore";

export const dynamic = 'force-dynamic';

function normalizeStoreKey(store: string | null | undefined): string | null {
  if (!store) return null;
  const s = String(store).trim().toLowerCase();
  if (!s) return null;
  if (s.includes('daraz')) return 'daraz';
  if (s.includes('shophive')) return 'shophive';
  if (s.includes('telemart')) return 'telemart';
  if (s.includes('mega')) return 'mega';
  if (s.includes('priceoye')) return 'priceoye';
  return s;
}

function deriveStoreKeyFromUrl(url: string): string | null {
  try {
    const hostname = new URL(url).hostname.toLowerCase();
    if (hostname.includes('daraz')) return 'daraz';
    if (hostname.includes('shophive')) return 'shophive';
    if (hostname.includes('telemart')) return 'telemart';
    if (hostname.includes('mega')) return 'mega';
    if (hostname.includes('priceoye')) return 'priceoye';
  } catch {}
  return null;
}

function formatStoreLabel(storeKey: string | null): string {
  if (!storeKey) return 'Unknown';
  switch (storeKey) {
    case 'daraz': return 'Daraz';
    case 'shophive': return 'Shophive';
    case 'telemart': return 'Telemart';
    case 'mega': return 'Mega';
    case 'priceoye': return 'PriceOye';
    default: return storeKey;
  }
}

function AlertCard({ alert, onRemove }: {
    alert: EnrichedAlertData;
    onRemove: (id: string) => void;
}) {
    const displayTarget = Number.isFinite(alert.targetPrice) && alert.targetPrice > 0
        ? alert.targetPrice.toLocaleString()
        : '\u2014';
    const storeKey = normalizeStoreKey(alert.product?.store) || (alert.productUrl ? deriveStoreKeyFromUrl(alert.productUrl) : null);
    const storeLabel = formatStoreLabel(storeKey);
    const productName = alert.product?.name || alert.keyword || alert.productUrl || 'Custom Alert';
    const currentPrice = alert.product?.price;
    const currentPriceDisplay = currentPrice ? `Rs. ${currentPrice.toLocaleString()}` : null;
    const targetReached = alert.isNotified || (currentPrice != null && currentPrice <= alert.targetPrice);

    const productHref = alert.productUrl
        ? `/product/${encodeURIComponent(alert.productUrl)}?url=${encodeURIComponent(alert.productUrl)}&store=${encodeURIComponent(storeKey || '')}`
        : null;

    const cardContent = (
        <div className="card" style={{
            padding: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            cursor: productHref ? 'pointer' : 'default',
            textDecoration: 'none',
            color: 'inherit',
        }}>
            {/* Product Image */}
            <div style={{
                width: '100px',
                height: '100px',
                minWidth: '100px',
                borderRadius: '8px',
                backgroundColor: 'var(--bg-secondary, #1a1a2e)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
            }}>
                {alert.product?.imageUrl ? (
                    <img
                        src={alert.product.imageUrl}
                        alt={productName}
                        style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                        onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                        }}
                    />
                ) : (
                    <span style={{ fontSize: '28px', color: 'var(--text-muted)' }}>&#128269;</span>
                )}
            </div>

            {/* Product Info */}
            <div style={{ flex: 1, minWidth: 0 }}>
                <h4 style={{
                    fontSize: '16px',
                    marginBottom: '6px',
                    color: 'var(--text-main)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    lineHeight: '1.3',
                }}>
                    {productName}
                </h4>

                {/* Store Badge */}
                {storeKey && (
                    <span style={{
                        display: 'inline-block',
                        fontSize: '11px',
                        fontWeight: '600',
                        color: 'var(--accent-primary)',
                        backgroundColor: 'rgba(99, 102, 241, 0.1)',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        marginBottom: '6px',
                        textTransform: 'capitalize',
                    }}>
                        {storeLabel}
                    </span>
                )}

                {/* Price Line */}
                <div style={{ fontSize: '14px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                    {currentPriceDisplay && (
                        <span>
                            Current: <span style={{ color: 'var(--text-main)', fontWeight: 600 }}>{currentPriceDisplay}</span>
                        </span>
                    )}
                    <span>
                        Target: <span style={{
                            color: targetReached ? 'var(--accent-success)' : 'var(--accent-primary)',
                            fontWeight: 'bold',
                        }}>Rs. {displayTarget}</span>
                    </span>
                    {targetReached && (
                        <span style={{
                            fontSize: '11px',
                            fontWeight: '600',
                            color: '#fff',
                            backgroundColor: 'var(--accent-success)',
                            padding: '2px 8px',
                            borderRadius: '4px',
                        }}>
                            TARGET REACHED
                        </span>
                    )}
                </div>
            </div>

            {/* Remove Button */}
            <button
                onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onRemove(alert.id);
                }}
                style={{
                    background: 'none',
                    border: '1px solid var(--accent-alert)',
                    borderRadius: '6px',
                    color: 'var(--accent-alert)',
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontWeight: '500',
                    padding: '8px 14px',
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                }}
            >
                REMOVE
            </button>
        </div>
    );

    // If alert has a product URL, wrap entire card in a Link to Bhao product page
    if (productHref) {
        return <Link href={productHref} style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>{cardContent}</Link>;
    }

    return cardContent;
}

function AlertsContent() {
    const { enrichedAlerts, loading, removeAlert } = useSmartAlerts();
    const { isAuthenticated, isLoading: authLoading } = useAuthStore();

    if (authLoading || loading) {
        return (
            <div className="container" style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <p style={{ color: 'var(--text-muted)' }}>Loading alerts...</p>
            </div>
        );
    }

    if (!isAuthenticated) {
        return (
            <div className="container" style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px' }}>
                <h2 style={{ fontSize: '24px' }}>Login Required</h2>
                <p style={{ color: 'var(--text-muted)' }}>You must be logged in to view and manage your Price Alerts.</p>
                <Link href="/login" className="btn btn-primary">Login Now</Link>
            </div>
        );
    }

    return (
        <div className="container">
            <div style={{ marginBottom: '32px' }}>
                <h1 style={{ fontSize: '36px', marginBottom: '8px' }}>Price Alerts</h1>
                <p style={{ color: 'var(--text-muted)' }}>
                    Track products and get notified when they drop below your target price.
                </p>
            </div>

            {enrichedAlerts.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {enrichedAlerts.map(alert => (
                        <AlertCard key={alert.id} alert={alert} onRemove={removeAlert} />
                    ))}
                </div>
            ) : (
                <div className="card" style={{ padding: '60px 40px', textAlign: 'center' }}>
                    <div style={{ fontSize: '48px', marginBottom: '16px' }}>&#128276;</div>
                    <h3 style={{ fontSize: '24px', marginBottom: '12px' }}>No active alerts</h3>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
                        Set price alerts on search results or specific products to track them automatically.
                    </p>
                    <Link href="/search" className="btn btn-primary">
                        Browse Products
                    </Link>
                </div>
            )}
        </div>
    );
}

import { Suspense } from 'react';

export default function AlertsPage() {
    return (
        <Suspense fallback={<div className="container" style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><p style={{ color: 'var(--text-muted)' }}>Loading alerts...</p></div>}>
            <AlertsContent />
        </Suspense>
    );
}
