# Code Optimization Report — Implementation Plan

Date: 2026-03-24
Depends on: `docs/plans/2026-03-10-code-optimization-report-design.md`

## Target Outcome

- A reproducible pipeline that generates a 20-page optimization PDF with repo-grounded metrics.
- Repeatable artifact output under `output/pdf/` and preview renders under `tmp/pdfs/`.

## Implementation Steps

### Slice 1 - Data Collection Pipeline

- Add a script to collect repo metrics (line counts, module weights, dynamic imports, chunk stats).
- Normalize outputs into a structured JSON report in `docs/reports/`.

### Slice 2 - Report Template Assembly

- Create a deterministic 20-section report template matching the approved page structure.
- Bind each section to data inputs plus qualitative findings placeholders.

### Slice 3 - PDF Rendering

- Add/build a renderer script that outputs a fixed 20-page PDF to `output/pdf/`.
- Add PNG preview rendering into `tmp/pdfs/` for spot checks.

### Slice 4 - QA + Consistency Checks

- Validate page count exactly equals 20.
- Validate required sections exist and non-empty checks pass.
- Add a quick command in docs for one-step regeneration.

## Risks

- Runtime variance can break exact page count.
  - Mitigation: fixed pagination blocks + overflow checks in generation step.
