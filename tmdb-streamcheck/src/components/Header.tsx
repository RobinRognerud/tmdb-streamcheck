import { Link } from 'react-router-dom';
import './Header.css';

export function Header() {
  return (
    <header className="header">
      <div className="header-container">
        <Link to="/" className="header-logo">
          <h1>Sjekk streamen</h1>
        </Link>
        <nav className="header-nav">
          <Link to="/" className="nav-link">Hjem</Link>
          <Link to="/moviesearch" className="nav-link">Filmsøk</Link>
          <Link to="/watchlist" className="nav-link">Watchlist</Link>
          <Link to="/import-letterboxd" className="nav-link">Importer</Link>
        </nav>
      </div>
    </header>
  );
}

