// Wishlist hook (backend-backed; no dummy/local wishlist)

import { useState, useEffect, useCallback } from 'react';
import Toast from 'react-native-toast-message';
import { authService } from '../services/api';
import { useAuth } from '../context/AuthContext';

const API_BASE = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001/api';

export interface WishlistItem {
  id: string;
  userId: string;
  store: string;
  url: string;
  name: string;
  imageUrl: string | null;
  createdAt: string;
}

export const useWishlist = () => {
  const { isAuthenticated } = useAuth();
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadWishlist = useCallback(async () => {
    try {
      if (!isAuthenticated) {
        setWishlist([]);
        return;
      }
      const token = await authService.getSessionToken();
      if (!token) {
        setWishlist([]);
        return;
      }

      const res = await fetch(`${API_BASE}/wishlist`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json().catch(() => ({} as any));
      if (!res.ok) throw new Error(data?.error || `Failed to load wishlist (${res.status})`);
      setWishlist(data.wishlist || []);
    } catch (error) {
      console.error('Failed to load wishlist:', error);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    loadWishlist();
  }, [loadWishlist]);

  const isInWishlist = useCallback((url: string): boolean => {
    if (!url) return false;
    return wishlist.some((item) => item.url === url);
  }, [wishlist]);

  const addToWishlist = useCallback(async (productData: { store: string; url: string; name: string; imageUrl?: string | null }) => {
    const token = await authService.getSessionToken();
    if (!token) throw new Error('Not authenticated');

    const res = await fetch(`${API_BASE}/wishlist`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(productData),
    });
    const data = await res.json().catch(() => ({} as any));
    if (!res.ok) throw new Error(data?.error || `Failed to add to wishlist (${res.status})`);
    return data.item as WishlistItem;
  }, []);

  const removeFromWishlist = useCallback(async (id: string) => {
    const token = await authService.getSessionToken();
    if (!token) throw new Error('Not authenticated');

    const res = await fetch(`${API_BASE}/wishlist/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json().catch(() => ({} as any));
    if (!res.ok) throw new Error(data?.error || `Failed to remove wishlist item (${res.status})`);
  }, []);

  const toggleWishlist = useCallback(async (productData: { store: string; url: string; name: string; imageUrl?: string | null }) => {
    try {
      if (!isAuthenticated) {
        Toast.show({ type: 'info', text1: 'Login required', text2: 'Please login to use wishlist' });
        return;
      }
      const url = productData.url || '';
      const existing = wishlist.find((w) => w.url === url);
      if (existing) {
        await removeFromWishlist(existing.id);
        setWishlist((prev) => prev.filter((w) => w.id !== existing.id));
        Toast.show({ type: 'success', text1: 'Removed from wishlist' });
      } else {
        const item = await addToWishlist(productData);
        setWishlist((prev) => [item, ...prev]);
        Toast.show({ type: 'success', text1: 'Added to wishlist' });
      }
    } catch (error: any) {
      Toast.show({ type: 'error', text1: 'Wishlist error', text2: error?.message || 'Please try again' });
    }
  }, [isAuthenticated, wishlist, addToWishlist, removeFromWishlist]);

  return {
    wishlist,
    loading,
    loadWishlist,
    isInWishlist,
    toggleWishlist,
  };
};
