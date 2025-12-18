# Ideer for Persistent Lagring av Watchlist

Per nå lagres watchlist kun i minnet (React state), og forsvinner når siden lastes på nytt. Her er flere alternativer for å implementere persistent lagring:

## 1. **LocalStorage (Enkleste løsning)**
**Fordeler:**
- Enkelt å implementere
- Fungerer umiddelbart uten backend
- Data lagres lokalt i nettleseren
- Fungerer offline

**Ulemper:**
- Data er kun tilgjengelig på samme nettleser/enhet
- Begrenset lagringsplass (~5-10MB)
- Ikke synkronisert mellom enheter

**Implementering:**
```typescript
// I WatchlistContext.tsx
useEffect(() => {
  const saved = localStorage.getItem('watchlist');
  if (saved) {
    setWatchlist(JSON.parse(saved));
  }
}, []);

useEffect(() => {
  localStorage.setItem('watchlist', JSON.stringify(watchlist));
}, [watchlist]);
```

## 2. **IndexedDB (For større datamengder)**
**Fordeler:**
- Større lagringskapasitet enn LocalStorage
- Bedre ytelse for store lister
- Støtter komplekse queries

**Ulemper:**
- Mer kompleks å implementere
- Krever async API
- Overkill for enkel watchlist

**Bibliotek:** `idb` eller `dexie.js` for enklere API

## 3. **Backend Database (Best for produksjon)**
**Fordeler:**
- Data synkroniseres mellom enheter
- Kan ha brukerkontoer og deling
- Sikkerhet og backup
- Kan ha ekstra funksjoner (notifikasjoner, anbefalinger)

**Ulemper:**
- Krever backend-server
- Mer kompleks infrastruktur
- Kostnader for hosting

**Alternativer:**
- **Firebase Firestore**: Serverless, enkel å sette opp
- **Supabase**: Open-source Firebase-alternativ med PostgreSQL
- **MongoDB Atlas**: Gratis tier for små prosjekter
- **PostgreSQL + Express**: Full kontroll, mer arbeid

**Implementering:**
```typescript
// Backend API endpoints:
POST /api/watchlist - Legg til film
DELETE /api/watchlist/:movieId - Fjern film
GET /api/watchlist - Hent watchlist
```

## 4. **Hybrid Løsning (Anbefalt)**
Kombiner LocalStorage med backend:
- Bruk LocalStorage som cache/offline-støtte
- Synkroniser med backend når tilgjengelig
- Beste av begge verdener

## 5. **Cookies (Ikke anbefalt)**
**Ulemper:**
- Begrenset størrelse (~4KB)
- Sendes med hver request
- Ikke ideelt for store lister

## Anbefaling

For dette prosjektet vil jeg anbefale:

1. **Kort sikt**: LocalStorage - raskt å implementere, fungerer umiddelbart
2. **Langsikt**: Backend med database (Firebase/Supabase) for å støtte brukerkontoer og synkronisering

### Eksempel implementering med LocalStorage:

```typescript
// contexts/WatchlistContext.tsx
export function WatchlistProvider({ children }: { children: ReactNode }) {
  const [watchlist, setWatchlist] = useState<WatchlistMovie[]>(() => {
    // Load from localStorage on mount
    const saved = localStorage.getItem('watchlist');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    // Save to localStorage whenever watchlist changes
    localStorage.setItem('watchlist', JSON.stringify(watchlist));
  }, [watchlist]);

  // ... rest of the code
}
```

**Merk:** Husk å håndtere `addedAt` datoer korrekt ved serialisering/deserialisering, da Date-objekter ikke serialiseres direkte til JSON.

