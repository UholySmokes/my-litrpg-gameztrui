### Game Design & Logic
- **Scaling:** 1000-level LitRPG. Use logarithmic/exponential growth (no linear scaling).
- **Breakthroughs:** Suggest 'Skill Mutations' or 'Stat Evolutions' every 10/50 levels for impact.
- **Precision:** Use `mathUtils.js`. Suggest `BigInt` or `decimal.js` if values exceed `MAX_SAFE_INTEGER`.

### Technical Implementation
- **Strict ESM:** Mandatory Node.js ESM. All imports MUST include extensions (e.g., `./utils.js`).
- **State:** Use `Zustand` or `Redux Toolkit` for Inventory/Stats; avoid deep `useState`.
- **Decoupling:** Keep combat logic independent from React UI for testing/performance.

### UI & UX
- **Data First:** Prioritize clear stats (deltas, %) over flashy animations.
- **SSR Safety:** Always use `isMounted` patterns for `localStorage`, `window`, or `Date` to prevent Hydration Error #418.