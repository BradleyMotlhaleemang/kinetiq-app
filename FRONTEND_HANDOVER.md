# Kinetiq — Frontend Handover
**For:** Frontend collaborator  
**Prepared:** May 2026  
**Scope:** Biofeedback page (full build) · Analytics page (polish + states)

---

## Before You Start

**What already exists in the codebase:**
- `app/analytics/page.tsx` — 5-tab structure built with recharts charts, all API calls wired, all data fetching in place. Your job is UI polish, component quality, empty/loading/error states, and chart styling.
- `app/biofeedback/page.tsx` — page exists and submits correctly. Your job is rebuilding the input UI to be genuinely interactive and user-ready. The form logic and API calls are yours to implement cleanly.

**What you do NOT need to touch:**
- Any backend or API logic
- `lib/api/biofeedback.ts` — API client is complete
- `lib/api/exercises.ts` — not relevant to your scope
- `store/session.store.ts` or `store/auth.store.ts`
- Routing — redirects already work

**Design reference (read before writing a single line of code):**
- `app/templates/page.tsx` — the living visual reference for the entire app
- `DESIGN_SYSTEM.md` — colour tokens, spacing, component patterns, typography rules

**Tech constraints:**
- Tailwind CSS only for styling
- No new libraries without checking `package.json` first (recharts is already installed)
- Tokens stored in `sessionStorage` only — never read or write to `localStorage`
- All training values (weights, scores, engine states) come from the server — never compute or derive them in the frontend

---

## Brand Tokens (Quick Reference)

| Token | Value |
|---|---|
| Primary | `#b1c5ff` |
| Tertiary / Teal | `#59d8de` |
| Warning / Amber | `#f59e0b` |
| Danger / Red | `#ef4444` |
| Success / Green | `#22c55e` |
| Headline font | Space Grotesk |
| Body font | Manrope |

---

# Module 1 — Biofeedback Page

**Route:** `/biofeedback?workoutId=:id`  
**File:** `app/biofeedback/page.tsx`

---

## 1.1 How the User Gets Here

Two entry points:
1. Immediately after tapping "Finish Workout" on `/workout/[id]` — the redirect already happens, `workoutId` is already in the URL query param.
2. Tapping a `BIOFEEDBACK_PROMPT` push notification — also routes here with `workoutId` in the URL.

In both cases `workoutId` is available as a URL search param on mount. Read it with `useSearchParams()`.

---

## 1.2 First Thing on Mount

Before rendering any form content, fetch the pre-population data:

```
GET /api/v1/biofeedback/pre-population?workoutId=:workoutId

Response: Array<{
  muscle: string           // e.g. "CHEST", "QUADS", "LATS"
  carrySoreness: boolean   // true = unresolved soreness from prior session
  lastSorenessLabel: string | null
  lastSorenessScore: number | null  // 0 | 2 | 5 | 8
}>
```

**This array is the source of truth for which muscles appear in the soreness section.** Only render tiles for muscles in this response. If you trained Chest and Quads, only Chest and Quads appear. Never render a hardcoded full-body list.

Show a loading skeleton for the full page while this call is pending. If it fails, show a fallback (see §1.10).

---

## 1.3 Page Layout

Single scrollable page — not a stepper, not tabbed. All 6 sections are visible and scrollable. A sticky progress indicator at the top fills as the user completes each section.

```
┌────────────────────────────────────┐
│  ← Back   Post-Workout Check-in    │  ← sticky header
│  ████████░░░░  4 of 6 complete     │  ← sticky progress bar below header
├────────────────────────────────────┤
│  [1] Soreness                      │
│  [2] Joint Comfort                 │
│  [3] Session Performance           │
│  [4] Training Drive                │
│  [5] Effort Level                  │
│  [6] Pump                          │
├────────────────────────────────────┤
│  [  Submit Biofeedback  ]          │  ← sticky bottom button
└────────────────────────────────────┘
```

**Sticky progress bar:** A thin horizontal fill bar (not numbered steps) that tracks how many of the 6 categories have at least one selection. Fills from left to right as user completes sections. Brand primary colour fill, muted track.

---

## 1.4 Section 1 — Soreness (Per Muscle)

### Muscle tiles

Render one tile per muscle returned by pre-population. Use a wrapping grid (2 columns on mobile, 3 on wider screens).

**Tile anatomy:**
```
┌──────────────────┐
│  CHEST           │  ← muscle name, uppercase, Space Grotesk
│                  │
│  ○  ○  ○  ○     │  ← 4-step tap selector (see below)
│  None  →  Still  │  ← scale endpoints label
│                  │
│  ⚠ Carrying      │  ← conditional, amber, only if carrySoreness true
│    soreness      │
└──────────────────┘
```

**When `carrySoreness === true`:**
- Amber border on tile (`border-amber-400/60`)
- Small amber badge at bottom of tile: `⚠ Carrying soreness`
- The ⓘ tooltip reads: *"You had unresolved soreness in this muscle from your last session. Log it accurately — this affects your next prescription."*

### 4-step soreness selector

Four circular tap targets in a horizontal row inside each tile. Tapping one selects it — only one active at a time per tile.

| Step | Label | Value |
|---|---|---|
| 1 | No soreness | `0` |
| 2 | Healed a while ago | `2` |
| 3 | Healed just in time | `5` |
| 4 | Still sore | `8` |

Show step labels below the circles (1 and 4 only, or all 4 if space allows).

**Interaction on select:**
- Selected circle: fills with brand primary `#b1c5ff`
- Unselected: opacity drops to `0.35`
- Scale animation on selected: `scale(1.0) → scale(1.18) → scale(1.0)`, 150ms ease-out
- When step 4 ("Still sore") is selected: tile border transitions to `amber-400/60` over 250ms

**Section header tooltip (ⓘ):** *"Rate soreness from the muscles you just trained. Accurate logging is the primary input to your next prescription."*

---

## 1.5 Section 2 — Joint Comfort

### Step A: Global single-select (always visible)

Five full-width pill buttons stacked vertically:

| Label | Value | Style cue |
|---|---|---|
| Feels great | `0` | Teal accent on selected |
| Feels normal | `1` | Neutral |
| Slight discomfort | `3` | Neutral |
| Very uncomfortable | `6` | Amber tint on selected |
| Sharp / acute pain | `9` | Red tint on selected |

One selection at a time. Selected state: filled background using the appropriate cue colour at `20%` opacity with a matching border.

### Step B: Joint multi-select (conditional)

**Only render this block when the selected score is `6` or `9`.** Animate it in with a slide-down expand: `max-height: 0 → 200px`, `opacity: 0 → 1`, `translateY(-6px) → 0`, 220ms `cubic-bezier(0.16, 1, 0.3, 1)`.

Title above chips: *"Which joints are affected?"*

Seven chip buttons in a wrapping row:
```
[ SHOULDER ]  [ ELBOW ]  [ WRIST ]
[ HIP ]       [ KNEE ]   [ ANKLE ]
[ LOWER BACK ]
```

Multi-select — user can select multiple. Selected chip: brand primary `#b1c5ff` fill, dark text. Unselected: outlined.

When score ≥ 6, the section header text also transitions colour: neutral → amber over 300ms.

**Section header tooltip (ⓘ):** *"Rate your connective tissue and joint health today. Discomfort above a threshold triggers substitution logic in your next prescription."*

---

## 1.6 Sections 3–6 — Session Metrics

All four use the identical component: a **4-step icon selector**. Build it once as a shared component, used four times.

```
○    ○    ○    ●
1    2    3    4
[label]       [label]
```

On select: bubble fills brand primary, unselected go to `opacity-35`, pop scale animation (same as soreness selector).

**Show only the endpoint labels** (1 and 4) below the row unless screen space allows all four.

### Section 3 — Session Performance
**Key:** `sessionPerformance`  
Label 1: "Much worse than expected"  
Label 4: "Exceeded expectations"  
**Tooltip:** *"Compare against your own recent baseline, not a perfect session. Did your body perform as you expected?"*

### Section 4 — Training Drive
**Key:** `trainingDrive`  
Label 1: "Checked out"  
Label 4: "Locked in"  
**Tooltip:** *"Mental focus and motivation — separate from physical capacity. Low drive can indicate central nervous system fatigue."*

### Section 5 — Effort Level
**Key:** `effortScore`  
Label 1: "Comfortable, far from failure"  
Label 4: "Everything I had"  
**Tooltip:** *"Perceived exertion, not motivation. High effort at weights that felt easy last week is a reliable fatigue signal."*

### Section 6 — Pump
**Key:** `pumpScore`  
Label 1: "Nothing"  
Label 4: "Incredible"  
**Tooltip:** *"A reliable local fatigue and volume adequacy signal. Consistently low pump may suggest insufficient volume."*

---

## 1.7 Submission Payload

When the user taps Submit, post this shape:

```typescript
POST /api/v1/biofeedback

{
  workoutId: string,              // from URL param
  sorenessLog: {                  // one key per rendered muscle tile
    [muscle: string]: 0 | 2 | 5 | 8
  },
  globalJointComfortScore: 0 | 1 | 3 | 6 | 9,
  jointComfortLog: {              // empty object {} if score < 6
    [joint: string]: number       // e.g. { "KNEE": 6, "SHOULDER": 6 }
  },
  sessionPerformance: 1 | 2 | 3 | 4,
  trainingDrive: 1 | 2 | 3 | 4,
  effortScore: 1 | 2 | 3 | 4,
  pumpScore: 1 | 2 | 3 | 4
}

On 201 success: router.push('/dashboard')
On error: show inline toast error, do not navigate
```

**Note on `jointComfortLog`:** Always send an object. If no joints selected (score < 6), send `{}`. Never send `null`.

---

## 1.8 Submit Button — Contextual Animation States

The submit button reads the live form state and applies one of three visual modes. These are not decorative — they communicate a coaching signal.

### State A — Warning Pulse (Red)
**Trigger:** Either of these is true:
- `globalJointComfortScore >= 6`
- Two or more muscle tiles have soreness step 4 selected ("Still sore")

**Visual:**
```css
animation: warningPulse 1.8s ease-in-out infinite;

@keyframes warningPulse {
  0%   { box-shadow: 0 0 0 0px rgba(239, 68, 68, 0); }
  40%  { box-shadow: 0 0 0 8px rgba(239, 68, 68, 0.25); 
         background-color: rgba(239, 68, 68, 0.12); }
  100% { box-shadow: 0 0 0 0px rgba(239, 68, 68, 0); }
}
```

Button label: **"Log & Flag Recovery"**  
Tooltip on hover/long-press: *"High discomfort or significant soreness detected. Your next prescription will be adjusted accordingly."*

### State B — Green Confidence (Optimal)
**Trigger:** All of these are true:
- `globalJointComfortScore <= 1`
- `pumpScore >= 3`
- `sessionPerformance >= 3`
- No soreness tiles at step 4

**Visual:**
```css
animation: optimalFade 2.5s ease-in-out infinite;

@keyframes optimalFade {
  0%   { box-shadow: 0 0 0 0px rgba(34, 197, 94, 0); }
  50%  { box-shadow: 0 0 0 10px rgba(34, 197, 94, 0.18); }
  100% { box-shadow: 0 0 0 0px rgba(34, 197, 94, 0); }
}
```

Button label: **"Submit & Progress"**  
No tooltip — the visual is the signal.

### State C — Neutral (Default)
All other combinations. No animation. Standard button styling from design system.  
Button label: **"Submit Biofeedback"**

---

## 1.9 Validation — Incomplete Form

If the user taps Submit before all sections have a selection:

1. Scroll to the first incomplete section
2. Apply a shake animation to each incomplete tile or selector:

```css
@keyframes validationShake {
  0%   { transform: translateX(0); }
  20%  { transform: translateX(-5px); }
  40%  { transform: translateX(5px); }
  60%  { transform: translateX(-3px); }
  80%  { transform: translateX(3px); }
  100% { transform: translateX(0); }
}
/* Duration: 350ms. Fire once. Do not loop. */
```

Also apply a temporary red border on the incomplete element: `border-red-400/60` for 2 seconds, then revert.

Required selections before submit is allowed:
- All rendered muscle tiles (soreness)
- `globalJointComfortScore` (joint comfort — one of the 5 pills)
- `sessionPerformance`
- `trainingDrive`
- `effortScore`
- `pumpScore`

---

## 1.10 Edge Cases & Fallback States

| Situation | What to render |
|---|---|
| Pre-population API fails | Warning banner: *"Couldn't load your session muscles."* + render 6 generic tiles: CHEST, BACK, QUADS, HAMSTRINGS, SHOULDERS, ARMS |
| Pre-population returns empty array | Same fallback as above — should not happen in practice |
| `workoutId` missing from URL | Show error card: *"This session could not be identified. Return to your dashboard."* + "Go to Dashboard" button |
| Submit returns non-201 | Inline toast: *"Something went wrong. Please try again."* Stay on page. |

---

---

# Module 2 — Analytics Page

**Route:** `/analytics`  
**File:** `app/analytics/page.tsx`  
**Current state:** 5-tab structure built, recharts charts in place, all API calls wired. Your job is visual quality, chart styling, empty states, engine-phase states, and overall polish.

---

## 2.1 Tab Bar

Horizontally scrollable pill tabs. No clipping on mobile. Tabs:

```
Volume · Trends · Strength · Insights · SFR
```

- Active tab: brand primary `#b1c5ff` background, dark/black text, `font-medium`
- Inactive: transparent background, muted text (`text-neutral-400` or equivalent), hover state with subtle background
- The tab bar itself has no bottom border — the content below it provides visual separation

---

## 2.2 Engine Phase — Global Banner

The analytics page should communicate data-scarcity at the top level when applicable. Check the `enginePhase` field available from the strength trends data (or expose it separately). If the user is in an early engine phase, show a dismissible info banner **above the tab bar**:

| `enginePhase` | Banner text | Banner colour |
|---|---|---|
| `BASELINE` | *"Your analytics are building. Log your first few sessions to start seeing data."* | Muted / neutral |
| `CALIBRATING` | *"Calibrating to your data. Charts will sharpen over the next few sessions."* | Amber tint |
| `LEARNING` | *"Your engine is learning. Data shown reflects early estimates."* | Teal tint |
| `ACTIVE` | No banner | — |

Banner is dismissible (X button) — dismissed state held in component state (not persisted). Do not show again until page remount.

---

## 2.3 Shared Loading & Error Patterns

Every tab uses these same patterns — build them as shared components.

**Loading skeleton:**
- Match the rough shape of the actual content (bars for bar charts, lines for line charts, card shapes for lists)
- Use `animate-pulse` with a muted fill colour
- Never show a spinner in place of a chart — always use a shape-matched skeleton

**Empty state card:**
- Centred in the tab content area
- Icon (optional, use a simple lucide icon)
- Message (see per-tab copy below)
- No CTA unless a specific action helps

**Error state:**
- Brief message
- "Retry" button that re-triggers the relevant fetch
- Never expose raw error objects or network errors to the user

---

## 2.4 Tab 1 — Volume

**API:** `GET /api/v1/analytics/volume/weekly` (already called)

**Response shape:**
```typescript
Array<{
  muscle: string           // e.g. "CHEST", "FRONT_DELT"
  setsThisWeek: number
  mev: number              // minimum effective volume floor
  mrv: number              // maximum recoverable volume ceiling
  status: 'BELOW_MEV' | 'OPTIMAL' | 'ABOVE_MRV'
}>
```

**Chart:** Vertical `BarChart` (recharts). One bar per muscle.

**Bar colours by status:**
- `BELOW_MEV` → amber `#f59e0b`
- `OPTIMAL` → teal `#59d8de`
- `ABOVE_MRV` → red `#ef4444`

**X axis:** Abbreviated muscle names. Use this map:
```
CHEST → Chest
BACK → Back
FRONT_DELT → F. Delt
SIDE_DELT → S. Delt
REAR_DELT → R. Delt
QUADS → Quads
HAMSTRINGS → Hams
GLUTES → Glutes
BICEPS → Biceps
TRICEPS → Triceps
ABS → Abs
CALVES → Calves
TRAPS → Traps
```

**Tooltip on bar hover:** `"X sets this week | MEV: Y | MRV: Z"`

**MEV / MRV as reference lines:** Cannot overlay per-bar reference lines in a standard recharts BarChart. Instead, add a small legend below the chart:
```
■ Below MEV   ■ Optimal   ■ Above MRV
```
Using the same colour tokens. No additional reference line needed.

**Chart sizing:** `<ResponsiveContainer width="100%" height={260}>`

**Empty state:** *"No volume data yet. Complete your first session to start tracking."*

**Loading:** 5 skeleton bars, equal height, `animate-pulse`

---

## 2.5 Tab 2 — Trends

**API:** `GET /api/v1/analytics/volume/trends` (not currently called — add fetch)

**Response shape:**
```typescript
Array<{
  week: string                        // ISO date string (Sunday-start week)
  muscles: Record<string, number>     // muscle → set count
}>
```

**Chart:** Grouped `BarChart`. One group per week, one bar per muscle within each group.

**Week label formatting:** Parse the ISO string and format as `"May 5"`, `"May 12"` etc.

**Muscle colours:** Define a fixed 8-colour palette inline. Suggested palette (muted, distinct):
```
["#b1c5ff", "#59d8de", "#f59e0b", "#a78bfa", "#34d399", "#f87171", "#60a5fa", "#fbbf24"]
```
Assign colours to muscles in the order they first appear in the data.

**Legend:** Below the chart. Muscle name + its assigned colour swatch. Wrapping row.

**Chart sizing:** `<ResponsiveContainer width="100%" height={300}>`

**Empty state:** *"Trend data builds after two weeks of logging. Keep training consistently."*

**Loading:** Grouped skeleton bars (3 groups of 4)

---

## 2.6 Tab 3 — Strength

**API index:** `GET /api/v1/analytics/strength/trends` (already called)  
**API drill-down:** `GET /api/v1/analytics/e1rm/:exerciseId` (called on tap)

**Index response shape:**
```typescript
Array<{
  exercise: string         // exercise name
  history: Array<{
    exerciseId: string
    date: string
    bestE1rm: number
    bestWeight: number
  }>
}>
```

**Drill-down response shape:**
```typescript
Array<{
  date: string
  bestE1rm: number
  bestWeight: number
  bestReps: number
}>
```

### Index View (no exercise selected)

List of exercise cards. Each card:
- Exercise name (bold)
- Latest e1RM value: `"142 kg e1RM"` with label
- Session count from `history.length`
- Trend indicator: compare latest vs previous e1RM
  - Up arrow in teal if improving
  - Dash in muted if flat
  - Down arrow in amber if declining
- Tap → drill into that exercise

**Empty state:** *"Log more sessions to build your strength history."*

### Drill-Down View (exercise selected)

- Back button: `"← All exercises"` at top, resets to index view
- Exercise name as sub-header
- `LineChart`:
  - X axis: date formatted `"May 5"`
  - Y axis: e1RM in kg
  - One `<Line>` for `bestE1rm`, stroke `#b1c5ff`, `strokeWidth={2}`
  - Dot on each data point
  - Tooltip: date, e1RM, weight used, reps
  - `<ResponsiveContainer width="100%" height={240}>`
- Below chart: small table of the raw data points (date / weight / reps / e1RM). Optional, but adds value.

**Drill-down empty state:** *"Not enough data for this exercise yet. Log a few more sessions."*

**Loading (index):** 3 skeleton cards  
**Loading (drill-down):** Line chart skeleton (flat rectangular area)

---

## 2.7 Tab 4 — Insights

**API:** `GET /api/v1/analytics/insights` (already called)

**Response shape:**
```typescript
{
  plateaus: Array<{
    id: string
    exercise: { name: string }
    // other fields present but above are sufficient
  }>
  progressionLogs: Array<{
    id: string
    action: string        // e.g. "PROGRESS_LOAD", "HOLD_FATIGUE"
    reason: string
    exercise: { name: string }
    loggedAt: string      // ISO date
  }>
}
```

### Sub-section 1 — Plateaus Detected

Title: `"Plateaus Detected"`

Each plateau as a card:
- Exercise name
- Label: `"Plateau detected"` in amber badge
- Subtext: *"The engine has flagged stagnation here. Volume or intensity adjustment may be needed."*

**Empty:** *"No plateaus detected. Your progression is on track."* — show in a muted success-tinted card.

### Sub-section 2 — Recent Prescriptions

Title: `"Recent Engine Decisions"`

Each progression log as a row:
- Exercise name (bold)
- Action as a styled badge. Use this display map:

| Action value | Display label | Badge colour |
|---|---|---|
| `PROGRESS_LOAD` | "Progress Load" | Teal |
| `PROGRESS_REPS` | "Progress Reps" | Teal |
| `MAINTAIN` | "Maintain" | Primary blue |
| `HOLD_FATIGUE` | "Hold — Fatigue" | Amber |
| `REDUCE_VOLUME` | "Reduce Volume" | Amber |
| `REDUCE_INTENSITY` | "Reduce Intensity" | Amber |
| `DELOAD_LOCAL` | "Local Deload" | Red |
| `DELOAD_SYSTEMIC` | "Systemic Deload" | Red |
| `CALIBRATION_PHASE` | "Calibrating" | Muted |
| `RECOVERY_INTERVENTION` | "Recovery Week" | Red |

- Reason as muted small text below action badge
- Relative date: `"3 days ago"`, `"Today"`, `"Yesterday"` — use a simple relative formatter

**Show 5 most recent by default.** If more than 5 exist, show a `"View all"` text button that expands the rest inline (no navigation).

**Empty:** *"No prescription history yet."*

---

## 2.8 Tab 5 — SFR

**API:** `GET /api/v1/analytics/sfr/:exerciseId` — called for each exercise from the strength trends response.

**Fetch strategy:** Use the `exerciseId` values from the strength/trends data (already fetched). For each, call `GET /analytics/sfr/:exerciseId` in parallel via `Promise.all`. Filter out null results (SFR is null until sufficient history exists). Sort descending by `sfrScore`.

**SFR response shape:**
```typescript
{
  sfrScore: number
  stimulusAvg: number
  fatigueAvg: number
  sampleSize: number
  updatedAt: string
} | null
```

### Ranked List

Each row:
- Rank number on the left: `#1`, `#2`, `#3` — muted, smaller text
- Exercise name (bold)
- SFR score badge on the right, colour-tiered:

| Score range | Background | Meaning |
|---|---|---|
| ≥ 3.5 | Teal `#59d8de` | High quality stimulus |
| 2.5 – 3.4 | Primary `#b1c5ff` | Adequate |
| < 2.5 | Muted grey | Low efficiency |

- Below the badge: `"S: 3.2 / F: 1.1"` using `stimulusAvg` and `fatigueAvg`, tiny muted text
- Below that: `"Based on X sessions"` using `sampleSize`

### What SFR means (add a ⓘ tooltip on the section header)
*"Stimulus-to-Fatigue Ratio. A higher score means this exercise delivers more training stimulus relative to the fatigue it generates. Prioritise high-SFR exercises when volume is limited."*

**Empty state:** *"SFR scores build after several logged sessions per exercise. Keep training."*

**Loading:** 4 skeleton rows

---

## 2.9 Chart Styling — Global Rules

Apply these across all recharts instances for visual consistency:

```typescript
// Shared chart theme — define once, import where needed
const chartTheme = {
  grid: {
    stroke: 'rgba(255,255,255,0.06)',
    strokeDasharray: '3 3',
  },
  axis: {
    tick: { fill: 'rgba(255,255,255,0.4)', fontSize: 11 },
    line: { stroke: 'transparent' },
  },
  tooltip: {
    contentStyle: {
      background: 'rgba(15,15,20,0.92)',
      border: '1px solid rgba(255,255,255,0.1)',
      borderRadius: '8px',
      fontSize: '13px',
    },
    labelStyle: { color: 'rgba(255,255,255,0.6)' },
    itemStyle: { color: '#b1c5ff' },
  },
}
```

- No chart background fill — transparent or match page background
- Remove default recharts borders
- All axes use the muted tick style above
- Tooltip always uses the dark glass style above

---

## 2.10 Analytics — Checklist

### Tab bar
- [ ] Horizontally scrollable, no overflow clipping
- [ ] Active/inactive states correct
- [ ] Smooth tab switch (no flash/jump)

### Engine phase banner
- [ ] Shows for BASELINE, CALIBRATING, LEARNING
- [ ] Dismissible per session
- [ ] Hidden for ACTIVE

### Tab 1 — Volume
- [ ] BarChart renders with correct colours per status
- [ ] Abbreviated muscle names on X axis
- [ ] MEV/MRV in tooltip
- [ ] Status legend below chart
- [ ] Empty state
- [ ] Loading skeleton
- [ ] Error + retry

### Tab 2 — Trends
- [ ] New fetch for `/analytics/volume/trends`
- [ ] Grouped BarChart with week labels
- [ ] Colour-coded per muscle, consistent palette
- [ ] Legend renders correctly
- [ ] Empty state
- [ ] Loading skeleton
- [ ] Error + retry

### Tab 3 — Strength
- [ ] Index view: exercise cards with trend indicator
- [ ] Tap to drill-down works
- [ ] Back button returns to index
- [ ] Drill-down LineChart renders
- [ ] Tooltip shows date + e1RM + weight + reps
- [ ] Empty states for both views
- [ ] Loading skeletons for both views

### Tab 4 — Insights
- [ ] Plateaus sub-section with amber badge
- [ ] Plateaus empty state (success tint)
- [ ] Recent prescriptions with action badge map
- [ ] Relative timestamps
- [ ] "View all" expand works
- [ ] Empty state for prescriptions

### Tab 5 — SFR
- [ ] Parallel fetch from strength exercise IDs
- [ ] Null filtering
- [ ] Descending sort
- [ ] Score tier badge colours correct
- [ ] S/F mini-metrics visible
- [ ] Sample size visible
- [ ] Section tooltip present
- [ ] Empty state
- [ ] Loading skeleton

---

## Biofeedback — Checklist

### Foundation
- [ ] `workoutId` read from URL params on mount
- [ ] Pre-population fetch on mount
- [ ] Full-page loading skeleton while fetching
- [ ] Fallback to generic 6 muscles on fetch failure

### Progress bar
- [ ] Sticky below header
- [ ] Fills as sections are completed
- [ ] Brand primary fill colour

### Section 1 — Soreness
- [ ] Only muscles from pre-population render
- [ ] Carry-soreness badge on affected tiles
- [ ] Carry-soreness amber border on tile
- [ ] 4-step selector works (one selection per tile)
- [ ] Scale pop animation on selection
- [ ] Still-sore → amber border transition on tile

### Section 2 — Joint Comfort
- [ ] 5 pill buttons, single-select
- [ ] Amber/red tint on selected ≥ 6 value
- [ ] Joint multi-select reveals on score ≥ 6
- [ ] Slide-down reveal animation (220ms)
- [ ] Section header turns amber when score ≥ 6
- [ ] Multi-select chips work correctly

### Sections 3–6
- [ ] Shared 4-step component used consistently
- [ ] Scale pop animation on each selection
- [ ] Endpoint labels visible
- [ ] All four keys wired to form state

### Submit button
- [ ] Warning pulse (red) on joint discomfort or 2+ still-sore muscles
- [ ] Label changes to "Log & Flag Recovery" in warning state
- [ ] Optimal fade (green) on clean metrics
- [ ] Label changes to "Submit & Progress" in optimal state
- [ ] Default neutral state otherwise

### Validation
- [ ] Incomplete form cannot submit
- [ ] Shakes incomplete tiles/selectors on attempt
- [ ] Scrolls to first incomplete section
- [ ] Temporary red border on incomplete elements

### Submission
- [ ] Correct payload shape (see §1.7)
- [ ] `jointComfortLog` sends `{}` when score < 6
- [ ] On 201: navigates to `/dashboard`
- [ ] On error: inline toast, stays on page

---

## Closing Note

The backend is complete. Every API call listed in this document exists and is tested. Your job is entirely frontend — component quality, interaction design, visual polish, and state handling.

When in doubt on visual decisions, `app/templates/page.tsx` is the ground truth. Match it exactly for spacing, card styles, header patterns, and button designs. Do not introduce new design patterns that aren't represented there.

Questions about the data or backend behaviour should be directed to the backend developer before implementation, not resolved with frontend assumptions.
