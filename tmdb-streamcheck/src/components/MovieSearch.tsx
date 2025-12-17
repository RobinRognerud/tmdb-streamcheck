import { useState, useEffect } from 'react';
import { useDebounce } from '../hooks/useDebounce';
import './MovieSearch.css';

interface MovieSummary {
  id: number;
  title: string;
  release_date?: string;
  poster_path?: string | null;
  popularity?: number;
  vote_average?: number;
}

interface MovieDetail {
  id: number;
  title: string;
  overview: string;
  release_date?: string;
  poster_path?: string | null;
  vote_average?: number;
  runtime?: number;
  genres?: Array<{ id: number; name: string }>;
}

interface WatchProvider {
  display_priority: number;
  logo_path: string;
  provider_name: string;
  provider_id: number;
}

interface WatchProviders {
  flatrate?: WatchProvider[];
  rent?: WatchProvider[];
  buy?: WatchProvider[];
}

interface WatchProvidersResponse {
  results: {
    [countryCode: string]: WatchProviders;
  };
}

interface SearchResponse {
  results: MovieSummary[];
  total_results?: number;
}

/**
 * Sorterer filmer for å gi beste brukeropplevelse:
 * 1. Vurdering (høyest først) - høyest vurderte filmer først
 * 2. Popularitet (høyest først) - mest relevante populære filmer innen samme vurdering
 * 3. Utgivelsesår (nyeste først) - nyere filmer først som tie-breaker
 */
function sortMovies(movies: MovieSummary[]): MovieSummary[] {
  return [...movies].sort((a, b) => {
    // Sorter først på vurdering (høyest først)
    const ratingA = a.vote_average ?? 0;
    const ratingB = b.vote_average ?? 0;
    if (ratingB !== ratingA) {
      return ratingB - ratingA;
    }

    // Så på popularitet (høyest først)
    const popularityA = a.popularity ?? 0;
    const popularityB = b.popularity ?? 0;
    if (popularityB !== popularityA) {
      return popularityB - popularityA;
    }

    // Til slutt på utgivelsesår (nyeste først)
    const yearA = a.release_date ? new Date(a.release_date).getFullYear() : 0;
    const yearB = b.release_date ? new Date(b.release_date).getFullYear() : 0;
    return yearB - yearA;
  });
}

export function MovieSearch() {
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 400);

  const [results, setResults] = useState<MovieSummary[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedMovie, setSelectedMovie] = useState<MovieDetail | null>(null);
  const [watchProviders, setWatchProviders] = useState<WatchProviders | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Fetch search results
  useEffect(() => {
    if (!debouncedQuery.trim()) {
      setResults([]);
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    setError(null);

    fetch(`/api/movies/search?q=${encodeURIComponent(debouncedQuery)}`)
      .then((res) => {
        if (!res.ok) throw new Error('Search failed');
        return res.json();
      })
      .then((data: SearchResponse) => {
        if (!cancelled) {
          const sortedResults = sortMovies(data.results ?? []);
          setResults(sortedResults);
        }
      })
      .catch((e) => {
        if (!cancelled) {
          setError(e.message);
          setResults([]);
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [debouncedQuery]);

  const handleSelectMovie = (movie: MovieSummary) => {
    setQuery(movie.title);
    setResults([]);
    setSelectedMovie(null);
    setWatchProviders(null);
    setError(null);

    // Fetch movie details
    fetch(`/api/movies/${movie.id}`)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load movie');
        return res.json();
      })
      .then((data: MovieDetail) => {
        setSelectedMovie(data);
        // Fetch watch providers (non-blocking)
        fetch(`/api/movies/${movie.id}/watch-providers?watch_region=NO`)
          .then((res) => {
            if (!res.ok) {
              // Watch providers not available is not a critical error
              return null;
            }
            return res.json();
          })
          .then((data: WatchProvidersResponse | null) => {
            if (data) {
              // Get Norwegian providers (NO)
              const noProviders = data.results?.NO;
              setWatchProviders(noProviders || null);
            } else {
              setWatchProviders(null);
            }
          })
          .catch(() => {
            // Silently fail for watch providers - not critical
            setWatchProviders(null);
          });
      })
      .catch((e) => {
        setError(e.message);
      });
  };

  return (
    <div className="movie-search-container">
      <div className="search-container">
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
          }}
          placeholder="Search for a movie..."
          className="search-input"
          autoComplete="off"
        />

        {isLoading && (
          <div className="loading-indicator">
            Loading...
          </div>
        )}

        {results.length > 0 && (!selectedMovie || query !== selectedMovie.title) && (
          <ul className="results-list">
            {results.map((movie) => (
              <li
                key={movie.id}
                onClick={() => handleSelectMovie(movie)}
                className="result-item"
              >
                {movie.poster_path && (
                  <img
                    src={`https://image.tmdb.org/t/p/w92${movie.poster_path}`}
                    alt={movie.title}
                    className="result-poster"
                  />
                )}
                <div className="result-info">
                  <div className="result-title">{movie.title}</div>
                  {movie.release_date && (
                    <small className="result-year">
                      {new Date(movie.release_date).getFullYear()}
                    </small>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {selectedMovie && (
        <div className="movie-detail-container">
          <div className="movie-detail-flex">
            {selectedMovie.poster_path && (
              <img
                src={`https://image.tmdb.org/t/p/w342${selectedMovie.poster_path}`}
                alt={selectedMovie.title}
                className="movie-detail-poster"
              />
            )}
            <div className="movie-detail-info">
              <h2 className="movie-detail-title">{selectedMovie.title}</h2>
              {selectedMovie.release_date && (
                <p className="movie-detail-release">
                  Release: {new Date(selectedMovie.release_date).toLocaleDateString()}
                </p>
              )}
              {selectedMovie.vote_average !== undefined && (
                <p className="movie-detail-field">
                  <strong>Rating:</strong> {selectedMovie.vote_average.toFixed(1)}/10
                </p>
              )}
              {selectedMovie.runtime && (
                <p className="movie-detail-field">
                  <strong>Runtime:</strong> {selectedMovie.runtime} minutes
                </p>
              )}
              {selectedMovie.genres && selectedMovie.genres.length > 0 && (
                <p className="movie-detail-field">
                  <strong>Genres:</strong>{' '}
                  {selectedMovie.genres.map((g) => g.name).join(', ')}
                </p>
              )}
              {watchProviders && watchProviders.flatrate && watchProviders.flatrate.length > 0 && (
                <div className="movie-detail-watch-providers">
                  <div className="watch-providers-section">
                    <strong>Stream på:</strong>
                    <div className="watch-providers-list">
                      {watchProviders.flatrate.map((provider) => (
                        <div key={provider.provider_id} className="watch-provider-item">
                          {provider.logo_path && (
                            <img
                              src={`https://image.tmdb.org/t/p/w92${provider.logo_path}`}
                              alt={provider.provider_name}
                              className="watch-provider-logo"
                            />
                          )}
                          <span className="watch-provider-name">{provider.provider_name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
              {selectedMovie.overview && (
                <div className="movie-detail-overview-container">
                  <h3 className="movie-detail-overview-title">Overview</h3>
                  <p className="movie-detail-overview-text">{selectedMovie.overview}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}