import { create } from 'zustand';
import { RetrievedChunk } from '@/services/reedy/retrieval/BookRetriever';

interface KulliyatSearchState {
  isOpen: boolean;
  query: string;
  results: RetrievedChunk[];
  isSearching: boolean;
  error: string | null;

  open: (query?: string) => void;
  close: () => void;
  setQuery: (q: string) => void;
  setResults: (res: RetrievedChunk[]) => void;
  setIsSearching: (searching: boolean) => void;
  setError: (error: string | null) => void;
}

export const useKulliyatSearchStore = create<KulliyatSearchState>((set) => ({
  isOpen: false,
  query: '',
  results: [],
  isSearching: false,
  error: null,

  open: (query) => set({ isOpen: true, query: query ?? '', error: null }),
  close: () => set({ isOpen: false, results: [], isSearching: false, error: null }),
  setQuery: (query) => set({ query }),
  setResults: (results) => set({ results }),
  setIsSearching: (isSearching) => set({ isSearching }),
  setError: (error) => set({ error }),
}));
