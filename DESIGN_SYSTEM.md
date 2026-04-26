# KINETIQ DESIGN SYSTEM
> Source of truth for all UI decisions across `kinetiq-app`.
> Every token, pattern, and rule in this document is derived directly from `app/templates/page.tsx` — the visual reference standard.
> **Rule: If it is not in this document, ask before building it.**

---

## 1. COLOUR TOKENS

These are the exact values used in the Templates page `C` object. Every page must reference these values — never hardcode a one-off colour.

```ts
// Copy this object into any page that needs colours.
// Long term: move to a shared lib/tokens.ts and import everywhere.
const C = {
  primary:          '#b1c5ff',   // Blue-lavender. Headings, active states, primary CTAs.
  primaryContainer: '#002560',   // Deep blue. Rarely used directly.
  secondary:        '#d4bbff',   // Soft purple. Secondary labels, accents.
  tertiary:         '#59d8de',   // Teal. Active nav, highlights, engine indicators.
  surface:          '#111318',   // Page background. Always the outermost bg.
  surfaceLow:       '#161820',   // Slightly lifted surface. Input fields, info rows.
  surfaceContainer: '#1e2026',   // Cards, modals, expandable panels.
  surfaceHigh:      '#282a30',   // Chips, stat pills, icon backgrounds.
  surfaceHighest:   '#32343c',   // Highest elevation. Rarely needed.
  outline:          '#8e909c',   // Muted labels, icons, section headers.
  outlineVariant:   '#3a3c44',   // Borders, dividers, separators.
  onSurface:        '#e2e2e8',   // Primary text.
  onSurfaceVariant: '#c5c6d2',   // Secondary/body text.
  glass:            'rgba(22,24,32,0.80)', // Sticky header background.
};
```

### Accent system
Three accent colours map to template/card types. Use `accentKey` to look up:
```ts
const ACCENT: Record<string, string> = {
  primary:   '#b1c5ff',
  secondary: '#d4bbff',
  tertiary:  '#59d8de',
};
```

### Day / series colours
For ordered lists of days, phases, or sequential items:
```ts
const DAY_COLORS = ['#b1c5ff', '#59d8de', '#d4bbff', '#a2e7ff'];
```

---

## 2. TYPOGRAPHY

### Fonts
| Role | Font | Usage |
|---|---|---|
| Display / Headings | `Space Grotesk, sans-serif` | Page titles, card names, hero text, CTAs |
| Body / UI | `Manrope, sans-serif` | Body copy, labels, inputs, nav, chips |

**Never use system-ui or any other font.** Both fonts must be loaded globally in `app/layout.tsx`.

### Scale (extracted from Templates page)

| Token | Size | Weight | Usage |
|---|---|---|---|
| Micro label | `0.57rem` | 700 | Section headers, page category labels. ALL CAPS. Letter-spacing: `0.22–0.24em` |
| Caption | `0.52rem` | 700 | Stat labels inside cards. ALL CAPS. Letter-spacing: `0.16–0.2em` |
| Body small | `11px` | 500–800 | Stat values, day pills, sub-labels |
| Body | `12–13px` | 500 | Descriptions, body copy, input text |
| Card title | `clamp(1.1rem,4vw,1.3rem)` | 800 | Standard card headings |
| Page title | `clamp(1.85rem,6vw,2.4rem)` | 900 | H1 page titles only |
| Heading 2 | `18px` | 800 | Section headings within a page (e.g. "Library") |
| Logo | `20px` | 900 | Header logo text only |

### Logo — exact implementation
The logo is a text element, not an image. The word `Kinetiq` uses a gradient, with the final letter `Q` rendered in teal (`#59d8de`).

```tsx
// components/KinetiqLogo.tsx — EXACT IMPLEMENTATION
// Do NOT change font, size, weight, or gradient. Only the Q colour is teal.
function KinetiqLogo() {
  return (
    <span style={{
      fontFamily: 'Space Grotesk, sans-serif',
      fontWeight: 900,
      fontSize: 20,
      letterSpacing: '-0.04em',
    }}>
      <span style={{
        background: 'linear-gradient(90deg, #b1c5ff, #d4bbff)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
      }}>
        Kinetiq
      </span>
    </span>
  );
}

// NOTE: The "Q" teal treatment is done by splitting the word:
// "Kinetiq" → "Kinetiق" is NOT split in current templates page.
// To add teal Q: render "Kineti" with the gradient, then "q" in color #59d8de.
// Implementation:
function KinetiqLogoWithTealQ() {
  return (
    <span style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 900, fontSize: 20, letterSpacing: '-0.04em' }}>
      <span style={{ background: 'linear-gradient(90deg, #b1c5ff, #d4bbff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
        Kineti
      </span>
      <span style={{ color: '#59d8de' }}>q</span>
    </span>
  );
}
```

---

## 3. SPACING

All spacing is inline. Use these values consistently:

| Token | Value | Usage |
|---|---|---|
| Page horizontal padding | `16–20px` | Outer page container sides |
| Page max-width | `600px` | All pages: `maxWidth: 600, margin: '0 auto'` |
| Page bottom padding | `110px` | Clears the bottom nav: `paddingBottom: 110` |
| Card padding | `16–18px` | Internal card padding |
| Gap between cards | `12px` | `gap: 12` in card lists |
| Section gap | `22–28px` | Space between major page sections |
| Border radius — page card | `16px` | Main cards |
| Border radius — inner element | `8–12px` | Chips, inputs, inner panels |
| Border radius — pill | `100px` | Filter chips, badges |

---

## 4. COMPONENTS

### 4.1 Sticky Glass Header
Used on every main app page. **Do not deviate from this structure.**

```tsx
<header style={{
  position: 'sticky', top: 0, zIndex: 40,
  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  padding: '0 20px', height: 58,
  background: 'rgba(22,24,32,0.80)',
  backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
  borderBottom: '1px solid #3a3c44',
}}>
  <KinetiqLogoWithTealQ />
  {/* Right slot: page-specific icon (search, bell, etc.) */}
  <button style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 6 }}>
    {/* Icon here */}
  </button>
</header>
```

**Rules:**
- Logo always on the left
- One icon button on the right (search OR bell — never both unless the page requires it)
- Height is always `58px`
- `zIndex: 40` — modals and bottom sheets use `zIndex: 60`
- This header is rendered per-page, NOT in layout.tsx (because some pages like auth/onboarding hide it)
- The `AppHeader.tsx` component in `/components/` should be updated to match this exactly

---

### 4.2 Primary Button

```tsx
<button style={{
  width: '100%',           // or flex:1 when side-by-side
  padding: '13–15px 0',
  borderRadius: 12,
  border: 'none',
  background: 'linear-gradient(135deg, #b1c5ff 0%, #3a5cbf 100%)',
  color: '#05080f',
  fontFamily: 'Space Grotesk, sans-serif',
  fontWeight: 900,
  fontSize: 13,            // 15px for modal CTAs
  letterSpacing: '0.01em',
  cursor: 'pointer',
}}>
  Action Label →
</button>
```

**Rules:**
- Always dark text (`#05080f`) on the gradient — never white
- Arrow `→` suffix on all primary CTAs
- Font: Space Grotesk, weight 900
- Use `fontSize: 15` only in bottom-sheet modals (larger touch area)

---

### 4.3 Secondary Button (Ghost)

```tsx
<button style={{
  flex: 1,
  padding: '13px 0',
  borderRadius: 12,
  border: '1px solid #3a3c44',
  background: 'transparent',
  color: '#c5c6d2',
  fontFamily: 'Manrope, sans-serif',
  fontWeight: 700,
  fontSize: 13,
  cursor: 'pointer',
}}>
  Label
</button>
```

**Rules:**
- Always transparent background
- Border: `1px solid #3a3c44` (outlineVariant)
- Text: `#c5c6d2` (onSurfaceVariant)
- Font: Manrope, weight 700
- Never use a gradient on secondary buttons

---

### 4.4 Card — Standard

```tsx
<div style={{
  background: '#1e2026',               // surfaceContainer
  border: '1px solid #3a3c44',         // outlineVariant
  borderLeft: '3px solid ACCENT_COLOR',// accent left border — use template/card accent
  borderRadius: 16,
  // Optional glow when expanded:
  boxShadow: '0 0 30px -10px rgba(R,G,B,0.22)',
}}>
  {/* content */}
</div>
```

**Rules:**
- All cards have a 3px left accent border in the card's accent colour
- `borderRadius: 16` always
- Inner content padding: `16–18px`
- No shadow by default; shadow only on expanded/active state

---

### 4.5 Info Panel / Expandable Row

The expand pattern from `StandardCard` — used for any collapsible content across the app:

```tsx
// Trigger (always the card header):
<div style={{ cursor: 'pointer' }} onClick={onToggle}>
  {/* visible content */}
  <div style={{
    width: 30, height: 30, borderRadius: 8,
    background: expanded ? `rgba(R,G,B,0.15)` : '#282a30',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0, marginLeft: 10,
  }}>
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none"
      style={{ transform: expanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.25s ease' }}>
      <path d="M2 4.5L6.5 9L11 4.5" stroke={expanded ? ACCENT : '#8e909c'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  </div>
</div>

// Expanded content panel:
{expanded && (
  <div style={{ padding: '0 16px 16px', borderTop: '1px solid #3a3c44', paddingTop: 14 }}>
    {/* content */}
  </div>
)}
```

**Rules:**
- Chevron icon only — no text label on the expand trigger
- Chevron rotates 180° when open (CSS transition `0.25s ease`)
- Chevron colour: accent when open, `#8e909c` (outline) when closed
- Expanded panel separated by `borderTop: 1px solid #3a3c44`
- This is the ONLY expand/collapse pattern. No accordions, no `<details>` tags.

---

### 4.6 Info Icon (i)

Used on cards to trigger a detail modal. Standard across all pages.

```tsx
function InfoIcon({ color = '#8e909c' }: { color?: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="6.5" stroke={color} strokeWidth="1.4"/>
      <path d="M8 7v4" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
      <circle cx="8" cy="5.5" r="0.75" fill={color}/>
    </svg>
  );
}
```

**Decision:** Use the `(i)` InfoIcon as the standard. Do not use a download arrow. The `(i)` is already implemented and used consistently in Templates.

**Placement:** Top-right of cards. Button wrapper:
```tsx
<button style={{
  background: 'none', border: 'none', cursor: 'pointer',
  padding: 4, display: 'flex', alignItems: 'center', justifyContent: 'center',
}}>
  <InfoIcon color="#8e909c" />
</button>
```

---

### 4.7 Bottom Sheet Modal

Used for detail views triggered by the Info icon. Standard pattern:

```tsx
// Outer overlay — click to close
<div style={{ position: 'fixed', inset: 0, zIndex: 60, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}
  onClick={onClose}>

  {/* Backdrop blur */}
  <div style={{ position: 'absolute', inset: 0, background: 'rgba(8,10,16,0.85)', backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)' }} />

  {/* Sheet */}
  <div onClick={e => e.stopPropagation()} style={{
    position: 'relative', width: '100%', maxWidth: 600,
    background: '#1e2026',
    borderRadius: '20px 20px 0 0',
    maxHeight: '88vh', overflowY: 'auto',
    border: '1px solid #3a3c44', borderBottom: 'none',
  }}>
    {/* Drag handle */}
    <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 0' }}>
      <div style={{ width: 40, height: 4, borderRadius: 2, background: '#3a3c44' }} />
    </div>
    {/* content */}
  </div>
</div>
```

---

### 4.8 Search Bar

Used on Templates. Use this exact pattern on any page that needs search:

```tsx
<div style={{ position: 'relative', marginBottom: 14 }}>
  <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }}>
    <SearchIcon size={16} color="#8e909c" />
  </span>
  <input
    placeholder="Search…"
    value={search}
    onChange={e => setSearch(e.target.value)}
    style={{
      width: '100%', boxSizing: 'border-box',
      background: '#161820',
      border: '1px solid #3a3c44',
      borderRadius: 12,
      padding: '12px 14px 12px 40px',
      color: '#e2e2e8',
      fontFamily: 'Manrope, sans-serif', fontSize: 14, outline: 'none',
    }}
  />
</div>
```

---

### 4.9 Filter Chips

Horizontal scroll row of filter buttons:

```tsx
<div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4, marginBottom: 12, msOverflowStyle: 'none' }}>
  {filters.map(label => {
    const active = label === activeFilter;
    return (
      <button key={label} onClick={() => setActiveFilter(label)} style={{
        flexShrink: 0, padding: '7px 16px', borderRadius: 100,
        border: active ? 'none' : '1px solid #3a3c44',
        background: active ? '#b1c5ff' : 'transparent',
        color: active ? '#05080f' : '#c5c6d2',
        fontSize: '0.72rem', fontFamily: 'Manrope, sans-serif',
        fontWeight: 700, letterSpacing: '0.05em',
        cursor: 'pointer', whiteSpace: 'nowrap',
        transition: 'all 0.18s ease',
      }}>
        {label}
      </button>
    );
  })}
</div>
```

---

### 4.10 Stat Pill / Mini Stat

Inside cards, for showing quick stats:

```tsx
<div style={{ background: '#282a30', borderRadius: 7, padding: '5px 9px' }}>
  <span style={{ display: 'block', fontSize: '0.5rem', letterSpacing: '0.16em', textTransform: 'uppercase', color: '#8e909c', fontWeight: 700 }}>
    LABEL
  </span>
  <span style={{ display: 'block', fontSize: 11, fontWeight: 800, color: '#c5c6d2', marginTop: 2 }}>
    Value
  </span>
</div>
```

---

### 4.11 Section Label (micro heading)

```tsx
function SectionLabel({ text }: { text: string }) {
  return (
    <p style={{
      margin: '0 0 10px',
      fontSize: '0.57rem',
      letterSpacing: '0.22em',
      textTransform: 'uppercase',
      color: '#8e909c',
      fontWeight: 700,
    }}>
      {text}
    </p>
  );
}
```

---

### 4.12 Day / Tag Pill

Coloured pills for workout days, muscle groups, tags:

```tsx
<span style={{
  fontSize: 10, fontWeight: 700,
  color: COLOR,
  background: `rgba(R,G,B,0.1)`,
  borderRadius: 5,
  padding: '3px 8px',
}}>
  Label
</span>
```

---

## 5. PAGE LAYOUT SHELL

Every main app page uses this exact shell. Do not deviate:

```tsx
<div style={{
  minHeight: '100vh',
  background: '#111318',       // surface
  color: '#e2e2e8',            // onSurface
  fontFamily: 'Manrope, sans-serif',
  paddingBottom: 110,          // clears bottom nav
  overflowX: 'hidden',
}}>
  {/* Sticky glass header */}
  <header>...</header>

  {/* Page content */}
  <div style={{ maxWidth: 600, margin: '0 auto', padding: '26px 16px 0' }}>
    {/* Micro label */}
    <p style={{ margin: '0 0 6px', color: '#8e909c', fontSize: '0.57rem', letterSpacing: '0.24em', textTransform: 'uppercase', fontWeight: 700 }}>
      PAGE CATEGORY
    </p>
    {/* Page title */}
    <h1 style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 900, fontSize: 'clamp(1.85rem,6vw,2.4rem)', letterSpacing: '-0.045em', lineHeight: 1.05, color: '#e2e2e8', margin: '0 0 10px' }}>
      Page Title
    </h1>
    {/* Body content */}
  </div>
</div>
```

---

## 6. PAGES THAT HIDE THE HEADER AND NAV

These pages do NOT use the sticky glass header or bottom nav:
- `/welcome`
- `/how-it-works`
- `/auth/*` (login, register, forgot-password, reset-password)
- `/onboarding`

All other pages use the full header + bottom nav layout.

---

## 7. PAGES THAT HIDE ONLY THE BOTTOM NAV

These pages hide the bottom nav (handled in `BottomNav.tsx` via `HIDE_ON_PREFIXES`):
- `/workout/*` (execution page)
- `/biofeedback`
- `/weekly-feedback`

---

## 8. EXECUTION PAGE — SPECIFIC RULES

The workout execution page (`app/workout/[id]/page.tsx`) has its own layout because it hides the nav.

**Remove:** The timer icon/button in the top-right corner. The `DURATION` counter at the bottom of the page is sufficient — the separate timer icon is redundant.

**Keep:**
- Top bar with close (×) button on left, "WEEK X · DAY X" label centre, nothing on right (after timer removed)
- Exercise cards with SET / KG / REPS columns
- `+ ADD SET` row
- `Add exercise notes...` row
- `+ ADD EXERCISE` button
- `FINISH WORKOUT` sticky button
- `WORKOUT VOLUME` and `DURATION` bar at bottom

---

## 9. ICON STANDARDS

| Icon | SVG source | Usage |
|---|---|---|
| Search | `SearchIcon` from templates page | Header right slot on search pages |
| Info | `InfoIcon` from templates page | Card top-right info trigger |
| Close | `CloseIcon` from templates page | Modal close, back button |
| Chevron down | Inline SVG path `M2 4.5L6.5 9L11 4.5` | Expand/collapse trigger |

All icons are inline SVGs. Do not use Lucide or any icon library for these four — they are already defined in the codebase.

**Lucide is acceptable for:** Bottom nav icons only (already implemented in `BottomNav.tsx`).

---

## 10. CURSOR PROMPT RULES

When using Cursor to implement any page:

1. **Show diff before applying.** Every prompt must end with "Show me the diff. Wait for approval before applying."
2. **One file per prompt.** Never ask Cursor to touch more than one file at a time.
3. **Style only, no structure changes.** Unless a specific structural change is listed in this document, Cursor must not move, add, or remove JSX elements.
4. **No Tailwind on main pages.** The main app pages use inline styles only (matching Templates). Tailwind is only used in `BottomNav.tsx` — do not mix the two.
5. **No new components without approval.** All shared UI primitives must exist before they are used.

---

## 11. PAGE-BY-PAGE IMPLEMENTATION ORDER

Work through these in order. Complete and approve each page before starting the next.

| Priority | Page | File | Key changes |
|---|---|---|---|
| 1 | **Logo** | `components/KinetiqLogo.tsx` | Implement teal Q version. Used everywhere. |
| 2 | **App Header** | `components/AppHeader.tsx` | Match sticky glass header exactly. Logo left, icon right. |
| 3 | **Dashboard** | `app/dashboard/page.tsx` | Apply page shell, section labels, card styles. Logo from component. |
| 4 | **Mesocycles list** | `app/mesocycles/page.tsx` | Cards with left accent border, info icon, consistent spacing. |
| 5 | **Create Block** | `app/mesocycles/new/page.tsx` | Input fields, dropdowns, primary button at bottom. |
| 6 | **Mesocycle detail** | `app/mesocycles/[id]/page.tsx` | Volume targets list, progress bar, primary CTA. |
| 7 | **Execution page** | `app/workout/[id]/page.tsx` | Remove timer icon top-right. Style exercise cards to match token set. |
| 8 | **History** | `app/history/page.tsx` | Card list, section labels, consistent spacing. |
| 9 | **Analytics** | `app/analytics/page.tsx` | Section labels, stat grids, consistent card style. |
| 10 | **Notifications** | `app/notifications/page.tsx` | Card list with left border accent. (deferred — do last) |
| 11 | **Auth pages** | `app/auth/*` | Inputs, primary button. No header/nav. |
| 12 | **Profile / More** | `app/profile`, `app/more` | Lowest priority. Style last. |

---

## 12. REUSABLE CURSOR PROMPT TEMPLATE

Copy this for each page. Replace `[PAGE]`, `[FILE]`, and `[SPECIFIC CHANGES]`.

```
I am styling [PAGE] to match the Kinetiq design system.
Reference file: app/templates/page.tsx

RULES — follow exactly:
- Use inline styles only. No Tailwind on this page.
- Do NOT move, add, or remove any JSX elements or functionality.
- Do NOT change any state, hooks, API calls, or event handlers.
- Style only: background colours, text colours, font families, font sizes, font weights, border radius, padding, gap, border colours.

Colour values to use:
  surface:          #111318
  surfaceLow:       #161820
  surfaceContainer: #1e2026
  surfaceHigh:      #282a30
  outline:          #8e909c
  outlineVariant:   #3a3c44
  onSurface:        #e2e2e8
  onSurfaceVariant: #c5c6d2
  primary:          #b1c5ff
  secondary:        #d4bbff
  tertiary:         #59d8de

Page shell:
  minHeight: 100vh, background: #111318, color: #e2e2e8,
  fontFamily: Manrope, paddingBottom: 110, overflowX: hidden
  Inner container: maxWidth: 600, margin: 0 auto, padding: 26px 16px 0

Card style:
  background: #1e2026, border: 1px solid #3a3c44, borderRadius: 16, padding: 16–18px

Primary button:
  background: linear-gradient(135deg, #b1c5ff 0%, #3a5cbf 100%)
  color: #05080f, fontFamily: Space Grotesk, fontWeight: 900, borderRadius: 12

Secondary button:
  background: transparent, border: 1px solid #3a3c44
  color: #c5c6d2, fontFamily: Manrope, fontWeight: 700, borderRadius: 12

[SPECIFIC CHANGES for this page]:
[list any page-specific removals or additions here]

Open [FILE].
Show me the full diff of every change you plan to make.
Do NOT apply anything until I approve.
```