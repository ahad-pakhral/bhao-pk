import { create } from 'zustand';
import { SearchProduct } from '../app/search/page';

interface SearchState {
    lastQuery: string;
    lastResults: SearchProduct[];
    lastFetchTime: number;
    setSearchResults: (query: string, results: SearchProduct[]) => void;
    clearResults: () => void;
}

export const useSearchStore = create<SearchState>((set) => ({
    lastQuery: '',
    lastResults: [],
    lastFetchTime: 0,
    setSearchResults: (query, results) =>
        set({ lastQuery: query, lastResults: results, lastFetchTime: Date.now() }),
    clearResults: () =>
        set({ lastQuery: '', lastResults: [], lastFetchTime: 0 }),
}));
