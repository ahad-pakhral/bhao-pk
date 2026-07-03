"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useAuthStore } from "../../store/authStore";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

interface HistoryItem {
  id: string;
  user_id: string;
  query: string;
  created_at: string;
}

function formatRelativeDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  return date.toLocaleDateString('en-PK', { day: 'numeric', month: 'short' });
}

export default function HistoryPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuthStore();
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
      return;
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    if (!isAuthenticated) return;
    const token = localStorage.getItem('sb-token');
    if (!token) return;

    fetch(`${API_BASE}/auth/history`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        setHistory((data?.history || []) as HistoryItem[]);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [isAuthenticated]);

  const clearHistory = async () => {
    if (!confirm('Clear all search history? This cannot be undone.')) return;
    const token = localStorage.getItem('sb-token');
    if (!token) return;
    const res = await fetch(`${API_BASE}/auth/history`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) setHistory([]);
  };

  if (authLoading || loading) {
    return (
      <div className="container" style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: 'var(--text-muted)' }}>Loading history...</div>
      </div>
    );
  }

  return (
    <div className="container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '36px', marginBottom: '8px' }}>Search History</h1>
          <p style={{ color: 'var(--text-muted)' }}>
            Your recent searches
          </p>
        </div>
        {history.length > 0 && (
          <button className="btn btn-secondary" onClick={clearHistory}>
            Clear All
          </button>
        )}
      </div>

      {history.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
          {history.map((item, index) => (
            <div
              key={item.id || index}
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '16px 20px',
                borderBottom: index < history.length - 1 ? '1px solid var(--border-light)' : 'none',
                cursor: 'pointer',
                background: 'var(--bg-surface)',
                borderRadius: index === 0 ? '8px 8px 0 0' : index === history.length - 1 ? '0 0 8px 8px' : '0',
              }}
              className="card"
              onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-surface-hover)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'var(--bg-surface)'}
              onClick={() => router.push(`/search?q=${encodeURIComponent(item.query)}`)}
            >
              <svg
                width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--text-3)', marginRight: '16px', flexShrink: 0 }}
              >
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12 6 12 12 16 14"></polyline>
              </svg>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '16px', marginBottom: '4px' }}>{item.query}</div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{formatRelativeDate(item.created_at)}</div>
              </div>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-3)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6"></polyline>
              </svg>
            </div>
          ))}
        </div>
      ) : (
        <div className="card" style={{ padding: '60px 40px', textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🕐</div>
          <h3 style={{ fontSize: '24px', marginBottom: '12px' }}>No search history</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
            Your recent searches will appear here
          </p>
          <Link href="/search" className="btn btn-primary" style={{ textDecoration: 'none' }}>
            Start Searching
          </Link>
        </div>
      )}
    </div>
  );
}
