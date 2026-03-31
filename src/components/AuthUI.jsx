import { useEffect, useState } from "react";
import {
  signIn,
  signOut,
  getCurrentUser,
  onAuthStateChange,
} from "../core/AuthService.js";

export default function AuthUI({ onAuthChange, onLocalGame, mode = "full" }) {
  const [user, setUser] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    getCurrentUser().then((currentUser) => {
      setUser(currentUser);
      onAuthChange?.(currentUser);
    });

    const unsubscribe = onAuthStateChange((currentUser) => {
      setUser(currentUser);
      onAuthChange?.(currentUser);
    });

    return () => unsubscribe();
  }, [onAuthChange]);

  const handleSignIn = async () => {
    setLoading(true);
    setError(null);
    const result = await signIn();
    if (result?.success === false) {
      setError(result.error || "Failed to sign in.");
    } else if (result?.user) {
      setUser(result.user);
      onAuthChange?.(result.user);
    }
    setLoading(false);
  };

  const handleSignOut = async () => {
    setLoading(true);
    setError(null);
    const result = await signOut();
    if (result?.success === false) {
      setError(result.error || "Failed to sign out.");
    }
    setLoading(false);
  };

  if (user) {
    return (
      <div className="holo-panel auth-card" style={{ marginBottom: "1rem" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "1rem",
          }}
        >
          <div>
            <div
              style={{
                fontSize: "0.8rem",
                color: "var(--text-dim)",
                textTransform: "uppercase",
                letterSpacing: "0.12em",
              }}
            >
              Chronicle Bound
            </div>
            <div style={{ fontSize: "1rem", fontWeight: "bold" }}>
              {user.email || user.id}
            </div>
          </div>
          <button
            className="holo-button"
            onClick={handleSignOut}
            disabled={loading}
            style={{ minWidth: "116px" }}
          >
            {loading ? "..." : "Sign Out"}
          </button>
        </div>
        {error && <div className="auth-card__error">{error}</div>}
      </div>
    );
  }

  if (mode === "sidebar" && !showModal) {
    return (
      <div className="holo-panel auth-card" style={{ marginBottom: "1rem" }}>
        <p
          style={{
            fontSize: "0.9rem",
            color: "var(--text-main)",
            textAlign: "center",
            marginBottom: "0.5rem",
            textTransform: "uppercase",
            letterSpacing: "0.14em",
          }}
        >
          Bind Cloud Chronicle
        </p>
        <button
          type="button"
          className="holo-button"
          onClick={() => setShowModal(true)}
          style={{ width: "100%", fontSize: "0.9rem", padding: "0.65rem" }}
        >
          Sign In
        </button>
      </div>
    );
  }

  const containerStyle =
    mode === "sidebar"
      ? {
          position: "fixed",
          inset: 0,
          background: "rgba(8, 5, 4, 0.82)",
          backdropFilter: "blur(16px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 2000,
        }
      : {
          width: "100%",
          padding: "1.5rem",
          background: "var(--shell-surface-strong)",
          backdropFilter: "blur(16px)",
          border: "1px solid var(--shell-border-strong)",
          borderRadius: "24px",
          boxShadow: "var(--shell-shadow)",
        };

  const contentStyle =
    mode === "sidebar"
      ? {
          maxWidth: "420px",
          width: "90%",
          padding: "2rem",
          background: "var(--shell-surface-strong)",
          border: "1px solid var(--shell-border-strong)",
          borderRadius: "28px",
          boxShadow: "var(--shell-shadow)",
        }
      : {};

  return (
    <section
      className={mode === "sidebar" ? "" : "holo-panel auth-card"}
      style={containerStyle}
      role={mode === "sidebar" ? "dialog" : undefined}
      aria-modal={mode === "sidebar" ? "true" : undefined}
      aria-labelledby="auth-heading"
      onClick={(e) =>
        mode === "sidebar" &&
        e.target === e.currentTarget &&
        setShowModal(false)
      }
    >
      <div className="auth-card" style={contentStyle} onClick={(e) => e.stopPropagation()}>
        {mode === "sidebar" && (
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "1rem" }}>
            <button
              type="button"
              className="auth-card__close"
              onClick={() => setShowModal(false)}
              aria-label="Close sign-in dialog"
            >
              x
            </button>
          </div>
        )}

        <div className="auth-card__header">
          <h3 id="auth-heading" className="auth-card__title">
            Bind Your Chronicle
          </h3>
          <p className="auth-card__copy">
            Sign in to keep your saves, progression, and narrative state tethered
            across sessions.
          </p>
        </div>

        {error && (
          <div className="auth-card__error" role="alert">
            {error}
          </div>
        )}

        <div className="auth-card__actions">
          <button
            type="button"
            className="holo-button holo-button--solid"
            onClick={handleSignIn}
            disabled={loading}
            style={{
              width: "100%",
              minHeight: "48px",
              fontSize: "0.95rem",
              opacity: loading ? 0.7 : 1,
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            {loading ? "Binding..." : "Enter The Archive"}
          </button>

          {onLocalGame && (
            <div className="auth-card__notice">
              <p
                style={{
                  fontSize: "0.82rem",
                  marginTop: 0,
                  marginBottom: "0.65rem",
                  textAlign: "center",
                  textTransform: "uppercase",
                  letterSpacing: "0.12em",
                }}
              >
                Local Chronicle
              </p>
              <button
                type="button"
                className="holo-button"
                onClick={onLocalGame}
                style={{
                  width: "100%",
                  minHeight: "46px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                Play Offline Run
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
