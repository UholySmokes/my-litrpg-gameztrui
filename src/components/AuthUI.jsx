// AuthUI.jsx
import React, { useState, useEffect } from "react";
import {
  signUp,
  signIn,
  signOut,
  getCurrentUser,
  onAuthStateChange,
  resetPassword,
} from "../core/AuthService.js";

export default function AuthUI({ onAuthChange, onLocalGame, mode = "full" }) {
  const [user, setUser] = useState(null);
  const [isSignUp, setIsSignUp] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);

  // Check for existing session on mount
  useEffect(() => {
    getCurrentUser().then(setUser);

    // Subscribe to auth state changes
    const unsubscribe = onAuthStateChange((currentUser) => {
      setUser(currentUser);
      if (onAuthChange) {
        onAuthChange(currentUser);
      }
    });

    return () => unsubscribe();
  }, [onAuthChange]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      let result;
      if (isSignUp) {
        result = await signUp(email, password);
        if (result.success) {
          setMessage(
            "Account created! Please check your email to verify your account.",
          );
        }
      } else {
        result = await signIn(email, password);
      }

      if (!result.success) {
        setError(result.error || "Authentication failed");
      } else {
        setEmail("");
        setPassword("");
      }
    } catch (err) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    setLoading(true);
    const result = await signOut();
    if (result.success) {
      setUser(null);
      setMessage("Signed out successfully");
    } else {
      setError(result.error || "Failed to sign out");
    }
    setLoading(false);
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      setError("Please enter your email address");
      return;
    }

    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const result = await resetPassword(email);
      if (result.success) {
        setMessage("Password reset email sent! Please check your inbox.");
        setShowForgotPassword(false);
      } else {
        setError(result.error || "Failed to send password reset email");
      }
    } catch (err) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  // If user is logged in, show user info and sign out button
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
              {user.email}
            </div>
          </div>
          <button
            className="holo-button"
            onClick={handleSignOut}
            disabled={loading ? true : false}
            style={{ minWidth: "100px" }}
          >
            {loading ? "..." : "Sign Out"}
          </button>
        </div>
        {message && (
          <div
            style={{
              marginTop: "0.5rem",
              color: "var(--holo-cyan)",
              fontSize: "0.85rem",
            }}
          >
            {message}
          </div>
        )}
      </div>
    );
  }

  // Show forgot password form
  if (showForgotPassword) {
    return (
      <div className="holo-panel" style={{ marginBottom: "1rem" }}>
        <h3
          style={{
            fontFamily: "var(--font-hud)",
            fontSize: "1.2rem",
            marginBottom: "1rem",
            color: "var(--holo-cyan)",
          }}
        >
          Reset Password
        </h3>

        <form onSubmit={handleForgotPassword}>
          <div style={{ marginBottom: "1rem" }}>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
              className="holo-input"
              style={{
                width: "100%",
                background: "transparent",
                border: "none",
                borderBottom: "2px solid var(--holo-cyan)",
                color: "var(--text-main)",
                fontFamily: "var(--font-text)",
                fontSize: "1rem",
                padding: "0.75rem",
                outline: "none",
                marginBottom: "0.5rem",
              }}
            />
          </div>

          {error && (
            <div
              style={{
                color: "var(--holo-alert)",
                fontSize: "0.85rem",
                marginBottom: "0.5rem",
              }}
            >
              {error}
            </div>
          )}

          {message && (
            <div
              style={{
                color: "var(--holo-cyan)",
                fontSize: "0.85rem",
                marginBottom: "0.5rem",
              }}
            >
              {message}
            </div>
          )}

          <div
            style={{ display: "flex", gap: "0.5rem", marginBottom: "0.5rem" }}
          >
            <button
              type="submit"
              className="holo-button"
              disabled={loading ? true : false}
              style={{ flex: 1 }}
            >
              {loading ? "..." : "Send Reset Email"}
            </button>
          </div>

          <button
            type="button"
            onClick={() => {
              setShowForgotPassword(false);
              setError(null);
              setMessage(null);
            }}
            style={{
              background: "transparent",
              border: "none",
              color: "var(--holo-cyan)",
              cursor: "pointer",
              fontSize: "0.85rem",
              textDecoration: "underline",
              width: "100%",
            }}
          >
            Back to Sign In
          </button>
        </form>
      </div>
    );
  }

  // Show login/signup form
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
          className="holo-button"
          onClick={() => setShowModal(true)}
          style={{ width: "100%", fontSize: "0.9rem", padding: "0.5rem" }}
        >
          Sign In / Register
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
          position: "fixed",
          bottom: "20px",
          left: "20px",
          right: "20px",
          margin: "0 auto",
          maxWidth: "400px",
          zIndex: 1000,
          marginBottom: "0",
          transition: "all 0.3s ease-in-out",
          padding: "1.5rem",
          backgroundColor: "rgba(10, 15, 30, 0.95)",
          backdropFilter: "blur(5px)",
          boxShadow: "0 0 20px rgba(0, 243, 255, 0.2)",
        };

  const contentStyle =
    mode === "sidebar"
      ? {
          maxWidth: "400px",
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
              onClick={() => setShowModal(false)}
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
          {isSignUp ? "Create Account" : "Sign In"}
        </h3>

        {/* Local Game Option for Developers */}
        {onLocalGame && (
          <div
            style={{
              marginBottom: "1rem",
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

        <form
          onSubmit={handleSubmit}
          style={{ display: "flex", flexDirection: "column", gap: "15px" }}
        >
          <div style={{ position: "relative", width: "80%", margin: "0 auto" }}>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              required
              className="holo-input"
              style={{
                width: "100%",
                background: "transparent",
                border: "none",
                borderBottom: "2px solid var(--holo-cyan)",
                color: "var(--text-main)",
                fontFamily: "var(--font-text)",
                fontSize: "1rem",
                padding: "0.75rem",
                outline: "none",
                transition: "border-color 0.3s ease",
              }}
            />
          </div>

          <div style={{ position: "relative", width: "80%", margin: "0 auto" }}>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              required
              minLength={6}
              className="holo-input"
              style={{
                width: "100%",
                background: "transparent",
                border: "none",
                borderBottom: "2px solid var(--holo-cyan)",
                color: "var(--text-main)",
                fontFamily: "var(--font-text)",
                fontSize: "1rem",
                padding: "0.75rem",
                outline: "none",
                transition: "border-color 0.3s ease",
              }}
            />
          </div>

          {isSignUp && (
            <div
              style={{ position: "relative", width: "80%", margin: "0 auto" }}
            >
              <input
                type="password"
                placeholder="Confirm Password"
                required
                minLength={6}
                className="holo-input"
                style={{
                  width: "100%",
                  background: "transparent",
                  border: "none",
                  borderBottom: "2px solid var(--holo-cyan)",
                  color: "var(--text-main)",
                  fontFamily: "var(--font-text)",
                  fontSize: "1rem",
                  padding: "0.75rem",
                  outline: "none",
                  transition: "border-color 0.3s ease",
                }}
              />
            </div>
          )}

          {error && (
            <div
              style={{
                color: "var(--holo-alert)",
                fontSize: "0.85rem",
                textAlign: "center",
                padding: "0.5rem",
                background: "rgba(255, 50, 50, 0.1)",
                borderRadius: "4px",
              }}
              role="alert"
            >
              {error}
            </div>
          )}

          {message && (
            <div
              style={{
                color: "var(--holo-cyan)",
                fontSize: "0.85rem",
                textAlign: "center",
                padding: "0.5rem",
                background: "rgba(0, 243, 255, 0.1)",
                borderRadius: "4px",
              }}
              role="status"
            >
              {message}
            </div>
          )}

          <button
            type="submit"
            className="holo-button"
            disabled={loading ? true : false}
            style={{
              width: "100%",
              height: "45px",
              fontSize: "1rem",
              marginTop: "0.5rem",
              opacity: loading ? 0.7 : 1,
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            {loading ? "..." : isSignUp ? "Sign Up" : "Sign In"}
          </button>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "0.75rem",
              marginTop: "0.5rem",
            }}
          >
            <button
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError(null);
                setMessage(null);
              }}
              style={{
                background: "transparent",
                border: "none",
                color: "var(--holo-cyan)",
                cursor: "pointer",
                fontSize: "0.9rem",
                textDecoration: "underline",
                width: "100%",
                padding: "0.5rem",
                transition: "color 0.2s ease",
              }}
            >
              {isSignUp
                ? "Already have an account? Sign in"
                : "Don't have an account? Sign up"}
            </button>

            {!isSignUp && (
              <button
                type="button"
                onClick={() => {
                  setShowForgotPassword(true);
                  setError(null);
                  setMessage(null);
                }}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "var(--text-muted)",
                  cursor: "pointer",
                  fontSize: "0.85rem",
                  textDecoration: "underline",
                  width: "100%",
                  padding: "0.25rem",
                }}
              >
                Forgot Password?
              </button>
            )}
          </div>
        </form>
      </div>
    </section>
  );
}
