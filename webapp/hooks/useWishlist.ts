// Wishlist hook for webapp

'use client';

import { useState, useEffect } from 'react';
import { wishlistStorage } from '../services/storage.service';

export const useWishlist = () => {
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadWishlist();
  }, []);

  const loadWishlist = () => {
    try {
      const items = wishlistStorage.getWishlist();
      setWishlist(items);
    } catch (error) {
      console.error('Failed to load wishlist:', error);
    } finally {
      setLoading(false);
    }
  };

  const addToWishlist = (productId: string) => {
    try {
      wishlistStorage.addToWishlist(productId);
      setWishlist((prev) => [...prev, productId]);
      // Toast notification would go here
      console.log('Added to wishlist:', productId);
    } catch (error) {
      console.error('Failed to add to wishlist:', error);
    }
  };

  const removeFromWishlist = (productId: string) => {
    try {
      wishlistStorage.removeFromWishlist(productId);
      setWishlist((prev) => prev.filter((id) => id !== productId));
      console.log('Removed from wishlist:', productId);
    } catch (error) {
      console.error('Failed to remove from wishlist:', error);
    }
  };

  const toggleWishlist = (productId: string) => {
    if (wishlist.includes(productId)) {
      removeFromWishlist(productId);
    } else {
      addToWishlist(productId);
    }
  };

  const isInWishlist = (productId: string): boolean => {
    return wishlist.includes(productId);
  };

  return {
    wishlist,
    loading,
    addToWishlist,
    removeFromWishlist,
    toggleWishlist,
    isInWishlist,
  };
};
