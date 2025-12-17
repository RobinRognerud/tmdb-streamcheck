import { Link } from 'react-router-dom';
import './Header.css';

export function Header() {
  return (
    <header className="header">
      <div className="header-container">
        <Link to="/" className="header-logo">
          <h1>TMDB StreamCheck</h1>
        </Link>
        <nav className="header-nav">
          <Link to="/" className="nav-link">Home</Link>
          <Link to="/moviesearch" className="nav-link">Movie Search</Link>
        </nav>
      </div>
    </header>
  );
}

