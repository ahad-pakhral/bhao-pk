// Core data models matching the database schema from presentation

export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: Date;
  profilePicture?: string;
}

export interface Product {
  id: string;
  name: string;
  description?: string;
  category: string;
  brand?: string;
  image: string;
  specifications?: Record<string, string>;
  createdAt?: Date;
}

export interface Store {
  id: string;
  name: string;
  url: string;
  logoUrl?: string;
  isActive: boolean;
}

export interface StoreListing {
  id: string;
  productId: string;
  storeId: string;
  price: number;
  currency: string;
  url: string;
  inStock: boolean;
  lastUpdated: Date;
}

export interface PriceHistory {
  id: string;
  storeListingId: string;
  price: number;
  timestamp: Date;
}

export interface Alert {
  id: string;
  userId: string;
  productId: string;
  productName: string;
  productImage: string;
  currentPrice: number;
  targetPrice: number;
  store: string;
  isActive: boolean;
  createdAt: Date;
}

export interface WishlistItem {
  id: string;
  userId: string;
  productId: string;
  addedAt: Date;
}

// Extended models for UI display
export interface ProductWithListings extends Product {
  listings: (StoreListing & { store: Store })[];
  lowestPrice: number;
  highestPrice: number;
  averageRating?: number;
  reviewCount?: number;
  priceHistory?: PriceHistory[];
  badge?: string;
  specs?: string;
  rating?: number;
  store?: string;
  price?: string;
}

export interface ProductCardData {
  id: string;
  name: string;
  price: string;
  store: string;
  rating: number;
  reviewsCount?: number;
  image: string;
  badge?: string;
  specs?: string;
  category?: string;
  originalPrice?: string;
}

// Smart Alerts — cross-store tracking with alternatives

export interface SmartAlert {
  id: string;
  userId: string;
  productId: string;
  productName: string;
  productImage: string;
  category: string;
  originalPrice: number;
  targetPrice: number;
  alertType: 'every_change' | 'target_price';
  trackedStores: StoreSnapshot[];
  bestCurrentPrice: number;
  bestCurrentStore: string;
  alternatives: AlternativeProduct[];
  isActive: boolean;
  isTriggered: boolean;
  createdAt: Date;
  lastCheckedAt: Date;
}

export interface StoreSnapshot {
  store: string;
  price: number;
  url: string;
  inStock: boolean;
  lastUpdated: Date;
  priceChange?: number;
  priceChangePercent?: number;
}

export interface AlternativeProduct {
  productId: string;
  productName: string;
  productImage: string;
  price: number;
  store: string;
  url: string;
  rating: number;
  reviewsCount: number;
  reason: string;
  score: number;
}
