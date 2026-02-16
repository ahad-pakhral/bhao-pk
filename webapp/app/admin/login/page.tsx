"use client";

import Link from "next/link";

export default function AdminLoginPage() {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert("Admin access granted (Dummy)");
    window.location.href = "/admin/dashboard";
  };

  return (
    <div className="container" style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="card" style={{ width: '100%', maxWidth: '400px', padding: '40px', borderTop: '4px solid var(--accent-secondary)' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ color: 'var(--accent-secondary)', fontSize: '24px', fontWeight: '900', marginBottom: '16px', fontFamily: 'var(--font-mono)' }}>ADMIN_CORE</div>
          <h2 style={{ fontSize: '24px', marginBottom: '8px' }}>System Access</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Authorized personnel only. All access is logged.</p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Access Key</label>
            <input type="text" placeholder="ADMIN_ID_XXXX" className="input-field" style={{ fontFamily: 'var(--font-mono)' }} required />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Security Phrase</label>
            <input type="password" placeholder="••••••••" className="input-field" required />
          </div>

          <button type="submit" className="btn" style={{ background: 'var(--accent-secondary)', color: '#fff', height: '48px', marginTop: '12px', border: 'none', cursor: 'pointer' }}>Initialize Session</button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '32px', fontSize: '12px', color: 'var(--text-muted)' }}>
          <Link href="/" style={{ color: 'inherit', textDecoration: 'none' }}>← Return to Public Terminal</Link>
        </div>
      </div>
    </div>
  );
}
