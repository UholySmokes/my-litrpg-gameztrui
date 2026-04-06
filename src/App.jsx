import { useState, useEffect, Suspense, lazy } from "react";
import { getCurrentUser, onAuthStateChange } from "./core/AuthService.js";
import { isWebGameplayEnabled } from "./core/WebGameplayGate.js";
import { ThemeDock, ThemeProvider } from "./context/ThemeContext.jsx";
import EntryShell from "./components/shell/EntryShell.jsx";
import "./index.css";
import "./App.css";
import "./styles/runic-shell.css";

const GameUI = lazy(() => import("./components/GameUI"));
const AuthUI = lazy(() => import("./components/AuthUI"));

const LOCAL_USER = { id: "local", email: "local@game.dev" };
const WEB_GAMEPLAY_ENABLED = isWebGameplayEnabled();

function AppContent() {
  const [isLocalGame, setIsLocalGame] = useState(() => {
    if (!WEB_GAMEPLAY_ENABLED) return false;
    return localStorage.getItem("localGame") === "true";
  });
  const [user, setUser] = useState(() => {
    if (!WEB_GAMEPLAY_ENABLED) return null;
    return localStorage.getItem("localGame") === "true" ? LOCAL_USER : null;
  });
  const [loading, setLoading] = useState(true);
  const loadingScreen = (
    <EntryShell
      title="Synchronizing the lattice."
      description="Loading identity, runtime contracts, and the latest browser-safe game shell before the chronicle opens."
      status="Boot sequence in progress."
      footer="Void-Verse runs the same deterministic systems beneath web, native, and simulation surfaces."
    />
  );

  useEffect(() => {
    let active = true;
    let unsubscribe = null;

    const start = async () => {
      if (!WEB_GAMEPLAY_ENABLED) {
        setLoading(false);
        return;
      }

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
    if (!WEB_GAMEPLAY_ENABLED) return;
    setUser(currentUser);
    if (currentUser) {
      setIsLocalGame(false);
      localStorage.removeItem("localGame");
    }
  };

  const handleLocalGame = () => {
    if (!WEB_GAMEPLAY_ENABLED) return;
    localStorage.setItem("localGame", "true");
    setIsLocalGame(true);
    setUser(LOCAL_USER);
  };

  if (loading) {
    return loadingScreen;
  }

  if (!WEB_GAMEPLAY_ENABLED) {
    return (
      <EntryShell
        title="Web gameplay is disabled."
        description="This environment is configured for tooling and observability. Enable the web runtime explicitly when you want the browser client to run the game."
        status="Set `VITE_WEB_GAMEPLAY_ENABLED=true` or `VITE_ENABLE_WEB_GAMEPLAY=true` in runtime or build config."
        footer="The Godot runtime remains the recommended native delivery surface when web gameplay is intentionally disabled."
      />
    );
  }

  // Show login if not authenticated and not in local game
  if (!user && !isLocalGame) {
    return (
      <EntryShell
        title="Bind your chronicle."
        description="Sign in to carry progression, saves, and narrative continuity across sessions, or launch a local-only run in this browser."
        status="Cloud sign-in unlocks synced progression and remote saves."
        footer="The new web shell keeps onboarding, creation, and adventure inside one continuous responsive experience."
      >
        <Suspense fallback={loadingScreen}>
          <AuthUI onAuthChange={handleAuthChange} onLocalGame={handleLocalGame} />
        </Suspense>
      </EntryShell>
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
      <ThemeDock />
      <AppContent />
    </ThemeProvider>
  );
}

export default App;
