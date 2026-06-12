# Stitch AI Prompt — Exercise Library (`/exercises`, `/exercises/[id]`)

Redesign the Kinetiq **Exercise Library** — browse/search page and individual exercise detail page. Match the existing Kinetiq design system **exactly** (tokens below are locked). Layout, filter placement, and visual hierarchy are open for creative improvement **provided every current feature listed in this document remains present and functional in the mock**.

**Primary viewport:** Mobile-first — **390×844** and **600px** max content width (matches live app). Optional secondary artboard: **1280×800** desktop browse (two-column) in footnote only.

**Source of truth:** `DESIGN_SYSTEM.md`, `lib/design/workoutTokens.ts`, `lib/design/muscleColors.ts`, `app/exercises/page.tsx`, `app/exercises/[id]/page.tsx`, `UX_POLICY.md` (`/exercises` constraints).

---

## Screens to design

| Route | Purpose |
|-------|---------|
| `/exercises` | Browse, search, and filter the exercise library |
| `/exercises?select=true&returnTo=…` | **Select mode** — pick an exercise and return to caller (template editor) |
| `/exercises/[id]` | Full exercise detail — muscles, metadata, SFR score, substitution pool |

---

## Locked colour tokens

```ts
const C = {
  primary:          '#b1c5ff',
  secondary:        '#d4bbff',
  tertiary:         '#59d8de',
  surface:          '#111318',
  surfaceLow:       '#161820',
  surfaceContainer: '#1e2026',
  surfaceHigh:      '#282a30',
  outline:          '#8e909c',
  outlineVariant:   '#3a3c44',
  onSurface:        '#e2e2e8',
  onSurfaceVariant: '#c5c6d2',
  glass:            'rgba(22,24,32,0.80)',
};
```

### Primary CTA gradient
```css
background: linear-gradient(135deg, #b1c5ff 0%, #3a5cbf 100%);
color: #05080f;
font-family: Space Grotesk, sans-serif;
font-weight: 900;
```

### Muscle-group left accent (use on list cards — replace generic primary bar)
| Muscle | Hex |
|--------|-----|
| Chest | `#ff6b6b` |
| Back / Lats | `#b1c5ff` |
| Delts | `#59d8de` |
| Quads | `#6cd68f` |
| Glutes | `#ff7ac8` |
| Hamstrings | `#f5d76e` |
| Biceps | `#b1c5ff` |
| Triceps | `#59d8de` |
| Default | `#59d8de` |

---

## Locked typography

| Role | Font | Usage |
|------|------|-------|
| Headings / exercise names / CTAs | `Space Grotesk, sans-serif` | 800–900 |
| Body / labels / inputs | `Manrope, sans-serif` | 500–700 |

| Token | Size | Usage |
|-------|------|-------|
| Micro label | `0.57rem`, weight 700, `letter-spacing: 0.22–0.24em`, uppercase | Section headers ("Library", "Muscles") |
| Caption | `0.52rem`, weight 700, uppercase | Stat grid labels inside detail cards |
| Page title | `clamp(1.85rem,6vw,2.4rem)`, weight 900 | H1 |
| Exercise name (list) | `~1.05rem`, weight 800 | Card title |
| Exercise name (header) | `1rem`, weight 800 | Detail sticky header |
| SFR score display | `2rem`, weight 900 | Large numeric |

---

## Locked spacing & layout shell

```ts
// Page shell (both routes)
minHeight: 100vh
background: #111318
color: #e2e2e8
fontFamily: Manrope, sans-serif
paddingBottom: 110  // clears bottom nav
overflowX: hidden

// Content container
maxWidth: 600
margin: 0 auto
padding: 26px 16px 0

// Sticky header
height: 58px
padding: 0 20px
background: rgba(22,24,32,0.80)
backdropFilter: blur(24px)
borderBottom: 1px solid #3a3c44
zIndex: 40
```

---

# PART 1 — `/exercises` Browse & Select

## Primary actions (UX_POLICY — do not change)

| Mode | Primary action |
|------|----------------|
| **Browse** (`/exercises`) | Tap card → **View detail** (`/exercises/[id]`) |
| **Select** (`?select=true`) | Tap card or **Add** → **Select exercise** and return to `returnTo` URL |

## Current features checklist (ALL must appear in mock)

### Header
- [ ] Sticky glass header, height 58px
- [ ] Title: **"Exercises"** in browse mode OR **"Select Exercise"** in select mode
- [ ] Search icon button in header right slot (decorative / future — present in live UI)

### Page hero
- [ ] Micro label: **"Library"**
- [ ] H1: **"Exercises"** or **"Select Exercise"** (matches mode)

### Filters (all options must be reachable)
- [ ] **Primary muscle filter** — API-driven, options:
  - ALL, CHEST, BACK, FRONT_DELT, SIDE_DELT, REAR_DELT, BICEPS, TRICEPS, QUADS, HAMSTRINGS, GLUTES, CALVES, LATS
- [ ] **Movement pattern filter** — API-driven, options:
  - ALL, PUSH, PULL, HINGE, SQUAT, CARRY, ISOLATION, CORE
- [ ] **Search input** — client-side debounced filter on exercise name, placeholder `"Search exercises..."`, search icon left inset

**UX_POLICY note:** Filters may move behind an expandable **"Filters"** control to reduce clutter — but all filter dimensions above must remain accessible without losing functionality.

### Exercise list cards (one per exercise)
Each card shows:
- [ ] **Primary muscle badge** — filled pill, `#b1c5ff` background, `#111318` text, 10px uppercase
- [ ] **Movement pattern badge** — `#282a30` background, `#8e909c` text
- [ ] **Compound indicator** — small teal dot (`#59d8de`) with glow when `isCompound === true`, title tooltip "Compound"
- [ ] **Exercise name** — Space Grotesk 800, ellipsis overflow
- [ ] **Browse mode:** chevron-right in bordered square (28×28, `#161820` bg)
- [ ] **Select mode:** **"Add"** pill button (primary fill, dark text) instead of chevron
- [ ] Card shell: `#1e2026`, border `#3a3c44`, **left accent 3px** (use muscle colour per table above), radius 16px

### States (mock at least 4 frames or variants)
- [ ] **Loading** — 3 skeleton cards (pulsing placeholder bars)
- [ ] **Error** — card with message `"Couldn't load exercises."` + **Retry →** primary button
- [ ] **No results (filters active)** — `"No exercises match these filters."` + **Clear filters** ghost button
- [ ] **Empty API** — `"No exercises found."` (no clear button)
- [ ] **Populated list** — minimum 6 exercises showing varied muscles/patterns

### Select mode behaviour (document in mock annotation)
- [ ] URL: `/exercises?select=true&returnTo=/templates/[id]/edit`
- [ ] On select: writes `kinetiq_selected_exercise` to sessionStorage, navigates to `returnTo`
- [ ] Used by **template editor** when adding exercises to a program day

### Bottom navigation
- [ ] Exercises tab active in bottom nav (BookOpen icon, "Exercises" label, `#b1c5ff` when active)

---

## User use cases — browse page

- Browse the full exercise library by muscle group
- Filter by movement pattern (push/pull/hinge/etc.)
- Search by exercise name while filters are active
- Clear all filters when nothing matches
- Open an exercise to read full details before using it in a program
- Pick an exercise to add to a custom template (select mode)
- Retry when the API fails to load
- Identify compound vs isolation exercises at a glance (teal dot)
- See primary muscle and movement pattern without opening detail

---

# PART 2 — `/exercises/[id]` Exercise Detail

## Primary action

**Browse context:** User arrived to learn about the exercise. No mandatory CTA — informational page. Back navigation is primary exit.

**Optional future CTA (do not remove back):** "Add to workout" — not in live app; omit unless shown as ghost placeholder.

## Current features checklist (ALL must appear in mock)

### Header
- [ ] Sticky glass header
- [ ] **Back button** left — 34×34, `#161820` bg, border `#3a3c44`, chevron-left icon → `router.back()`
- [ ] **Centred title** — exercise name, ellipsis overflow (shows "Exercise" while loading)
- [ ] **Compound badge** right — teal pill `"COMPOUND"` when `isCompound` (hidden when isolation)

### Section 1 — Muscles (`border-left: 3px solid #b1c5ff`)
- [ ] Micro label: **"Muscles"**
- [ ] **Primary muscle** — large filled badge (`#b1c5ff` bg, dark text)
- [ ] **Secondary muscles** — row of grey pills (`#282a30` bg) OR em dash `—` if none

### Section 2 — Details (`border-left: 3px solid #59d8de`)
- [ ] Micro label: **"Details"**
- [ ] **2×2 stat grid** (each cell: `#161820` bg, radius 10px):
  | Label | Data source |
  |-------|-------------|
  | Equipment | `metadata.equipmentProfile.name` or fallback **"Bodyweight"** |
  | Execution Zone | `metadata.executionProfile.zone` or **"—"** |
  | Movement Pattern | `movementPattern` |
  | Category | `category` |
- [ ] **Required equipment line** (below grid, 11px muted) — only if `metadata.equipmentProfile.requiredEquipment` exists; comma-joined list

### Section 3 — SFR Score (`border-left: 3px solid #b1c5ff`)
- [ ] Micro label: **"SFR Score"**
- [ ] **When data exists:** Large score `sfrScore.toFixed(2)` in `#b1c5ff`, subtitle **"Stimulus-to-Fatigue Ratio"**, caption **"Based on {sampleSize} sessions"**
- [ ] **When no data:** Info box — *"SFR score builds after several logged sessions with this exercise."*

### Section 4 — Substitution Pool (`border-left: 3px solid #59d8de`)
- [ ] Micro label: **"Substitution Pool"**
- [ ] **When pools exist:** List of substitution cards, each showing:
  - Substitute exercise name
  - Priority badge: **"Primary"** (`#b1c5ff` fill) if `priority === 1`, else **"Alternative"** (grey)
  - **Pain/joint tags** when `suitableWhenPain` array non-empty — teal outlined chip: `Safe: {joints joined}`
- [ ] **When empty:** *"No substitutions configured for this exercise."*

### States
- [ ] **Loading** — 4 skeleton section cards
- [ ] **Error** — `"Couldn't load exercise."` + **Retry →**
- [ ] **Loaded** — all four sections populated (use realistic example: e.g. Barbell Bench Press)

### Data loaded from APIs (annotate in mock)
- `GET /api/v1/exercises/:id` — exercise detail
- `GET /api/v1/analytics/sfr/:id` — SFR score (may be null)
- `GET /api/v1/exercises/:id/substitutions` — substitution pool

---

## User use cases — detail page

- Understand which muscles an exercise targets (primary + secondary)
- Check equipment requirements before planning a session
- See movement pattern and exercise category for program design
- Learn execution zone for form context
- View personal SFR score after logging enough sessions
- Find approved substitutes when experiencing joint pain
- See which substitute is the primary recommendation vs alternatives
- Navigate back to the library or template editor

---

## Example exercise data (use for realistic mocks)

**Barbell Bench Press** (or similar compound push):
```
primaryMuscle: CHEST
secondaryMuscles: [TRICEPS, FRONT_DELT]
movementPattern: PUSH
category: PRIMARY_COMPOUND
isCompound: true
equipment: Barbell
executionZone: Mid chest
sfrScore: 1.42 (sampleSize: 24) — or empty state variant
substitutions:
  - Dumbbell Bench Press (Primary) — Safe: shoulder, elbow
  - Machine Chest Press (Alternative) — Safe: wrist
```

---

## Locked component patterns

### Standard section card
```
background: #1e2026
border: 1px solid #3a3c44
border-left: 3px solid [section accent]
border-radius: 16px
padding: 16px
gap between sections: 12px
```

### Search input (exact)
```
background: #161820
border: 1px solid #3a3c44
border-radius: 12px
padding: 12px 14px 12px 40px
color: #e2e2e8
font: Manrope 14px
icon: search SVG, #8e909c, left 14px
```

### Filter select / chip (current: native select — may redesign)
```
background: #161820
border: 1px solid #3a3c44
border-radius: 12px
padding: 12px
font: Manrope 13px
color: #e2e2e8
```

### Muscle badge (list card — primary)
```
font-size: 10px; font-weight: 700; letter-spacing: 0.06em
background: #b1c5ff; color: #111318
border-radius: 6px; padding: 3px 8px
```

### Pattern badge (list card)
```
background: #282a30; color: #8e909c
(same sizing as muscle badge)
```

### Compound dot
```
width: 8px; height: 8px; border-radius: 50%
background: #59d8de
box-shadow: 0 0 8px #59d8de
```

### Substitution row
```
background: #161820
border: 1px solid #3a3c44
border-radius: 10px
padding: 10px 12px
```

### Pain safety chip
```
font-size: 10px; font-weight: 700
color: #59d8de
background: rgba(89,216,222,0.125)
border: 1px solid rgba(89,216,222,0.33)
border-radius: 6px; padding: 3px 7px
```

### Secondary / ghost button
```
padding: 10px 14px
border-radius: 12px
border: 1px solid #3a3c44
background: transparent
color: #c5c6d2
font: Manrope 700 13px
```

---

## UX constraints (UX_POLICY)

| Rule | Application |
|------|-------------|
| Select mode primary = Select exercise | "Add" button prominent in select mode |
| Browse mode primary = View detail | Chevron / tappable card |
| Filters behind expandable (preferred) | May collapse muscle + pattern selects — must still expose all options |
| Do not clone workout logging UI | This is library/explore, not set entry |
| Dark mode only | No light theme |
| Bottom nav visible | Except when navigated from fullscreen flows |

---

## Relationship to other screens

| Caller | How it uses `/exercises` |
|--------|--------------------------|
| Bottom nav **Exercises** tab | Browse mode |
| `/templates/[id]/edit` | Select mode + `returnTo` — add exercise to program day |
| `/workout/[id]` | Uses **inline** exercise picker (not this page) — do not merge layouts |

---

## Deliverables (request from Stitch)

### Required frames
1. **`/exercises` browse** — populated list, filters visible, 6+ cards
2. **`/exercises` browse** — loading skeleton state
3. **`/exercises` browse** — no results + clear filters
4. **`/exercises?select=true`** — select mode with **Add** buttons
5. **`/exercises/[id]`** — full detail, SFR populated, substitutions populated
6. **`/exercises/[id]`** — SFR empty state + substitutions empty state variant
7. **`/exercises/[id]`** — loading skeleton

### Optional frames
8. Error state (browse + detail)
9. Desktop 1280px — two-column browse (list left, preview right) — footnote only
10. Filters collapsed behind expandable panel (UX_POLICY-aligned variant)

### Component spec sheet (optional)
- `ExerciseListCard` (browse vs select variants)
- `ExerciseSectionCard`
- `MuscleBadge` / `PatternBadge` / `CompoundDot`
- `SfrScoreBlock` (filled vs empty)
- `SubstitutionPoolRow`
- `DetailStatCell` (2×2 grid cell)

---

## Explicit exclusions

- Do **not** redesign `/workout/[id]` exercise picker or set logging
- Do **not** remove select mode or `returnTo` flow
- Do **not** remove SFR or Substitution Pool sections from detail
- Do **not** invent colours outside the token set
- Do **not** use Tailwind class names — specify hex values inline
- Do **not** remove back navigation on detail page

---

## Open decisions (your creativity)

- Whether filters are inline selects, chip rows, or expandable sheet
- Whether list cards show equipment on the browse row
- Whether detail page gets a muscle-group coloured hero accent
- Card density (compact vs comfortable)
- Animation on filter change / card press
- Desktop two-column layout treatment

**Hard requirement:** Every checkbox in the feature lists above must be satisfied in the final mocks.
