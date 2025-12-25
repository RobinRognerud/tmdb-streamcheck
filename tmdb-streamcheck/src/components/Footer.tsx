import './Footer.css';

export function Footer() {
  return (
    <footer className="footer">
      <div className="footer-container">
        <p className="footer-text">
          Info fra{' '}
          <a
            href="https://www.themoviedb.org/"
            target="_blank"
            rel="noopener noreferrer"
            className="footer-link"
          >
            TMDB
          </a>
        </p>

        <div className="footer-letterboxd-wrap">
          <a
            href="https://letterboxd.com/robinro"
            target="_blank"
            rel="noopener noreferrer"
            className="footer-link footer-letterboxd"
            aria-label="Letterboxd - robinro"
          >
            <img src="https://letterboxd.com/favicon.ico" alt="Letterboxd logo" className="footer-letterboxd-logo" />
          </a>
        </div>
      </div>
    </footer>
  );
}

