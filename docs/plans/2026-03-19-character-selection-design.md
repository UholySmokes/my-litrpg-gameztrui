# Character Selection Redesign Plan

## Goal
Create a new card-based character selection presentation for the existing character creation flow, plus two rendered concept pictures that show the same layout in two visual treatments: a painted fantasy skin and a pixel-art skin.

## Approved Direction
- Shared roster layout with 3-5 hero cards.
- Selected hero gets a featured detail panel.
- Strong confirm CTA and fast class/race/role readability.
- Two visual skins:
  - Painted fantasy
  - Pixel art

## UX Structure
1. Header with title and mode flavor text.
2. Hero roster wall with high-readability cards.
3. Selected hero spotlight panel with stat chips and origin text.
4. Bottom action bar with Back, Random, and Confirm actions.
5. Theme switcher so both design variants can be compared inside one implementation.

## Visual Direction
### Painted Fantasy
- Night navy and steel-blue shell.
- Gold rune accents.
- Soft glow and painterly portrait treatment.
- Premium fantasy splash-art tone.

### Pixel Art
- Same hierarchy, rendered with crisp chunky borders.
- Reduced texture noise.
- Bold contrast blocks and jewel-tone highlights.
- Retro tactical RPG readability.

## Technical Plan
- Add a reusable showcase component above the creation wizard body.
- Keep the layout implementation shared and themeable.
- Render both concept pictures directly in React/CSS so the design remains diff-reviewable.
- Avoid standalone image/binary deliverables for this concept pass.

## Risks and Mitigations
- Risk: ornate styling harms readability.
  - Mitigation: keep stat chips and CTA contrast-first.
- Risk: pixel skin appears like downscaled modern UI.
  - Mitigation: use hard edges, reduced rounding, and chunky stat framing in the pixel variant.

## Validation
- Build should succeed.
- Lint on touched UI files should succeed.
- Both concept pictures should be reviewable directly in code and visible in-app.
