import { useState, useEffect } from 'react';
import { useDebounce } from '../hooks/useDebounce';

interface MovieSummary {
  id: number;
  title: string;
  release_date?: string;
  poster_path?: string | null;
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

interface SearchResponse {
  results: MovieSummary[];
  total_results?: number;
}

export function MovieSearch() {
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 400);

  const [results, setResults] = useState<MovieSummary[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedMovie, setSelectedMovie] = useState<MovieDetail | null>(null);
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
          setResults(data.results ?? []);
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
    setError(null);

    fetch(`/api/movies/${movie.id}`)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load movie');
        return res.json();
      })
      .then((data: MovieDetail) => setSelectedMovie(data))
      .catch((e) => setError(e.message));
  };

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '20px' }}>
      <div style={{ position: 'relative', marginBottom: '20px' }}>
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setSelectedMovie(null);
          }}
          placeholder="Search for a movie..."
          style={{
            width: '100%',
            padding: '12px',
            fontSize: '16px',
            border: '1px solid #ccc',
            borderRadius: '4px',
            boxSizing: 'border-box',
          }}
          autoComplete="off"
        />

        {isLoading && (
          <div
            style={{
              position: 'absolute',
              right: 12,
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#666',
            }}
          >
            Loading...
          </div>
        )}

        {results.length > 0 && (
          <ul
            style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              background: 'white',
              border: '1px solid #ccc',
              borderTop: 'none',
              listStyle: 'none',
              margin: 0,
              padding: 0,
              maxHeight: 400,
              overflowY: 'auto',
              zIndex: 1000,
              boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
            }}
          >
            {results.map((movie) => (
              <li
                key={movie.id}
                onClick={() => handleSelectMovie(movie)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#f0f0f0';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'white';
                }}
                style={{
                  padding: '12px',
                  cursor: 'pointer',
                  display: 'flex',
                  gap: '12px',
                  alignItems: 'center',
                  borderBottom: '1px solid #eee',
                }}
              >
                {movie.poster_path && (
                  <img
                    src={`https://image.tmdb.org/t/p/w92${movie.poster_path}`}
                    alt={movie.title}
                    style={{ width: 46, height: 69, objectFit: 'cover', borderRadius: '4px' }}
                  />
                )}
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>{movie.title}</div>
                  {movie.release_date && (
                    <small style={{ color: '#666' }}>
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
        <div style={{ color: 'red', marginBottom: '20px', padding: '10px', background: '#ffe6e6', borderRadius: '4px' }}>
          {error}
        </div>
      )}

      {selectedMovie && (
        <div
          style={{
            marginTop: '24px',
            padding: '20px',
            border: '1px solid #ddd',
            borderRadius: '8px',
            background: '#f9f9f9',
          }}
        >
          <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
            {selectedMovie.poster_path && (
              <img
                src={`https://image.tmdb.org/t/p/w342${selectedMovie.poster_path}`}
                alt={selectedMovie.title}
                style={{
                  width: 200,
                  height: 'auto',
                  borderRadius: '8px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                }}
              />
            )}
            <div style={{ flex: 1, minWidth: 300 }}>
              <h2 style={{ marginTop: 0, marginBottom: '10px' }}>{selectedMovie.title}</h2>
              {selectedMovie.release_date && (
                <p style={{ color: '#666', marginBottom: '10px' }}>
                  Release: {new Date(selectedMovie.release_date).toLocaleDateString()}
                </p>
              )}
              {selectedMovie.vote_average !== undefined && (
                <p style={{ marginBottom: '10px' }}>
                  <strong>Rating:</strong> {selectedMovie.vote_average.toFixed(1)}/10
                </p>
              )}
              {selectedMovie.runtime && (
                <p style={{ marginBottom: '10px' }}>
                  <strong>Runtime:</strong> {selectedMovie.runtime} minutes
                </p>
              )}
              {selectedMovie.genres && selectedMovie.genres.length > 0 && (
                <p style={{ marginBottom: '10px' }}>
                  <strong>Genres:</strong>{' '}
                  {selectedMovie.genres.map((g) => g.name).join(', ')}
                </p>
              )}
              {selectedMovie.overview && (
                <div style={{ marginTop: '15px' }}>
                  <h3 style={{ marginBottom: '8px' }}>Overview</h3>
                  <p style={{ lineHeight: '1.6' }}>{selectedMovie.overview}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}