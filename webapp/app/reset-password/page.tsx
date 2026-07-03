"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Logo } from "../../components/Logo";
import { supabase } from "../../utils/supabase";
import { validatePassword } from "../../utils/passwordValidation";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [hasHashToken, setHasHashToken] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const passwordValidation = validatePassword(password);

  // Check if Supabase recovery tokens are in the URL hash
  useEffect(() => {
    const checkHash = async () => {
      const hash = window.location.hash;
      if (hash.includes('type=recovery') || hash.includes('access_token')) {
        // Let Supabase parse the hash fragment
        await supabase.auth.getSession();
        setHasHashToken(true);
      } else {
        // No recovery token in URL — user might have navigated here directly
        setHasHashToken(false);
      }
    };
    checkHash();
  }, []);

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
      const { error } = await supabase.auth.updateUser({ password });

      if (error) {
        setError(error.message);
        return;
      }

      setIsSuccess(true);
    } catch {
      setError('Failed to reset password');
    } finally {
      setIsLoading(false);
    }
  };

  if (!hasHashToken && !isSuccess) {
    return (
      <div className="container" style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="card" style={{ width: '100%', maxWidth: '400px', padding: '40px', textAlign: 'center' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}><Logo size="lg" /></div>
          <h2 style={{ fontSize: '24px', marginBottom: '12px' }}>Invalid or Expired Link</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', lineHeight: '1.6', marginBottom: '24px' }}>
            This password reset link is invalid or has expired. Please request a new one.
          </p>
          <Link href="/forgot-password" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '48px', textDecoration: 'none' }}>
            Request New Link
          </Link>
        </div>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="container" style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="card" style={{ width: '100%', maxWidth: '400px', padding: '40px', textAlign: 'center' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}><Logo size="lg" /></div>
          <h2 style={{ fontSize: '28px', marginBottom: '12px' }}>Password Updated</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', lineHeight: '1.6', marginBottom: '24px' }}>
            Your password has been reset successfully. You can now log in with your new password.
          </p>
          <Link href="/login" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '48px', textDecoration: 'none' }}>
            Go to Login
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
          <h2 style={{ fontSize: '28px', marginBottom: '8px' }}>Set New Password</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Enter your new password below</p>
        </div>

        {error && (
          <div style={{ padding: '12px', marginBottom: '20px', borderRadius: '8px', background: 'rgba(255, 68, 68, 0.1)', color: 'var(--accent-alert)', fontSize: '14px', border: '1px solid rgba(255, 68, 68, 0.2)' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label>New password</label>
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
                  <div key={rule.label} style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px', color: rule.met ? 'var(--success)' : 'var(--text-muted)' }}>
                    <span>{rule.met ? '✓' : '○'}</span> {rule.label}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label>Confirm new password</label>
            <input
              type="password"
              placeholder="••••••••"
              className="input-field"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              style={confirmPassword && confirmPassword !== password ? { borderColor: 'var(--accent-alert)' } : undefined}
            />
            {confirmPassword && confirmPassword !== password && (
              <span style={{ fontSize: '12px', color: 'var(--accent-alert)' }}>Passwords do not match</span>
            )}
          </div>

          <button disabled={isLoading || !passwordValidation.isValid} type="submit" className="btn btn-primary" style={{ height: '48px', marginTop: '12px', opacity: isLoading ? 0.7 : 1 }}>
            {isLoading ? "Updating..." : "Reset Password"}
          </button>
        </form>
      </div>
    </div>
  );
}
