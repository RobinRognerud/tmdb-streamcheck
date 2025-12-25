import type { Request, Response } from 'express';
import { tmdbFetch } from '../services/tmdbClient';

export async function searchMovies(req: Request, res: Response) {
  try {
    const q = String(req.query.q ?? '');
    if (!q) {
      return res.status(400).json({ error: 'query param "q" is required' });
    }

    const page = Number(req.query.page ?? '1');
    const language = String(req.query.language ?? 'en-US');
    const region = String(req.query.region ?? 'NO');
    // Optional year filter from client (e.g. Letterboxd CSV import)
    const year = req.query.year ? String(req.query.year) : undefined;

    const data = await tmdbFetch('/search/movie', {
      query: q,
      page,
      include_adult: 'false',
      language,
      region,
      ...(year ? { year } : {}),
    });

    res.json(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(502).json({ error: message });
  }
}

export async function getMovieDetails(req: Request, res: Response) {
  try {
    const movieId = String(req.params.id ?? '');
    if (!movieId) {
      return res.status(400).json({ error: 'movie ID is required' });
    }

    const language = String(req.query.language ?? 'en-US');

    const data = await tmdbFetch(`/movie/${movieId}`, { language });
    res.json(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(502).json({ error: message });
  }
}

export async function getMovieWatchProviders(req: Request, res: Response) {
  try {
    const movieId = String(req.params.id ?? '');
    if (!movieId) {
      return res.status(400).json({ error: 'movie ID is required' });
    }

    const language = String(req.query.language ?? 'en-US');
    const watchRegion = String(req.query.watch_region ?? 'NO');

    const data = await tmdbFetch(`/movie/${movieId}/watch/providers`, {
      language,
      watch_region: watchRegion
    });
    res.json(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(502).json({ error: message });
  }
}

export async function getMovieReleaseDates(req: Request, res: Response) {
  try {
    const movieId = String(req.params.id ?? '');
    if (!movieId) {
      return res.status(400).json({ error: 'movie ID is required' });
    }

    const data = await tmdbFetch(`/movie/${movieId}/release_dates`);
    res.json(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(502).json({ error: message });
  }
}

// --- Netflix discover endpoint ---
let netflixProviderId: number | null = null;
let providerFetchedAt = 0;
const PROVIDER_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

async function resolveNetflixProviderId(): Promise<number | null> {
  if (netflixProviderId && (Date.now() - providerFetchedAt < PROVIDER_TTL_MS)) {
    return netflixProviderId;
  }

  const data = await tmdbFetch('/watch/providers/movie');
  const results = (data as { results?: any[] }).results || [];
  const entry = results.find((p: any) => p.provider_name && String(p.provider_name).toLowerCase() === 'netflix');
  netflixProviderId = entry ? Number(entry.provider_id) : null;
  providerFetchedAt = Date.now();
  return netflixProviderId;
}

// Simple in-memory cache for discover results
const discoverCache = new Map<string, { ts: number; data: unknown }>();
const DISCOVER_TTL_MS = 10 * 60 * 1000; // 10 minutes

export async function getNetflixMovies(req: Request, res: Response) {
  try {
    const region = String(req.query.region ?? 'NO');
    const page = Number(req.query.page ?? '1');

    const providerId = await resolveNetflixProviderId();
    if (!providerId) return res.status(502).json({ error: 'Could not resolve Netflix provider id' });

    const genres = req.query.genres ? String(req.query.genres) : undefined;
    // optional sort param (validated below)
    const requestedSort = String(req.query.sort ?? 'popularity.desc');

    // validate allowed sorts to avoid passing arbitrary values to TMDB
    const ALLOWED_SORTS = new Set([
      'popularity.desc', 'popularity.asc',
      'release_date.desc', 'release_date.asc',
      'primary_release_date.desc', 'primary_release_date.asc',
      'vote_average.desc', 'vote_average.asc'
    ]);
    const sortBy = ALLOWED_SORTS.has(requestedSort) ? requestedSort : 'popularity.desc';

    // include genres and sort in cache key so different filters are cached separately
    const cacheKey = `${providerId}:${region}:${page}:${genres ?? ''}:${sortBy}`;
    const cached = discoverCache.get(cacheKey);
    if (cached && Date.now() - cached.ts < DISCOVER_TTL_MS) {
      return res.json(cached.data);
    }

    const data = await tmdbFetch('/discover/movie', {
      with_watch_providers: providerId,
      watch_region: region,
      with_watch_monetization_types: 'flatrate',
      sort_by: sortBy,
      page,
      language: 'en-US',
      ...(genres ? { with_genres: genres } : {})
    });

    discoverCache.set(cacheKey, { ts: Date.now(), data });

    res.json(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(502).json({ error: message });
  }
}

export async function getMovieGenres(req: Request, res: Response) {
  try {
    const language = String(req.query.language ?? 'en-US');
    const data = await tmdbFetch('/genre/movie/list', { language });
    res.json(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(502).json({ error: message });
  }
}

export async function getSimilarMovies(req: Request, res: Response) {
  try {
    const movieId = String(req.params.id ?? '');
    if (!movieId) {
      return res.status(400).json({ error: 'movie ID is required' });
    }

    const page = Number(req.query.page ?? '1');
    const language = String(req.query.language ?? 'en-US');

    const data = await tmdbFetch(`/movie/${movieId}/similar`, {
      page,
      language,
    });

    res.json(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(502).json({ error: message });
  }
}