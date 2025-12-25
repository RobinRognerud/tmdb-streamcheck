import './Oppdag.css';
import { useState, useEffect } from 'react';
import { useDebounce } from '../hooks/useDebounce';
import { useWatchlist } from '../contexts/WatchlistContext';

interface MovieSummary {
  id: number;
  title: string;
  release_date?: string;
  poster_path?: string | null;
  vote_average?: number;
}

export function Oppdag() {
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 400);
  const [results, setResults] = useState<MovieSummary[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selected, setSelected] = useState<MovieSummary | null>(null);
  const [suggestions, setSuggestions] = useState<MovieSummary[]>([]);
  const [error, setError] = useState<string | null>(null);

  const { addToWatchlist, isInWatchlist } = useWatchlist();

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
      .then((data) => {
        if (!cancelled) setResults(data.results || []);
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

  const handleSelect = (m: MovieSummary) => {
    setSelected(m);
    setResults([]);
    setSuggestions([]);
    setError(null);

    // fetch similar movies
    fetch(`/api/movies/${m.id}/similar`)
      .then((res) => {
        if (!res.ok) throw new Error('Kunne ikke hente lignende filmer');
        return res.json();
      })
      .then((data) => {
        setSuggestions(data.results || []);
      })
      .catch((e) => setError(e.message));
  };

  return (
    <div className="oppdag-page">
      <h2>Oppdag filmer</h2>
      <p>Søk etter en film, så får du forslag til lignende filmer.</p>

      <div className="oppdag-search">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Søk etter film..."
          className="oppdag-input"
        />
        {isLoading && <div className="loading">Laster...</div>}
        {results.length > 0 && (
          <ul className="oppdag-results">
            {results.map((r) => (
              <li key={r.id} className="oppdag-result" onClick={() => handleSelect(r)}>
                {r.poster_path && <img src={`https://image.tmdb.org/t/p/w92${r.poster_path}`} alt={r.title} />}
                <div className="result-info">
                  <div className="result-title">{r.title}</div>
                  {r.release_date && <small>{new Date(r.release_date).getFullYear()}</small>}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {error && <div className="error">{error}</div>}

      {selected && (
        <div className="oppdag-selected">
          <h3>Forslag basert på: {selected.title}</h3>
          {suggestions.length === 0 && <div className="no-suggestions">Ingen forslag funnet.</div>}
          <div className="suggestions-grid">
            {suggestions.map((s) => (
              <div key={s.id} className="suggestion-card">
                {s.poster_path ? (
                  <img src={`https://image.tmdb.org/t/p/w342${s.poster_path}`} alt={s.title} />
                ) : (
                  <div className="placeholder">Ingen bilde</div>
                )}
                <div className="suggestion-info">
                  <div className="suggestion-title">{s.title}</div>
                  {s.release_date && <div className="suggestion-year">{new Date(s.release_date).getFullYear()}</div>}
                  <div className="suggestion-actions">
                    {!isInWatchlist(s.id) ? (
                      <button onClick={() => addToWatchlist({ id: s.id, title: s.title, release_date: s.release_date, poster_path: s.poster_path, vote_average: s.vote_average, overview: undefined })} className="add-btn">+ Legg til</button>
                    ) : (
                      <span className="in-watchlist">✓ I watchlist</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default Oppdag;
