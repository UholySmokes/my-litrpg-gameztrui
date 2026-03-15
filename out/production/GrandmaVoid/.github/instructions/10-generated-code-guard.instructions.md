---
applyTo: "**/{dataconnect-generated,dist,build,coverage}/**/*"
description: "Protect generated/build output from accidental manual edits."
---

# Generated Code Guard

These files are usually generated artifacts, not source of truth.

Rules:
1. Do not hand-edit generated files.
2. Find and edit the source schema/config/template instead.
3. Regenerate outputs using project scripts/tools.
4. In your summary, state the regeneration command used.

If uncertain whether a file is generated:
- Check nearby README files and folder names first.
- Prefer asking for confirmation before manual edits.

Why:
- Manual changes in generated files are overwritten and create confusing diffs.
