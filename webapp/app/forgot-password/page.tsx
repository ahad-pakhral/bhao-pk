"use client";

import Link from "next/link";
import { useState } from "react";
import { Logo } from "../../components/Logo";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const res = await fetch(`${API_BASE}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Something went wrong');
        return;
      }

      setSent(true);
    } catch {
      setError('Failed to send reset email');
    } finally {
      setIsLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="container" style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="card" style={{ width: '100%', maxWidth: '400px', padding: '40px', textAlign: 'center' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}><Logo size="lg" /></div>
          <h2 style={{ fontSize: '28px', marginBottom: '12px' }}>Check Your Email</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', lineHeight: '1.6', marginBottom: '24px' }}>
            If an account exists for <strong>{email}</strong>, you will receive a password reset link shortly.
          </p>
          <Link href="/login" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '48px', textDecoration: 'none' }}>
            Back to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container" style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="card" style={{ width: '100%', maxWidth: '400px', padding: '40px' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}><Logo size="lg" /></div>
          <h2 style={{ fontSize: '28px', marginBottom: '8px' }}>Forgot Password</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Enter your email and we&apos;ll send you a reset link</p>
        </div>

        {error && (
          <div style={{ padding: '12px', marginBottom: '20px', borderRadius: '8px', background: 'rgba(255, 68, 68, 0.1)', color: 'var(--accent-alert)', fontSize: '14px', border: '1px solid rgba(255, 68, 68, 0.2)' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '12px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Email Address</label>
            <input
              type="email"
              placeholder="name@example.com"
              className="input-field"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <button disabled={isLoading} type="submit" className="btn btn-primary" style={{ height: '48px', marginTop: '12px', opacity: isLoading ? 0.7 : 1 }}>
            {isLoading ? "Sending..." : "Send Reset Link"}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '24px', fontSize: '14px', color: 'var(--text-muted)' }}>
          Remember your password? <Link href="/login" style={{ color: 'var(--text-main)', textDecoration: 'none', fontWeight: '700' }}>Login</Link>
        </div>
      </div>
    </div>
  );
}
