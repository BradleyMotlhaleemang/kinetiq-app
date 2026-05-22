'use client';

import { useState } from 'react';

// ── COLOUR TOKENS ────────────────────────────────────────────────
const C = {
  primary:          '#b1c5ff',
  secondary:        '#d4bbff',
  tertiary:         '#59d8de',
  surface:          '#111318',
  surfaceLow:       '#161820',
  surfaceContainer: '#1e2026',
  surfaceHigh:      '#282a30',
  surfaceHighest:   '#32343c',
  outline:          '#8e909c',
  outlineVariant:   '#3a3c44',
  onSurface:        '#e2e2e8',
  onSurfaceVariant: '#c5c6d2',
  glass:            'rgba(22,24,32,0.80)',
  amber:            '#ffb347',
  red:              '#ff6b6b',
  green:            '#59d8a0',
};

const DAY_COLORS = ['#b1c5ff', '#59d8de', '#d4bbff', '#a2e7ff'];

function hexToRgb(hex: string): string {
  const r = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!r) return '177,197,255';
  return `${parseInt(r[1],16)},${parseInt(r[2],16)},${parseInt(r[3],16)}`;
}

// ── LOGO ─────────────────────────────────────────────────────────
function KinetiqLogoWithTealQ() {
  return (
    <span style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 900, fontSize: 20, letterSpacing: '-0.04em' }}>
      <span style={{ background: 'linear-gradient(90deg, #b1c5ff, #d4bbff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Kineti</span>
      <span style={{ color: '#59d8de' }}>q</span>
    </span>
  );
}

// ── EXPANDABLE FAQ ────────────────────────────────────────────────
function FaqCard({ q, a, accent, index }: { q: string; a: string; accent: string; index: number }) {
  const [open, setOpen] = useState(false);
  return (
    <div
      style={{
        background: C.surfaceContainer,
        border: `1px solid ${open ? accent : C.outlineVariant}`,
        borderLeft: `3px solid ${accent}`,
        borderRadius: 16,
        overflow: 'hidden',
        transition: 'border-color 0.2s ease',
        boxShadow: open ? `0 0 28px -8px rgba(${hexToRgb(accent)}, 0.18)` : 'none',
      }}
    >
      {/* Header */}
      <div
        onClick={() => setOpen(o => !o)}
        style={{ cursor: 'pointer', padding: '16px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
          {/* Number badge */}
          <div style={{
            width: 26, height: 26, borderRadius: 8, flexShrink: 0,
            background: open ? `rgba(${hexToRgb(accent)}, 0.15)` : C.surfaceHigh,
            border: `1px solid ${open ? accent : C.outlineVariant}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all 0.2s',
          }}>
            <span style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 10, fontWeight: 900, color: open ? accent : C.outline }}>{String(index + 1).padStart(2, '0')}</span>
          </div>
          <p style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 800, fontSize: 13, color: open ? C.onSurface : C.onSurfaceVariant, margin: 0, letterSpacing: '-0.01em', lineHeight: 1.35, transition: 'color 0.2s', paddingTop: 3 }}>
            {q}
          </p>
        </div>
        {/* Chevron */}
        <div style={{ width: 28, height: 28, borderRadius: 8, background: open ? `rgba(${hexToRgb(accent)}, 0.12)` : C.surfaceHigh, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'background 0.2s' }}>
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none" style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.25s ease' }}>
            <path d="M2 4.5L6.5 9L11 4.5" stroke={open ? accent : C.outline} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      </div>
      {/* Body */}
      {open && (
        <div style={{ padding: '0 16px 16px', borderTop: `1px solid ${C.outlineVariant}`, paddingTop: 14 }}>
          <p style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 500, fontSize: 13, color: C.onSurfaceVariant, margin: 0, lineHeight: 1.7 }}>{a}</p>
        </div>
      )}
    </div>
  );
}

// ── FUN FACT CARD ─────────────────────────────────────────────────
function FunFactCard({ emoji, title, body, accent }: { emoji: string; title: string; body: string; accent: string }) {
  const [flipped, setFlipped] = useState(false);
  return (
    <div
      onClick={() => setFlipped(f => !f)}
      style={{
        background: flipped ? `rgba(${hexToRgb(accent)}, 0.08)` : C.surfaceContainer,
        border: `1px solid ${flipped ? accent : C.outlineVariant}`,
        borderLeft: `3px solid ${accent}`,
        borderRadius: 16,
        padding: '18px 16px',
        cursor: 'pointer',
        transition: 'all 0.25s ease',
        boxShadow: flipped ? `0 0 24px -8px rgba(${hexToRgb(accent)}, 0.22)` : 'none',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Tap hint — only when not flipped */}
      {!flipped && (
        <div style={{ position: 'absolute', top: 10, right: 12 }}>
          <span style={{ fontSize: '0.52rem', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: C.outline }}>tap</span>
        </div>
      )}
      <div style={{ fontSize: 28, marginBottom: 10, lineHeight: 1 }}>{emoji}</div>
      <p style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 900, fontSize: 13, color: flipped ? accent : C.onSurface, margin: '0 0 6px', letterSpacing: '-0.01em', transition: 'color 0.2s' }}>{title}</p>
      <p style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 500, fontSize: 12, color: flipped ? C.onSurfaceVariant : C.outline, margin: 0, lineHeight: 1.6, transition: 'color 0.2s' }}>
        {flipped ? body : 'Tap to reveal the science.'}
      </p>
    </div>
  );
}

// ── STAT HIGHLIGHT ────────────────────────────────────────────────
function StatHighlight({ value, label, sub, accent }: { value: string; label: string; sub: string; accent: string }) {
  return (
    <div style={{
      background: C.surfaceContainer,
      border: `1px solid ${C.outlineVariant}`,
      borderLeft: `3px solid ${accent}`,
      borderRadius: 16,
      padding: '16px',
      flex: 1,
      minWidth: 0,
    }}>
      <p style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 900, fontSize: 28, color: accent, margin: 0, letterSpacing: '-0.05em', lineHeight: 1 }}>{value}</p>
      <p style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 800, fontSize: 12, color: C.onSurface, margin: '6px 0 3px', letterSpacing: '-0.01em' }}>{label}</p>
      <p style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 500, fontSize: 11, color: C.outline, margin: 0, lineHeight: 1.4 }}>{sub}</p>
    </div>
  );
}

// ── MYTH CARD ─────────────────────────────────────────────────────
function MythCard({ myth, truth }: { myth: string; truth: string }) {
  const [revealed, setRevealed] = useState(false);
  return (
    <div style={{ background: C.surfaceContainer, border: `1px solid ${C.outlineVariant}`, borderRadius: 16, overflow: 'hidden' }}>
      {/* Myth */}
      <div style={{ padding: '14px 16px', borderBottom: `1px solid ${C.outlineVariant}`, display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        <span style={{ fontSize: '0.52rem', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: C.red, background: `rgba(${hexToRgb(C.red)},0.1)`, borderRadius: 5, padding: '3px 8px', flexShrink: 0, marginTop: 1 }}>MYTH</span>
        <p style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 800, fontSize: 13, color: C.onSurface, margin: 0, letterSpacing: '-0.01em', lineHeight: 1.4, textDecoration: 'line-through', textDecorationColor: `rgba(${hexToRgb(C.red)},0.5)` }}>{myth}</p>
      </div>
      {/* Truth trigger */}
      <div
        onClick={() => setRevealed(r => !r)}
        style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', background: revealed ? `rgba(${hexToRgb(C.green)},0.05)` : 'transparent', transition: 'background 0.2s' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: '0.52rem', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: C.green, background: `rgba(${hexToRgb(C.green)},0.1)`, borderRadius: 5, padding: '3px 8px' }}>TRUTH</span>
          {!revealed && <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: 12, fontWeight: 600, color: C.outline }}>Tap to reveal →</span>}
        </div>
        <div style={{ width: 26, height: 26, borderRadius: 8, background: revealed ? `rgba(${hexToRgb(C.green)},0.12)` : C.surfaceHigh, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none" style={{ transform: revealed ? 'rotate(180deg)' : 'none', transition: 'transform 0.25s ease' }}>
            <path d="M2 4.5L6.5 9L11 4.5" stroke={revealed ? C.green : C.outline} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      </div>
      {revealed && (
        <div style={{ padding: '0 16px 14px', paddingTop: 4 }}>
          <p style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 500, fontSize: 13, color: C.onSurfaceVariant, margin: 0, lineHeight: 1.7 }}>{truth}</p>
        </div>
      )}
    </div>
  );
}

// ── DATA ─────────────────────────────────────────────────────────

const FAQ_DATA = [
  {
    q: 'How do I actually know if I\'m progressing?',
    a: 'The mirror will lie to you daily — don\'t trust it alone. The most reliable signal is strength. If you\'re lifting more weight or doing more reps with the same weight over time, muscle growth is almost certainly happening. Progress photos every 4–6 weeks are your second tool — the change between two photos taken 6 weeks apart is almost always more obvious than what you notice day-to-day. Body measurements (arms, thighs, waist) a few times a year round out the picture. Kinetiq tracks your e1RM automatically — watch that number trend upward and trust the process.',
  },
  {
    q: 'How much muscle can I realistically gain?',
    a: 'Genetics play a big role, but here\'s a truthful ballpark. In your first year of proper training: men can gain 1–2 lbs of muscle per month (roughly 10–20 lbs over the year). Women can expect roughly half that, but relative strength and body composition changes are often just as dramatic. By year two, the rate slows — 0.5–1 lb per month for men. By year three and beyond, you\'re fighting for fractions. This is normal. The difference between a beginner and an advanced physique is often 4–6 years of showing up consistently. Not 6 months. Not a 12-week transformation.',
  },
  {
    q: 'Should I be sore after every session?',
    a: 'Soreness is not a reliable indicator of a good workout. Delayed Onset Muscle Soreness (DOMS) spikes in the first few weeks of training because novelty — new movements, new angles, new loads — causes more muscle damage. As your body adapts, soreness naturally decreases. This is adaptation working, not the training stopping. Reduced soreness over time is actually a sign your recovery is improving. Chase progression in your lifts, not soreness.',
  },
  {
    q: 'What if I train while sore?',
    a: 'Mild soreness — the kind where you feel it but can move through a full range of motion — is generally fine to train through with a proper warm-up. If soreness is severe enough that it\'s changing your movement patterns, rest an extra day. The rule Kinetiq follows: soreness that affects form is soreness worth respecting. One extra rest day sets you back very little. A movement-compensation injury can set you back months.',
  },
  {
    q: 'Should I eat in a surplus, maintenance, or deficit?',
    a: 'A slight caloric surplus (200–400 calories above maintenance) gives you the best environment for muscle growth and recovery. If fat loss is your primary goal, a moderate deficit still allows muscle retention and even slow muscle gain — especially for beginners. The non-negotiable in both cases is protein: aim for 0.8–1g per pound of bodyweight daily. This is the single dietary variable that has the most evidence behind it for preserving and building muscle.',
  },
  {
    q: 'Why does Kinetiq keep the same exercises week after week?',
    a: 'Constantly switching exercises resets your learning curve every week. Muscle growth requires both progressive overload (doing more over time) and technical mastery (performing the movement efficiently enough to actually stress the target muscle). You cannot progressively overload an exercise you are still learning. Kinetiq keeps your core movements consistent for the duration of a block specifically so progression can compound. Variety has its place — but only after a foundation is established.',
  },
  {
    q: 'Is a lifting belt necessary?',
    a: 'No, but it can help. A belt works by giving your core something to brace against — it cues and supports intra-abdominal pressure during heavy compound lifts like squats, deadlifts, and overhead pressing. Use it on working sets for these movements, not warm-ups. The bigger principle: whatever technique choices you make, make them consistently. Your nervous system adapts to specific conditions. If you belt up at 80% but not at 85%, you\'re introducing inconsistency your body wasn\'t prepared for.',
  },
  {
    q: 'What do I do after completing a training block?',
    a: 'Two solid options: repeat the same block for another cycle (you will likely get significantly more out of it the second time, since your technique will be better and your loads higher), or advance to a more complex block that introduces new training variables like increased frequency or intensity techniques. Kinetiq will guide you through this transition. The key thing to resist: jumping to a completely different program out of boredom. Block completion is a milestone, not a reset.',
  },
];

const FUN_FACTS = [
  {
    emoji: '🧠',
    title: 'Your brain builds muscle too',
    body: 'In the first 8–12 weeks of training, most of your strength gains come from neural adaptations — your nervous system learning to recruit more motor units, not your muscles actually getting bigger. That beginner "newbie gains" period is largely your brain getting better at driving your muscles.',
    accent: C.primary,
  },
  {
    emoji: '😴',
    title: 'You grow while you sleep',
    body: 'The majority of muscle protein synthesis — the actual repair and growth process — happens during sleep, especially in the deep slow-wave stages. Growth hormone peaks in the first few hours of sleep. Cutting sleep to train more is literally counterproductive. 7–9 hours is part of the program.',
    accent: C.secondary,
  },
  {
    emoji: '🔁',
    title: 'Muscle memory is real',
    body: 'When you take a training break and come back, your muscles regain their previous size significantly faster than it took to build them originally. This is because muscle nuclei (myonuclei) are retained even after muscle fibres shrink — they can accelerate protein synthesis again as soon as training resumes.',
    accent: C.tertiary,
  },
  {
    emoji: '📊',
    title: 'Strength predicts size',
    body: 'There\'s a well-established relationship between relative strength and muscle mass. A bigger muscle is almost always a stronger muscle. This is why progressive overload — consistently increasing the demand on a muscle over time — is the most evidence-backed strategy for hypertrophy. Chase the numbers and the size follows.',
    accent: '#a2e7ff',
  },
  {
    emoji: '⚡',
    title: 'Soreness ≠ growth signal',
    body: 'Muscle soreness is primarily caused by eccentric contractions and long-muscle-length loading — not by how effective the workout was. You can have an extremely productive session with zero soreness the next day. Highly-trained athletes rarely get sore despite training at intensities beginners couldn\'t dream of. Adaptation, not damage, is the goal.',
    accent: C.amber,
  },
  {
    emoji: '⏱️',
    title: 'Rest periods actually matter',
    body: 'Longer rest between sets (2–5 minutes for compound movements) consistently outperforms shorter rest for strength and hypertrophy. Your muscles need time to partially replenish phosphocreatine stores. Cutting rest short feels like more work — but it often just means your next set is weaker, producing less stimulus. Work smarter.',
    accent: C.green,
  },
];

const MYTHS = [
  {
    myth: 'Lifting heavy makes women bulky',
    truth: 'Women have roughly 10–15× less testosterone than men, making the kind of hypertrophy that produces a "bulky" look extraordinarily difficult to achieve. What heavy lifting does do for women: increased bone density, improved metabolic rate, better body composition, and a significantly stronger physique. The look most women describe wanting from training is achieved faster with heavy compound lifts than with light, high-rep work.',
  },
  {
    myth: 'You must train to failure every set to grow',
    truth: 'Research consistently shows that leaving 2–4 reps in reserve (RIR) on most sets produces similar hypertrophy to training to absolute failure, with significantly less fatigue accumulation. Training to failure on every set makes recovery harder, degrades form on later exercises, and can increase injury risk. Kinetiq\'s prescription targets challenging — not failure — loads by design.',
  },
  {
    myth: 'Cardio kills your gains',
    truth: 'Moderate cardio (3–4 sessions per week of low-to-moderate intensity) does not meaningfully interfere with muscle growth when protein intake and training volume are appropriate. In fact, improved cardiovascular fitness enhances recovery between sets and between sessions. The "cardio kills gains" myth comes from extremes — marathon training combined with heavy strength work is challenging to recover from. A 20-minute walk is not.',
  },
  {
    myth: 'You need to feel the "pump" to grow',
    truth: 'The pump — transient cell swelling from blood flow during training — might play a minor role in hypertrophy signalling, but it is not a requirement for muscle growth. Heavy compound lifts with minimal pump produce significant hypertrophy. The pump is satisfying and may correlate with a good session, but chasing it specifically (by prioritising isolation work and high reps) at the cost of progressive overload on compound movements is a poor trade-off.',
  },
  {
    myth: 'Muscle turns to fat when you stop training',
    truth: 'Muscle and fat are entirely different tissues — one cannot convert into the other. What happens when you stop training: your muscles shrink (atrophy) because the demand driving protein synthesis is removed. If your caloric intake doesn\'t decrease alongside your reduced energy expenditure, you may gain body fat. But the fat and the muscle loss are two separate, unrelated processes happening simultaneously. Muscle does not become fat.',
  },
];

const MARATHON_TIPS = [
  { icon: '📅', title: 'Show up on the bad days', body: 'The session you don\'t feel like doing is often the most important one you do. Motivation is a terrible training partner — it\'s inconsistent, unreliable, and shows up whenever it feels like it. Discipline is the real driver. Build the habit first. The motivation comes after.' },
  { icon: '📈', title: 'Measure in months, not days', body: 'One session is noise. One month is a data point. One year is a trend. Judging your progress after a single bad workout — or even a bad week — is like judging a film by a single frame. Zoom out. If you\'re stronger than you were 3 months ago, you\'re winning.' },
  { icon: '🔋', title: 'Recovery is training', body: 'Sleep, nutrition, and stress management are not separate from training — they are the conditions under which training produces results. You can do everything right in the gym and undo it all with 5 hours of sleep and 1,800 calories a day. Recovery is where adaptation happens.' },
  { icon: '🎯', title: 'Boring works', body: 'The best program is the one you actually run. The flashiest periodisation model, the most cutting-edge rep schemes, the optimal split — none of them matter if you don\'t show up consistently. Pick a program. Run it. Don\'t switch halfway through because you saw something else online. The results are always on the other side of boring consistency.' },
  { icon: '🧱', title: 'Stack small wins', body: 'Adding 2.5kg to a lift doesn\'t feel like much in a single session. But 2.5kg per month on your bench press over 12 months is 30kg — the difference between a beginner and an intermediate lifter. Compounding small wins is the entire mechanism behind long-term progress. Respect the increments.' },
  { icon: '🤕', title: 'The injury you avoid beats the PR you chased', body: 'Ego lifting — loading more than your current capacity to look strong — is the most expensive choice in the gym. Injuries don\'t just set you back for a few days. Serious soft-tissue injuries can sideline you for months, erasing progress and creating long-term compensation patterns. Train at the edge of your capacity, not beyond it.' },
];

// ════════════════════════════════════════════════════════════════
// PAGE
// ════════════════════════════════════════════════════════════════
export default function KnowledgePage() {
  const [activeSection, setActiveSection] = useState<'faq'|'facts'|'myths'|'mindset'>('faq');

  const NAV_TABS = [
    { id: 'faq',     label: 'FAQ',       accent: C.primary   },
    { id: 'facts',   label: 'Fun Facts', accent: C.tertiary  },
    { id: 'myths',   label: 'Myths',     accent: C.red       },
    { id: 'mindset', label: 'Mindset',   accent: C.secondary },
  ] as const;

  return (
    <div style={{
      minHeight: '100vh',
      background: C.surface,
      color: C.onSurface,
      fontFamily: 'Manrope, sans-serif',
      paddingBottom: 110,
      overflowX: 'hidden',
    }}>

      {/* ── STICKY GLASS HEADER ── */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 40,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 20px', height: 58,
        background: C.glass,
        backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
        borderBottom: `1px solid ${C.outlineVariant}`,
      }}>
        <KinetiqLogoWithTealQ />
        {/* Info icon — right slot */}
        <button style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <circle cx="8" cy="8" r="6.5" stroke={C.outline} strokeWidth="1.4"/>
            <path d="M8 7v4" stroke={C.outline} strokeWidth="1.5" strokeLinecap="round"/>
            <circle cx="8" cy="5.5" r="0.75" fill={C.outline}/>
          </svg>
        </button>
      </header>

      {/* ── HERO BANNER ── */}
      <div style={{ position: 'relative', background: C.surfaceLow, borderBottom: `1px solid ${C.outlineVariant}`, overflow: 'hidden' }}>
        {/* Decorative glows */}
        <div style={{ position: 'absolute', top: -40, left: -40, width: 240, height: 240, borderRadius: '50%', background: `radial-gradient(circle, rgba(${hexToRgb(C.primary)},0.1) 0%, transparent 70%)`, pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: -40, right: -20, width: 200, height: 200, borderRadius: '50%', background: `radial-gradient(circle, rgba(${hexToRgb(C.tertiary)},0.09) 0%, transparent 70%)`, pointerEvents: 'none' }} />

        <div style={{ maxWidth: 600, margin: '0 auto', padding: '32px 16px 28px', position: 'relative' }}>
          <p style={{ margin: '0 0 8px', fontSize: '0.57rem', letterSpacing: '0.24em', textTransform: 'uppercase', color: C.outline, fontWeight: 700 }}>Knowledge Base</p>
          <h1 style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 900, fontSize: 'clamp(1.85rem,6vw,2.4rem)', letterSpacing: '-0.045em', lineHeight: 1.05, color: C.onSurface, margin: '0 0 10px' }}>
            The truth about<br />
            <span style={{ background: `linear-gradient(90deg, ${C.primary}, ${C.tertiary})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>training smarter.</span>
          </h1>
          <p style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 500, fontSize: 13, color: C.outline, margin: '0 0 24px', lineHeight: 1.6, maxWidth: 420 }}>
            No bro-science. No shortcuts. Just the evidence-backed reality of what it takes to build a body that lasts — and why it takes longer than the internet wants you to believe.
          </p>

          {/* Stat row */}
          <div style={{ display: 'flex', gap: 10 }}>
            <StatHighlight value="1–2 lbs" label="Muscle / month" sub="Realistic first-year gain for men" accent={C.primary} />
            <StatHighlight value="4–6 yrs" label="For real results" sub="The honest timeline most skip" accent={C.tertiary} />
            <StatHighlight value="0.8g" label="Protein / lb BW" sub="The non-negotiable daily target" accent={C.secondary} />
          </div>
        </div>
      </div>

      {/* ── MARATHON CALLOUT ── */}
      <div style={{ maxWidth: 600, margin: '0 auto', padding: '20px 16px 0' }}>
        <div style={{
          background: `linear-gradient(135deg, rgba(${hexToRgb(C.primary)},0.07) 0%, rgba(${hexToRgb(C.tertiary)},0.05) 100%)`,
          border: `1px solid rgba(${hexToRgb(C.primary)},0.2)`,
          borderLeft: `3px solid ${C.primary}`,
          borderRadius: 16,
          padding: '16px 18px',
          display: 'flex',
          alignItems: 'flex-start',
          gap: 14,
        }}>
          <div style={{ fontSize: 28, flexShrink: 0, marginTop: 2 }}>🏃</div>
          <div>
            <p style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 900, fontSize: 15, color: C.primary, margin: '0 0 5px', letterSpacing: '-0.02em' }}>
              Bodybuilding is a marathon, not a sprint.
            </p>
            <p style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 500, fontSize: 13, color: C.onSurfaceVariant, margin: 0, lineHeight: 1.65 }}>
              The fitness industry profits from impatience. It sells 12-week transformations, 6-minute abs, and before-after photos carefully selected to make you feel behind. You are not behind. Building a meaningful physique takes years of consistent, unglamorous work. The athletes you admire have been training for 5, 10, 15 years — and they started exactly where you are.
            </p>
          </div>
        </div>
      </div>

      {/* ── TAB NAV ── */}
      <div style={{ maxWidth: 600, margin: '0 auto', padding: '20px 16px 0' }}>
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4, msOverflowStyle: 'none' }}>
          {NAV_TABS.map(tab => {
            const active = activeSection === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveSection(tab.id)}
                style={{
                  flexShrink: 0, padding: '7px 16px', borderRadius: 100,
                  border: active ? 'none' : `1px solid ${C.outlineVariant}`,
                  background: active ? tab.accent : 'transparent',
                  color: active ? '#05080f' : C.onSurfaceVariant,
                  fontSize: '0.72rem', fontFamily: 'Manrope, sans-serif',
                  fontWeight: 700, letterSpacing: '0.05em',
                  cursor: 'pointer', whiteSpace: 'nowrap',
                  transition: 'all 0.18s ease',
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── CONTENT ── */}
      <div style={{ maxWidth: 600, margin: '0 auto', padding: '16px 16px 0' }}>

        {/* ─── FAQ ─── */}
        {activeSection === 'faq' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ marginBottom: 6 }}>
              <p style={{ margin: '0 0 4px', fontSize: '0.57rem', letterSpacing: '0.22em', textTransform: 'uppercase', color: C.outline, fontWeight: 700 }}>Frequently Asked</p>
              <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: 13, fontWeight: 500, color: C.outline, margin: 0 }}>Tap any question to expand the answer.</p>
            </div>
            {FAQ_DATA.map((item, i) => (
              <FaqCard
                key={i}
                q={item.q}
                a={item.a}
                accent={DAY_COLORS[i % DAY_COLORS.length]}
                index={i}
              />
            ))}
          </div>
        )}

        {/* ─── FUN FACTS ─── */}
        {activeSection === 'facts' && (
          <div>
            <div style={{ marginBottom: 16 }}>
              <p style={{ margin: '0 0 4px', fontSize: '0.57rem', letterSpacing: '0.22em', textTransform: 'uppercase', color: C.outline, fontWeight: 700 }}>Did You Know</p>
              <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: 13, fontWeight: 500, color: C.outline, margin: 0 }}>Tap a card to reveal the science behind it.</p>
            </div>

            {/* 2-column grid for fun facts */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {FUN_FACTS.map((fact, i) => (
                <FunFactCard
                  key={i}
                  emoji={fact.emoji}
                  title={fact.title}
                  body={fact.body}
                  accent={fact.accent}
                />
              ))}
            </div>

            {/* Extra callout */}
            <div style={{ marginTop: 14, background: C.surfaceContainer, border: `1px solid ${C.outlineVariant}`, borderLeft: `3px solid ${C.tertiary}`, borderRadius: 16, padding: '16px 18px' }}>
              <p style={{ fontSize: '0.57rem', fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', color: C.tertiary, margin: '0 0 8px' }}>Worth knowing</p>
              <p style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 800, fontSize: 14, color: C.onSurface, margin: '0 0 6px', letterSpacing: '-0.02em' }}>The "muscle confusion" myth</p>
              <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: 13, fontWeight: 500, color: C.onSurfaceVariant, margin: 0, lineHeight: 1.65 }}>
                Constantly changing your exercises doesn't "confuse" your muscles into growing faster. Muscles respond to progressive mechanical tension — load applied over time. Switching movements frequently resets the learning curve, makes progression harder to track, and prevents you from developing the technical efficiency needed to actually load a muscle effectively. Boring repetition of core movements is a feature, not a flaw.
              </p>
            </div>
          </div>
        )}

        {/* ─── MYTHS ─── */}
        {activeSection === 'myths' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ marginBottom: 6 }}>
              <p style={{ margin: '0 0 4px', fontSize: '0.57rem', letterSpacing: '0.22em', textTransform: 'uppercase', color: C.outline, fontWeight: 700 }}>Myth vs Truth</p>
              <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: 13, fontWeight: 500, color: C.outline, margin: 0 }}>Tap each card to reveal the evidence-backed reality.</p>
            </div>

            {/* Warning banner */}
            <div style={{ background: `rgba(${hexToRgb(C.red)},0.06)`, border: `1px solid rgba(${hexToRgb(C.red)},0.2)`, borderLeft: `3px solid ${C.red}`, borderRadius: 14, padding: '12px 14px', display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 4 }}>
              <span style={{ fontSize: 18, flexShrink: 0 }}>⚠️</span>
              <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: 12, fontWeight: 600, color: C.onSurfaceVariant, margin: 0, lineHeight: 1.55 }}>
                The fitness industry is one of the most misinformation-dense spaces on the internet. These myths cost people years of wasted effort. Read carefully.
              </p>
            </div>

            {MYTHS.map((m, i) => (
              <MythCard key={i} myth={m.myth} truth={m.truth} />
            ))}
          </div>
        )}

        {/* ─── MINDSET ─── */}
        {activeSection === 'mindset' && (
          <div>
            <div style={{ marginBottom: 16 }}>
              <p style={{ margin: '0 0 4px', fontSize: '0.57rem', letterSpacing: '0.22em', textTransform: 'uppercase', color: C.outline, fontWeight: 700 }}>The Long Game</p>
              <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: 13, fontWeight: 500, color: C.outline, margin: 0 }}>The mental side of training that nobody puts in a program.</p>
            </div>

            {/* Big quote card */}
            <div style={{
              background: `linear-gradient(135deg, rgba(${hexToRgb(C.secondary)},0.08) 0%, rgba(${hexToRgb(C.primary)},0.05) 100%)`,
              border: `1px solid rgba(${hexToRgb(C.secondary)},0.2)`,
              borderRadius: 16,
              padding: '22px 20px',
              marginBottom: 14,
              position: 'relative',
              overflow: 'hidden',
            }}>
              {/* Decorative quote mark */}
              <div style={{ position: 'absolute', top: -10, right: 16, fontFamily: 'Space Grotesk, sans-serif', fontSize: 120, fontWeight: 900, color: `rgba(${hexToRgb(C.secondary)},0.06)`, lineHeight: 1, userSelect: 'none', pointerEvents: 'none' }}>"</div>
              <p style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 900, fontSize: 'clamp(1.1rem,3.5vw,1.3rem)', color: C.onSurface, margin: '0 0 12px', letterSpacing: '-0.03em', lineHeight: 1.3, position: 'relative' }}>
                The only workout you regret is the one you didn't do.
              </p>
              <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: 12, fontWeight: 700, color: C.outline, margin: 0, letterSpacing: '0.06em', textTransform: 'uppercase' }}>— Every gym veteran, ever</p>
            </div>

            {/* Marathon tips */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {MARATHON_TIPS.map((tip, i) => (
                <div
                  key={i}
                  style={{
                    background: C.surfaceContainer,
                    border: `1px solid ${C.outlineVariant}`,
                    borderLeft: `3px solid ${DAY_COLORS[i % DAY_COLORS.length]}`,
                    borderRadius: 16,
                    padding: '16px 18px',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 14,
                  }}
                >
                  <div style={{ fontSize: 22, flexShrink: 0, marginTop: 2 }}>{tip.icon}</div>
                  <div>
                    <p style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 900, fontSize: 14, color: C.onSurface, margin: '0 0 5px', letterSpacing: '-0.02em' }}>{tip.title}</p>
                    <p style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 500, fontSize: 13, color: C.onSurfaceVariant, margin: 0, lineHeight: 1.65 }}>{tip.body}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Closing callout */}
            <div style={{ marginTop: 14, background: C.surfaceHigh, border: `1px solid ${C.outlineVariant}`, borderRadius: 16, padding: '18px 18px', textAlign: 'center' }}>
              <p style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 900, fontSize: 15, color: C.primary, margin: '0 0 8px', letterSpacing: '-0.02em' }}>
                You already know what to do.
              </p>
              <p style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 500, fontSize: 13, color: C.onSurfaceVariant, margin: 0, lineHeight: 1.65 }}>
                Sleep enough. Eat enough protein. Train consistently. Don't skip the boring sessions. Don't chase the program you read about last week. The formula is simple — it's just not easy. Kinetiq handles the programming. You handle the showing up.
              </p>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}