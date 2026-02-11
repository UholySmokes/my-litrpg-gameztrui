---
alwaysApply: false
---
GLOBAL MODE RULE:

Use Chat (Max Mode if core system):
- whenever the task can change architecture, system boundaries, data models, or long-term design
- whenever the question contains “should”, “does this make sense”, “which approach”, or uncertainty
- for analysis, critique, trade-offs, refactor decisions, or planning

Use Solo Coder / Solo Builder:
- only when the design is already decided
- only for execution (code, files, configs, prompts)
- never to decide what to build, only to build it

Principle:
Chat decides. Solo executes.
If the system shape is not fixed, Solo is forbidden.
