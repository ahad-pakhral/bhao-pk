'use client';

import { useState, useCallback, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export interface WishlistItem {
  id: string;
  userId: string;
  store: string;
  url: string;
  name: string;
  imageUrl: string | null;
  createdAt: string;
}

export type WishlistResult = 'added' | 'removed' | 'auth_required' | 'error';

export const useWishlist = () => {
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { token, isAuthenticated } = useAuthStore();

  const loadWishlist = useCallback(async () => {
    if (!isAuthenticated || !token) {
      setWishlist([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/wishlist`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setWishlist(data.wishlist || []);
      }
    } catch (error) {
      console.error('Failed to load wishlist:', error);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, token]);

  useEffect(() => {
    loadWishlist();
  }, [loadWishlist]);

  const addToWishlist = useCallback(async (productData: any): Promise<WishlistItem | null> => {
    if (!token) return null;
    try {
      const res = await fetch(`${API_BASE}/wishlist`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(productData),
      });
      const data = await res.json().catch(() => ({} as any));
      if (res.ok) {
        const item = data.item;
        setWishlist(prev => {
          // Prevent duplicates (race condition with wishlist not loaded yet)
          if (prev.some(i => i.url === (productData.url || ''))) return prev;
          return [item, ...prev];
        });
        return item;
      } else if (res.status === 409) {
        // Item already in wishlist (unique constraint) — reload from server
        console.log('[Wishlist] Item already exists, reloading wishlist');
        loadWishlist();
        return productData; // Return a truthy value so caller knows it's in the wishlist
      }
      console.error('Failed to add to wishlist:', data?.error || res.statusText);
      return null;
    } catch (error) {
      console.error('Failed to add to wishlist:', error);
      return null;
    }
  }, [token, loadWishlist]);

  const removeFromWishlist = useCallback(async (id: string) => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/wishlist/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setWishlist(prev => prev.filter(item => item.id !== id));
      }
    } catch (error) {
      console.error('Failed to remove from wishlist:', error);
    }
  }, [token]);

  const isInWishlist = useCallback((url: string): boolean => {
    if (!url) return false;
    return wishlist.some(item => item.url === url);
  }, [wishlist]);

  const toggleWishlist = useCallback(async (productData: any): Promise<WishlistResult> => {
    if (!isAuthenticated) return 'auth_required';
    const url = productData.url || '';
    if (url && isInWishlist(url)) {
      const item = wishlist.find(i => i.url === url);
      if (item) {
        await removeFromWishlist(item.id);
      }
      return 'removed';
    } else {
      const result = await addToWishlist(productData);
      return result ? 'added' : 'error';
    }
  }, [isAuthenticated, wishlist, isInWishlist, addToWishlist, removeFromWishlist]);

  return {
    wishlist,
    loading,
    addToWishlist,
    removeFromWishlist,
    isInWishlist,
    toggleWishlist,
  };
};
