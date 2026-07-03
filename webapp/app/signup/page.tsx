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
        <div className="card" style={{ width: '100%', maxWidth: '420px', padding: '40px', borderRadius: 'var(--r-lg)', textAlign: 'center' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}><Logo size="lg" /></div>
          <h2 style={{ marginBottom: '12px' }}>Check your email</h2>
          <p style={{ color: 'var(--text-2)', fontSize: '14px', lineHeight: '1.6', marginBottom: '24px' }}>
            We sent a verification link to <strong style={{ color: 'var(--text)' }}>{email}</strong>. Click the link to activate your account.
          </p>
          <Link href="/login" className="btn btn-primary btn-block btn-lg">
            Go to login
          </Link>
          <p style={{ color: 'var(--text-3)', fontSize: '13px', marginTop: '16px' }}>
            Didn&apos;t receive it? Check your spam folder.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container" style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="card" style={{ width: '100%', maxWidth: '420px', padding: '40px', borderRadius: 'var(--r-lg)' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}><Logo size="lg" /></div>
          <h2 style={{ marginBottom: '8px' }}>Create account</h2>
          <p style={{ color: 'var(--text-2)', fontSize: '14px' }}>Join Bhao.pk to track prices and save money</p>
        </div>

        {error && (
          <div style={{ padding: '12px 14px', marginBottom: '20px', borderRadius: 'var(--r-md)', background: 'var(--danger-soft)', color: 'var(--danger)', fontSize: '14px', border: '1px solid var(--danger)' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label>Full name</label>
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
            <label>Password</label>
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
            {password.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '4px' }}>
                {passwordValidation.rules.map((rule) => (
                  <div key={rule.label} style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px', color: rule.met ? 'var(--success)' : 'var(--text-3)' }}>
                    <span>{rule.met ? '✓' : '○'}</span> {rule.label}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label>Confirm password</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showConfirm ? "text" : "password"}
                placeholder="••••••••"
                className="input-field"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                style={{ width: '100%', paddingRight: '40px', ...(confirmPassword && confirmPassword !== password ? { borderColor: 'var(--danger)' } : {}) }}
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', fontSize: '16px', padding: 0 }}
              >
                {showConfirm ? '🙈' : '👁'}
              </button>
            </div>
            {confirmPassword && confirmPassword !== password && (
              <span style={{ fontSize: '12px', color: 'var(--danger)' }}>Passwords do not match</span>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', marginTop: '8px' }}>
            <input type="checkbox" id="terms" required style={{ marginTop: '4px' }} />
            <label htmlFor="terms" style={{ fontSize: '13px', color: 'var(--text-2)', lineHeight: '1.5' }}>
              I agree to the <Link href="#" style={{ color: 'var(--accent)' }}>Terms of Service</Link> and <Link href="#" style={{ color: 'var(--accent)' }}>Privacy Policy</Link>
            </label>
          </div>

          <button disabled={isLoading || !passwordValidation.isValid} type="submit" className="btn btn-primary btn-block btn-lg" style={{ marginTop: '12px' }}>
            {isLoading ? "Creating account..." : "Create account"}
          </button>
        </form>

        <Link href="/" className="btn btn-secondary btn-block btn-lg" style={{ marginTop: '12px' }}>
          Continue as guest
        </Link>

        <div style={{ textAlign: 'center', marginTop: '32px', fontSize: '14px', color: 'var(--text-2)' }}>
          Already have an account? <Link href="/login" style={{ color: 'var(--accent)', textDecoration: 'none', fontWeight: 600 }}>Login</Link>
        </div>
      </div>
    </div>
  );
}
