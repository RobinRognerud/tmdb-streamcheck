import { Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Home } from './pages/Home';
import { MovieSearch } from './components/MovieSearch';
import './App.css';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="moviesearch" element={<MovieSearch />} />
      </Route>
    </Routes>
  );
}

export default App;
