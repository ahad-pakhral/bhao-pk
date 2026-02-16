// Wishlist hook

import { useState, useEffect } from 'react';
import { wishlistStorage } from '../services/storage.service';
import Toast from 'react-native-toast-message';

export const useWishlist = () => {
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadWishlist();
  }, []);

  const loadWishlist = async () => {
    try {
      const items = await wishlistStorage.getWishlist();
      setWishlist(items);
    } catch (error) {
      console.error('Failed to load wishlist:', error);
    } finally {
      setLoading(false);
    }
  };

  const addToWishlist = async (productId: string) => {
    try {
      await wishlistStorage.addToWishlist(productId);
      setWishlist((prev) => [...prev, productId]);
      Toast.show({
        type: 'success',
        text1: 'Added to wishlist',
        text2: 'Product saved successfully',
      });
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Failed to add',
        text2: 'Could not add product to wishlist',
      });
    }
  };

  const removeFromWishlist = async (productId: string) => {
    try {
      await wishlistStorage.removeFromWishlist(productId);
      setWishlist((prev) => prev.filter((id) => id !== productId));
      Toast.show({
        type: 'success',
        text1: 'Removed from wishlist',
        text2: 'Product removed successfully',
      });
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Failed to remove',
        text2: 'Could not remove product from wishlist',
      });
    }
  };

  const toggleWishlist = async (productId: string) => {
    if (wishlist.includes(productId)) {
      await removeFromWishlist(productId);
    } else {
      await addToWishlist(productId);
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
