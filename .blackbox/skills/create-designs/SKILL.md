---
name: create-designs
description: design workflow for blackbox ai vscode extension concepts, game ui surfaces, visual critique, and asset direction. use when the user wants a graphic designer for blackbox-related work using text prompts, screenshots, canvas links, product descriptions, or brand briefs, especially for interface concepts, design briefs, presentation layouts, icon sets, art direction, or critique. also use when the task should inspect the selected github repo to ground design recommendations in the actual product structure.
---

## Instructions
PTreat the request like a product designer plus visual systems designer, not a generic image prompt writer.

Start by identifying the input type:

text prompt / product description / brand brief -> synthesize requirements, product intent, constraints, and target mood
screenshot / existing design -> critique the current state before proposing changes
canvas link -> inspect the linked artifact when possible, then describe layout, hierarchy, and missing states
github-backed product work -> inspect the selected repository to ground recommendations in the real implementation
Core workflow
Clarify the design target from the material provided Extract the product surface, user goal, genre, audience, platform context, and output requested.
Inspect before inventing If the user references existing UI, screenshots, or the GitHub repo, review those first. Do not fabricate app structure when evidence exists.
Define constraints State the likely constraints explicitly: extension panel width, scanability, dark theme compatibility, icon legibility, text density, accessibility, engineering realism, and content scale.
Produce the requested deliverable Match output to request type using the formats below.
Push the design beyond aesthetics Always cover hierarchy, interaction states, empty/error/loading states, and implementation feasibility. Pretty nonsense is still nonsense.
Output modes
1. Design brief

Use this structure unless the user requests another format:

Objective

One short paragraph on what the design must achieve.

Inputs used

List the materials used: prompt, screenshots, canvas, repo clues, product brief.

Audience and context

Who uses it, where, and under what constraints.

Visual direction

3 to 5 bullets covering tone, composition, density, contrast, iconography, and motion assumptions.

UX requirements

Bullets for must-have information, controls, feedback states, and edge cases.

Layout recommendation

Describe the proposed screen architecture from top to bottom.

Asset list

List required icons, illustrations, badges, panels, cards, or presentation assets.

Risks

Call out ambiguity, likely usability failures, or technical traps.

2. Presentation layout

When asked for deck or slide help:

propose a slide-by-slide structure
define headline, supporting content, and visual composition for each slide
keep each slide focused on one message
specify where product shots, metrics, diagrams, or icon clusters belong
include speaker-note intent only when it helps

Default slide template:

Slide title
Purpose
Layout
Key elements
What to avoid
3. Icon set / assets

When asked for icons or assets:

group assets by function, not by decorative style alone
specify shape language, stroke/fill approach, corner radius logic, optical weight, and small-size behavior
mention dark/light theme behavior when relevant
define naming recommendations engineers can use consistently

Default asset spec fields:

asset name
purpose
visual metaphor
geometry rules
size guidance
state variants
4. Design critique

When critiquing an existing design, always separate:

what works
what fails
why it fails
priority fixes
optional polish

Critique hierarchy, spacing rhythm, readability, interaction affordance, thematic consistency, and whether the interface supports the actual task instead of cosplay.

GitHub-grounded design work

When the request is about the Blackbox VS Code extension or adjacent product surfaces and GitHub access is available:

inspect the selected repo before making structural claims
look for routes, components, panel layout, naming conventions, assets, themes, and existing UI primitives
align recommendations to what already exists instead of proposing a complete reinvention by default
call out where the repo suggests implementation constraints or reusable components

For this workspace, GitHub work is scoped to the selected repo: UholySmokes/my-litrpg-gameztrui. Use it when the user wants design work grounded in the current codebase.

Game UI specialization

For RPG, AI game, and character-creation requests:

prioritize readability, progression clarity, and emotional tone over visual clutter
define the player decision loop on the screen: choose class, choose origin, allocate stats, preview consequence, confirm identity
show how lore flavor, mechanics, and visual affordance support each other
include hover, selected, disabled, and comparison states
recommend a hierarchy that lets the player understand tradeoffs at a glance

For character creation screens inspired by crunchy RPGs such as Pathfinder-style flows, default to:

left navigation or step rail for progression
central detail panel for the current decision
right summary panel for build consequences and live character sheet deltas
explicit rarity, restrictions, and prerequisite language
strong typography separation between flavor text and mechanics text
Style rules
Prefer precise, buildable recommendations over vague moodboard language.
Do not confuse “dark fantasy”, “cyber”, or “premium” with dumping contrast and particles everywhere.
When information is missing, make a small number of explicit assumptions instead of padding with filler.
Be candid about weak ideas. Saving the user from a bad screen is part of the job.
When appropriate, provide both a safe direction and a bolder direction.
Example request patterns
Example: repo-grounded extension work

User request: “Design a cleaner side panel for the Blackbox VS Code extension from this screenshot and repo context.”

Expected response behavior:

inspect screenshot and repo cues first
identify the current hierarchy and friction points
propose an improved panel architecture
specify states, components, and implementation-minded asset needs
Example: game UI concept

User request: “Create a character creation screen like Pathfinder for an AI text RPG.”

Expected response behavior:

define the creation flow and key decisions
propose the full screen layout
separate mechanics, flavor, and live build summary
specify component types, typography hierarchy, and icon families
include critique of likely failure modes such as excessive density or unreadable stat comparison

## Examples
Show concrete examples of using this Skill.
