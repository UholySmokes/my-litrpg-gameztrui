I will fix the issues in the character creation system by addressing the non-deterministic skill selection and increasing the available skill options.

### 1. Fix "Multiple Clicks" Bug
**File:** `src/hook/useCharacterCreation.js`
- **Problem:** `handleActiveSkillSelect` and `handlePassiveSkillToggle` currently call `getSkillsByClass` to find the selected skill object. Since `getSkillsByClass` returns a **random subset** of skills every time it's called, the selected skill often doesn't exist in the new random set, causing the selection to fail (requiring multiple clicks until the random set happens to include the target skill).
- **Fix:** Update these handlers to use `getSkillById(skillId)` (from `skills.js`) instead. This function performs a deterministic lookup across the entire skill database, ensuring the correct skill object is always found immediately.

### 2. Increase Active Skills Displayed
**File:** `src/lib/skills.js`
- **Problem:** The user requested to see 8 active skills instead of 4.
- **Fix:** Update the `getSkillsByClass` function to slice 8 active skills (`.slice(0, 8)`) instead of 4. I have verified that the skill database contains at least 10 active skills per class (and 20 for placeholders), so this is safe.

### 3. Verify Stat Point Logic
**File:** `src/hook/useCharacterCreation.js`
- **Action:** I will review and slightly simplify the `allocateAttributePoint` logic to ensure it's robust. The previous fix (derived state) was theoretically correct, but I will ensure the `remainingPoints` calculation is perfectly synchronized with the state updates to prevent the "window wont change" issue reported by the user.

### Execution Steps
1.  Modify `src/lib/skills.js` to increase the active skill count to 8.
2.  Modify `src/hook/useCharacterCreation.js` to import `getSkillById` and use it in skill selection handlers.
3.  (Implicit) The stat point issue is likely linked to the "multiple clicks" lag or will be resolved by the clean state logic, but I will ensure the implementation is solid.