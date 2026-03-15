// Browser compatibility and error handling fixes
// Addresses deprecated APIs and specific console noise

export function initBrowserFixes() {
  if (typeof window === "undefined") return;

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
      return;
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
