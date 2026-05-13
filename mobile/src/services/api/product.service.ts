// Product service (backend API)

import { apiClient } from './client';
import {
  SearchRequest,
  SearchResponse,
} from '../../types/api';
import { ProductWithListings } from '../../types/models';

export const productService = {
  // Backend uses POST /api/search with { keyword }
  async search(params: SearchRequest): Promise<SearchResponse> {
    const keyword = (params as any)?.query || '';
    const response = await apiClient.post<SearchResponse>('/search', { keyword });
    return response;
  },

  // Backend uses GET /api/search/trending
  async getTrending(): Promise<{ results: any[]; source?: string }> {
    const response = await apiClient.get<{ results: any[]; source?: string }>('/search/trending');
    return response;
  },
};
