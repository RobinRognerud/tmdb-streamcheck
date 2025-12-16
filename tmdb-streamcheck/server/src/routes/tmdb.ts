import type { Request, Response } from 'express';
import { tmdbFetch } from '../services/tmdbClient';

export async function popularMovies(req: Request, res: Response) {
  try {
    const page = String(req.query.page ?? '1');
    const language = String(req.query.language ?? 'en-US');

    const data = await tmdbFetch('/movie/popular', { page, language });
    res.json(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(502).json({ error: message });
  }
}

export async function searchMovies(req: Request, res: Response) {
  try {
    const q = String(req.query.q ?? '');
    if (!q) {
      return res.status(400).json({ error: 'query param "q" is required' });
    }

    const page = Number(req.query.page ?? '1');
    const language = String(req.query.language ?? 'en-US');
    const region = String(req.query.region ?? 'NO');

    const data = await tmdbFetch('/search/movie', {
      query: q,
      page,
      include_adult: 'false',
      language,
      region
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


