import { Link } from 'react-router-dom';
import './Home.css';

export function Home() {
  return (
    <div className="home-container">
      <div className="home-content">
        <h1 className="home-title">Welcome to TMDB StreamCheck</h1>
        <p className="home-description">
          Search for movies and find out where you can stream them in Norway.
        </p>
        <Link to="/moviesearch" className="home-cta">
          Start Searching
        </Link>
      </div>
    </div>
  );
}

