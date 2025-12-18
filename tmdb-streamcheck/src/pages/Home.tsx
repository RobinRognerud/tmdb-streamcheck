import { Link } from 'react-router-dom';
import './Home.css';

export function Home() {
  return (
    <div className="home-container">
      <div className="home-content">
        <h1 className="home-title">Velkommen til min side</h1>
        <p className="home-description">
          Søk etter filmer og finn ut hvor du kan se dem i Norge.
        </p>
        <Link to="/moviesearch" className="home-cta">
          Start søking
        </Link>
      </div>
    </div>
  );
}

