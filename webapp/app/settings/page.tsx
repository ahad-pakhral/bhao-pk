"use client";

import { useState } from "react";

export default function SettingsPage() {
  const [notifications, setNotifications] = useState({
    priceDrops: true,
    newProducts: false,
    newsletter: true,
  });

  const toggleNotification = (key: keyof typeof notifications) => {
    setNotifications({ ...notifications, [key]: !notifications[key] });
  };

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
                defaultValue="Ahad Ali"
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
                defaultValue="ahad@example.com"
                style={{ width: '100%' }}
              />
            </div>
            <button className="btn btn-primary">Save Changes</button>
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
            <button className="btn btn-secondary" style={{ justifyContent: 'flex-start' }}>
              Change Password
            </button>
            <button className="btn btn-secondary" style={{ justifyContent: 'flex-start' }}>
              Clear Search History
            </button>
            <button className="btn btn-secondary" style={{ justifyContent: 'flex-start' }}>
              Download My Data
            </button>
            <button className="btn btn-ghost" style={{ justifyContent: 'flex-start', color: 'var(--accent-alert)', marginTop: '8px' }}>
              Delete Account
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
