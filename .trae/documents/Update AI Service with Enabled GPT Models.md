I will update `src/core/AIService.js` to configure the **AI Service** with the specific list of enabled GPT models you provided.

**Changes to `src/core/AIService.js`:**
1.  **Update Model List**: I will replace the current `models` array with the exact 15 models you listed, ensuring `gpt-5.2-pro`, `gpt-5`, and others are prioritized as requested.
2.  **Verify Safety**: The error handling mechanism I previously implemented will remain in place. This ensures that if any specific model (like `gpt-5.2-pro`) is temporarily unreachable or returns a 404, the system will seamlessly failover to the next available model (like `gpt-4o`) without disrupting the game.