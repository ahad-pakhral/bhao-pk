"use client";

import React from 'react';
import Link from 'next/link';
import { Heart, ShoppingBag, Trash2 } from 'lucide-react';
import { useWishlist } from '../../hooks/useWishlist';
import { useAuthStore } from '../../store/authStore';

function WishlistContent() {
  const { wishlist, loading, removeFromWishlist } = useWishlist();
  const { isAuthenticated, isLoading: authLoading } = useAuthStore();

  if (authLoading || loading) {
    return (
      <div className="container" style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: 'var(--text-muted)' }}>Loading wishlist...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="container" style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px' }}>
        <h2 style={{ fontSize: '24px' }}>Login Required</h2>
        <p style={{ color: 'var(--text-muted)' }}>You must be logged in to view your wishlist.</p>
        <Link href="/login" className="btn btn-primary">Login Now</Link>
      </div>
    );
  }

  if (wishlist.length === 0) {
    return (
      <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', padding: '2rem' }}>
        <Heart color="var(--text-secondary)" size={64} strokeWidth={1} />
        <h2 style={{ marginTop: '2rem', marginBottom: '0.5rem', color: 'var(--text-main)' }}>Your wishlist is empty</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>Start adding products you love to keep track of them</p>
        <Link href="/search" className="btn btn-primary" style={{ padding: '1rem 2rem', fontSize: '14px', alignItems: 'center', display: 'flex', gap: '8px' }}>
          <ShoppingBag size={20} />
          BROWSE PRODUCTS
        </Link>
      </div>
    );
  }

  return (
    <div className="container" style={{ paddingTop: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '36px' }}>Wishlist</h1>
        <p style={{ color: 'var(--text-muted)' }}>{wishlist.length} items</p>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {wishlist.map((item) => (
          <div key={item.id} className="card" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <a href={item.url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', color: 'inherit', display: 'flex', alignItems: 'center', gap: '20px', flex: 1 }}>
              <div style={{ width: '100px', height: '100px', background: 'var(--surface-2)', borderRadius: '8px', overflow: 'hidden', flexShrink: 0 }}>
                <img src={item.imageUrl || '/images/iphone-15-pro.png'} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              <div style={{ flex: 1 }}>
                <h4 style={{ fontSize: '18px', marginBottom: '4px' }}>{item.name}</h4>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                  {item.store}
                </div>
              </div>
            </a>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <a href={item.url} target="_blank" rel="noopener noreferrer" className="btn btn-secondary" style={{ padding: '8px 16px', fontSize: '12px' }}>
                Visit Store
              </a>
              <button
                onClick={() => removeFromWishlist(item.id)}
                style={{
                  backgroundColor: 'transparent',
                  border: '1px solid var(--accent-alert)',
                  borderRadius: '50%',
                  padding: '8px',
                  cursor: 'pointer',
                  color: 'var(--accent-alert)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Trash2 size={18} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

import { ReactNode, Suspense } from 'react';

export default function WishlistPage() {
  return (
    <Suspense fallback={<div className="container" style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><p style={{ color: 'var(--text-muted)' }}>Loading wishlist...</p></div>}>
      <WishlistContent />
    </Suspense>
  );
}
