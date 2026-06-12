# Stitch AI Prompt — Desktop Freestyle Training + Admin CMS (Combined)

Design **two connected experiences** for Kinetiq in a single desktop deliverable:

1. **Part A — Consumer:** Freestyle workouts (1-day) and weekly routines (7-day splits) **outside** a mesocycle block, with full session recording.
2. **Part B — Admin:** Desktop operator console to create and manage system templates, exercises, and catalog content.

**Target viewport:** Desktop-first — **1440×900** primary artboard, minimum **1280×800**. Do not design mobile-first. A brief footnote on how mobile would simplify is optional.

**Visual fidelity:** Match Kinetiq's existing design system **exactly** (tokens below are locked). Layout density and information architecture are open for creative exploration within desktop constraints.

**Source of truth files:** `DESIGN_SYSTEM.md`, `lib/design/workoutTokens.ts`, `lib/design/muscleColors.ts`, `docs/STITCH_PROGRAM_PAGES_PROMPT.md`.

---

## Locked colour tokens

```ts
const C = {
  primary:          '#b1c5ff',   // Blue-lavender. Headings, active states, primary CTAs.
  primaryContainer: '#002560',   // Deep blue. Rarely used.
  secondary:        '#d4bbff',   // Soft purple. Secondary accents.
  tertiary:         '#59d8de',   // Teal. Highlights, engine indicators, Beginner chip.
  surface:          '#111318',   // Page background.
  surfaceLow:       '#161820',   // Inputs, info rows, accordion rows.
  surfaceContainer: '#1e2026',   // Cards, modals, panels.
  surfaceHigh:      '#282a30',   // Chips, stat pills, icon backgrounds.
  surfaceHighest:   '#32343c',   // Highest elevation.
  outline:          '#8e909c',   // Muted labels, section headers.
  outlineVariant:   '#3a3c44',   // Borders, dividers.
  onSurface:        '#e2e2e8',   // Primary text.
  onSurfaceVariant: '#c5c6d2',   // Secondary/body text.
  glass:            'rgba(22,24,32,0.80)', // Sticky header / admin top bar.
};

const ACCENT = {
  primary:   '#b1c5ff',
  secondary: '#d4bbff',
  tertiary:  '#59d8de',
};

const DAY_COLORS = ['#b1c5ff', '#59d8de', '#d4bbff', '#a2e7ff'];

// Semantic (workout execution only)
const ERROR   = '#ffb4ab';
const WARNING = '#f5d76e';
const SUCCESS = '#6cd68f';
```

### Primary CTA gradient (exact)
```css
background: linear-gradient(135deg, #b1c5ff 0%, #3a5cbf 100%);
color: #05080f;  /* always dark text on gradient — never white */
```

### Destructive CTA gradient
```css
background: linear-gradient(135deg, #ff8b8b 0%, #cc4444 100%);
color: #05080f;
```

### Modal overlay
```css
background: rgba(8,10,16,0.85);
backdrop-filter: blur(14px);
```

---

## Locked typography

| Role | Font | Notes |
|------|------|-------|
| Display / headings / CTAs | `Space Grotesk, sans-serif` | Weights 800–900 |
| Body / labels / inputs / nav | `Manrope, sans-serif` | Weights 500–700 |

**Never use system-ui or other fonts.**

| Token | Size | Weight | Usage |
|-------|------|--------|-------|
| Micro label | `0.57rem` | 700 | Section headers. ALL CAPS. `letter-spacing: 0.22–0.24em` |
| Caption | `0.52rem` | 700 | Stat labels in cards. ALL CAPS. `letter-spacing: 0.16–0.2em` |
| Body small | `11px` | 500–800 | Sub-labels, table meta |
| Body | `12–13px` | 500 | Descriptions, input text |
| Card title | `17–20px` | 800 | Program / routine names |
| Page title (desktop) | `28–32px` | 900 | H1 only. `letter-spacing: -0.045em` |
| Admin table header | `11px` | 700 | ALL CAPS, `#8e909c` |

### Logo (exact)
- Text logo, not image
- `"Kineti"` with gradient `linear-gradient(90deg, #b1c5ff, #d4bbff)` clipped to text
- Final `"q"` in `#59d8de`
- `fontFamily: Space Grotesk`, `fontWeight: 900`, `fontSize: 20px`, `letterSpacing: -0.04em`

---

## Locked spacing & radii

| Token | Value | Usage |
|-------|-------|-------|
| Desktop page padding | `24–32px` | Outer container (admin + consumer desktop) |
| Consumer content max-width | `600px` centre column OR two-column `60/40` split | Dashboard desktop |
| Admin sidebar width | `240px` fixed | Left nav |
| Admin main padding | `24px 32px` | Content area |
| Card padding | `16–18px` | Standard cards |
| Card gap | `12px` | Between cards in a list |
| Section gap | `24–32px` | Between major sections |
| Card border-radius | `16px` | All cards |
| Input border-radius | `10–12px` | Fields, search |
| Pill border-radius | `100px` | Filter chips |
| Inner element radius | `8–12px` | Chips, chevron boxes |

---

## Muscle-group accent colours (exact — from `muscleColors.ts`)

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
| Calves / default fallback | `#59d8de` |

Exercise cards use **3px left border** in muscle colour.

---

## Locked component patterns

### Standard card shell
```
background: #1e2026
border: 1px solid #3a3c44
border-left: 3px solid [accent]
border-radius: 16px
padding: 16–18px
```

### Experience level chip (exact)
| Level | Text colour | Background |
|-------|-------------|------------|
| Beginner | `#59d8de` | `rgba(89,216,222,0.12)` |
| Intermediate | `#b1c5ff` | `rgba(177,197,255,0.12)` |
| Advanced | `#d4bbff` | `rgba(212,187,255,0.12)` |

```
font-size: 10px; font-weight: 700; letter-spacing: 0.06em;
text-transform: uppercase; border-radius: 5px; padding: 3px 8px;
```

### Session type badge (new — design in mock)
| Type | Label | Suggested colour |
|------|-------|------------------|
| Block session | `Block` | `#b1c5ff` |
| Freestyle | `Freestyle` | `#59d8de` |
| Routine | `Routine` | `#d4bbff` |

Same pill treatment as experience chip.

### Primary button
```
width: 100% (or auto in toolbars)
padding: 13–15px 20px
border-radius: 12px
border: none
background: linear-gradient(135deg, #b1c5ff 0%, #3a5cbf 100%)
color: #05080f
font-family: Space Grotesk, sans-serif
font-weight: 900
font-size: 13–15px
```
Arrow `→` suffix on primary CTAs where appropriate.

### Secondary (ghost) button
```
padding: 13px 20px
border-radius: 12px
border: 1px solid #3a3c44
background: transparent
color: #c5c6d2
font-family: Manrope, sans-serif
font-weight: 700
font-size: 13px
```

### Search input (exact)
```
background: #161820
border: 1px solid #3a3c44
border-radius: 12px
padding: 12px 14px 12px 40px  (icon left)
color: #e2e2e8
font-family: Manrope, sans-serif
font-size: 14px
```

### Filter chips (exact)
```
padding: 7px 16px
border-radius: 100px
active: background #b1c5ff, color #05080f, no border
inactive: background transparent, border 1px solid #3a3c44, color #c5c6d2
font-size: 0.72rem; font-weight: 700; letter-spacing: 0.05em
```

### Training day accordion row
```
background: #161820
border: 1px solid #3a3c44
border-radius: 12px
border-left: 3px solid [day colour or #8e909c if completed]
padding: 12px 14px
expanded list: font-size 12px, color #c5c6d2, prescription format "Exercise — 3×8–12"
chevron: lucide-style up/down, colour matches day accent
completed: opacity 0.75, "Done" badge
```

### Exercise editor card (routine builder — match template edit)
```
background: #1e2026; border: 1px solid #3a3c44; border-radius: 16px
left accent: 3px muscle colour
exercise name: Space Grotesk 800, ~0.95rem
metadata: Manrope 500, 0.65rem uppercase, #8e909c
field labels: Manrope 700, 0.55rem uppercase (Sets, Min Reps, Max Reps, RPE)
numeric inputs: background #161820, border 1px solid #3a3c44, radius 10px
               Space Grotesk 800, 1rem, text-align center
delete: trash icon top-right, inline "Remove?" Yes/No
```

### Set input fields (workout execution — reference only)
```
background: #161820
border: 1px solid #3a3c44
border-radius: 10px
font: Space Grotesk 800, 1rem, centered
padding: 10px 8px
```

### Progress bar (thin)
```
height: 4px
track: #282a30
fill: linear-gradient(90deg, #b1c5ff, #59d8de)
border-radius: 9999px
```

### Admin data table
```
header row: background #161820, text #8e909c, 11px uppercase, letter-spacing 0.18em
body row: background #1e2026, border-bottom 1px solid #3a3c44, padding 12px 16px
row hover: background #282a30
selected row: border-left 3px solid #b1c5ff
```

### Admin sidebar nav item
```
padding: 10px 16px
border-radius: 8px
inactive: color #8e909c, background transparent
active: color #b1c5ff, background rgba(177,197,255,0.1)
font: Manrope 700, 13px
```

---

# PART A — Consumer: Freestyle Training & Routines

## Product context

Users today **must** create a mesocycle block to train. This feature adds paths for:

- **Freestyle workout (1-day):** Empty session → add any exercises → log sets → recorded in history/PRs.
- **Weekly routine (up to 7 days):** User-built split that **repeats weekly** with **no** block duration, deload, or week progression.

**Placement rule (UX_POLICY):** Freestyle entry lives on **Dashboard** as a **secondary** action under the mesocycle primary CTA — not on the Program tab.

---

## A1. Desktop dashboard (`/dashboard`) — two-column layout

**Primary action (unchanged):** Start / Resume today's **block** session.

**Layout:**
- **Left column (~58%):** Today card — mesocycle context, week/day label, primary gradient CTA
- **Right column (~42%):** "Quick routines" — up to 3 routine cards + "See all" link
- **Below:** Last session row (any session type) + recent PR chip

**New secondary CTA (ghost, full-width under primary):**
```
Label: "Log a freestyle workout"
Style: secondary button pattern above
```

**States to mock:**
1. Active mesocycle + no in-progress freestyle
2. Resume in-progress freestyle (teal accent on secondary area)
3. No mesocycle — freestyle CTA slightly more prominent (still secondary to "Browse programs" if shown)

**Micro label above page title:**
```
font-size: 0.57rem; letter-spacing: 0.24em; uppercase; color: #8e909c; font-weight: 700
text: "Today"
```

---

## A2. Start workout modal (desktop centred dialog)

Triggered by "Log a freestyle workout". **Not** a bottom sheet on desktop — use centred modal `max-width: 480px`.

**Title:** Start a workout  
**Options (3 equal rows or cards):**

| Option | Subtitle |
|--------|----------|
| **Empty workout** | Add exercises as you go |
| **From routine** | Pick a saved 1-day or weekly split |
| **Build new routine** | Create a reusable plan |

Each option: `surfaceContainer` card, left accent `#59d8de`, hover `surfaceHigh`.

**Primary action per selection:**
- Empty → creates session immediately (no extra step in mock)
- From routine → opens routine picker sub-view
- Build new routine → routes to A4 wizard

---

## A3. Freestyle workout execution (`/workout/[id]`)

Match existing workout page styling. **Variant differences only:**

**Context bar (below top bar):**
```
background: #161820
border: 1px solid #3a3c44
border-radius: 12px
padding: 10px 14px
label: "Freestyle" chip (#59d8de) + "Not part of a training block" in #8e909c
```

**Empty state (no exercises yet):**
- Centred illustration area (optional subtle dumbbell icon in `#282a30` circle)
- Heading: Space Grotesk 800, "Add your first exercise"
- Primary: "+ Add exercise" (gradient button, not full width — `max-width: 280px`)

**Populated state:** Reuse exercise card shell with muscle accent, set rows, `+ ADD SET`, `+ ADD EXERCISE`.

**No block prescription panel** — progression coaching collapsed or hidden with label "No block prescription".

**Overflow menu (top-right ⋮):**
- Save as routine
- Discard workout

**Sticky footer:** `FINISH WORKOUT` gradient button + volume/duration bar.

**Mock two states:** empty + 2 exercises logged.

---

## A4. Routine builder wizard (desktop, full-width within content area)

**Step indicator:** horizontal pills, active = `#b1c5ff` fill.

### Step 1 — Type
- **Single session** (1-day routine)
- **Weekly split** (2–7 training days)

Cards: standard shell, radio selection with teal left border when selected.

### Step 2 — Details
- Routine name (text input)
- Experience tag: Beginner / Intermediate / Advanced (experience chips, multi-select off — pick one)
- Optional description

### Step 3 — Schedule (weekly split only)
- 7-column day grid (Mon–Sun) or horizontal day tabs
- Toggle each day: Workout / Rest
- Active workout days use `DAY_COLORS` rotation

### Step 4 — Exercises per day
- Day tabs across top (coloured underline = day accent)
- Exercise cards per A exercise editor pattern above
- "+ Add exercise" opens exercise search side panel (desktop: **400px right drawer**, `surfaceContainer`, blur overlay)

### Step 5 — Review
- Summary card: name, type, experience chip, days count, total exercises
- Expandable day accordion with full exercise list
- Info callout (`surfaceLow`, left border `#59d8de`):
  > "This is a repeating schedule, not a training block. No deload or week progression."

**Footer actions:**
- Ghost: "Save for later"
- Primary: "Save & start now →"

---

## A5. My Routines (`/routines`)

Desktop table or card grid — **prefer table on desktop**.

**Columns:** Name · Type (1-day / Weekly) · Days · Last used · Actions

**Row actions:** Start · Edit · Duplicate · Delete (delete = destructive confirm modal)

**Filters:** All · 1-day · Weekly (filter chips pattern)

**Empty state:** "No routines yet" + CTA "Build your first routine"

---

## A6. History integration (`/history`)

Add session type badge on each session card:
- `Block` / `Freestyle` / `Routine`

Filter chips at top: All · Block · Freestyle · Routine

Freestyle sessions show exercise count + top weight moved (not "Day 3 Push").

---

## A7. Consumer user use cases (include in design thinking)

- Walk into the gym with no plan and log immediately
- Add and remove exercises mid-session
- Save today's session as a reusable routine
- Run a personal PPL weekly without an 8-week mesocycle
- Resume an in-progress freestyle workout from the dashboard
- See freestyle sessions in history alongside block sessions
- Pick a saved routine and start the correct day for today
- Build a 1-day template for a recurring class or sport session

---

## A8. Consumer UX constraints (UX_POLICY)

| Principle | Application |
|-----------|-------------|
| P1 One primary action | Dashboard: block start remains primary; freestyle is secondary |
| P2 Log first set in ≤5 actions | Empty workout → add exercise → log set in ≤4 taps/clicks |
| P3 Workout in 1 tap | Resume chip on dashboard when freestyle in progress |
| P5 Relevant info only | No mesocycle volume targets on freestyle workout page |
| P11 Context visible | Banner: Freestyle vs Week N · Day N |
| P13 Goal-oriented screens | Routines live near Dashboard, not buried in Program |

---

# PART B — Admin CMS (Desktop Operator Console)

## Product context

Internal tool for Kinetiq operators to manage the **system catalog** — templates, exercises, featured flags — without touching user data. **Not** visible in consumer bottom nav. Gated by admin role.

**Visual density:** Higher than consumer — tables, split panes, drawers. Same tokens, different layout.

---

## B1. Admin shell layout

```
┌──────────────┬────────────────────────────────────────────────────┐
│  Sidebar     │  Top bar (glass, height 58px)                      │
│  240px       │  [Search global…]              [Staging] [Avatar]  │
│              ├────────────────────────────────────────────────────┤
│  Dashboard   │                                                    │
│  Templates   │  Main content area                                 │
│  Exercises   │  padding: 24px 32px                                │
│  Catalog     │                                                    │
│  Users       │                                                    │
│  Settings    │                                                    │
└──────────────┴────────────────────────────────────────────────────┘
```

- **Background:** `#111318` page, `#161820` sidebar
- **No bottom navigation**
- **Logo** top of sidebar (Kinetiq teal-q, smaller `16px`)
- **Sidebar border-right:** `1px solid #3a3c44`

---

## B2. Admin dashboard (`/admin`)

**Stat cards row (4 across):**
| Card | Example value |
|------|---------------|
| System templates | 12 |
| Exercises | 248 |
| Active users (7d) | 1,204 |
| Workouts logged (7d) | 8,932 |

Stat card style: `surfaceContainer`, micro label caption, large Space Grotesk 900 number in `#b1c5ff`.

**Recent activity table:** Last 10 edits — type, name, admin, timestamp.

**Quick actions:** Primary "New template", ghost "New exercise", ghost "Sync catalog".

---

## B3. Template manager (`/admin/templates`) — master-detail

**Left pane (40%):** Filterable table
- Columns: Name · Goal · Level · Days/wk · Featured · System
- Search bar at top
- Filter chips: All goals, Experience, Featured only
- Row click selects template

**Right pane (60%):** Editor
- **Header:** Template name (editable), experience chips, featured toggle
- **Metadata form (two columns):**
  - Name, slug (auto-filled from name, monospace `#8e909c`)
  - Goal tags (multi chip select)
  - Experience tags (Beginner / Intermediate / Advanced)
  - Days per week, split type
  - Duration range hint (for mesocycle compatibility)
  - Difficulty warning (textarea, auto-suggest if ≥6 days)
  - Featured toggle, System flag (read-only for seeded)
- **Split editor:** Day tabs (7 max) with `DAY_COLORS` underlines
- **Exercise list per day:** Exercise editor cards (same as routine builder)
- **Auto-fill defaults button:** "Apply intermediate defaults" — sets 3×8–12 RPE 8
- **Footer toolbar:** Ghost Discard · Primary "Publish template →"

**Mock:** "Upper/Lower 4-Day" selected, Day 1 expanded with 5 exercises.

---

## B4. Exercise library (`/admin/exercises`)

**Full-width data table:**
| Column | Example |
|--------|---------|
| Name | Barbell Bench Press |
| Primary muscle | CHEST |
| Equipment | Barbell |
| Movement class | COMPOUND |
| Chest region | MID |
| Incline ° | — |
| System | ✓ |

- Sortable column headers
- Bulk select checkboxes
- **Right drawer (400px)** on row click for inline edit
- Fields: name, muscles, equipment, movement class, chest region enum, incline angle, joint map tags (for biofeedback)
- Primary "Save" in drawer footer

**Top actions:** Search, "+ New exercise", "Import CSV" (ghost)

---

## B5. Catalog sync (`/admin/catalog`)

- List seeded templates from system catalog
- Diff indicator: in sync / pending / new
- Table: slug, name, goal, experience tags, last synced
- Destructive action: "Sync to database" with confirmation modal (destructive gradient)

---

## B6. Users (`/admin/users`) — read-only mock

- Table: email, experience level, active block, last workout, joined
- No edit actions in v1 — view only

---

## B7. Admin user use cases

- Create a new system template and publish to browse pool
- Set beginner / intermediate / advanced tags on templates
- Mark a template as featured on Program tab
- Add or edit exercise metadata (chest sub-region, incline angle)
- Fix prescription errors in a template day before users fork it
- Duplicate an existing template as a starting point
- Review catalog sync status after seed file changes
- Preview how a template card will appear to users

---

## B8. Admin safety patterns

- Destructive actions always use confirmation modal
- System templates visually distinct from user templates (badge "System")
- Staging environment badge in top bar (`#f5d76e` on `#282a30`)
- No consumer bottom nav or mobile gestures

---

# Relationship between Part A and Part B

Both parts share the **same data model**:

```
SplitTemplate → SplitDay → SplitDayExercise → Exercise
Workout (STANDALONE | SPLIT | MESOCYCLE) → WorkoutExercise → Set
```

| Surface | Who | Purpose |
|---------|-----|---------|
| Admin template manager | Operator | Top-down system catalog |
| Routine builder | User | Bottom-up personal routines |
| Empty freestyle | User | Minimal path, no template |
| Template editor (`/templates/[id]/edit`) | User | Fork of system template |

**Design implication:** Exercise editor card, experience chip, day accordion, and program summary card must look **identical** across admin and consumer — only layout density differs.

---

# Deliverables (request from Stitch)

Produce **high-fidelity desktop mocks** for:

### Consumer (Part A)
1. Dashboard two-column with freestyle secondary CTA + routines column
2. Start workout modal (3 options)
3. Freestyle workout — empty state
4. Freestyle workout — populated (2 exercises)
5. Routine builder — Step 4 (exercise editor with day tabs)
6. Routine builder — Step 5 (review)
7. My Routines table page
8. History with session type badges + filters

### Admin (Part B)
9. Admin shell with sidebar (templates section active)
10. Admin dashboard stat cards + activity table
11. Template manager master-detail (template selected, day 1 exercises visible)
12. Exercise library table + edit drawer open
13. Catalog sync page

### Component spec sheet (optional 14th frame)
- `ProgramSummaryCard`
- `ExperienceLevelChip`
- `SessionTypeBadge`
- `TrainingDayAccordion`
- `ExerciseEditorCard`
- `AdminSidebar`
- `AdminDataTable`
- Primary / Secondary / Destructive buttons at exact token values

---

# Explicit exclusions

- Do **not** redesign mobile bottom navigation
- Do **not** redesign mesocycle block flow (reference `STITCH_PROGRAM_PAGES_PROMPT.md` only)
- Do **not** change workout set-input interaction patterns — match existing execution page
- Do **not** invent new colours outside the token set
- Do **not** use Tailwind class names in deliverables — specify hex values inline

---

# Reference: existing consumer pages (do not redesign in this pass)

- `/mesocycles`, `/mesocycles/new`, `/mesocycles/[id]` — see `STITCH_PROGRAM_PAGES_PROMPT.md`
- `/workout/[id]` — execution reference for set logging UI
- `/exercises` — exercise search/browse for add-exercise drawer content

---

# Footnote (optional in deliverable)

Mobile simplification: Dashboard stacks single column; admin is desktop-only with "Not available on mobile" gate; routine builder becomes full-screen steps; tables become card lists.
