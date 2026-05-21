// Browser compatibility and error handling fixes
// Addresses deprecated APIs and specific console noise

export function initBrowserFixes() {
  if (typeof window === "undefined") return;

  // Keep CSS viewport units aligned with the *visible* viewport.
  // `100vh` can be slightly taller than the real viewport (browser UI, rounding),
  // which shows up as a small overflow under the app frame (including Playwright).
  const updateViewportVars = () => {
    const viewport = window.visualViewport;
    const width = Math.max(1, Math.floor(viewport?.width ?? window.innerWidth));
    const height = Math.max(1, Math.floor(viewport?.height ?? window.innerHeight));

    // Store as pixels-per-1% for easy `calc(var(--vvh) * 100)` usage.
    document.documentElement.style.setProperty("--vvw", `${width * 0.01}px`);
    document.documentElement.style.setProperty("--vvh", `${height * 0.01}px`);
  };

  updateViewportVars();
  window.addEventListener("resize", updateViewportVars, { passive: true });
  window.addEventListener("orientationchange", updateViewportVars, { passive: true });
  window.visualViewport?.addEventListener("resize", updateViewportVars, { passive: true });
  window.visualViewport?.addEventListener("scroll", updateViewportVars, { passive: true });

  // 1. Deprecated API: InstallTrigger
  // Firefox-specific API often checked by legacy scripts
  if (!("InstallTrigger" in window)) {
    Object.defineProperty(window, "InstallTrigger", {
      get: () => undefined,
      configurable: true,
    });
  }

  // 2. Deprecated API: window.fullScreen
  // Polyfill using modern Fullscreen API
  if (!("fullScreen" in window)) {
    Object.defineProperty(window, "fullScreen", {
      get: () => !!document.fullscreenElement,
      set: (val) => {
        if (val) {
          document.documentElement.requestFullscreen().catch(console.warn);
        } else if (document.fullscreenElement) {
          document.exitFullscreen().catch(console.warn);
        }
      },
      configurable: true,
    });
  }

  // 3. Event Mapping: mozfullscreenchange -> fullscreenchange
  document.addEventListener("fullscreenchange", () => {
    const event = new Event("mozfullscreenchange");
    window.dispatchEvent(event);
  });

  document.addEventListener("fullscreenerror", () => {
    const event = new Event("onmozfullscreenerror");
    window.dispatchEvent(event);
  });

  // 4. Promise Error Handling
  // Suppress "context unloaded" errors common in Firefox/Extensions
  window.addEventListener("unhandledrejection", (event) => {
    const msg = event.reason?.message || String(event.reason);

    // Filter out specific extension/browser-internal errors
    const ignoredErrors = [
      "Promise rejected after context unloaded",
      "PortMessage for closed conduit",
      "Promise resolved after context unloaded",
      "Actor 'Conduits' destroyed before Promise was resolved",
      "No such JSProcessActor",
      "BrowserToolboxDevToolsProcess",
      "InvalidStateError: JSWindowActorChild.contentWindow getter",
    ];

    if (ignoredErrors.some((err) => msg.includes(err))) {
      event.preventDefault(); // Stop propagation/logging

    }
  });

  // 6. Console Error Filtering
  // Suppress specific internal browser errors that bypass unhandledrejection
  const originalConsoleError = console.error;
  console.error = (...args) => {
    const msg = args.map(String).join(" ");
    if (
      msg.includes("No such JSProcessActor") ||
      msg.includes("BrowserToolboxDevToolsProcess") ||
      (msg.includes("InvalidStateError") &&
        msg.includes("PictureInPictureToggle"))
    ) {
      return;
    }
    originalConsoleError.apply(console, args);
  };

  const originalConsoleWarn = console.warn;
  console.warn = (...args) => {
    const msg = args.map(String).join(" ");
    if (
      msg.includes(
        "Layout-Darstellung wurde erzwungen, bevor die Seite vollständig geladen war",
      ) ||
      msg.includes("Layout was forced before the page was fully loaded")
    ) {
      return;
    }
    originalConsoleWarn.apply(console, args);
  };

  console.log("Browser compatibility fixes initialized.");
}
