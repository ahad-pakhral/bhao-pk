"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

const wishlist = [
  { id: 1, name: "iPhone 15 Pro", currentPrice: "Rs. 345,000", targetPrice: "Rs. 320,000", status: "Tracking" },
  { id: 3, name: "AirPods Pro", currentPrice: "Rs. 65,000", targetPrice: "Rs. 55,000", status: "Price Drop!" },
];

const menuItems = [
  {
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>,
    title: 'Wishlist',
    subtitle: '3 items saved',
    action: 'wishlist'
  },
  {
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>,
    title: 'Price Alerts',
    subtitle: '2 active alerts',
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

  const handleMenuClick = (action: string) => {
    switch (action) {
      case 'wishlist':
        router.push('/wishlist');
        break;
      case 'alerts':
        router.push('/alerts');
        break;
      case 'history':
        router.push('/history');
        break;
      case 'settings':
        router.push('/settings');
        break;
    }
  };

  const handleEditProfile = () => {
    router.push('/settings');
  };

  const handleLogout = () => {
    if (confirm('Are you sure you want to logout?')) {
      router.push('/login');
    }
  };

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
            <h3 style={{ fontSize: '20px', marginBottom: '4px' }}>Ahad Ali</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '24px' }}>ahad@example.com</p>
            <button
              className="btn btn-secondary"
              style={{ width: '100%', fontSize: '12px' }}
              onClick={handleEditProfile}
            >
              Edit Profile
            </button>
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
                <div style={{ fontSize: '24px', color: 'var(--accent-primary)', fontWeight: '700', fontFamily: 'var(--font-mono)' }}>12</div>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '6px', letterSpacing: '0.5px' }}>TRACKED</div>
              </div>
              <div style={{ background: 'var(--bg-surface)', padding: '16px 12px', borderRadius: '8px', textAlign: 'center' }}>
                <div style={{ fontSize: '24px', color: 'var(--accent-primary)', fontWeight: '700', fontFamily: 'var(--font-mono)' }}>5</div>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '6px', letterSpacing: '0.5px' }}>ALERTS</div>
              </div>
              <div style={{ background: 'var(--bg-surface)', padding: '16px 12px', borderRadius: '8px', textAlign: 'center' }}>
                <div style={{ fontSize: '20px', color: 'var(--accent-primary)', fontWeight: '700', fontFamily: 'var(--font-mono)' }}>15k</div>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '6px', letterSpacing: '0.5px' }}>SAVED</div>
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
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{item.subtitle}</div>
                </div>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#666' }}>
                  <polyline points="9 18 15 12 9 6"></polyline>
                </svg>
              </div>
            ))}
          </div>

          <div className="section-title"><h3>Your Wishlist</h3></div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '60px' }}>
            {wishlist.map(item => (
              <div key={item.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h4 style={{ fontSize: '18px', marginBottom: '4px' }}>{item.name}</h4>
                  <div style={{ display: 'flex', gap: '20px', fontSize: '14px' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Current: <span style={{ color: 'var(--accent-primary)', fontWeight: '700' }}>{item.currentPrice}</span></span>
                    <span style={{ color: 'var(--text-secondary)' }}>Target: <span style={{ fontWeight: '700' }}>{item.targetPrice}</span></span>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                   <span className={`badge ${item.status === 'Price Drop!' ? 'badge-hot' : 'badge-secondary'}`}>{item.status}</span>
                   <Link href={`/product/${item.id}`} className="btn btn-secondary" style={{ padding: '8px 16px', fontSize: '12px' }}>View</Link>
                </div>
              </div>
            ))}
          </div>

          <div className="section-title"><h3>Price Alerts</h3></div>
          <div className="card" style={{ padding: '40px', textAlign: 'center' }}>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>You will receive notifications here when your tracked products reach their target prices.</p>
            <Link href="/search" className="btn btn-primary">Discover More Products</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
