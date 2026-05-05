# Kinetiq App Styling Audit

Reference baseline: `DESIGN_SYSTEM.md` (derived from `app/templates/page.tsx`).
Audit scope: all `page.tsx` routes under `app/`.

## Page-by-page audit

| Route | File | Status | Notes |
|---|---|---|---|
| `/` | `app/page.tsx` | matches brand | Route shell/redirect entry, no standalone visual system to standardize. |
| `/templates` | `app/templates/page.tsx` | matches brand | Baseline reference implementation for tokens, spacing rhythm, and card/header patterns. |
| `/dashboard` | `app/dashboard/page.tsx` | has issues | Uses non-token surface color `#1a1c22`; spacing rhythm differs from template shell (`paddingBottom: 110` pattern not consistently applied). |
| `/workout/[id]` | `app/workout/[id]/page.tsx` | has issues | Uses non-token palette values (`#ff6b6b`, `#6cd68f`, `#ff7ac8`, `#f5d76e`, `#ffb4ab`, `#1a1c22`); includes top-right timer icon despite design spec to remove it; card/spacing style diverges from standard card shell. |
| `/mesocycles` | `app/mesocycles/page.tsx` | has issues | Mixed token and non-token text color (`#444650`); inconsistent page shell spacing versus template reference. |
| `/mesocycles/new` | `app/mesocycles/new/page.tsx` | has issues | Uses non-token muted text `#444650` and error `#ffb4ab`; form spacing and section rhythm not fully aligned with template shell/card spacing. |
| `/mesocycles/[id]` | `app/mesocycles/[id]/page.tsx` | has issues | Uses non-token colors (`#002c70`, `#1a1c20`, `#282a2e`, `#444650`, `#ffb4ab`); typography and spacing inconsistent with baseline cards and heading scale. |
| `/analytics` | `app/analytics/page.tsx` | has issues | Typography not consistently using explicit Space Grotesk/Manrope pattern; page shell/header composition diverges from baseline. |
| `/history` | `app/history/page.tsx` | has issues | Header/typography pattern inconsistent with baseline page shell; font usage not standardized to explicit heading/body roles. |
| `/notifications` | `app/notifications/page.tsx` | has issues | Typography and card rhythm do not consistently follow templates shell/tokens despite matching dark palette family. |
| `/profile` | `app/profile/page.tsx` | has issues | Uses non-token muted text `#444650`; heading typography does not consistently follow Space Grotesk role. |
| `/more` | `app/more/page.tsx` | has issues | Uses non-token surfaces/text (`#1a1c20`, `#444650`); spacing and card treatment vary from standard card shell. |
| `/exercises` | `app/exercises/page.tsx` | has issues | Heading typography not consistently using Space Grotesk role; shell spacing and component rhythm vary from templates standard. |
| `/readiness` | `app/readiness/page.tsx` | has issues | Typography roles are inconsistent (explicit heading/body font split not consistently applied); shell spacing diverges from template rhythm. |
| `/biofeedback` | `app/biofeedback/page.tsx` | has issues | Uses non-token colors (`#002c70`, `#0a1f10`, `#1a1c20`, `#444650`); component treatment and spacing differ from standard card/input patterns. |
| `/weekly-feedback` | `app/weekly-feedback/page.tsx` | has issues | Uses many non-token colors (`#002c70`, `#0a1f10`, `#0c0e12`, `#1a1c20`, `#444650`, `#ffb4ab`); spacing and panel styling inconsistent with baseline. |
| `/auth/login` | `app/auth/login/page.tsx` | has issues | Uses non-token auth palette (`#0c0e12`, `#002c70`, `#444650`, `#ffb4ab`); needs alignment with approved auth token mapping if auth pages are standardized. |
| `/auth/register` | `app/auth/register/page.tsx` | has issues | Same non-token palette drift as login (`#0c0e12`, `#002c70`, `#444650`, `#ffb4ab`). |
| `/auth/forgot-password` | `app/auth/forgot-password/page.tsx` | has issues | Same non-token palette drift (`#0c0e12`, `#002c70`, `#444650`). |
| `/auth/reset-password` | `app/auth/reset-password/page.tsx` | has issues | Same non-token palette drift (`#0c0e12`, `#002c70`, `#444650`, `#ffb4ab`). |
| `/onboarding` | `app/onboarding/page.tsx` | has issues | Typography and spacing do not clearly conform to template heading/body tokenized pattern. |
| `/welcome` | `app/welcome/page.tsx` | has issues | Uses non-token colors (`#0c0e12`, `#002c70`, `#444650`); shell spacing/typography diverge from baseline onboarding/auth family rules. |
| `/how-it-works` | `app/how-it-works/page.tsx` | has issues | Uses non-token colors (`#002c70`, `#1a1c20`, `#444650`); typography/layout rhythm diverges from baseline onboarding/auth family. |

## Global Patterns

- Color token drift:
  - Repeated non-token values across pages: `#444650`, `#0c0e12`, `#1a1c20`, `#1a1c22`, `#002c70`, `#ffb4ab`.
  - Workout page introduces additional non-system accent colors for muscle groups (`#ff6b6b`, `#6cd68f`, `#ff7ac8`, `#f5d76e`).
- Typography inconsistency:
  - Some pages explicitly use Space Grotesk + Manrope roles, others rely on inherited/default styles or inconsistent heading/body mapping.
  - Heading hierarchy and letter-spacing scale varies noticeably from templates baseline.
- Spacing inconsistency:
  - Baseline shell spacing (`maxWidth: 600`, `padding: 26px 16px 0`, `paddingBottom: 110`) is not consistently applied.
  - Card padding/radius/gap cadence differs by route (especially workout, analytics, history, and auth stack).
- Component pattern drift:
  - Not all pages follow the same card border/left-accent treatment.
  - Header pattern differs across routes; some do not match sticky glass header composition from design system.
  - Execution screen (`/workout/[id]`) includes UI elements explicitly flagged by design spec (top-right timer icon).

## Recommended Fix Order

1. `/dashboard`
2. `/workout/[id]`
3. `/mesocycles`
4. `/mesocycles/new`
5. `/mesocycles/[id]`
6. `/templates` (only if drift is introduced elsewhere; currently baseline)
7. `/analytics`
8. `/history`
9. `/notifications`
10. `/profile`
11. `/more`
12. `/auth/*`
13. `/onboarding`
14. `/readiness`
15. `/biofeedback`
16. `/weekly-feedback`

## Notes for approval

- This is an audit only; no UI implementation changes were made.
- Build-reliability caveat remains valid: if global web fonts were intentionally removed for offline/stable builds, do not reintroduce network-dependent Google font loading.
