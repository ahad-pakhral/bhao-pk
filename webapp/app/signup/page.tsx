"use client";

import Link from "next/link";
import { Logo } from "../../components/Logo";

export default function SignupPage() {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert("Account created successfully (Dummy)");
    window.location.href = "/profile";
  };

  return (
    <div className="container" style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="card" style={{ width: '100%', maxWidth: '400px', padding: '40px' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}><Logo size="lg" /></div>
          <h2 style={{ fontSize: '32px', marginBottom: '8px' }}>Create Account</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Join BHAO.PK to track prices and save money</p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '12px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Full Name</label>
            <input type="text" placeholder="John Doe" className="input-field" required />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '12px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Email Address</label>
            <input type="email" placeholder="name@example.com" className="input-field" required />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '12px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Password</label>
            <input type="password" placeholder="••••••••" className="input-field" required />
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', marginTop: '8px' }}>
            <input type="checkbox" id="terms" required style={{ marginTop: '4px' }} />
            <label htmlFor="terms" style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
              I agree to the <Link href="#" style={{ color: 'var(--text-main)' }}>Terms of Service</Link> and <Link href="#" style={{ color: 'var(--text-main)' }}>Privacy Policy</Link>
            </label>
          </div>

          <button type="submit" className="btn btn-primary" style={{ height: '48px', marginTop: '12px' }}>Create Account</button>
        </form>

        <Link href="/" className="btn btn-secondary" style={{ height: '48px', marginTop: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none' }}>
          Continue as Guest
        </Link>

        <div style={{ textAlign: 'center', marginTop: '32px', fontSize: '14px', color: 'var(--text-muted)' }}>
          Already have an account? <Link href="/login" style={{ color: 'var(--text-main)', textDecoration: 'none', fontWeight: '700' }}>Login</Link>
        </div>
      </div>
    </div>
  );
}
