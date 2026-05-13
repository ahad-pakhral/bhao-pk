"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthStore } from "../../store/authStore";
import { useWishlist } from "../../hooks/useWishlist";
import { useSmartAlerts } from "../../hooks/useSmartAlerts";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

const menuItems = [
  {
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>,
    title: 'Wishlist',
    subtitleKey: 'wishlist' as const,
    action: 'wishlist'
  },
  {
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>,
    title: 'Price Alerts',
    subtitleKey: 'alerts' as const,
    action: 'alerts'
  },
  {
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
    title: 'Search History',
    subtitle: 'View past searches',
    action: 'history'
  },
  {
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>,
    title: 'Settings',
    subtitle: 'Profile, Notifications',
    action: 'settings'
  },
];

export default function ProfilePage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading, logout } = useAuthStore();
  const { wishlist } = useWishlist();
  const { alerts } = useSmartAlerts();
  const [stats, setStats] = useState<{ wishlistCount: number; activeAlertsCount: number; searchesCount: number } | null>(null);

  // Fetch real stats
  useEffect(() => {
    if (!isAuthenticated || !user) return;
    const token = localStorage.getItem('sb-token');
    if (!token) return;
    fetch(`${API_BASE}/auth/stats`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => res.ok ? res.json() : null)
      .then(data => { if (data) setStats(data); })
      .catch(() => {});
  }, [isAuthenticated, user]);

  // Auth guard
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [authLoading, isAuthenticated, router]);

  const handleMenuClick = (action: string) => {
    switch (action) {
      case 'wishlist': router.push('/wishlist'); break;
      case 'alerts': router.push('/alerts'); break;
      case 'history': router.push('/history'); break;
      case 'settings': router.push('/settings'); break;
    }
  };

  const handleLogout = async () => {
    if (confirm('Are you sure you want to logout?')) {
      await logout();
      router.push('/login');
    }
  };

  if (authLoading || !user) {
    return (
      <div className="container" style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: 'var(--text-muted)' }}>Loading profile...</div>
      </div>
    );
  }

  const displayName = user.name || user.email;
  const activeAlertCount = alerts.filter(a => !a.isNotified).length;
  const displayStats = stats || { wishlistCount: wishlist.length, activeAlertsCount: activeAlertCount, searchesCount: 0 };

  function getSubtitle(item: typeof menuItems[number]): string {
    if ('subtitle' in item && item.subtitle) return item.subtitle;
    if (item.subtitleKey === 'wishlist') return `${displayStats.wishlistCount} items saved`;
    if (item.subtitleKey === 'alerts') return `${displayStats.activeAlertsCount} active alerts`;
    return '';
  }

  return (
    <div className="container">
      <div style={{ display: 'flex', gap: '40px', alignItems: 'flex-start' }}>
        {/* User Sidebar */}
        <div style={{ width: '300px', flexShrink: 0 }}>
          <div className="card" style={{ textAlign: 'center', padding: '40px 20px' }}>
            <div style={{ width: '100px', height: '100px', background: 'var(--bg-surface)', borderRadius: '50%', margin: '0 auto 20px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid var(--border-light)' }}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
            </div>
            <h3 style={{ fontSize: '20px', marginBottom: '4px' }}>{displayName}</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '24px' }}>{user.email}</p>
            <Link href="/settings" className="btn btn-secondary" style={{ width: '100%', fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none' }}>
              Edit Profile
            </Link>
            <button
              className="btn btn-secondary"
              style={{ width: '100%', fontSize: '12px', marginTop: '12px', color: '#FF4444', borderColor: 'rgba(255, 68, 68, 0.2)' }}
              onClick={handleLogout}
            >
              Sign Out
            </button>

            {/* Stats */}
            <div style={{ marginTop: '24px', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
              <div style={{ background: 'var(--bg-surface)', padding: '16px 12px', borderRadius: '8px', textAlign: 'center' }}>
                <div style={{ fontSize: '24px', color: 'var(--accent-primary)', fontWeight: '700', fontFamily: 'var(--font-mono)' }}>{displayStats.wishlistCount}</div>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '6px', letterSpacing: '0.5px' }}>TRACKED</div>
              </div>
              <div style={{ background: 'var(--bg-surface)', padding: '16px 12px', borderRadius: '8px', textAlign: 'center' }}>
                <div style={{ fontSize: '24px', color: 'var(--accent-primary)', fontWeight: '700', fontFamily: 'var(--font-mono)' }}>{displayStats.activeAlertsCount}</div>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '6px', letterSpacing: '0.5px' }}>ALERTS</div>
              </div>
              <div style={{ background: 'var(--bg-surface)', padding: '16px 12px', borderRadius: '8px', textAlign: 'center' }}>
                <div style={{ fontSize: displayStats.searchesCount >= 1000 ? '20px' : '24px', color: 'var(--accent-primary)', fontWeight: '700', fontFamily: 'var(--font-mono)' }}>
                  {displayStats.searchesCount >= 1000 ? `${(displayStats.searchesCount / 1000).toFixed(1)}k` : displayStats.searchesCount}
                </div>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '6px', letterSpacing: '0.5px' }}>SEARCHES</div>
              </div>
            </div>
          </div>
        </div>

        {/* Profile Content */}
        <div style={{ flex: 1 }}>
          <div className="section-title"><h3>Quick Access</h3></div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0', marginBottom: '40px' }}>
            {menuItems.map((item, index) => (
              <div
                key={index}
                className="card"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '16px 20px',
                  cursor: 'pointer',
                  borderRadius: index === 0 ? '8px 8px 0 0' : index === menuItems.length - 1 ? '0 0 8px 8px' : '0',
                  marginBottom: '0',
                  borderBottom: index < menuItems.length - 1 ? '1px solid var(--border-light)' : 'none'
                }}
                onClick={() => handleMenuClick(item.action)}
                onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-surface-hover)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'var(--bg-surface)'}
              >
                <div style={{ marginRight: '16px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}>{item.icon}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '15px', marginBottom: '2px' }}>{item.title}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{getSubtitle(item)}</div>
                </div>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#666' }}>
                  <polyline points="9 18 15 12 9 6"></polyline>
                </svg>
              </div>
            ))}
          </div>

          <div className="section-title"><h3>Your Wishlist</h3></div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '60px' }}>
            {wishlist.length === 0 ? (
              <div className="card" style={{ padding: '40px', textAlign: 'center' }}>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>Your wishlist is empty. Start tracking products you love!</p>
                <Link href="/search" className="btn btn-primary" style={{ textDecoration: 'none' }}>Discover Products</Link>
              </div>
            ) : (
              wishlist.slice(0, 5).map(item => (
                <div key={item.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    {item.imageUrl ? (
                      <img src={item.imageUrl} alt={item.name} style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '8px', background: '#1a1a1a' }} />
                    ) : (
                      <div style={{ width: '60px', height: '60px', borderRadius: '8px', background: '#1a1a1a', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#444', fontSize: '11px' }}>No img</div>
                    )}
                    <div>
                      <h4 style={{ fontSize: '16px', marginBottom: '4px' }}>{item.name}</h4>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{item.store}</div>
                    </div>
                  </div>
                  <Link href={item.url} target="_blank" rel="noopener noreferrer" className="btn btn-secondary" style={{ padding: '8px 16px', fontSize: '12px', textDecoration: 'none' }}>View</Link>
                </div>
              ))
            )}
            {wishlist.length > 5 && (
              <Link href="/wishlist" className="btn btn-secondary" style={{ textDecoration: 'none' }}>View All {wishlist.length} Items</Link>
            )}
          </div>

          <div className="section-title"><h3>Price Alerts</h3></div>
          {alerts.length === 0 ? (
            <div className="card" style={{ padding: '40px', textAlign: 'center' }}>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>No alerts set. Create a price alert to get notified when prices drop!</p>
              <Link href="/search" className="btn btn-primary" style={{ textDecoration: 'none' }}>Discover More Products</Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {alerts.slice(0, 5).map(alert => (
                <div key={alert.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px' }}>
                  <div>
                    <div style={{ fontSize: '15px', marginBottom: '2px' }}>
                      {alert.keyword || alert.productUrl || 'Alert'}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      Target: Rs. {alert.targetPrice.toLocaleString('en-PK')}
                    </div>
                  </div>
                  <span className={`badge ${alert.isNotified ? 'badge-secondary' : 'badge-hot'}`}>
                    {alert.isNotified ? 'Triggered' : 'Active'}
                  </span>
                </div>
              ))}
              {alerts.length > 5 && (
                <Link href="/alerts" className="btn btn-secondary" style={{ textDecoration: 'none', marginTop: '8px' }}>View All {alerts.length} Alerts</Link>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
