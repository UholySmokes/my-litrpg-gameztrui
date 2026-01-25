## Priority Plan

### P0: Unblock AI (ship now)
- [x] Finish /api/narrate → NarratorAgent (text-only)
- [x] Validate QuestAgent JSON schema against game state
- [x] Test narration length / tone guards
- [x] Frontend error handling on AI failure

### P1: Stabilize Core Loop (next)
- [x] Post‑migration smoke testing
- [x] Level‑up flow end‑to‑end test
- [x] Attribute math verification
- [x] Combat loop regression test
- [x] Mana regeneration outside level‑up
- [x] Skill cooldowns visible in UI
- [x] Free attribute points on level‑up

### P2: AI Operations (after stability)
- [x] Admin approval flow for Factory drafts
- [x] Persist AI outputs as drafts (quests, lore, NPCs)
- [x] Error envelope standard { ok, errorCode, message }
- [x] Add request tracing + per‑agent logging
- [x] Rate limiting & retry policy for Foundry calls
- [x] Versioned AI outputs (content hash / seed)

### P3: Depth & Scale (later)
- [x] Universal skill fusion system
- [x] Skill evolution trees UI
- [x] Class evolution paths
- [x] Equipment crafting & professions
- [x] Legendary item proc & set bonuses
- [x] Advanced combat status effects
- [x] Tactical positioning / lanes
