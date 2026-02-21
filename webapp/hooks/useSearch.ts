// Search hook with filter and sort logic

import { useState, useEffect } from 'react';
import { ProductWithListings } from '../types/models';
import { SearchFilters, SortOption } from '../types/api';
import { rankByRelevance } from '../utils/ranking';

export const useSearch = (allProducts: ProductWithListings[]) => {
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState<SearchFilters>({});
  const [sort, setSort] = useState<SortOption>('relevance');
  const [results, setResults] = useState<ProductWithListings[]>(allProducts);

  useEffect(() => {
    filterAndSort();
  }, [query, filters, sort, allProducts]);

  const filterAndSort = () => {
    let filtered = [...allProducts];

    // Filter by search query
    if (query.trim()) {
      const lowerQuery = query.toLowerCase();
      filtered = filtered.filter(
        (product) =>
          product.name.toLowerCase().includes(lowerQuery) ||
          product.specs?.toLowerCase().includes(lowerQuery) ||
          product.category?.toLowerCase().includes(lowerQuery)
      );
    }

    // Filter by stores
    if (filters.stores && filters.stores.length > 0) {
      filtered = filtered.filter((product) =>
        filters.stores!.includes(product.store || '')
      );
    }

    // Filter by price range
    if (filters.minPrice !== undefined) {
      filtered = filtered.filter((product) => {
        const price = parseFloat(product.price?.replace(/[^0-9.]/g, '') || '0');
        return price >= filters.minPrice!;
      });
    }

    if (filters.maxPrice !== undefined) {
      filtered = filtered.filter((product) => {
        const price = parseFloat(product.price?.replace(/[^0-9.]/g, '') || '0');
        return price <= filters.maxPrice!;
      });
    }

    // Filter by category
    if (filters.category) {
      filtered = filtered.filter(
        (product) => product.category === filters.category
      );
    }

    // Sort results
    switch (sort) {
      case 'price_asc':
        filtered.sort((a, b) => {
          const priceA = parseFloat(a.price?.replace(/[^0-9.]/g, '') || '0');
          const priceB = parseFloat(b.price?.replace(/[^0-9.]/g, '') || '0');
          return priceA - priceB;
        });
        break;
      case 'price_desc':
        filtered.sort((a, b) => {
          const priceA = parseFloat(a.price?.replace(/[^0-9.]/g, '') || '0');
          const priceB = parseFloat(b.price?.replace(/[^0-9.]/g, '') || '0');
          return priceB - priceA;
        });
        break;
      case 'rating':
        filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        break;
      case 'relevance':
      default:
        filtered = rankByRelevance(filtered);
        break;
    }

    setResults(filtered);
  };

  const updateFilters = (newFilters: Partial<SearchFilters>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  };

  const clearFilters = () => {
    setFilters({});
  };

  return {
    query,
    setQuery,
    filters,
    updateFilters,
    clearFilters,
    sort,
    setSort,
    results,
    resultCount: results.length,
  };
};
