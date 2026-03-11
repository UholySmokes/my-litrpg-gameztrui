import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { ErrorBoundary } from "./components/ErrorBoundary.jsx";
import { verifyEnv } from "./core/EnvCheck.js";
import { initBrowserFixes } from "./core/BrowserFixes.js";
import { registerServiceWorker } from "./core/registerServiceWorker.js";
import { bootstrapStaticData } from "./data/StaticDataBootstrap.js";

async function startApp() {
  initBrowserFixes();
  registerServiceWorker();
  if (import.meta.env.DEV) verifyEnv();

  void bootstrapStaticData().catch((error) => {
    if (import.meta.env.DEV) {
      console.warn("Static data bootstrap failed:", error);
    }
  });

  createRoot(document.getElementById("root")).render(
    <StrictMode>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </StrictMode>,
  );
}

startApp();
