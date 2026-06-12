# Stitch AI Prompt — Template Edit Exercise Cards

Redesign exercise cards on `/templates/[id]/edit`. Match workout execution visual language exactly on the axes below. Layout composition within the card is open.

## Brand & tokens
Same as `STITCH_EXERCISES_PROMPT.md` and `lib/design/workoutTokens.ts`.

## Card shell
- Background `#1e2026`, border `1px solid #3a3c44`, radius `16px`
- Left muscle accent `3px solid` (muscle-group color from exercise primary muscle)
- Padding `16px`, internal gap `12px`

## Typography
- Exercise name: Space Grotesk 800, ~0.95rem
- Metadata line (muscle group): Manrope 500, 0.65rem uppercase, `#8e909c`
- Field labels (Sets, Min Reps, Max Reps, RPE): Manrope 700, 0.55rem uppercase

## Inline editable fields
- Sets, Min Reps, Max Reps, RPE as centered numeric inputs
- Background `#161820`, border `1px solid #3a3c44`, radius `10px`
- Space Grotesk 800, 1rem, text-align center
- Tab order: Sets → Min Reps → Max Reps → RPE
- No modals or steppers for editing

## Delete control
- Top-right of card
- Icon: trash (lucide-style)
- Inline confirmation on card: "Remove?" with Yes / No — no full-screen modal

## Spacing
Match workout execution card density: padding 16px, field grid gap 12px.

## Open decisions (your creativity)
- Whether fields are 2×2 grid or single row
- How day tabs relate visually to cards
- Add-exercise CTA placement
