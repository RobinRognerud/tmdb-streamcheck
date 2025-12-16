import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT ?? 4000;

app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

app.get('/api/movies', (_req, res) =>
  res.json({
    movies: [
      { id: 1, title: 'Example Movie' }
    ]
  })
);

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});