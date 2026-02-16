"use client";

import Link from "next/link";
import { Logo } from "../../components/Logo";

export default function LoginPage() {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert("Login successful (Dummy)");
    window.location.href = "/profile";
  };

  return (
    <div className="container" style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="card" style={{ width: '100%', maxWidth: '400px', padding: '40px' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}><Logo size="lg" /></div>
          <h2 style={{ fontSize: '32px', marginBottom: '8px' }}>Welcome Back</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Enter your credentials to access your account</p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '12px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Email Address</label>
            <input type="email" placeholder="name@example.com" className="input-field" required />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <label style={{ fontSize: '12px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Password</label>
              <Link href="#" style={{ fontSize: '12px', color: 'var(--accent-primary)', textDecoration: 'none' }}>Forgot?</Link>
            </div>
            <input type="password" placeholder="••••••••" className="input-field" required />
          </div>

          <button type="submit" className="btn btn-primary" style={{ height: '48px', marginTop: '12px' }}>Login to Account</button>
        </form>

        <Link href="/" className="btn btn-secondary" style={{ height: '48px', marginTop: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none' }}>
          Continue as Guest
        </Link>

        <div style={{ textAlign: 'center', marginTop: '32px', fontSize: '14px', color: 'var(--text-muted)' }}>
          Don't have an account? <Link href="/signup" style={{ color: 'var(--text-main)', textDecoration: 'none', fontWeight: '700' }}>Sign Up</Link>
        </div>
      </div>
    </div>
  );
}
