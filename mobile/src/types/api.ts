// API request and response types

import { User, Product, ProductWithListings, Alert, WishlistItem, PriceHistory } from './models';

// Authentication
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: User;
  token: string;
}

export interface SignupRequest {
  name: string;
  email: string;
  password: string;
}

export interface SignupResponse {
  user: User;
  token: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ForgotPasswordResponse {
  message: string;
}

export interface ResetPasswordRequest {
  token: string;
  password: string;
}

export interface ResetPasswordResponse {
  message: string;
}

// Product Search
export interface SearchFilters {
  stores?: string[];
  minPrice?: number;
  maxPrice?: number;
  category?: string;
}

export type SortOption = 'relevance' | 'price_asc' | 'price_desc' | 'rating';

export interface SearchRequest {
  query: string;
  filters?: SearchFilters;
  sort?: SortOption;
  page?: number;
  limit?: number;
}

export interface SearchResponse {
  results: ProductWithListings[];
  total: number;
  page: number;
  totalPages: number;
  hasMore: boolean;
}

// Product Detail
export interface ProductDetailResponse extends ProductWithListings {
  reviews?: Review[];
}

export interface Review {
  id: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  createdAt: Date;
}

// Price History
export interface PriceHistoryRequest {
  productId: string;
  days?: number;
}

export interface PriceHistoryResponse {
  history: PriceHistory[];
  lowestPrice: number;
  highestPrice: number;
  averagePrice: number;
}

// Alerts
export interface CreateAlertRequest {
  productId: string;
  targetPrice: number;
}

export interface CreateAlertResponse extends Alert {}

export interface AlertsResponse {
  alerts: Alert[];
}

// Wishlist
export interface AddToWishlistRequest {
  productId: string;
}

export interface AddToWishlistResponse extends WishlistItem {}

export interface WishlistResponse {
  items: WishlistItem[];
}

// Generic API Response
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Error Response
export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, string>;
}
