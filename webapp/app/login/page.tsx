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
      <div className="card" style={{ width: '100%', maxWidth: '400px', padding: '40px' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}><Logo size="lg" /></div>
          <h2 style={{ fontSize: '32px', marginBottom: '8px' }}>Welcome Back</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Enter your credentials to access your account</p>
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

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <label style={{ fontSize: '12px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Password</label>
              <Link href="/forgot-password" style={{ fontSize: '12px', color: 'var(--accent-primary)', textDecoration: 'none' }}>Forgot?</Link>
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
                style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '16px', padding: 0 }}
              >
                {showPassword ? '🙈' : '👁'}
              </button>
            </div>
          </div>

          <button disabled={isLoading} type="submit" className="btn btn-primary" style={{ height: '48px', marginTop: '12px', opacity: isLoading ? 0.7 : 1 }}>
            {isLoading ? "Logging in..." : "Login to Account"}
          </button>
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
