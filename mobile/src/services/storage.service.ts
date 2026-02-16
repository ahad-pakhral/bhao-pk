// Storage service for mobile using AsyncStorage

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert, WishlistItem } from '../types/models';

class StorageService {
  async setItem(key: string, value: any): Promise<void> {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(`Storage error (setItem ${key}):`, error);
      throw error;
    }
  }

  async getItem<T>(key: string): Promise<T | null> {
    try {
      const value = await AsyncStorage.getItem(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error(`Storage error (getItem ${key}):`, error);
      return null;
    }
  }

  async removeItem(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.error(`Storage error (removeItem ${key}):`, error);
      throw error;
    }
  }

  async clear(): Promise<void> {
    try {
      await AsyncStorage.clear();
    } catch (error) {
      console.error('Storage error (clear):', error);
      throw error;
    }
  }
}

export const storageService = new StorageService();

// Wishlist storage
export const wishlistStorage = {
  async getWishlist(): Promise<string[]> {
    return (await storageService.getItem<string[]>('@wishlist')) || [];
  },

  async addToWishlist(productId: string): Promise<void> {
    const wishlist = await this.getWishlist();
    if (!wishlist.includes(productId)) {
      await storageService.setItem('@wishlist', [...wishlist, productId]);
    }
  },

  async removeFromWishlist(productId: string): Promise<void> {
    const wishlist = await this.getWishlist();
    await storageService.setItem(
      '@wishlist',
      wishlist.filter(id => id !== productId)
    );
  },

  async isInWishlist(productId: string): Promise<boolean> {
    const wishlist = await this.getWishlist();
    return wishlist.includes(productId);
  },

  async clearWishlist(): Promise<void> {
    await storageService.setItem('@wishlist', []);
  },
};

// Alerts storage
export const alertsStorage = {
  async getAlerts(): Promise<Alert[]> {
    return (await storageService.getItem<Alert[]>('@alerts')) || [];
  },

  async addAlert(alert: Alert): Promise<void> {
    const alerts = await this.getAlerts();
    await storageService.setItem('@alerts', [...alerts, alert]);
  },

  async removeAlert(alertId: string): Promise<void> {
    const alerts = await this.getAlerts();
    await storageService.setItem(
      '@alerts',
      alerts.filter(a => a.id !== alertId)
    );
  },

  async updateAlert(alertId: string, updates: Partial<Alert>): Promise<void> {
    const alerts = await this.getAlerts();
    const updatedAlerts = alerts.map(alert =>
      alert.id === alertId ? { ...alert, ...updates } : alert
    );
    await storageService.setItem('@alerts', updatedAlerts);
  },

  async clearAlerts(): Promise<void> {
    await storageService.setItem('@alerts', []);
  },
};

// Search history storage
export const searchHistoryStorage = {
  async getHistory(): Promise<string[]> {
    return (await storageService.getItem<string[]>('@search_history')) || [];
  },

  async addToHistory(query: string): Promise<void> {
    const history = await this.getHistory();
    const filtered = history.filter(q => q !== query);
    const updated = [query, ...filtered].slice(0, 10); // Keep last 10
    await storageService.setItem('@search_history', updated);
  },

  async clearHistory(): Promise<void> {
    await storageService.setItem('@search_history', []);
  },
};
