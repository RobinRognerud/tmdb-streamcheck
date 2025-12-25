import express from 'express';
import type { Request, Response } from 'express';
import { searchMovies, getMovieDetails, getMovieWatchProviders, getMovieReleaseDates, getNetflixMovies, getMovieGenres, getSimilarMovies } from './routes/tmdb';

const router = express.Router();

router.get('/search', (req: Request, res: Response) => {
  void searchMovies(req, res);
});

router.get('/:id/watch-providers', (req: Request, res: Response) => {
  void getMovieWatchProviders(req, res);
});

router.get('/:id/release-dates', (req: Request, res: Response) => {
  void getMovieReleaseDates(req, res);
});
router.get('/:id/similar', (req: Request, res: Response) => {
  void getSimilarMovies(req, res);
});
router.get('/netflix', (req: Request, res: Response) => {
  void getNetflixMovies(req, res);
});

router.get('/genres', (req: Request, res: Response) => {
  void getMovieGenres(req, res);
});

router.get('/:id', (req: Request, res: Response) => {
  void getMovieDetails(req, res);
});

router.get('/netflix', (req, res) => { void getNetflixMovies(req, res); });

export default router;