import { useState, useEffect } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import { MovieSearch } from './components/MovieSearch'

function App() {
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/health').then(r => r.json()).then(d => setStatus(d.status));
  }, []);

  return (
    <>
      <div>
        <a href="https://vite.dev" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <p>Server status: {status ?? 'Loading...'}</p>
      <MovieSearch />
      <h1>Vite + React</h1>
      <div className="card">
      </div>
      <p className="read-the-docs">
        Click on the Vite and React logos to learn more
      </p>
    </>
  )
}

export default App
