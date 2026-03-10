import { useState, useEffect, Suspense, lazy } from "react";
import { getCurrentUser, onAuthStateChange } from "./core/AuthService.js";
import { isWebGameplayEnabled } from "./core/WebGameplayGate.js";
import { ThemeProvider } from "./context/ThemeContext.jsx";
import PwaInstallPrompt from "./components/PwaInstallPrompt.jsx";
import "./index.css";
import "./App.css";

const GameUI = lazy(() => import("./components/GameUI"));
const AuthUI = lazy(() => import("./components/AuthUI"));

const LOCAL_USER = { id: "local", email: "local@game.dev" };
const WEB_GAMEPLAY_ENABLED = isWebGameplayEnabled();

function GameplayDisabledScreen() {
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
      <div className="holo-panel" style={{ maxWidth: "680px", width: "100%" }}>
        <h2
          style={{
            marginTop: 0,
            color: "var(--holo-cyan)",
            fontFamily: "var(--font-hud)",
          }}
        >
          Web Gameplay Disabled
        </h2>
        <p style={{ color: "var(--text-main)" }}>
          This environment is configured for tooling and observability only.
          Production gameplay should run through the Godot runtime.
        </p>
        <p style={{ color: "var(--text-muted)", marginBottom: 0 }}>
          To explicitly enable web gameplay outside dev, set
          `VITE_WEB_GAMEPLAY_ENABLED=true` (or `VITE_ENABLE_WEB_GAMEPLAY=true`) in
          runtime/build config.
        </p>
      </div>
    </div>
  );
}

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
    return <GameplayDisabledScreen />;
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
              onLocalGame={import.meta.env.DEV ? handleLocalGame : null}
            />
          </Suspense>
        </div>
      </div>
    );
  }

  return (
    <Suspense fallback={loadingScreen}>
      <>
        <PwaInstallPrompt enabled={WEB_GAMEPLAY_ENABLED} />
        <GameUI user={user} />
      </>
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
