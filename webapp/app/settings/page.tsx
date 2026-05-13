"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "../../store/authStore";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export default function SettingsPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading, logout } = useAuthStore();
  const [name, setName] = useState("");
  const [saveStatus, setSaveStatus] = useState("");
  const [clearStatus, setClearStatus] = useState("");
  const [notifications, setNotifications] = useState({
    priceDrops: true,
    newProducts: false,
    newsletter: true,
  });

  // Populate name from user data
  useEffect(() => {
    if (user) setName(user.name || "");
  }, [user]);

  // Auth guard
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [authLoading, isAuthenticated, router]);

  const toggleNotification = (key: keyof typeof notifications) => {
    setNotifications({ ...notifications, [key]: !notifications[key] });
  };

  const handleSaveProfile = async () => {
    setSaveStatus("");
    const token = localStorage.getItem('sb-token');
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/auth/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name }),
      });
      if (res.ok) {
        setSaveStatus("Profile updated successfully");
        const data = await res.json();
        // Update local store with new name
        if (user && data.user) {
          useAuthStore.setState({ user: { ...user, name: data.user.name } });
        }
      } else {
        setSaveStatus("Failed to update profile");
      }
    } catch {
      setSaveStatus("Network error");
    }
  };

  const handleClearHistory = async () => {
    if (!confirm('Clear all your search history? This cannot be undone.')) return;
    setClearStatus("");
    const token = localStorage.getItem('sb-token');
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/auth/history`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setClearStatus("Search history cleared");
      } else {
        setClearStatus("Failed to clear history");
      }
    } catch {
      setClearStatus("Network error");
    }
  };

  const handleDownloadData = async () => {
    const token = localStorage.getItem('sb-token');
    if (!token) return;
    try {
      const [wishlistRes, alertsRes, historyRes] = await Promise.all([
        fetch(`${API_BASE}/wishlist`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_BASE}/alerts`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_BASE}/auth/history`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      const wishlist = wishlistRes.ok ? (await wishlistRes.json()).wishlist || [] : [];
      const alerts = alertsRes.ok ? (await alertsRes.json()).alerts || [] : [];
      const history = historyRes.ok ? (await historyRes.json()).history || [] : [];

      const exportData = { user, wishlist, alerts, history, exportedAt: new Date().toISOString() };
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `bhao-pk-data-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert('Failed to download data. Please try again.');
    }
  };

  const handleDeleteAccount = () => {
    if (confirm('Are you sure you want to delete your account? This will log you out and cannot be undone.')) {
      logout().then(() => router.push('/login'));
    }
  };

  if (authLoading || !user) {
    return (
      <div className="container" style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: 'var(--text-muted)' }}>Loading settings...</div>
      </div>
    );
  }

  return (
    <div className="container">
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '36px', marginBottom: '8px' }}>Settings</h1>
        <p style={{ color: 'var(--text-muted)' }}>
          Manage your account and preferences
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Profile Settings */}
        <div className="card">
          <h3 style={{ fontSize: '20px', marginBottom: '16px' }}>Profile Information</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px' }}>
                Full Name
              </label>
              <input
                type="text"
                className="input-field"
                value={name}
                onChange={(e) => setName(e.target.value)}
                style={{ width: '100%' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px' }}>
                Email
              </label>
              <input
                type="email"
                className="input-field"
                value={user.email}
                disabled
                style={{ width: '100%', opacity: 0.6 }}
              />
              <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>Email cannot be changed</p>
            </div>
            {saveStatus && (
              <div style={{ fontSize: '13px', color: saveStatus.includes('success') ? '#22c55e' : '#FF4444' }}>{saveStatus}</div>
            )}
            <button className="btn btn-primary" onClick={handleSaveProfile}>Save Changes</button>
          </div>
        </div>

        {/* Notification Settings */}
        <div className="card">
          <h3 style={{ fontSize: '20px', marginBottom: '16px' }}>Notifications</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}>
              <div>
                <div style={{ fontSize: '15px', marginBottom: '4px' }}>Price Drop Alerts</div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  Get notified when tracked products drop in price
                </div>
              </div>
              <input
                type="checkbox"
                checked={notifications.priceDrops}
                onChange={() => toggleNotification('priceDrops')}
                style={{ width: '20px', height: '20px' }}
              />
            </label>
            <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', paddingTop: '16px', borderTop: '1px solid var(--border-light)' }}>
              <div>
                <div style={{ fontSize: '15px', marginBottom: '4px' }}>New Products</div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  Be the first to know about new products
                </div>
              </div>
              <input
                type="checkbox"
                checked={notifications.newProducts}
                onChange={() => toggleNotification('newProducts')}
                style={{ width: '20px', height: '20px' }}
              />
            </label>
            <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', paddingTop: '16px', borderTop: '1px solid var(--border-light)' }}>
              <div>
                <div style={{ fontSize: '15px', marginBottom: '4px' }}>Newsletter</div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  Weekly deals and updates
                </div>
              </div>
              <input
                type="checkbox"
                checked={notifications.newsletter}
                onChange={() => toggleNotification('newsletter')}
                style={{ width: '20px', height: '20px' }}
              />
            </label>
          </div>
        </div>

        {/* Privacy Settings */}
        <div className="card">
          <h3 style={{ fontSize: '20px', marginBottom: '16px' }}>Privacy & Security</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <Link href="/reset-password" className="btn btn-secondary" style={{ justifyContent: 'flex-start', textDecoration: 'none' }}>
              Change Password
            </Link>
            <div>
              <button className="btn btn-secondary" style={{ justifyContent: 'flex-start' }} onClick={handleClearHistory}>
                Clear Search History
              </button>
              {clearStatus && <p style={{ fontSize: '12px', color: clearStatus.includes('cleared') ? '#22c55e' : '#FF4444', marginLeft: '16px', marginTop: '4px' }}>{clearStatus}</p>}
            </div>
            <button className="btn btn-secondary" style={{ justifyContent: 'flex-start' }} onClick={handleDownloadData}>
              Download My Data
            </button>
            <button className="btn btn-ghost" style={{ justifyContent: 'flex-start', color: 'var(--accent-alert)', marginTop: '8px' }} onClick={handleDeleteAccount}>
              Delete Account
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
