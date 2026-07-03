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
        <div className="card" style={{ width: '100%', maxWidth: '420px', padding: '40px', borderRadius: 'var(--r-lg)', textAlign: 'center' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}><Logo size="lg" /></div>
          <h2 style={{ marginBottom: '12px' }}>Check your email</h2>
          <p style={{ color: 'var(--text-2)', fontSize: '14px', lineHeight: '1.6', marginBottom: '24px' }}>
            If an account exists for <strong style={{ color: 'var(--text)' }}>{email}</strong>, you will receive a password reset link shortly.
          </p>
          <Link href="/login" className="btn btn-primary btn-block btn-lg">
            Back to login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container" style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="card" style={{ width: '100%', maxWidth: '420px', padding: '40px', borderRadius: 'var(--r-lg)' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}><Logo size="lg" /></div>
          <h2 style={{ marginBottom: '8px' }}>Forgot password</h2>
          <p style={{ color: 'var(--text-2)', fontSize: '14px' }}>Enter your email and we&apos;ll send you a reset link</p>
        </div>

        {error && (
          <div style={{ padding: '12px 14px', marginBottom: '20px', borderRadius: 'var(--r-md)', background: 'var(--danger-soft)', color: 'var(--danger)', fontSize: '14px', border: '1px solid var(--danger)' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label>Email address</label>
            <input
              type="email"
              placeholder="name@example.com"
              className="input-field"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <button disabled={isLoading} type="submit" className="btn btn-primary btn-block btn-lg" style={{ marginTop: '12px' }}>
            {isLoading ? "Sending..." : "Send reset link"}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '24px', fontSize: '14px', color: 'var(--text-2)' }}>
          Remember your password? <Link href="/login" style={{ color: 'var(--accent)', textDecoration: 'none', fontWeight: 600 }}>Login</Link>
        </div>
      </div>
    </div>
  );
}
