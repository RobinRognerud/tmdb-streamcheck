import { useState } from 'react';
import { useWatchlist } from '../contexts/WatchlistContext';
import './ImportLetterboxd.css';

interface ParsedRow {
  title: string;
  year?: string;
}

interface MatchResult {
  parsed: ParsedRow;
  status: 'pending' | 'found' | 'not_found' | 'error';
  movie?: {
    id: number;
    title: string;
    release_date?: string;
    poster_path?: string | null;
    vote_average?: number;
    overview?: string;
  };
  error?: string;
  selected?: boolean;
  exactMatch?: boolean;
  score?: number; // 0..1
  // Manual search fields
  manualQuery?: string;
  manualResults?: any[];
  manualLoading?: boolean;
  manualError?: string;
} 

// Minimal CSV parser that handles quoted fields
function parseLine(line: string): string[] {
  const cols: string[] = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        cur += '"';
        i++; // skip escaped quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === ',' && !inQuotes) {
      cols.push(cur);
      cur = '';
    } else {
      cur += ch;
    }
  }
  cols.push(cur);
  return cols;
}

function parseCSV(content: string): ParsedRow[] {
  const lines = content.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (lines.length === 0) return [];
  const headers = parseLine(lines[0]).map((h) => h.toLowerCase());
  const titleIndex = headers.findIndex((h) => h.includes('title') || h.includes('name'));
  const yearIndex = headers.findIndex((h) => h.includes('year'));

  const rows: ParsedRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = parseLine(lines[i]);
    const title = titleIndex >= 0 ? (cols[titleIndex] ?? '').trim() : (cols[0] ?? '').trim();
    const year = yearIndex >= 0 ? (cols[yearIndex] ?? '').trim() : undefined;
    if (title) rows.push({ title, year });
  }
  return rows;
}

export function ImportLetterboxd() {
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [matches, setMatches] = useState<MatchResult[]>([]);
  const [isMatching, setIsMatching] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const { addToWatchlist } = useWatchlist();

  const handleFile = (file: File | null) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result ?? '');
      const parsed = parseCSV(text);
      setRows(parsed);
      setMatches(parsed.map((p) => ({ parsed: p, status: 'pending' as const, selected: true })));
    };
    reader.readAsText(file, 'utf-8');
  };

  // Normalize title for comparison
  function normalizeTitle(s: string) {
    return s
      .toLowerCase()
      .replace(/\(.*?\)/g, '') // remove parentheses content
      .replace(/[^a-z0-9åøæ\s]/g, ' ') // keep letters/numbers and scandinavian letters
      .replace(/\s+/g, ' ')
      .trim();
  }


  const runMatching = async () => {
    setIsMatching(true);
    const results: MatchResult[] = [];

    for (const r of rows) {
      try {
        let data: any = null;
        // 1) Try year-restricted search if we have a year
        if (r.year) {
          const res = await fetch(`/api/movies/search?q=${encodeURIComponent(r.title)}&year=${encodeURIComponent(r.year)}`);
          if (res.ok) data = await res.json();
        }

        // 2) Fallback to normal search if no data or no results
        if (!data || !data.results || data.results.length === 0) {
          const res2 = await fetch(`/api/movies/search?q=${encodeURIComponent(r.title)}`);
          if (res2.ok) data = await res2.json();
        }

        if (!data || !data.results || data.results.length === 0) {
          results.push({ parsed: r, status: 'not_found' });
          continue;
        }

        // Choose only exact normalized title + exact year matches.
        // Use earliest release year (across countries) from TMDB when available to better match Letterboxd years.
        const candidates = data.results.slice(0, 8);

        // helper: cache earliest year per movie id to avoid repeated requests
        const earliestYearCache = new Map<number, number | null>();
        async function getEarliestYear(movieId: number): Promise<number | null> {
          if (earliestYearCache.has(movieId)) return earliestYearCache.get(movieId) as number | null;
          try {
            const res = await fetch(`/api/movies/${movieId}/release-dates`);
            if (!res.ok) {
              earliestYearCache.set(movieId, null);
              return null;
            }
            const data = await res.json();
            let minYear: number | null = null;
            (data.results || []).forEach((entry: any) => {
              (entry.release_dates || []).forEach((rd: any) => {
                if (rd.release_date) {
                  const y = new Date(rd.release_date).getFullYear();
                  if (!minYear || y < minYear) minYear = y;
                }
              });
            });
            earliestYearCache.set(movieId, minYear);
            return minYear;
          } catch {
            earliestYearCache.set(movieId, null);
            return null;
          }
        }

        if (r.year) {
          // First try normalized title equality and earliest release year match
          let foundExact: any = null;
          for (const m of candidates) {
            if (normalizeTitle(m.title || '') !== normalizeTitle(r.title)) continue;
            const eY = await getEarliestYear(m.id);
            if (eY && eY.toString() === r.year) {
              foundExact = m;
              break;
            }
          }

          if (foundExact) {
            results.push({ parsed: r, status: 'found', movie: foundExact, selected: true, exactMatch: true, score: 1 });
            continue;
          }
        }

        // Do not accept fuzzy matches — report as not found
        results.push({ parsed: r, status: 'not_found' });
      } catch (err) {
        results.push({ parsed: r, status: 'error', error: String(err) });
      }
    }

    setMatches(results);
    setIsMatching(false);
  };

  const importSelected = async () => {
    setIsImporting(true);
    let added = 0;
    for (const m of matches.filter((x) => x.selected)) {
      if (m.status === 'found' && m.movie) {
        addToWatchlist({
          id: m.movie.id,
          title: m.movie.title,
          release_date: m.movie.release_date,
          poster_path: m.movie.poster_path,
          vote_average: m.movie.vote_average,
          overview: m.movie.overview,
        });
        added++;
      }
    }
    setIsImporting(false);
    alert(`${added} filmer lagt til i watchlisten`);
  };

  return (
    <div className="import-container">
      <h1>Importer fra Letterboxd CSV</h1>
      <p>Last opp CSV-filen fra Letterboxd (watchlist), match filmene mot TMDB og legg dem til i din watchlist.</p>

      <div className="file-row">
        <input
          type="file"
          accept=".csv"
          onChange={(e) => handleFile(e.target.files ? e.target.files[0] : null)}
        />
        <button onClick={runMatching} disabled={rows.length === 0 || isMatching}>Match alle</button>
        <button onClick={importSelected} disabled={matches.filter((m) => m.selected && m.status === 'found').length === 0 || isImporting}>Importer valgte</button>
      </div>

      <div className="preview">
        {matches.length === 0 && rows.length === 0 && (
          <p>Ingen filer lastet opp ennå.</p>
        )}

        {rows.length > 0 && matches.length === 0 && (
          <div>
            <h3>Forhåndsvisning ({rows.length})</h3>
            <ul className="parsed-list">
              {rows.map((r, i) => (
                <li key={i}>{r.title} {r.year ? `(${r.year})` : ''}</li>
              ))}
            </ul>
          </div>
        )}

        {matches.length > 0 && (
          <div>
            <h3>Match-resultater</h3>
            <ul className="matches-list">
              {matches.map((m, i) => (
                <li key={i} className={`match-item ${m.status}`}>
                  <label>
                    <input type="checkbox" checked={!!m.selected} onChange={(e) => {
                      const copy = [...matches];
                      copy[i] = { ...copy[i], selected: e.target.checked };
                      setMatches(copy);
                    }} />
                    <strong>{m.parsed.title}</strong> {m.parsed.year ? `(${m.parsed.year})` : ''}
                  </label>
                  <div className="match-body">
                    {m.status === 'pending' && <em>Venter...</em>}
                                {m.status === 'not_found' && (
                      <div className="manual-search">
                        <div className="manual-input-row">
                          <input
                            type="text"
                            value={m.manualQuery ?? `${m.parsed.title}${m.parsed.year ? ' ' + m.parsed.year : ''}`}
                            onChange={(e) => {
                              const copy = [...matches];
                              copy[i] = { ...copy[i], manualQuery: e.target.value, manualError: undefined };
                              setMatches(copy);
                            }}
                            placeholder="Søk manuelt..."
                            className="manual-search-input"
                          />
                          <button
                            className="manual-search-button"
                            onClick={async () => {
                              const copy = [...matches];
                              copy[i] = { ...copy[i], manualLoading: true, manualError: undefined };
                              setMatches(copy);
                              try {
                                const q = encodeURIComponent(copy[i].manualQuery ?? copy[i].parsed.title);
                                const res = await fetch(`/api/movies/search?q=${q}`);
                                if (!res.ok) throw new Error('Søk feilet');
                                const data = await res.json();
                                copy[i] = { ...copy[i], manualLoading: false, manualResults: data.results ?? [] };
                                setMatches(copy);
                              } catch (err) {
                                copy[i] = { ...copy[i], manualLoading: false, manualError: String(err), manualResults: [] };
                                setMatches(copy);
                              }
                            }}
                          >
                            Søk
                          </button>
                        </div>
                        {m.manualLoading && <div className="manual-loading">Laster...</div>}
                        {m.manualError && <div className="error">{m.manualError}</div>}
                        {m.manualResults && m.manualResults.length > 0 && (
                          <ul className="manual-results">
                            {m.manualResults.slice(0, 8).map((r: any, idx: number) => (
                              <li key={idx} className="manual-result-item">
                                {r.poster_path && <img src={`https://image.tmdb.org/t/p/w92${r.poster_path}`} alt={r.title} />}
                                <div className="manual-result-info">
                                  <div className="manual-result-title">{r.title} {r.release_date ? `(${new Date(r.release_date).getFullYear()})` : ''}</div>
                                  <div className="manual-result-actions">
                                    <button
                                      onClick={() => {
                                        const copy = [...matches];
                                        copy[i] = { parsed: copy[i].parsed, status: 'found', movie: r, selected: true, exactMatch: false };
                                        setMatches(copy);
                                      }}
                                    >Velg</button>
                                  </div>
                                </div>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    )}
                    {m.status === 'error' && <span className="error">Feil: {m.error}</span>}
                    {m.status === 'found' && m.movie && (
                      <div className="found">
                        {m.movie.poster_path && (
                          <img src={`https://image.tmdb.org/t/p/w92${m.movie.poster_path}`} alt={m.movie.title} />
                        )}
                        <div className="found-info">
                          <div className="found-title">
                            {m.exactMatch && <span className="perfect-match">Perfekt treff</span>}
                            {m.movie.title} {m.movie.release_date ? `(${new Date(m.movie.release_date).getFullYear()})` : ''}
                            {!m.exactMatch && m.score !== undefined && (
                              <span className="match-score">{Math.round((m.score || 0) * 100)}%</span>
                            )}
                          </div>
                          <div className="found-vote">{m.movie.vote_average ? `⭐ ${m.movie.vote_average}` : ''}</div>
                        </div>
                      </div>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

export default ImportLetterboxd;
