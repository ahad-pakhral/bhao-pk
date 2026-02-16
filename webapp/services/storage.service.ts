// Storage service for webapp using localStorage

import { Alert } from '../types/models';

class StorageService {
  setItem(key: string, value: any): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(`Storage error (setItem ${key}):`, error);
      throw error;
    }
  }

  getItem<T>(key: string): T | null {
    try {
      const value = localStorage.getItem(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error(`Storage error (getItem ${key}):`, error);
      return null;
    }
  }

  removeItem(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error(`Storage error (removeItem ${key}):`, error);
      throw error;
    }
  }

  clear(): void {
    try {
      localStorage.clear();
    } catch (error) {
      console.error('Storage error (clear):', error);
      throw error;
    }
  }
}

export const storageService = new StorageService();

// Wishlist storage
export const wishlistStorage = {
  getWishlist(): string[] {
    return storageService.getItem<string[]>('@wishlist') || [];
  },

  addToWishlist(productId: string): void {
    const wishlist = this.getWishlist();
    if (!wishlist.includes(productId)) {
      storageService.setItem('@wishlist', [...wishlist, productId]);
    }
  },

  removeFromWishlist(productId: string): void {
    const wishlist = this.getWishlist();
    storageService.setItem(
      '@wishlist',
      wishlist.filter((id) => id !== productId)
    );
  },

  isInWishlist(productId: string): boolean {
    const wishlist = this.getWishlist();
    return wishlist.includes(productId);
  },

  clearWishlist(): void {
    storageService.setItem('@wishlist', []);
  },
};

// Alerts storage
export const alertsStorage = {
  getAlerts(): Alert[] {
    return storageService.getItem<Alert[]>('@alerts') || [];
  },

  addAlert(alert: Alert): void {
    const alerts = this.getAlerts();
    storageService.setItem('@alerts', [...alerts, alert]);
  },

  removeAlert(alertId: string): void {
    const alerts = this.getAlerts();
    storageService.setItem(
      '@alerts',
      alerts.filter((a) => a.id !== alertId)
    );
  },

  updateAlert(alertId: string, updates: Partial<Alert>): void {
    const alerts = this.getAlerts();
    const updatedAlerts = alerts.map((alert) =>
      alert.id === alertId ? { ...alert, ...updates } : alert
    );
    storageService.setItem('@alerts', updatedAlerts);
  },

  clearAlerts(): void {
    storageService.setItem('@alerts', []);
  },
};

// Search history storage
export const searchHistoryStorage = {
  getHistory(): string[] {
    return storageService.getItem<string[]>('@search_history') || [];
  },

  addToHistory(query: string): void {
    const history = this.getHistory();
    const filtered = history.filter((q) => q !== query);
    const updated = [query, ...filtered].slice(0, 10); // Keep last 10
    storageService.setItem('@search_history', updated);
  },

  clearHistory(): void {
    storageService.setItem('@search_history', []);
  },
};
