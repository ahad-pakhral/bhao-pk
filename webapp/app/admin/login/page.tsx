"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "../../../store/authStore";
import { useToast } from "../../../components/Toast";

export default function AdminLoginPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const { login, logout } = useAuthStore();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await login(email, password);
      const user = useAuthStore.getState().user;
      if (!user || String(user.role || '').toUpperCase() !== 'ADMIN') {
        await logout();
        showToast("Admin access required", "error");
        return;
      }
      showToast("Admin session initialized", "success");
      router.push("/admin/dashboard");
    } catch (err: any) {
      showToast(err?.message || "Admin login failed", "error");
    } finally {
      setSubmitting(false);
    }
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
            <label style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Email</label>
            <input
              type="email"
              placeholder="admin@bhao.pk"
              className="input-field"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Password</label>
            <input
              type="password"
              placeholder="••••••••"
              className="input-field"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="btn"
            disabled={submitting}
            style={{ background: 'var(--accent-secondary)', color: '#fff', height: '48px', marginTop: '12px', border: 'none', cursor: submitting ? 'not-allowed' : 'pointer', opacity: submitting ? 0.7 : 1 }}
          >
            {submitting ? 'Initializing...' : 'Initialize Session'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '32px', fontSize: '12px', color: 'var(--text-muted)' }}>
          <Link href="/" style={{ color: 'inherit', textDecoration: 'none' }}>← Return to Public Terminal</Link>
        </div>
      </div>
    </div>
  );
}
