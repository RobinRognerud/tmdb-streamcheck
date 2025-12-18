import { useState, useEffect } from 'react';
import { useWatchlist } from '../contexts/WatchlistContext';
import type { WatchProviders } from '../contexts/WatchlistContext';
import './Watchlist.css';
import '../pages/MovieSearch.css';

interface WatchProvidersResponse {
  results: {
    [countryCode: string]: WatchProviders;
  };
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

export function Watchlist() {
  const { watchlist, removeFromWatchlist, isInWatchlist } = useWatchlist();
  const [providersMap, setProvidersMap] = useState<Map<number, WatchProviders | null>>(new Map());
  const [selectedMovie, setSelectedMovie] = useState<MovieDetail | null>(null);
  const [watchProviders, setWatchProviders] = useState<WatchProviders | null>(null);
  const [watchProvidersLoaded, setWatchProvidersLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Handle ESC key to close modal
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && selectedMovie) {
        setSelectedMovie(null);
      }
    };

    if (selectedMovie) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [selectedMovie]);

  // Fetch watch providers for all movies
  useEffect(() => {
    const fetchProviders = async () => {
      const newProvidersMap = new Map<number, WatchProviders | null>();
      
      await Promise.all(
        watchlist.map(async (movie) => {
          try {
            const res = await fetch(`/api/movies/${movie.id}/watch-providers?watch_region=NO`);
            if (res.ok) {
              const data: WatchProvidersResponse = await res.json();
              const noProviders = data.results?.NO;
              newProvidersMap.set(movie.id, noProviders || null);
            } else {
              newProvidersMap.set(movie.id, null);
            }
          } catch {
            newProvidersMap.set(movie.id, null);
          }
        })
      );
      
      setProvidersMap(newProvidersMap);
    };

    if (watchlist.length > 0) {
      fetchProviders();
    }
  }, [watchlist]);

  const handleSelectMovie = (movieId: number) => {
    setSelectedMovie(null);
    setWatchProviders(null);
    setWatchProvidersLoaded(false);
    setError(null);

    // Fetch movie details
    fetch(`/api/movies/${movieId}`)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load movie');
        return res.json();
      })
      .then((data: MovieDetail) => {
        setSelectedMovie(data);
        // Fetch watch providers (non-blocking)
        setWatchProvidersLoaded(false);
        fetch(`/api/movies/${movieId}/watch-providers?watch_region=NO`)
          .then((res) => {
            if (!res.ok) {
              return null;
            }
            return res.json();
          })
          .then((data: WatchProvidersResponse | null) => {
            if (data) {
              const noProviders = data.results?.NO;
              setWatchProviders(noProviders || null);
            } else {
              setWatchProviders(null);
            }
            setWatchProvidersLoaded(true);
          })
          .catch(() => {
            setWatchProviders(null);
            setWatchProvidersLoaded(true);
          });
      })
      .catch((e) => {
        setError(e.message);
      });
  };

  if (watchlist.length === 0) {
    return (
      <div className="watchlist-container">
        <h1 className="watchlist-title">Min Watchlist</h1>
        <div className="watchlist-empty">
          <p>Din watchlist er tom.</p>
          <p>Legg til filmer fra søkesiden for å se dem her.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="watchlist-container">
      <h1 className="watchlist-title">Min Watchlist ({watchlist.length})</h1>
      <div className="watchlist-grid">
        {watchlist.map((movie) => (
          <div
            key={movie.id}
            className="watchlist-item"
            onClick={() => handleSelectMovie(movie.id)}
          >
            <button
              onClick={(e) => {
                e.stopPropagation();
                removeFromWatchlist(movie.id);
              }}
              className="watchlist-remove-icon"
              aria-label="Fjern fra watchlist"
            >
              ×
            </button>
            {movie.poster_path && (
              <img
                src={`https://image.tmdb.org/t/p/w342${movie.poster_path}`}
                alt={movie.title}
                className="watchlist-poster"
              />
            )}
            <div className="watchlist-item-info">
              <h3 className="watchlist-item-title">{movie.title}</h3>
              {movie.release_date && (
                <p className="watchlist-item-year">
                  {new Date(movie.release_date).getFullYear()}
                </p>
              )}
              {movie.vote_average !== undefined && (
                <p className="watchlist-item-rating">
                  ⭐ {movie.vote_average.toFixed(1)}/10
                </p>
              )}
              {providersMap.get(movie.id)?.flatrate && providersMap.get(movie.id)!.flatrate!.length > 0 && (
                <div className="watchlist-providers">
                  {providersMap.get(movie.id)!.flatrate!.slice(0, 3).map((provider) => (
                    <img
                      key={provider.provider_id}
                      src={`https://image.tmdb.org/t/p/w45${provider.logo_path}`}
                      alt={provider.provider_name}
                      className="watchlist-provider-logo"
                      title={provider.provider_name}
                    />
                  ))}
                  {providersMap.get(movie.id)!.flatrate!.length > 3 && (
                    <span className="watchlist-provider-more">
                      +{providersMap.get(movie.id)!.flatrate!.length - 3}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {selectedMovie && (
        <div
          className="watchlist-modal-overlay"
          onClick={() => setSelectedMovie(null)}
        >
          <div
            className="watchlist-modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="watchlist-modal-close"
              onClick={() => setSelectedMovie(null)}
              aria-label="Lukk modal"
            >
              ×
            </button>
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
                  <div className="movie-detail-header">
                    <h2 className="movie-detail-title">{selectedMovie.title}</h2>
                    {isInWatchlist(selectedMovie.id) && (
                      <span className="in-watchlist-badge">✓ I watchlist</span>
                    )}
                  </div>
                  {selectedMovie.release_date && (
                    <p className="movie-detail-release">
                      Utgivelsesdato: {new Date(selectedMovie.release_date).toLocaleDateString()}
                    </p>
                  )}
                  {selectedMovie.vote_average !== undefined && (
                    <p className="movie-detail-field">
                      <strong>Vurdering:</strong> {selectedMovie.vote_average.toFixed(1)}/10
                    </p>
                  )}
                  {selectedMovie.runtime && (
                    <p className="movie-detail-field">
                      <strong>Spilletid:</strong> {selectedMovie.runtime} minutter
                    </p>
                  )}
                  {selectedMovie.genres && selectedMovie.genres.length > 0 && (
                    <p className="movie-detail-field">
                      <strong>Genre:</strong>{' '}
                      {selectedMovie.genres.map((g) => g.name).join(', ')}
                    </p>
                  )}
                  {watchProvidersLoaded && (
                    <div className="movie-detail-watch-providers">
                      {watchProviders && watchProviders.flatrate && watchProviders.flatrate.length > 0 ? (
                        <div className="watch-providers-section">
                          <strong>Kan ses på:</strong>
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
                      ) : (
                        <div className="watch-providers-section">
                          <p className="no-streaming-message">
                            Ingen streaming-tjenester tilgjengelig for denne filmen i Norge.
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                  {selectedMovie.overview && (
                    <div className="movie-detail-overview-container">
                      <h3 className="movie-detail-overview-title">Sammendrag</h3>
                      <p className="movie-detail-overview-text">{selectedMovie.overview}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

