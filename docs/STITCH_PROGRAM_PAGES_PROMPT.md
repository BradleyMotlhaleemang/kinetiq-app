# Stitch AI Prompt — Program Tab (`/mesocycles`, `/mesocycles/new`, `/mesocycles/[id]`)

Redesign the Kinetiq **Program** experience: browse templates, configure a training block, and view an active mesocycle. Match the existing Kinetiq dark design system exactly. Layout and micro-interactions are open for refinement.

---

## Reference screens (current implementation)

1. **`/mesocycles`** — Program hub: active block card, past programs, template browser (my programs + browse), filters
2. **`/mesocycles/new?templateId=…`** — Configure Block: program summary card, expandable training preview, block name, duration picker, create CTA
3. **`/mesocycles/[id]`** — Active block detail: week progress, expandable week schedule with full exercise lists, volume targets, start session CTA

Use these as functional reference. Improve visual hierarchy and polish without changing primary actions.

---

## User use cases (what people actually do here)

### `/mesocycles` — Program hub
- See which training block is currently active and how far through it they are
- Jump into their active program to start or review this week's sessions
- Pick a first program after signing up (no block yet)
- Browse proven templates (PPL, upper/lower, full body, etc.) and compare them quickly
- Filter programs by goal (hypertrophy, strength), experience level, duration, or days per week
- Search for a program by name
- Open a custom program they built earlier
- Long-press a custom program to edit, start a new block from it, or delete it
- Create a brand-new program from scratch (wizard)
- Review completed past blocks and when they ran
- Read what a mesocycle is and why blocks have deload weeks (collapsed explainer)
- Switch to a different template before committing to a new block

### `/mesocycles/new` — Configure block
- Confirm they picked the right program before starting
- Preview what exercises run on each training day before creating the block
- Name their block (e.g. "Summer Push", "Meet Prep")
- Choose block length — 4 weeks, 8 weeks, or a custom duration
- See total session count before committing (days/week × weeks)
- Fork and customize a system template before starting
- Go back and pick a different template
- Create the block and land on the dashboard ready to train

### `/mesocycles/[id]` — Active block detail
- Check which week of the block they're in and how many sessions are done
- See this week's training days at a glance
- Expand a day to see the full exercise list with sets and rep ranges
- Start today's scheduled session
- Track weekly volume per muscle group against prescribed targets
- Swap an exercise for the rest of the block (injury, equipment, preference)
- Review active exercise substitutions
- Edit program structure (non-beginners)
- Mark the block complete when the mesocycle is finished
- Understand what's coming up later in the week without starting a workout yet

---

## Brand tokens (locked)

| Token | Value |
|-------|-------|
| Primary | `#b1c5ff` |
| Secondary | `#d4bbff` |
| Tertiary | `#59d8de` |
| Surface (page bg) | `#111318` |
| Surface low | `#161820` |
| Surface container (cards) | `#1e2026` |
| Surface high | `#282a30` |
| Outline | `#8e909c` |
| Outline variant (borders) | `#3a3c44` |
| On-surface text | `#e2e2e8` |
| On-surface variant | `#c5c6d2` |

**Fonts:** Space Grotesk (headings, program names, CTAs) · Manrope (body, labels, chips)

**Day accent rotation:** `#b1c5ff`, `#59d8de`, `#d4bbff`, `#a2e7ff`

---

## Shared components (must match)

### Program summary card
- Shell: `#1e2026` bg, `1px solid #3a3c44`, `16px` radius, **3px left accent** (goal-based color)
- Eyebrow: Manrope 700, `0.57rem`, uppercase, letter-spacing `0.2em`, accent color
- Title: Space Grotesk 800–900, ~17–20px, `-0.04em` tracking
- **Experience chip:** Beginner (teal) / Intermediate (primary) / Advanced (purple) — uppercase pill, `10px` font
- Meta line: `12px` Manrope, `#c5c6d2` — e.g. `4 days/week · Hypertrophy`

### Training day accordion
- Row: `#161820` bg, `12px` radius, left accent bar (day color or muted if completed)
- Collapsed: day label + exercise count or muscle summary
- Expanded: bullet list — `Exercise Name — 3×8–12` prescription format
- Chevron toggle; completed days show “Done” badge, reduced opacity

### Primary CTA
- Full-width gradient button: `linear-gradient(135deg, #b1c5ff 0%, #3a5cbf 100%)`
- Space Grotesk 900, `#05080f` text, `12–15px` radius

### Section labels
- Manrope 700, `0.57rem`, uppercase, `0.22em` letter-spacing, `#8e909c`

---

## Per-screen primary actions (do not demote)

| Screen | Primary action |
|--------|----------------|
| `/mesocycles` (no block) | Pick / start a program |
| `/mesocycles/new` | **Create Block** |
| `/mesocycles/[id]` | **Start today's session** |

Secondary actions (ghost buttons, text links): Change program, Customize, Edit program, volume accordion.

---

## UX constraints (from UX_POLICY)

- **One dominant primary action per screen**
- Filters (goal chips, experience/duration/days matrix) stay **compact** — not hero elements
- Training preview / exercise lists are **expandable**, not always visible
- No “What is a mesocycle?” inline link — education lives in collapsed accordion only
- Mobile-first, max content width ~600px, bottom nav clearance ~96px
- Dark mode only

---

## Screen-specific notes

### `/mesocycles` — browse state
- Hero when empty: “Choose your training program” (Space Grotesk 900, large)
- Template list: simplified cards (name + chip + brief summary only)
- Filter row: horizontal goal chips + 3-column matrix toggles (Experience / Duration / Days per week)
- “Create New Program” gradient CTA above My Programs

### `/mesocycles/new` — configure block
- Program summary card at top with “Change program →” text link
- Training Preview accordion below summary (before form fields)
- Duration: two preset pills (4 / 8 weeks) + dashed “+” for custom stepper
- Session count info row before CTAs
- Ghost “Customize this program” above primary Create Block

### `/mesocycles/[id]` — active block
- Status card: Week N, session fraction, % complete bar (4px gradient)
- Week schedule card with expandable days (full exercise prescription on expand)
- Volume targets: optional section with thin progress bars per muscle
- Edit program: collapsed accordion (swaps, substitutions) — advanced, not inline clutter

---

## Open decisions (your creativity)

- Exact spacing rhythm between sections
- Whether active block on `/mesocycles` gets a mini week preview
- Animation on accordion expand (subtle height transition welcome)
- How “Recommended” badge relates to experience chip visually
- Past programs list density

---

## Deliverables

1. High-fidelity mock: **`/mesocycles`** with active block + browse templates below
2. High-fidelity mock: **`/mesocycles/new`** configure flow
3. High-fidelity mock: **`/mesocycles/[id]`** with one day expanded showing exercise list
4. Optional: component spec sheet for ProgramSummaryCard + TrainingDayAccordion

Do not redesign workout logging, dashboard, or bottom navigation in this pass.
