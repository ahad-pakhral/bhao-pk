// Product service

import { apiClient } from './client';
import {
  SearchRequest,
  SearchResponse,
  ProductDetailResponse,
  PriceHistoryResponse,
} from '../../types/api';
import { ProductWithListings } from '../../types/models';

export const productService = {
  async search(params: SearchRequest): Promise<SearchResponse> {
    const queryParams = new URLSearchParams();
    queryParams.append('query', params.query || '');

    if (params.filters?.stores) {
      queryParams.append('stores', params.filters.stores.join(','));
    }
    if (params.filters?.minPrice !== undefined) {
      queryParams.append('minPrice', params.filters.minPrice.toString());
    }
    if (params.filters?.maxPrice !== undefined) {
      queryParams.append('maxPrice', params.filters.maxPrice.toString());
    }
    if (params.filters?.category) {
      queryParams.append('category', params.filters.category);
    }
    if (params.sort) {
      queryParams.append('sort', params.sort);
    }
    if (params.page) {
      queryParams.append('page', params.page.toString());
    }
    if (params.limit) {
      queryParams.append('limit', params.limit.toString());
    }

    const response = await apiClient.get<SearchResponse>(
      `/products/search?${queryParams.toString()}`
    );
    return response;
  },

  async getProductById(id: string): Promise<ProductDetailResponse> {
    const response = await apiClient.get<ProductDetailResponse>(`/products/${id}`);
    return response;
  },

  async getPriceHistory(
    productId: string,
    days: number = 30
  ): Promise<PriceHistoryResponse> {
    const response = await apiClient.get<PriceHistoryResponse>(
      `/products/${productId}/price-history?days=${days}`
    );
    return response;
  },

  async getTrending(): Promise<ProductWithListings[]> {
    const response = await apiClient.get<ProductWithListings[]>('/products/trending');
    return response;
  },

  async getRecentlyViewed(): Promise<ProductWithListings[]> {
    // This would normally fetch from backend based on user history
    // For now, return empty array
    return [];
  },
};
