// Wishlist service

import { apiClient } from './client';
import {
  WishlistResponse,
  AddToWishlistRequest,
  AddToWishlistResponse,
} from '../../types/api';

export const wishlistService = {
  async getWishlist(): Promise<WishlistResponse> {
    const response = await apiClient.get<WishlistResponse>('/wishlist');
    return response;
  },

  async addToWishlist(productId: string): Promise<AddToWishlistResponse> {
    const response = await apiClient.post<AddToWishlistResponse>('/wishlist', {
      productId,
    } as AddToWishlistRequest);
    return response;
  },

  async removeFromWishlist(productId: string): Promise<void> {
    await apiClient.delete(`/wishlist/${productId}`);
  },

  async isInWishlist(productId: string): Promise<boolean> {
    try {
      const wishlist = await this.getWishlist();
      return wishlist.items.some(item => item.productId === productId);
    } catch {
      return false;
    }
  },
};
