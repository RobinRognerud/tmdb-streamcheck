import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';

const STORAGE_KEY = 'tmdb-watchlist';

export interface WatchProvider {
  display_priority: number;
  logo_path: string;
  provider_name: string;
  provider_id: number;
}

export interface WatchProviders {
  flatrate?: WatchProvider[];
  rent?: WatchProvider[];
  buy?: WatchProvider[];
}

export interface WatchlistMovie {
  id: number;
  title: string;
  release_date?: string;
  poster_path?: string | null;
  vote_average?: number;
  overview?: string;
  watchProviders?: WatchProviders | null;
  addedAt: Date;
}

// Interface for serialized version (Date as string)
interface SerializedWatchlistMovie extends Omit<WatchlistMovie, 'addedAt'> {
  addedAt: string;
}

interface WatchlistContextType {
  watchlist: WatchlistMovie[];
  addToWatchlist: (movie: Omit<WatchlistMovie, 'addedAt'>) => void;
  removeFromWatchlist: (movieId: number) => void;
  isInWatchlist: (movieId: number) => boolean;
}

const WatchlistContext = createContext<WatchlistContextType | undefined>(undefined);

export function WatchlistProvider({ children }: { children: ReactNode }) {
  // Load from localStorage on mount
  const [watchlist, setWatchlist] = useState<WatchlistMovie[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed: SerializedWatchlistMovie[] = JSON.parse(saved);
        // Convert addedAt strings back to Date objects
        return parsed.map((movie) => ({
          ...movie,
          addedAt: new Date(movie.addedAt),
        }));
      }
    } catch (error) {
      console.error('Failed to load watchlist from localStorage:', error);
    }
    return [];
  });

  // Save to localStorage whenever watchlist changes
  useEffect(() => {
    try {
      // Convert Date objects to strings for serialization
      const serialized: SerializedWatchlistMovie[] = watchlist.map((movie) => ({
        ...movie,
        addedAt: movie.addedAt.toISOString(),
      }));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(serialized));
    } catch (error) {
      console.error('Failed to save watchlist to localStorage:', error);
    }
  }, [watchlist]);

  const addToWatchlist = (movie: Omit<WatchlistMovie, 'addedAt'>) => {
    setWatchlist((prev) => {
      // Sjekk om filmen allerede er i listen
      if (prev.some((m) => m.id === movie.id)) {
        return prev;
      }
      return [...prev, { ...movie, addedAt: new Date() }];
    });
  };

  const removeFromWatchlist = (movieId: number) => {
    setWatchlist((prev) => prev.filter((m) => m.id !== movieId));
  };

  const isInWatchlist = (movieId: number) => {
    return watchlist.some((m) => m.id === movieId);
  };

  return (
    <WatchlistContext.Provider
      value={{
        watchlist,
        addToWatchlist,
        removeFromWatchlist,
        isInWatchlist,
      }}
    >
      {children}
    </WatchlistContext.Provider>
  );
}

export function useWatchlist() {
  const context = useContext(WatchlistContext);
  if (context === undefined) {
    throw new Error('useWatchlist must be used within a WatchlistProvider');
  }
  return context;
}

