import { useEffect, useMemo, useState } from "react";
import "./PwaInstallPrompt.css";

const DISMISS_KEY = "pwaInstallPromptDismissed:v1";

const isStandaloneDisplay = () => {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia?.("(display-mode: standalone)")?.matches ||
    window.navigator?.standalone === true
  );
};

export default function PwaInstallPrompt({ enabled = true }) {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstalled, setIsInstalled] = useState(isStandaloneDisplay);
  const [dismissed, setDismissed] = useState(() => {
    if (typeof window === "undefined") return false;
    try {
      return window.localStorage.getItem(DISMISS_KEY) === "true";
    } catch {
      return false;
    }
  });

  useEffect(() => {
    if (!enabled || typeof window === "undefined") return undefined;

    const handleBeforeInstallPrompt = (event) => {
      event.preventDefault();
      setDeferredPrompt(event);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
      setDismissed(false);
      try {
        window.localStorage.removeItem(DISMISS_KEY);
      } catch {
        // Ignore localStorage errors in restricted contexts.
      }
    };

    const media = window.matchMedia?.("(display-mode: standalone)");
    const handleMediaChange = () => setIsInstalled(isStandaloneDisplay());

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);
    media?.addEventListener?.("change", handleMediaChange);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
      media?.removeEventListener?.("change", handleMediaChange);
    };
  }, [enabled]);

  const instructions = useMemo(
    () =>
      [
        "Chrome Android: browser menu -> Add to Home screen",
        "Samsung Internet: menu -> Add page to -> Home screen",
        "Desktop Chrome: open app menu and choose Install Void Verse",
      ].join("\n"),
    [],
  );

  if (!enabled || isInstalled || dismissed) return null;

  const dismiss = () => {
    setDismissed(true);
    try {
      window.localStorage.setItem(DISMISS_KEY, "true");
    } catch {
      // Ignore localStorage errors in restricted contexts.
    }
  };

  const triggerInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice.catch(() => null);
    if (choice?.outcome !== "accepted") {
      return;
    }
    setDeferredPrompt(null);
  };

  return (
    <aside className="pwa-install-banner" role="status" aria-live="polite">
      <div className="pwa-install-copy">
        <strong>Install Void Verse</strong>
        <p>
          Add this game to your Android home screen for a native-like launch and
          offline fallback.
        </p>
      </div>
      <div className="pwa-install-actions">
        {deferredPrompt ? (
          <button type="button" onClick={triggerInstall}>
            Install App
          </button>
        ) : (
          <details>
            <summary>Install Steps</summary>
            <pre>{instructions}</pre>
          </details>
        )}
        <button type="button" className="pwa-dismiss" onClick={dismiss}>
          Dismiss
        </button>
      </div>
    </aside>
  );
}

