import { useState, useEffect } from 'react'
import './App.css'
import { MovieSearch } from './components/MovieSearch'

function App() {
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/health').then(r => r.json()).then(d => setStatus(d.status));
  }, []);

  return (
    <>
      <p>Server status: {status ?? 'Loading...'}</p>
      <div className="card">
        <MovieSearch />
      </div>
    </>
  )
}

export default App
