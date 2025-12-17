import './Footer.css';

export function Footer() {
  return (
    <footer className="footer">
      <div className="footer-container">
        <p className="footer-text">
          Powered by{' '}
          <a
            href="https://www.themoviedb.org/"
            target="_blank"
            rel="noopener noreferrer"
            className="footer-link"
          >
            TMDB
          </a>
        </p>
        <p className="footer-copyright">
          © {new Date().getFullYear()} TMDB StreamCheck
        </p>
      </div>
    </footer>
  );
}

