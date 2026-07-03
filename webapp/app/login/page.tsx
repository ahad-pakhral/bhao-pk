"use client";

import Link from "next/link";
import { useState } from "react";
import { Logo } from "../../components/Logo";
import { useAuthStore } from "../../store/authStore";

export default function LoginPage() {
  const { login } = useAuthStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      await login(email, password);
      setTimeout(() => {
        window.location.href = "/";
      }, 500);
    } catch (err: any) {
      setError(err.message || "Login failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container" style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="card" style={{ width: '100%', maxWidth: '420px', padding: '40px', borderRadius: 'var(--r-lg)' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}><Logo size="lg" /></div>
          <h2 style={{ marginBottom: '8px' }}>Welcome back</h2>
          <p style={{ color: 'var(--text-2)', fontSize: '14px' }}>Enter your credentials to access your account</p>
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

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <label>Password</label>
              <Link href="/forgot-password" style={{ fontSize: '13px', color: 'var(--accent)', textDecoration: 'none', fontWeight: 500 }}>Forgot?</Link>
            </div>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                className="input-field"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ width: '100%', paddingRight: '40px' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', fontSize: '16px', padding: 0 }}
              >
                {showPassword ? '🙈' : '👁'}
              </button>
            </div>
          </div>

          <button disabled={isLoading} type="submit" className="btn btn-primary btn-block btn-lg" style={{ marginTop: '12px' }}>
            {isLoading ? "Logging in..." : "Login to account"}
          </button>
        </form>

        <Link href="/" className="btn btn-secondary btn-block btn-lg" style={{ marginTop: '12px' }}>
          Continue as guest
        </Link>

        <div style={{ textAlign: 'center', marginTop: '32px', fontSize: '14px', color: 'var(--text-2)' }}>
          Don't have an account? <Link href="/signup" style={{ color: 'var(--accent)', textDecoration: 'none', fontWeight: 600 }}>Sign up</Link>
        </div>
      </div>
    </div>
  );
}
