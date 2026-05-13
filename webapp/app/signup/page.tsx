"use client";

import Link from "next/link";
import { useState } from "react";
import { Logo } from "../../components/Logo";
import { useAuthStore } from "../../store/authStore";
import { validatePassword } from "../../utils/passwordValidation";

export default function SignupPage() {
  const { register } = useAuthStore();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const passwordValidation = validatePassword(password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!passwordValidation.isValid) {
      setError("Password does not meet all requirements");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setIsLoading(true);

    try {
      await register({ email, password, name });
      // If email confirmation is enabled, session will be null
      setEmailSent(true);
    } catch (err: any) {
      setError(err.message || "Registration failed");
    } finally {
      setIsLoading(false);
    }
  };

  if (emailSent) {
    return (
      <div className="container" style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="card" style={{ width: '100%', maxWidth: '400px', padding: '40px', textAlign: 'center' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}><Logo size="lg" /></div>
          <h2 style={{ fontSize: '28px', marginBottom: '12px' }}>Check Your Email</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', lineHeight: '1.6', marginBottom: '24px' }}>
            We sent a verification link to <strong>{email}</strong>. Click the link to activate your account.
          </p>
          <Link href="/login" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '48px', textDecoration: 'none' }}>
            Go to Login
          </Link>
          <p style={{ color: 'var(--text-muted)', fontSize: '12px', marginTop: '16px' }}>
            Didn&apos;t receive it? Check your spam folder.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container" style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="card" style={{ width: '100%', maxWidth: '400px', padding: '40px' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}><Logo size="lg" /></div>
          <h2 style={{ fontSize: '32px', marginBottom: '8px' }}>Create Account</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Join BHAO.PK to track prices and save money</p>
        </div>

        {error && (
          <div style={{ padding: '12px', marginBottom: '20px', borderRadius: '8px', background: 'rgba(255, 68, 68, 0.1)', color: 'var(--accent-alert)', fontSize: '14px', border: '1px solid rgba(255, 68, 68, 0.2)' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '12px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Full Name</label>
            <input
              type="text"
              placeholder="John Doe"
              className="input-field"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

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
            <label style={{ fontSize: '12px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Password</label>
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
            {password.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '4px' }}>
                {passwordValidation.rules.map((rule) => (
                  <div key={rule.label} style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px', color: rule.met ? '#22c55e' : 'var(--text-muted)' }}>
                    <span>{rule.met ? '✓' : '○'}</span> {rule.label}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '12px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Confirm Password</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showConfirm ? "text" : "password"}
                placeholder="••••••••"
                className="input-field"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                style={{ width: '100%', paddingRight: '40px', ...(confirmPassword && confirmPassword !== password ? { borderColor: 'var(--accent-alert)' } : {}) }}
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '16px', padding: 0 }}
              >
                {showConfirm ? '🙈' : '👁'}
              </button>
            </div>
            {confirmPassword && confirmPassword !== password && (
              <span style={{ fontSize: '12px', color: 'var(--accent-alert)' }}>Passwords do not match</span>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', marginTop: '8px' }}>
            <input type="checkbox" id="terms" required style={{ marginTop: '4px' }} />
            <label htmlFor="terms" style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
              I agree to the <Link href="#" style={{ color: 'var(--text-main)' }}>Terms of Service</Link> and <Link href="#" style={{ color: 'var(--text-main)' }}>Privacy Policy</Link>
            </label>
          </div>

          <button disabled={isLoading || !passwordValidation.isValid} type="submit" className="btn btn-primary" style={{ height: '48px', marginTop: '12px', opacity: isLoading ? 0.7 : 1 }}>
            {isLoading ? "Creating Account..." : "Create Account"}
          </button>
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
