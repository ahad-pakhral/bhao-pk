"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

const searchHistory = [
  { query: "iPhone 15", date: "2 hours ago" },
  { query: "MacBook Air", date: "Yesterday" },
  { query: "AirPods Pro", date: "2 days ago" },
  { query: "Samsung S24", date: "3 days ago" },
  { query: "iPad Pro", date: "1 week ago" },
];

export default function HistoryPage() {
  const router = useRouter();
  const [history, setHistory] = useState(searchHistory);

  const clearHistory = () => {
    if (confirm('Clear all search history?')) {
      setHistory([]);
    }
  };

  const removeItem = (index: number) => {
    setHistory(history.filter((_, i) => i !== index));
  };

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
          <button
            className="btn btn-secondary"
            onClick={clearHistory}
          >
            Clear All
          </button>
        )}
      </div>

      {history.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
          {history.map((item, index) => (
            <div
              key={index}
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '16px 20px',
                borderBottom: index < history.length - 1 ? '1px solid var(--border-light)' : 'none',
                cursor: 'pointer',
                background: 'var(--bg-surface)',
              }}
              className="card"
              onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-surface-hover)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'var(--bg-surface)'}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ color: '#666', marginRight: '16px' }}
              >
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12 6 12 12 16 14"></polyline>
              </svg>
              <div style={{ flex: 1 }} onClick={() => router.push(`/search?q=${encodeURIComponent(item.query)}`)}>
                <div style={{ fontSize: '16px', marginBottom: '4px' }}>{item.query}</div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{item.date}</div>
              </div>
              <button
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: '8px',
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  removeItem(index);
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
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
          <Link href="/search" className="btn btn-primary">
            Start Searching
          </Link>
        </div>
      )}
    </div>
  );
}
