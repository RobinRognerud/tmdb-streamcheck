import dotenv from 'dotenv';

dotenv.config();

const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

export const TMDB_API_KEY = process.env.TMDB_API_KEY;

if (!TMDB_API_KEY) {
  // Fail fast in development; in production you might want a softer behaviour
  console.warn('TMDB_API_KEY is not set. TMDB requests will fail.');
}

export interface TmdbQueryParams {
  [key: string]: string | number | boolean | undefined;
}

export async function tmdbFetch<T = unknown>(
  path: string,
  params: TmdbQueryParams = {}
): Promise<T> {
  if (!TMDB_API_KEY) {
    throw new Error('TMDB_API_KEY is not configured');
  }

  const url = new URL(`${TMDB_BASE_URL}${path}`);

  // Add required API key
  url.searchParams.set('api_key', TMDB_API_KEY);

  // Add user params
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined) return;
    url.searchParams.set(key, String(value));
  });

  const res = await fetch(url.toString());

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`TMDB request failed with ${res.status}: ${text}`);
  }

  return (await res.json()) as T;
}