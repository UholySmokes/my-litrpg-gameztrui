I will modify the authentication components to allow signing in from within a local game.

1.  **Modify `src/components/AuthUI.jsx`**:
    *   Add a `mode` prop (default `'full'`, accepts `'sidebar'`).
    *   In `'sidebar'` mode (when not logged in):
        *   Display a compact "Login / Register" button instead of the full fixed form.
        *   When clicked, show the login form in a modal overlay (similar to Shop/Gacha modals).
    *   Preserve existing behavior for the start screen (`'full'` mode).

2.  **Modify `src/components/GameUI.jsx`**:
    *   Remove the `!isLocalGame` check that hides the auth panel.
    *   Always render `AuthUI`, passing `mode="sidebar"` to ensure it integrates correctly into the HUD.

This ensures players in "Local Game" mode can access cloud features (Cloud Save) without restarting, resolving the issue where the window "only appears at the start."