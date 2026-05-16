import {create} from 'zustand';
import {persist, createJSONStorage} from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const useSearchStore = create(
  persist(
    (set, get) => ({
      recentSearches: [],
      searchResults: [],
      isSearching: false,

      // ── Recent Searches ───────────────────────────────
      addRecentSearch: query => {
        const trimmed = query.trim();
        if (!trimmed) return;
        set(state => ({
          recentSearches: [
            trimmed,
            ...state.recentSearches
              .filter(q => q !== trimmed)
              .slice(0, 9),      // max 10 items
          ],
        }));
      },

      removeRecentSearch: query =>
        set(state => ({
          recentSearches: state.recentSearches.filter(q => q !== query),
        })),

      clearRecentSearches: () => set({recentSearches: []}),

      // ── Results ───────────────────────────────────────
      setSearchResults: results => set({searchResults: results}),
      setSearching: isSearching => set({isSearching}),
      clearResults: () => set({searchResults: []}),
    }),
    {
      name: 'foodapp-search',
      storage: createJSONStorage(() => AsyncStorage),
      // Only persist recent searches
      partialize: state => ({recentSearches: state.recentSearches}),
    },
  ),
);
