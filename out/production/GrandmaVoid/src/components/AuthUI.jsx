// AuthUI.jsx
import React, { useEffect, useState } from "react";
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
      <div className="holo-panel" style={{ marginBottom: "1rem" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            <div style={{ fontSize: "0.9rem", color: "var(--holo-cyan)" }}>
              Logged in as
            </div>
            <div style={{ fontSize: "1rem", fontWeight: "bold" }}>
              {user.email || user.id}
            </div>
          </div>
          <button
            className="holo-button"
            onClick={handleSignOut}
            disabled={loading}
            style={{ minWidth: "100px" }}
          >
            {loading ? "..." : "Sign Out"}
          </button>
        </div>
        {error && (
          <div
            style={{
              marginTop: "0.5rem",
              color: "var(--holo-alert)",
              fontSize: "0.85rem",
            }}
          >
            {error}
          </div>
        )}
      </div>
    );
  }

  if (mode === "sidebar" && !showModal) {
    return (
      <div className="holo-panel" style={{ marginBottom: "1rem" }}>
        <p
          style={{
            fontSize: "0.9rem",
            color: "var(--holo-cyan)",
            textAlign: "center",
            marginBottom: "0.5rem",
          }}
        >
          Connect Cloud Account
        </p>
        <button
          type="button"
          className="holo-button"
          onClick={() => setShowModal(true)}
          style={{ width: "100%", fontSize: "0.9rem", padding: "0.5rem" }}
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
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(0, 0, 0, 0.8)",
          backdropFilter: "blur(5px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 2000,
        }
      : {
          width: "100%",
          padding: "1.5rem",
          backgroundColor: "rgba(10, 15, 30, 0.95)",
          backdropFilter: "blur(5px)",
          border: "1px solid rgba(0, 243, 255, 0.3)",
          borderRadius: "8px",
          boxShadow: "0 0 20px rgba(0, 243, 255, 0.2)",
        };

  const contentStyle =
    mode === "sidebar"
      ? {
          maxWidth: "420px",
          width: "90%",
          padding: "2rem",
          backgroundColor: "rgba(10, 15, 30, 0.95)",
          border: "1px solid var(--holo-cyan)",
          borderRadius: "8px",
          boxShadow: "0 0 30px rgba(0, 243, 255, 0.2)",
        }
      : {};

  return (
    <section
      className={mode === "sidebar" ? "" : "holo-panel"}
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
      <div style={contentStyle} onClick={(e) => e.stopPropagation()}>
        {mode === "sidebar" && (
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              marginBottom: "1rem",
            }}
          >
            <button
              type="button"
              onClick={() => setShowModal(false)}
              aria-label="Close sign-in dialog"
              style={{
                background: "transparent",
                border: "none",
                color: "var(--holo-alert)",
                fontSize: "1.5rem",
                cursor: "pointer",
                lineHeight: 1,
              }}
            >
              ×
            </button>
          </div>
        )}
        <h3
          id="auth-heading"
          style={{
            fontFamily: "var(--font-hud)",
            fontSize: "1.2rem",
            marginBottom: "1rem",
            color: "var(--holo-cyan)",
            textAlign: "center",
          }}
        >
          Cloud Sign-In
        </h3>

        <p
          style={{
            color: "var(--text-muted)",
            fontSize: "0.9rem",
            textAlign: "center",
            marginBottom: "1.25rem",
          }}
        >
          Sign in to enable cloud saves and synced progression.
        </p>

        {error && (
          <div
            style={{
              color: "var(--holo-alert)",
              fontSize: "0.85rem",
              textAlign: "center",
              padding: "0.5rem",
              background: "rgba(255, 50, 50, 0.1)",
              borderRadius: "4px",
              marginBottom: "0.75rem",
            }}
            role="alert"
          >
            {error}
          </div>
        )}

        <button
          type="button"
          className="holo-button"
          onClick={handleSignIn}
          disabled={loading}
          style={{
            width: "100%",
            height: "45px",
            fontSize: "1rem",
            opacity: loading ? 0.7 : 1,
            cursor: loading ? "not-allowed" : "pointer",
          }}
        >
          {loading ? "..." : "Sign In"}
        </button>

        {onLocalGame && (
          <div
            style={{
              marginTop: "1rem",
              padding: "0.75rem",
              background: "rgba(255, 215, 0, 0.1)",
              borderRadius: "4px",
              border: "1px solid var(--holo-gold)",
            }}
          >
            <p
              style={{
                fontSize: "0.85rem",
                color: "var(--holo-gold)",
                marginBottom: "0.5rem",
                textAlign: "center",
              }}
            >
              Developer Mode
            </p>
            <button
              type="button"
              className="holo-button"
              onClick={onLocalGame}
              style={{
                width: "100%",
                borderColor: "var(--holo-gold)",
                color: "var(--holo-gold)",
                height: "45px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              Play Local Game (No Login)
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
