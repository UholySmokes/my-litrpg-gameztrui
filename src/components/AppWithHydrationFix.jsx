import GameUI from './GameUI.jsx';
import AuthUI from './AuthUI.jsx';
import { useState, useEffect, useRef } from 'react';
import { getCurrentUser, onAuthStateChange } from '../core/AuthService.js';
import '../index.css';
import '../App.css';

function AppWithHydrationFix() {
  const [user, setUser] = useState(null);
  const [isLocalGame, setIsLocalGame] = useState(false);
  const [loading, setLoading] = useState(true);
  const isMounted = useRef(false);

  useEffect(() => {
    isMounted.current = true;

    const initAuth = async () => {
      // Check local storage (safe in useEffect)
      let localGameActive = false;
      if (typeof window !== 'undefined') {
        localGameActive = localStorage.getItem('localGame') === 'true';
        if (localGameActive) setIsLocalGame(true);
      }

      try {
        const currentUser = await getCurrentUser();
        if (isMounted.current) {
          if (currentUser) {
            setUser(currentUser);
            // If logged in, clear local game state
            setIsLocalGame(false);
            if (typeof window !== 'undefined') {
              localStorage.removeItem('localGame');
            }
          }
          setLoading(false);
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        if (isMounted.current) setLoading(false);
      }
    };

    initAuth();

    // Subscribe to auth changes
    const unsubscribe = onAuthStateChange((currentUser) => {
      if (!isMounted.current) return;
      
      setUser(currentUser);
      if (currentUser) {
        setIsLocalGame(false);
        if (typeof window !== 'undefined') {
          localStorage.removeItem('localGame');
        }
      } else {
        setIsLocalGame(false);
        if (typeof window !== 'undefined') {
          localStorage.removeItem('localGame');
        }
      }
    });

    return () => {
      unsubscribe();
      isMounted.current = false;
    };
  }, []);

  const handleAuthChange = (currentUser) => {
    setUser(currentUser);
    if (currentUser) {
      setIsLocalGame(false);
      if (typeof window !== 'undefined') {
        localStorage.removeItem('localGame');
      }
    }
  };

  const handleLocalGame = () => {
    // Clear any existing character/save data when starting local game
    if (typeof window !== 'undefined') {
      localStorage.removeItem('characterCreated');
      localStorage.removeItem('saveLoaded');
      localStorage.setItem('localGame', 'true');
    }
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
  return <GameUI />;
}

export default AppWithHydrationFix;
