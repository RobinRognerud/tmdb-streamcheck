import express from 'express';
import type { Request, Response } from 'express';
import { searchMovies, getMovieDetails, getMovieWatchProviders } from './routes/tmdb';

const router = express.Router();

router.get('/search', (req: Request, res: Response) => {
  void searchMovies(req, res);
});

router.get('/:id/watch-providers', (req: Request, res: Response) => {
  void getMovieWatchProviders(req, res);
});

router.get('/:id', (req: Request, res: Response) => {
  void getMovieDetails(req, res);
});

export default router;