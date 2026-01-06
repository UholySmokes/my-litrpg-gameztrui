import GameUI from './components/GameUI';
import AuthUI from './components/AuthUI';
import { useState, useEffect } from 'react';
import { getCurrentUser, onAuthStateChange } from './core/AuthService.js';
import './index.css';
import './App.css';

function App() {
  const [user, setUser] = useState(null);
  const [isLocalGame, setIsLocalGame] = useState(() => {
    return localStorage.getItem('localGame') === 'true';
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing session
    getCurrentUser().then(currentUser => {
      setUser(currentUser);
      setLoading(false);
    });

    // Subscribe to auth changes
    const unsubscribe = onAuthStateChange((currentUser) => {
      setUser(currentUser);
      if (!currentUser) {
        setIsLocalGame(false);
        localStorage.removeItem('localGame');
      }
    });

    return () => unsubscribe();
  }, []);

  const handleAuthChange = (currentUser) => {
    setUser(currentUser);
    if (currentUser) {
      setIsLocalGame(false);
      localStorage.removeItem('localGame');
    }
  };

  const handleLocalGame = () => {
    // Clear any existing character/save data when starting local game
    localStorage.removeItem('characterCreated');
    localStorage.removeItem('saveLoaded');
    localStorage.setItem('localGame', 'true');
    setIsLocalGame(true);
    setUser({ id: 'local', email: 'local@game.dev' }); // Dummy user for local game
  };

  if (loading) {
    return (
      <div style={{
        width: '100vw',
        height: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        background: 'var(--bg-deep)',
        color: 'var(--holo-cyan)',
        fontFamily: 'var(--font-hud)'
      }}>
        Loading...
      </div>
    );
  }

  // Show login if not authenticated and not in local game
  if (!user && !isLocalGame) {
    return (
      <div style={{
        width: '100vw',
        height: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        background: 'var(--bg-deep)',
        padding: '2rem'
      }}>
        <div style={{ maxWidth: '400px', width: '100%' }}>
          <AuthUI onAuthChange={handleAuthChange} onLocalGame={handleLocalGame} />
        </div>
      </div>
    );
  }

  // Show game UI if authenticated or in local game
<<<<<<< HEAD
  if (isMounted) {
    // Game UI is ready to mount
  }
  
  return <GameUI />;
=======
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/3f03f283-383d-430a-bf4d-6c4ae328671d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'App.jsx:88',message:'App rendering GameUI',data:{hasUser:!!user,isLocalGame},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'N'})}).catch(()=>{});
  // #endregion
  try {
    return <GameUI />;
  } catch (error) {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/3f03f283-383d-430a-bf4d-6c4ae328671d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'App.jsx:92',message:'GameUI render error',data:{error:error.message,stack:error.stack},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'N'})}).catch(()=>{});
    // #endregion
    console.error('Error rendering GameUI:', error);
    return (
      <div style={{
        width: '100vw',
        height: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        background: 'var(--bg-deep)',
        color: 'var(--holo-alert)',
        fontFamily: 'var(--font-hud)',
        padding: '2rem'
      }}>
        <div>
          <h1>Error Loading Game</h1>
          <p>{error.message}</p>
          <button onClick={() => window.location.reload()}>Reload</button>
        </div>
      </div>
    );
  }
>>>>>>> parent of b907677 (snapshot before refactoring6.1 6:50uhr)
}

export default App;