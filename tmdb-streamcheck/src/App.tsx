import { Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Home } from './pages/Home';
import { MovieSearch } from './pages/MovieSearch';
import { Watchlist } from './pages/Watchlist';
import { ImportLetterboxd } from './pages/ImportLetterboxd';
import './App.css';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="moviesearch" element={<MovieSearch />} />
        <Route path="watchlist" element={<Watchlist />} />
        <Route path="import-letterboxd" element={<ImportLetterboxd />} />
      </Route>
    </Routes>
  );
}

export default App;
