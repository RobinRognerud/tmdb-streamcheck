import './Netflix.css';
import { useState, useEffect, useCallback } from 'react';
import { useWatchlist } from '../contexts/WatchlistContext';

interface MovieSummary {
    id: number;
    title: string;
    release_date?: string;
    poster_path?: string | null;
    vote_average?: number;
}

interface Genre {
    id: number;
    name: string;
}

export function Netflix() {
    const [movies, setMovies] = useState<MovieSummary[]>([]);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState<number | null>(null);
    const [totalResults, setTotalResults] = useState<number | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [genres, setGenres] = useState<Genre[]>([]);
    const [selectedGenres, setSelectedGenres] = useState<number[]>([]);

    const [selectedSort, setSelectedSort] = useState<string>('popularity.desc');

    const SORT_OPTIONS: { label: string; value: string }[] = [
        { label: 'Popularitet (høy → lav)', value: 'popularity.desc' },
        { label: 'Popularitet (lav → høy)', value: 'popularity.asc' },
        { label: 'Nyeste', value: 'release_date.desc' },
        { label: 'Eldste', value: 'release_date.asc' },
        { label: 'Beste vurdering', value: 'vote_average.desc' },
    ];

    const { addToWatchlist, isInWatchlist } = useWatchlist();

    const fetchPage = useCallback(async (p: number) => {
        try {
            if (p === 1) {
                setIsLoading(true);
                setError(null);
            } else {
                setLoadingMore(true);
            }

            const genreParam = selectedGenres.length ? `&genres=${selectedGenres.join(',')}` : '';
            const sortParam = selectedSort ? `&sort=${encodeURIComponent(selectedSort)}` : '';

            const res = await fetch(`/api/movies/netflix?region=NO&page=${p}${genreParam}${sortParam}`);
            if (!res.ok) throw new Error('Feil ved henting fra server');
            const data = await res.json();

            const results: MovieSummary[] = (data.results || []).map((r: any) => ({
                id: r.id,
                title: r.title,
                release_date: r.release_date,
                poster_path: r.poster_path,
                vote_average: r.vote_average,
            }));

            if (p === 1) setMovies(results);
            else setMovies((prev) => [...prev, ...results]);

            setPage(Number(data.page ?? p));
            setTotalPages(data.total_pages ?? null);
            setTotalResults(typeof data.total_results === 'number' ? data.total_results : null);
        } catch (err) {
            setError(err instanceof Error ? err.message : String(err));
        } finally {
            setIsLoading(false);
            setLoadingMore(false);
        }
    }, [selectedGenres, selectedSort]);

    useEffect(() => {
        void fetchPage(1);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        // when genres or sort change, reload from page 1
        void fetchPage(1);
    }, [selectedGenres, selectedSort, fetchPage]);

    useEffect(() => {
        // fetch available genres
        const loadGenres = async () => {
            try {
                const res = await fetch('/api/movies/genres');
                if (!res.ok) return;
                const data = await res.json();
                setGenres((data.genres || []) as Genre[]);
            } catch (_) {
                // ignore
            }
        };
        void loadGenres();
    }, []);

    const toggleGenre = (id: number) => {
        setSelectedGenres((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
    };

    const clearFilters = () => {
        setSelectedGenres([]);
    };

    return (
        <div className="netflix-page">
            <div className="netflix-header">
                <h2>Netflix - Strømmetips (NO)</h2>
                <p className="netflix-sub">Filtrer for Netflix-flatrate (kun Norge)</p>
            </div>

            <div className="netflix-controls-top">
                <div className="netflix-filters">
                    <strong>Filtrer på kategori:</strong>
                    <div className="genre-list">
                        {genres.map((g) => (
                            <button
                                key={g.id}
                                className={`genre-chip ${selectedGenres.includes(g.id) ? 'selected' : ''}`}
                                onClick={() => toggleGenre(g.id)}
                            >
                                {g.name}
                            </button>
                        ))}
                    </div>
                    <button className="clear-filters" onClick={clearFilters} disabled={selectedGenres.length === 0}>Rydd filter</button>
                </div>

                <div className="netflix-sort-and-counts">
                    <div className="netflix-sort">
                        <label htmlFor="sort-select"><strong>Sorter:</strong></label>
                        <select id="sort-select" className="sort-select" value={selectedSort} onChange={(e) => setSelectedSort(e.target.value)}>
                            {SORT_OPTIONS.map((o) => (
                                <option key={o.value} value={o.value}>{o.label}</option>
                            ))}
                        </select>
                    </div>

                    <div className="netflix-counts">
                        <div>Viser <strong>{movies.length}</strong> {movies.length === 1 ? 'film' : 'filmer'} {totalResults ? `av ${totalResults}` : ''}</div>
                    </div>
                </div>
            </div>

            {isLoading && <div className="loading">Laster...</div>}
            {error && <div className="error">{error}</div>}

            <div className="netflix-grid">
                {movies.map((m) => (
                    <div key={m.id} className="netflix-item">
                        {m.poster_path ? (
                            <img
                                src={`https://image.tmdb.org/t/p/w342${m.poster_path}`}
                                alt={m.title}
                                className="netflix-poster"
                            />
                        ) : (
                            <div className="netflix-poster-placeholder">Ingen bilde</div>
                        )}
                        <div className="netflix-info">
                            <div className="netflix-title">{m.title}</div>
                            {m.release_date && <div className="netflix-year">{new Date(m.release_date).getFullYear()}</div>}
                            <div className="netflix-actions">
                                {!isInWatchlist(m.id) ? (
                                    <button className="add-button" onClick={() => addToWatchlist({ id: m.id, title: m.title, release_date: m.release_date, poster_path: m.poster_path, vote_average: m.vote_average, overview: undefined })}>
                                        + Legg til i watchlist
                                    </button>
                                ) : (
                                    <span className="in-watchlist">✓ I watchlist</span>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {totalPages && page < totalPages && (
                <div className="netflix-controls">
                    <button className="load-more" onClick={() => void fetchPage(page + 1)} disabled={loadingMore}>
                        {loadingMore ? 'Laster...' : 'Vis mer'}
                    </button>
                </div>
            )}
        </div>
    );
}

export default Netflix;