import GameUI from "./components/GameUI";
import AuthUI from "./components/AuthUI";
import { useState, useEffect } from "react";
import { getCurrentUser, onAuthStateChange } from "./core/AuthService.js";
import { ThemeProvider } from "./context/ThemeContext.jsx";
import "./index.css";
import "./App.css";

function AppContent() {
  const [user, setUser] = useState(null);
  const [isLocalGame, setIsLocalGame] = useState(() => {
    return localStorage.getItem("localGame") === "true";
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing session
    getCurrentUser().then((currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    // Subscribe to auth changes
    const unsubscribe = onAuthStateChange((currentUser) => {
      setUser(currentUser);
      if (!currentUser) {
        setIsLocalGame(false);
        localStorage.removeItem("localGame");
      }
    });

    return () => unsubscribe();
  }, []);

  const handleAuthChange = (currentUser) => {
    setUser(currentUser);
    if (currentUser) {
      setIsLocalGame(false);
      localStorage.removeItem("localGame");
    }
  };

  const handleLocalGame = () => {
    // Clear any existing character/save data when starting local game
    localStorage.removeItem("characterCreated");
    localStorage.removeItem("saveLoaded");
    localStorage.setItem("localGame", "true");
    setIsLocalGame(true);
    setUser({ id: "local", email: "local@game.dev" }); // Dummy user for local game
  };

  if (loading) {
    return (
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
          <AuthUI
            onAuthChange={handleAuthChange}
            onLocalGame={handleLocalGame}
          />
        </div>
      </div>
    );
  }

  return <GameUI />;
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
