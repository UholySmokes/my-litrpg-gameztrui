import { useState, useEffect, Suspense, lazy } from "react";
import { getCurrentUser, onAuthStateChange } from "./core/AuthService.js";
import { ThemeProvider } from "./context/ThemeContext.jsx";
import "./index.css";
import "./App.css";

const GameUI = lazy(() => import("./components/GameUI"));
const AuthUI = lazy(() => import("./components/AuthUI"));

const LOCAL_USER = { id: "local", email: "local@game.dev" };

function AppContent() {
  const [isLocalGame, setIsLocalGame] = useState(() => {
    return localStorage.getItem("localGame") === "true";
  });
  const [user, setUser] = useState(() => {
    return localStorage.getItem("localGame") === "true" ? LOCAL_USER : null;
  });
  const [loading, setLoading] = useState(true);
  const loadingScreen = (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: "var(--bg-deep)",
        color: "var(--holo-cyan)",
        fontFamily: "var(--font-hud)",
      }}
    >
      Loading...
    </div>
  );

  useEffect(() => {
    let active = true;
    let unsubscribe = null;

    const start = async () => {
      if (isLocalGame) {
        setUser(LOCAL_USER);
        setLoading(false);
        return;
      }

      const currentUser = await getCurrentUser();
      if (!active) return;
      setUser(currentUser);
      setLoading(false);

      unsubscribe = onAuthStateChange((nextUser) => {
        setUser(nextUser);
      });
    };

    start();

    return () => {
      active = false;
      if (typeof unsubscribe === "function") unsubscribe();
    };
  }, [isLocalGame]);

  const handleAuthChange = (currentUser) => {
    setUser(currentUser);
    if (currentUser) {
      setIsLocalGame(false);
      localStorage.removeItem("localGame");
    }
  };

  const handleLocalGame = () => {
    localStorage.setItem("localGame", "true");
    setIsLocalGame(true);
    setUser(LOCAL_USER);
  };

  if (loading) {
    return loadingScreen;
  }

  // Show login if not authenticated and not in local game
  if (!user && !isLocalGame) {
    return (
      <div
        style={{
          width: "100vw",
          height: "100vh",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          background: "var(--bg-deep)",
          padding: "2rem",
        }}
      >
        <div style={{ maxWidth: "400px", width: "100%" }}>
          <Suspense fallback={loadingScreen}>
            <AuthUI
              onAuthChange={handleAuthChange}
              onLocalGame={handleLocalGame}
            />
          </Suspense>
        </div>
      </div>
    );
  }

  return (
    <Suspense fallback={loadingScreen}>
      <GameUI user={user} />
    </Suspense>
  );
}

// Wrap with ThemeProvider
function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}

export default App;
