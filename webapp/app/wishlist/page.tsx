'use client';

import React from 'react';
import Link from 'next/link';
import { Heart, ShoppingBag, Trash2 } from 'lucide-react';
import { useWishlist } from '../../hooks/useWishlist';

const allProducts = [
  { id: '1', name: 'iPhone 15 Pro', price: 'Rs. 345,000', store: 'Daraz', rating: 4.9, image: '/images/iphone-15-pro.png' },
  { id: '2', name: 'Samsung S24', price: 'Rs. 320,000', store: 'Telemart', rating: 4.8, image: '/images/samsung-s24.png' },
  { id: '3', name: 'AirPods Pro', price: 'Rs. 65,000', store: 'Daraz', rating: 4.7, image: '/images/airpods-pro.png' },
  { id: '4', name: 'MacBook Air', price: 'Rs. 285,000', store: 'Shophive', rating: 4.9, image: '/images/macbook-air.png' },
  { id: '5', name: 'iPad Pro 12.9"', price: 'Rs. 245,000', store: 'Daraz', rating: 4.8, image: '/images/ipad-pro.png' },
  { id: '6', name: 'Sony XM5', price: 'Rs. 85,000', store: 'Telemart', rating: 4.6, image: '/images/sony-xm5.png' },
  { id: '7', name: 'iPad Mini', price: 'Rs. 145,000', store: 'Shophive', rating: 4.7, image: '/images/ipad-mini.png' },
  { id: '8', name: 'Galaxy Buds', price: 'Rs. 35,000', store: 'Daraz', rating: 4.5, image: '/images/galaxy-buds.png' },
  { id: '9', name: 'iPhone 14', price: 'Rs. 285,000', store: 'Telemart', rating: 4.8, image: '/images/iphone-14.png' },
];

export default function WishlistPage() {
  const { wishlist, removeFromWishlist } = useWishlist();

  const wishlistProducts = allProducts.filter(p => wishlist.includes(p.id));

  if (wishlistProducts.length === 0) {
    return (
      <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', padding: '2rem' }}>
        <Heart color="var(--text-secondary)" size={64} strokeWidth={1} />
        <h2 style={{ marginTop: '2rem', marginBottom: '0.5rem', color: 'var(--text-main)' }}>Your wishlist is empty</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>Start adding products you love to keep track of them</p>
        <a href="/" style={{
          backgroundColor: 'var(--accent-primary)',
          color: 'var(--bg-core)',
          padding: '1rem 2rem',
          borderRadius: '8px',
          textDecoration: 'none',
          fontWeight: 'bold',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <ShoppingBag size={20} />
          BROWSE PRODUCTS
        </a>
      </div>
    );
  }

  return (
    <div className="container" style={{ paddingTop: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '36px' }}>Wishlist</h1>
        <p style={{ color: 'var(--text-muted)' }}>{wishlistProducts.length} items</p>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {wishlistProducts.map((product) => (
          <div key={product.id} className="card" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <Link href={`/product/${product.id}`} style={{ textDecoration: 'none', color: 'inherit', display: 'flex', alignItems: 'center', gap: '20px', flex: 1 }}>
              <div style={{ width: '100px', height: '100px', background: '#1a1a1a', borderRadius: '8px', overflow: 'hidden', flexShrink: 0 }}>
                <img src={product.image} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              <div style={{ flex: 1 }}>
                <h4 style={{ fontSize: '18px', marginBottom: '4px' }}>{product.name}</h4>
                <div style={{ color: 'var(--accent-primary)', fontSize: '16px', fontWeight: '700', marginBottom: '4px' }}>{product.price}</div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                  {product.store} • ★ {product.rating}
                </div>
              </div>
            </Link>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <Link href={`/product/${product.id}`} className="btn btn-secondary" style={{ padding: '8px 16px', fontSize: '12px' }}>
                View
              </Link>
              <button
                onClick={() => removeFromWishlist(product.id)}
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
