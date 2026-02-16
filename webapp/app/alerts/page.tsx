"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { alertsStorage } from "../../services/storage.service";
import { Alert } from "../../types/models";

export default function AlertsPage() {
  const [alertsList, setAlertsList] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = alertsStorage.getAlerts();
    setAlertsList(stored);
    setLoading(false);
  }, []);

  const removeAlert = (alertId: string) => {
    alertsStorage.removeAlert(alertId);
    setAlertsList(prev => prev.filter(a => a.id !== alertId));
  };

  if (loading) {
    return (
      <div className="container" style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: 'var(--text-muted)' }}>Loading alerts...</p>
      </div>
    );
  }

  return (
    <div className="container">
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '36px', marginBottom: '8px' }}>Price Alerts</h1>
        <p style={{ color: 'var(--text-muted)' }}>
          Get notified when products reach your target price
        </p>
      </div>

      {alertsList.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {alertsList.map(alert => {
            const isNearTarget = alert.currentPrice <= alert.targetPrice * 1.1;
            return (
              <div key={alert.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1 }}>
                  {alert.productImage && (
                    <div style={{ width: '60px', height: '60px', background: '#1a1a1a', borderRadius: '8px', overflow: 'hidden', flexShrink: 0 }}>
                      <img src={alert.productImage} alt={alert.productName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                  )}
                  <div>
                    <h4 style={{ fontSize: '18px', marginBottom: '4px' }}>{alert.productName}</h4>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px' }}>{alert.store}</div>
                    <div style={{ display: 'flex', gap: '24px', fontSize: '14px' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>
                        Current: <span style={{ color: 'var(--accent-primary)', fontWeight: '700' }}>Rs. {alert.currentPrice.toLocaleString()}</span>
                      </span>
                      <span style={{ color: 'var(--text-secondary)' }}>
                        Target: <span style={{ fontWeight: '700' }}>Rs. {alert.targetPrice.toLocaleString()}</span>
                      </span>
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <span className={`badge ${isNearTarget ? 'badge-hot' : 'badge-secondary'}`}>
                    {isNearTarget ? 'Near Target!' : 'Tracking'}
                  </span>
                  <Link href={`/product/${alert.productId}`} className="btn btn-secondary" style={{ padding: '8px 16px', fontSize: '12px' }}>
                    View
                  </Link>
                  <button
                    className="btn btn-ghost"
                    style={{ padding: '8px 16px', fontSize: '12px', color: 'var(--accent-alert)' }}
                    onClick={() => removeAlert(alert.id)}
                  >
                    Remove
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="card" style={{ padding: '60px 40px', textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔔</div>
          <h3 style={{ fontSize: '24px', marginBottom: '12px' }}>No active alerts</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
            Set price alerts on products you're interested in
          </p>
          <Link href="/search" className="btn btn-primary">
            Browse Products
          </Link>
        </div>
      )}
    </div>
  );
}
