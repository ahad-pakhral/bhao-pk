"use client";

import Link from "next/link";
import { useState } from "react";
import { useSmartAlerts } from "../../hooks/useSmartAlerts";
import { SmartAlert } from "../../types/models";

function AlertCard({ alert, onRemove, onViewProduct }: {
    alert: SmartAlert;
    onRemove: (id: string) => void;
    onViewProduct: (productId: string) => void;
}) {
    const [showAlternatives, setShowAlternatives] = useState(false);

    const isNearTarget = alert.bestCurrentPrice <= alert.targetPrice * 1.1;
    const progressPercent = alert.originalPrice > alert.targetPrice
        ? Math.min(100, Math.max(0,
            ((alert.originalPrice - alert.bestCurrentPrice) / (alert.originalPrice - alert.targetPrice)) * 100
        ))
        : 0;

    return (
        <div className="card" style={{ padding: '24px' }}>
            {/* Header */}
            <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                <div style={{ width: '60px', height: '60px', background: '#1a1a1a', borderRadius: '8px', overflow: 'hidden', flexShrink: 0 }}>
                    <img src={alert.productImage || '/images/iphone-15-pro.png'} alt={alert.productName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
                <div style={{ flex: 1 }}>
                    <h4 style={{ fontSize: '18px', marginBottom: '4px' }}>{alert.productName}</h4>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                        {alert.category} | {alert.alertType === 'every_change' ? 'Every Change' : 'Target Price'}
                    </div>
                </div>
                <button
                    onClick={() => onRemove(alert.id)}
                    style={{ background: 'none', border: 'none', color: 'var(--accent-alert)', cursor: 'pointer', fontSize: '14px', padding: '4px 8px' }}
                >
                    Remove
                </button>
            </div>

            {/* Cross-Store Prices */}
            {alert.trackedStores.length > 0 && (
                <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--border-light)' }}>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', letterSpacing: '1px', marginBottom: '12px' }}>
                        PRICES ACROSS STORES
                    </div>
                    {alert.trackedStores.map((snapshot, idx) => {
                        const isBest = snapshot.price === alert.bestCurrentPrice;
                        return (
                            <div key={idx} style={{ display: 'flex', alignItems: 'center', padding: '6px 0', gap: '12px' }}>
                                <span style={{ flex: 1, fontSize: '14px', color: isBest ? 'var(--accent-primary)' : 'inherit' }}>
                                    {snapshot.store}
                                </span>
                                <span style={{ fontFamily: 'monospace', fontWeight: 700, color: isBest ? 'var(--accent-primary)' : 'inherit' }}>
                                    Rs. {snapshot.price.toLocaleString()}
                                </span>
                                {snapshot.priceChangePercent != null && snapshot.priceChangePercent !== 0 && (
                                    <span style={{
                                        fontSize: '12px', width: '45px', textAlign: 'right',
                                        color: snapshot.priceChangePercent < 0 ? 'var(--accent-success)' : 'var(--accent-alert)',
                                    }}>
                                        {snapshot.priceChangePercent < 0 ? '' : '+'}{snapshot.priceChangePercent.toFixed(0)}%
                                    </span>
                                )}
                                {isBest && (
                                    <span className="badge badge-best" style={{ fontSize: '10px', padding: '2px 8px' }}>BEST</span>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Target Progress */}
            <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--border-light)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>BEST PRICE</div>
                        <div style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--accent-primary)', fontSize: '16px' }}>
                            Rs. {alert.bestCurrentPrice.toLocaleString()}
                        </div>
                    </div>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={isNearTarget ? 'var(--accent-success)' : 'var(--text-muted)'} strokeWidth="2">
                        <polyline points="22 17 13.5 8.5 8.5 13.5 2 7" /><polyline points="16 17 22 17 22 11" />
                    </svg>
                    <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>TARGET</div>
                        <div style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '16px' }}>
                            Rs. {alert.targetPrice.toLocaleString()}
                        </div>
                    </div>
                </div>
                {alert.alertType === 'target_price' && (
                    <div style={{ height: '4px', background: '#1a1a1a', borderRadius: '2px', marginTop: '12px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${progressPercent}%`, background: 'var(--accent-primary)', borderRadius: '2px' }} />
                    </div>
                )}
                {isNearTarget && (
                    <span style={{
                        display: 'inline-block', marginTop: '8px', border: '1px solid var(--accent-success)',
                        padding: '2px 10px', borderRadius: '4px', fontSize: '12px', color: 'var(--accent-success)',
                    }}>
                        NEAR TARGET!
                    </span>
                )}
            </div>

            {/* Alternatives */}
            {alert.alternatives.length > 0 && (
                <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--border-light)' }}>
                    <button
                        onClick={() => setShowAlternatives(!showAlternatives)}
                        style={{
                            background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer',
                            width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                            fontSize: '11px', letterSpacing: '1px', padding: 0, marginBottom: '8px',
                        }}
                    >
                        <span>BETTER ALTERNATIVES ({alert.alternatives.length})</span>
                        <span>{showAlternatives ? '▲' : '▼'}</span>
                    </button>
                    {showAlternatives && alert.alternatives.map((alt, idx) => (
                        <div
                            key={idx}
                            onClick={() => onViewProduct(alt.productId)}
                            style={{
                                display: 'flex', gap: '12px', alignItems: 'center', padding: '10px 0',
                                borderBottom: '1px solid var(--border-light)', cursor: 'pointer',
                            }}
                        >
                            <div style={{ width: '40px', height: '40px', background: '#1a1a1a', borderRadius: '6px', overflow: 'hidden', flexShrink: 0 }}>
                                <img src={alt.productImage || '/images/iphone-15-pro.png'} alt={alt.productName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            </div>
                            <div style={{ flex: 1 }}>
                                <div style={{ fontSize: '14px', marginBottom: '2px' }}>{alt.productName}</div>
                                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                    <span style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--accent-primary)', fontSize: '13px' }}>
                                        Rs. {alt.price.toLocaleString()}
                                    </span>
                                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{alt.store}</span>
                                </div>
                                <span style={{ fontSize: '11px', color: 'var(--accent-success)' }}>{alt.reason}</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Actions */}
            <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
                <Link href={`/product/${alert.productId}`} className="btn btn-primary" style={{ flex: 1, textAlign: 'center', padding: '10px', fontSize: '12px' }}>
                    VIEW PRODUCT
                </Link>
            </div>
        </div>
    );
}

export default function AlertsPage() {
    const { alerts, triggeredAlerts, loading, removeAlert, refreshPrices } = useSmartAlerts();

    if (loading) {
        return (
            <div className="container" style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <p style={{ color: 'var(--text-muted)' }}>Loading alerts...</p>
            </div>
        );
    }

    const handleViewProduct = (productId: string) => {
        window.location.href = `/product/${productId}`;
    };

    return (
        <div className="container">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
                <div>
                    <h1 style={{ fontSize: '36px', marginBottom: '8px' }}>Smart Alerts</h1>
                    <p style={{ color: 'var(--text-muted)' }}>
                        Track prices across stores and discover better alternatives
                    </p>
                </div>
                {alerts.length > 0 && (
                    <button className="btn btn-secondary" style={{ padding: '10px 20px', fontSize: '13px' }} onClick={refreshPrices}>
                        Refresh Prices
                    </button>
                )}
            </div>

            {alerts.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {triggeredAlerts.length > 0 && (
                        <div style={{ marginBottom: '8px' }}>
                            <div style={{ fontSize: '11px', color: 'var(--accent-success)', letterSpacing: '1px', marginBottom: '12px' }}>
                                TRIGGERED ALERTS
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                {triggeredAlerts.map(alert => (
                                    <AlertCard key={alert.id} alert={alert} onRemove={removeAlert} onViewProduct={handleViewProduct} />
                                ))}
                            </div>
                        </div>
                    )}
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', letterSpacing: '1px', marginBottom: '4px' }}>
                        {triggeredAlerts.length > 0 ? 'ALL ALERTS' : `${alerts.length} ALERT${alerts.length !== 1 ? 'S' : ''}`}
                    </div>
                    {alerts.map(alert => (
                        <AlertCard key={alert.id} alert={alert} onRemove={removeAlert} onViewProduct={handleViewProduct} />
                    ))}
                </div>
            ) : (
                <div className="card" style={{ padding: '60px 40px', textAlign: 'center' }}>
                    <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔔</div>
                    <h3 style={{ fontSize: '24px', marginBottom: '12px' }}>No active alerts</h3>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
                        Set price alerts on products to track prices across all stores and discover better alternatives
                    </p>
                    <Link href="/search" className="btn btn-primary">
                        Browse Products
                    </Link>
                </div>
            )}
        </div>
    );
}
