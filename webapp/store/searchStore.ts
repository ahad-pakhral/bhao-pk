import { create } from 'zustand';
import { SearchProduct } from '../app/search/page';

interface SearchState {
    lastQuery: string;
    lastResults: SearchProduct[];
    lastInterpretedQuery: string | null;
    lastFetchTime: number;
    recentlyViewed: SearchProduct[];
    trendingProducts: SearchProduct[];
    setSearchResults: (query: string, results: SearchProduct[], interpretedQuery?: string | null) => void;
    setTrendingProducts: (products: SearchProduct[]) => void;
    clearResults: () => void;
    getProductById: (id: string) => SearchProduct | undefined;
    addRecentlyViewed: (product: SearchProduct) => void;
}

export const useSearchStore = create<SearchState>((set, get) => ({
    lastQuery: '',
    lastResults: [],
    lastInterpretedQuery: null,
    lastFetchTime: 0,
    recentlyViewed: [],
    trendingProducts: [],
    setSearchResults: (query, results, interpretedQuery = null) =>
        set({ lastQuery: query, lastResults: results, lastInterpretedQuery: interpretedQuery, lastFetchTime: Date.now() }),
    setTrendingProducts: (products) =>
        set({ trendingProducts: products }),
    clearResults: () =>
        set({ lastQuery: '', lastResults: [], lastInterpretedQuery: null, lastFetchTime: 0 }),
    getProductById: (id) => {
        const decoded = decodeURIComponent(id);
        // Search in lastResults (search page products)
        const fromResults = get().lastResults.find(p => String(p.id) === String(id));
        if (fromResults) return fromResults;
        // Search in recentlyViewed
        const fromRecent = get().recentlyViewed.find(p => String(p.id) === String(id) || p.url === decoded);
        if (fromRecent) return fromRecent;
        // Search in trending by URL match
        const fromTrending = get().trendingProducts.find(p => p.url === decoded);
        if (fromTrending) return fromTrending;
        return undefined;
    },
    addRecentlyViewed: (product) => {
        const current = get().recentlyViewed;
        const filtered = current.filter(p => String(p.id) !== String(product.id));
        set({ recentlyViewed: [product, ...filtered].slice(0, 20) });
    },
}));
