'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api/client';

// ── COLOUR TOKENS ────────────────────────────────────────────────
const C = {
  primary:          '#b1c5ff',
  primaryContainer: '#002560',
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
};

// ── GOAL OPTIONS ─────────────────────────────────────────────────
const GOAL_OPTIONS = [
  { value: 'MUSCLE_GAIN', label: 'Build Muscle',   description: 'Maximize hypertrophy and size',       accent: C.primary   },
  { value: 'STRENGTH',    label: 'Build Strength', description: 'Focus on compound lifts and PRs',     accent: C.secondary },
  { value: 'WEIGHT_LOSS', label: 'Lose Fat',       description: 'Maintain muscle while losing fat',    accent: C.tertiary  },
  { value: 'MAINTAIN',    label: 'Maintain',       description: 'Keep current fitness level',          accent: C.outline   },
];

// ── QUESTIONNAIRE ────────────────────────────────────────────────
const QUESTIONS = [
  {
    domain: 'Training Consistency',
    question: 'How long have you been training with weights regularly (3+ sessions/week)?',
    options: ['Less than 6 months', '6 months to 18 months', '18 months to 3 years', 'More than 3 years'],
  },
  {
    domain: 'Training Consistency',
    question: 'Over the past year, how many months did you actually train consistently?',
    options: ['3 months or fewer', '4 to 6 months', '7 to 9 months', '10 to 12 months'],
  },
  {
    domain: 'Progression Understanding',
    question: 'How did you decide when to increase the weight?',
    options: ["Didn't track it / just lifted what felt okay", 'When it felt too easy I would add weight', 'I followed a program that told me when to increase', 'I tracked reps and added weight when I hit the top of my target range'],
  },
  {
    domain: 'Progression Understanding',
    question: 'Have you followed a structured training program for more than 8 consecutive weeks?',
    options: ['Never', 'Once or twice', 'Several times', 'This is how I always train'],
  },
  {
    domain: 'Recovery Awareness',
    question: 'After a hard leg session, what usually happens over the next few days?',
    options: ['Very sore, struggle to walk for 4+ days', 'Moderately sore for 2 to 3 days', 'Some soreness, gone within 1 to 2 days', 'Minimal soreness, back to normal quickly'],
  },
  {
    domain: 'Recovery Awareness',
    question: 'Can you tell the difference between muscle soreness and joint or tendon pain?',
    options: ['Not really, it all feels like pain', 'I think so, but not always sure', 'Yes, most of the time', 'Yes easily, and I adjust my training based on it'],
  },
  {
    domain: 'Strength Development',
    question: 'How has your strength changed since you started training?',
    options: ["I'm fairly new, not much to compare", 'Noticeably stronger — 30 to 50% improvement', 'Significantly stronger, some lifts have doubled', 'Progress has slowed, requires careful planning'],
  },
  {
    domain: 'Strength Development',
    question: 'Which best describes your current strength level?',
    options: ['Still learning / cannot bench press close to bodyweight', 'Can bench ~bodyweight / squat ~1.5x bodyweight', 'Can bench 1.25x bodyweight / squat ~2x bodyweight', 'Bench 1.5x+ bodyweight / squat 2x+ bodyweight'],
  },
  {
    domain: 'Exercise Execution',
    question: 'How confident are you with your technique on main compound lifts?',
    options: ['Still learning the basic movements', 'Decent form but still working on it', 'Solid form on most exercises, rarely breaks down', 'Excellent form — I can self-correct during a set'],
  },
  {
    domain: 'Exercise Execution',
    question: 'During an isolation exercise, can you feel the target muscle working?',
    options: ['Not really, I just lift the weight', 'Sometimes but not consistently', 'Usually yes', 'Yes, strong and consistent connection'],
  },
  {
    domain: 'Self-Regulation',
    question: 'At the end of a set, can you estimate how many more reps you could have done?',
    options: ['No, I lift until I cannot continue', 'Roughly, but I am often wrong', 'Yes, reasonably accurately', 'Yes, very accurately — I use this every set'],
  },
  {
    domain: 'Self-Regulation',
    question: 'Have you ever recognised signs that your body was not recovering well?',
    options: ["Not really, I don't know what to look for", 'Maybe, but not sure what it meant', 'Yes, and I took a rest or deload week', 'Yes, I actively manage my training to stay ahead of it'],
  },
];

// ── LEVEL CONFIG ─────────────────────────────────────────────────
const LEVEL_BG: Record<string, string> = {
  BEGINNER:     'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=900&q=80',
  INTERMEDIATE: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=900&q=80',
  ADVANCED:     'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=900&q=80',
};
const LEVEL_LABELS: Record<string, string> = {
  BEGINNER: 'Beginner', INTERMEDIATE: 'Intermediate', ADVANCED: 'Advanced',
};
const LEVEL_ACCENT: Record<string, string> = {
  BEGINNER: C.tertiary, INTERMEDIATE: C.primary, ADVANCED: C.secondary,
};
const LEVEL_SUMMARY: Record<string, string> = {
  BEGINNER:     'Every session produces gains. Your nervous system is still learning movement patterns — this is the most powerful phase of training. Kinetiq will build your foundation systematically.',
  INTERMEDIATE: 'You have real training experience and your body knows how to adapt. Progression shifts to weekly gains. Kinetiq will optimise your volume and intensity intelligently.',
  ADVANCED:     'Adaptation requires deliberate programming. Load progression alone is largely exhausted — you need block structure, deloads, and specialisation. Kinetiq will manage all of it.',
};

const DOMAIN_COLORS: Record<string, string> = {
  'Training Consistency':    '#8e909c',
  'Progression Understanding': '#b1c5ff',
  'Recovery Awareness':      '#59d8de',
  'Strength Development':    '#d4bbff',
  'Exercise Execution':      '#a2e7ff',
  'Self-Regulation':         '#b1c5ff',
};

// ── UTILITY ──────────────────────────────────────────────────────
function hexToRgb(hex: string): string {
  const r = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!r) return '177,197,255';
  return `${parseInt(r[1],16)},${parseInt(r[2],16)},${parseInt(r[3],16)}`;
}

function classifyLevel(answers: number[]) {
  const domains = [
    'Training Consistency','Training Consistency',
    'Progression Understanding','Progression Understanding',
    'Recovery Awareness','Recovery Awareness',
    'Strength Development','Strength Development',
    'Exercise Execution','Exercise Execution',
    'Self-Regulation','Self-Regulation',
  ];
  const domainScores: Record<string,number> = {};
  let total = 0;
  answers.forEach((a, i) => {
    const d = domains[i];
    domainScores[d] = (domainScores[d] ?? 0) + a;
    total += a;
  });
  let level = 'BEGINNER';
  if (total >= 28) level = 'ADVANCED';
  else if (total >= 17) level = 'INTERMEDIATE';
  return { level, score: total, domainScores };
}

// ── LOGO ─────────────────────────────────────────────────────────
function KinetiqLogoWithTealQ({ size = 20 }: { size?: number }) {
  return (
    <span style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 900, fontSize: size, letterSpacing: '-0.04em' }}>
      <span style={{ background: 'linear-gradient(90deg, #b1c5ff, #d4bbff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Kineti</span>
      <span style={{ color: '#59d8de' }}>q</span>
    </span>
  );
}

// ── ANIMATED SCORE ────────────────────────────────────────────────
function AnimatedScore({ target }: { target: number }) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    let cur = 0;
    const step = target / 40;
    const t = setInterval(() => {
      cur += step;
      if (cur >= target) { setVal(target); clearInterval(t); }
      else setVal(Math.round(cur));
    }, 22);
    return () => clearInterval(t);
  }, [target]);
  return <>{val}</>;
}

// ── OPTION CARD ──────────────────────────────────────────────────
function OptionCard({ label, description, accent, selected, onClick }: {
  label: string; description: string; accent: string; selected: boolean; onClick: () => void;
}) {
  const [hov, setHov] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        width: '100%', textAlign: 'left', borderRadius: 14, padding: '15px 18px',
        border: `1px solid ${selected ? accent : C.outlineVariant}`,
        borderLeft: `3px solid ${selected ? accent : C.outlineVariant}`,
        background: selected ? `rgba(${hexToRgb(accent)},0.08)` : hov ? C.surfaceHigh : C.surfaceContainer,
        cursor: 'pointer', transition: 'all 0.18s ease',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
      }}
    >
      <div>
        <p style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 800, fontSize: 14, color: selected ? accent : C.onSurface, margin: 0, letterSpacing: '-0.01em', transition: 'color 0.18s' }}>{label}</p>
        <p style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 500, fontSize: 12, color: selected ? C.onSurfaceVariant : C.outline, margin: '3px 0 0', transition: 'color 0.18s' }}>{description}</p>
      </div>
      <div style={{ width: 18, height: 18, borderRadius: '50%', border: `1.5px solid ${selected ? accent : C.outlineVariant}`, background: selected ? accent : 'transparent', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.18s' }}>
        {selected && <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 5l2.5 2.5L8 3" stroke="#05080f" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>}
      </div>
    </button>
  );
}

// ── QUIZ OPTION ──────────────────────────────────────────────────
function QuizOption({ label, index, selected, accent, onClick }: {
  label: string; index: number; selected: boolean; accent: string; onClick: () => void;
}) {
  const [hov, setHov] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        width: '100%', textAlign: 'left', borderRadius: 12, padding: '13px 16px',
        border: `1px solid ${selected ? accent : C.outlineVariant}`,
        borderLeft: `3px solid ${selected ? accent : C.outlineVariant}`,
        background: selected ? `rgba(${hexToRgb(accent)},0.08)` : hov ? C.surfaceHigh : C.surfaceContainer,
        cursor: 'pointer', transition: 'all 0.15s ease',
        display: 'flex', alignItems: 'center', gap: 12,
      }}
    >
      <div style={{ width: 22, height: 22, borderRadius: '50%', flexShrink: 0, border: `1.5px solid ${selected ? accent : C.outlineVariant}`, background: selected ? accent : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s' }}>
        {selected
          ? <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 5l2.5 2.5L8 3" stroke="#05080f" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
          : <span style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 800, fontSize: 9, color: C.outline }}>{'ABCD'[index]}</span>
        }
      </div>
      <span style={{ fontFamily: 'Manrope, sans-serif', fontWeight: selected ? 700 : 500, fontSize: 13, color: selected ? C.onSurface : C.onSurfaceVariant, transition: 'all 0.15s', lineHeight: 1.4 }}>{label}</span>
    </button>
  );
}

// ── DOMAIN BAR ───────────────────────────────────────────────────
function DomainBar({ domain, score, maxScore = 6, visible }: { domain: string; score: number; maxScore?: number; visible: boolean }) {
  const pct   = Math.round((score / maxScore) * 100);
  const color = pct >= 70 ? C.tertiary : pct >= 40 ? C.primary : C.secondary;
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
        <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: 11, fontWeight: 700, color: C.onSurfaceVariant }}>{domain}</span>
        <span style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 11, fontWeight: 800, color }}>{score}/{maxScore}</span>
      </div>
      <div style={{ height: 4, background: C.surfaceHigh, borderRadius: 100, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: visible ? `${pct}%` : '0%', borderRadius: 100, background: color, transition: 'width 0.9s cubic-bezier(0.34,1.2,0.64,1)' }} />
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// MAIN PAGE
// ════════════════════════════════════════════════════════════════
export default function OnboardingPage() {
  const router = useRouter();

  type Phase = 'hero' | 'goal' | 'quiz' | 'result' | 'bodyweight';
  const [phase, setPhase]             = useState<Phase>('hero');
  const [heroVisible, setHeroVisible] = useState(false);
  const [goalMode, setGoalMode]       = useState('');
  const [quizIndex, setQuizIndex]     = useState(0);
  const [answers, setAnswers]         = useState<number[]>(Array(12).fill(-1));
  const [result, setResult]           = useState<{ level: string; score: number; domainScores: Record<string,number> } | null>(null);
  const [chosenLevel, setChosenLevel] = useState('');
  const [showOverride, setShowOverride] = useState(false);
  const [bodyweightKg, setBodyweightKg] = useState('');
  const [inputFocused, setInputFocused] = useState(false);
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState('');
  const [barsVisible, setBarsVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setHeroVisible(true), 80);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (phase === 'result') setTimeout(() => setBarsVisible(true), 350);
    else setBarsVisible(false);
  }, [phase]);

  function advanceQuiz(answerIndex: number) {
    const next = [...answers];
    next[quizIndex] = answerIndex;
    setAnswers(next);
    if (quizIndex < 11) {
      setTimeout(() => setQuizIndex(q => q + 1), 60);
    } else {
      const r = classifyLevel(next);
      setResult(r);
      setChosenLevel(r.level);
      setPhase('result');
    }
  }

  async function handleFinish() {
    if (!goalMode) return;
    setLoading(true);
    setError('');
    try {
      await api.patch('/api/v1/users/me/onboarding', {
        goalMode,
        experienceLevel: chosenLevel || 'INTERMEDIATE',
        bodyweightKg: bodyweightKg ? parseFloat(bodyweightKg) : undefined,
        classificationScore: result?.score,
        recommendedLevel: result?.level,
        levelOverrideAcknowledged: chosenLevel !== result?.level,
      });
      router.push('/dashboard');
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  const currentQ    = QUESTIONS[quizIndex];
  const quizPct     = Math.round(((quizIndex + 1) / 12) * 100);
  const resultAccent = LEVEL_ACCENT[chosenLevel] ?? C.primary;

  // ════ HERO ═══════════════════════════════════════════════════════
  if (phase === 'hero') {
    return (
      <div style={{ minHeight: '100vh', background: C.surface, color: C.onSurface, fontFamily: 'Manrope, sans-serif', overflow: 'hidden', position: 'relative' }}>
        {/* Full-bleed hero image */}
        <div style={{ position: 'fixed', inset: 0, zIndex: 0 }}>
          <img
            src="https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?w=900&q=80"
            alt="Athlete"
            style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top', opacity: 0.42, filter: 'grayscale(25%)' }}
          />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, #111318 40%, rgba(17,19,24,0.72) 68%, rgba(17,19,24,0.28) 100%)' }} />
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '45%', background: `radial-gradient(ellipse at 25% 100%, rgba(89,216,222,0.07) 0%, transparent 70%)` }} />
        </div>

        <div style={{ position: 'relative', zIndex: 1, minHeight: '100vh', display: 'flex', flexDirection: 'column', maxWidth: 600, margin: '0 auto', padding: '0 22px' }}>
          {/* Top bar */}
          <div style={{ paddingTop: 26, opacity: heroVisible ? 1 : 0, transform: heroVisible ? 'none' : 'translateY(-8px)', transition: 'all 0.5s ease' }}>
            <KinetiqLogoWithTealQ size={22} />
            <span style={{ marginLeft: 6, fontSize: '0.57rem', fontWeight: 800, letterSpacing: '0.2em', color: C.tertiary, verticalAlign: 'middle' }}>+</span>
          </div>

          {/* Hero text — bottom anchored */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', paddingBottom: 56 }}>
            <div style={{ opacity: heroVisible ? 1 : 0, transform: heroVisible ? 'none' : 'translateY(28px)', transition: 'all 0.75s cubic-bezier(0.16,1,0.3,1) 0.15s' }}>
              <h1 style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 900, fontSize: 'clamp(2.4rem,9vw,3.4rem)', letterSpacing: '-0.04em', lineHeight: 1.04, color: C.onSurface, margin: '0 0 14px' }}>
                Training that<br />
                <span style={{ background: `linear-gradient(90deg, ${C.primary}, ${C.tertiary})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                  learns from you.
                </span>
              </h1>
              <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: 14, fontWeight: 500, color: C.onSurfaceVariant, margin: '0 0 6px', lineHeight: 1.55, maxWidth: 340 }}>
                Kinetiq reads your recovery after every session and adjusts your next workout automatically — no guessing, no static programs.
              </p>
              <p style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 11, fontWeight: 700, color: C.outline, letterSpacing: '0.1em', margin: '0 0 34px', textTransform: 'uppercase' }}>
                Elite Performance Labs
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, opacity: heroVisible ? 1 : 0, transform: heroVisible ? 'none' : 'translateY(18px)', transition: 'all 0.75s cubic-bezier(0.16,1,0.3,1) 0.3s' }}>
              <button
                onClick={() => setPhase('goal')}
                style={{ width: '100%', padding: '16px 0', borderRadius: 12, border: 'none', background: `linear-gradient(135deg, ${C.primary} 0%, #3a5cbf 100%)`, color: '#05080f', fontFamily: 'Space Grotesk, sans-serif', fontWeight: 900, fontSize: 14, letterSpacing: '0.06em', cursor: 'pointer', textTransform: 'uppercase' }}
              >
                Let's Get Started →
              </button>
            </div>

            {/* Step dots */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginTop: 26, opacity: heroVisible ? 1 : 0, transition: 'opacity 0.6s ease 0.5s' }}>
              {[0,1,2].map(i => (
                <div key={i} style={{ height: 4, borderRadius: 100, background: i === 0 ? C.primary : C.outlineVariant, width: i === 0 ? 22 : 6, transition: 'all 0.3s' }} />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ════ GOAL ════════════════════════════════════════════════════════
  if (phase === 'goal') {
    return (
      <div style={{ minHeight: '100vh', background: C.surface, color: C.onSurface, fontFamily: 'Manrope, sans-serif', overflowX: 'hidden' }}>

        {/* Philosophy banner — image 2 style */}
        <div style={{ position: 'relative', height: 175, overflow: 'hidden' }}>
          <img
            src="https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=900&q=80"
            alt="Barbell"
            style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 40%', opacity: 0.35, filter: 'grayscale(15%)' }}
          />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, rgba(17,19,24,0.96) 0%, rgba(17,19,24,0.6) 55%, rgba(17,19,24,0.4) 100%)' }} />
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '55%', background: 'linear-gradient(to top, #111318, transparent)' }} />
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 22px', maxWidth: 600, margin: '0 auto', left: 0, right: 0 }}>
            <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.57rem', fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', color: C.outline, margin: '0 0 8px' }}>PHILOSOPHY</p>
            <p style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 'clamp(0.9rem,2.8vw,1.05rem)', fontWeight: 900, color: C.onSurface, margin: 0, letterSpacing: '-0.02em', lineHeight: 1.25, fontStyle: 'italic', textTransform: 'uppercase' }}>
              Information without movement is useless.<br />Movement without information is wasted.
            </p>
          </div>
        </div>

        <div style={{ maxWidth: 600, margin: '0 auto', padding: '24px 16px 120px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <KinetiqLogoWithTealQ />
            <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.57rem', fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', color: C.outline }}>Step 1 of 2</span>
          </div>

          <p style={{ margin: '0 0 6px', fontSize: '0.57rem', letterSpacing: '0.24em', textTransform: 'uppercase', color: C.outline, fontWeight: 700 }}>Your Goal</p>
          <h1 style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 900, fontSize: 'clamp(1.85rem,6vw,2.4rem)', letterSpacing: '-0.045em', lineHeight: 1.05, color: C.onSurface, margin: '0 0 6px' }}>
            What are you training for?
          </h1>
          <p style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 500, fontSize: 13, color: C.outline, margin: '0 0 22px' }}>
            This shapes every prescription Kinetiq generates for you.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
            {GOAL_OPTIONS.map(opt => (
              <OptionCard
                key={opt.value}
                label={opt.label}
                description={opt.description}
                accent={opt.accent}
                selected={goalMode === opt.value}
                onClick={() => setGoalMode(opt.value)}
              />
            ))}
          </div>

          <button
            onClick={() => { if (goalMode) setPhase('quiz'); }}
            disabled={!goalMode}
            style={{
              width: '100%', padding: '15px 0', borderRadius: 12, border: 'none',
              background: goalMode ? 'linear-gradient(135deg, #b1c5ff 0%, #3a5cbf 100%)' : C.surfaceHigh,
              color: goalMode ? '#05080f' : C.outline,
              fontFamily: 'Space Grotesk, sans-serif', fontWeight: 900, fontSize: 14, letterSpacing: '0.01em',
              cursor: goalMode ? 'pointer' : 'not-allowed', opacity: goalMode ? 1 : 0.55, transition: 'all 0.18s',
            }}
          >
            Continue → Calibrate Your Level
          </button>
        </div>
      </div>
    );
  }

  // ════ QUIZ ════════════════════════════════════════════════════════
  if (phase === 'quiz') {
    const domColor = DOMAIN_COLORS[currentQ.domain] ?? C.primary;
    return (
      <div style={{ minHeight: '100vh', background: C.surface, color: C.onSurface, fontFamily: 'Manrope, sans-serif', overflowX: 'hidden' }}>

        {/* Sticky top bar */}
        <div style={{ position: 'sticky', top: 0, zIndex: 40, background: 'rgba(22,24,32,0.92)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', borderBottom: `1px solid ${C.outlineVariant}`, padding: '0 20px', height: 58, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <button
            onClick={() => quizIndex > 0 ? setQuizIndex(q => q - 1) : setPhase('goal')}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '6px 0', display: 'flex', alignItems: 'center' }}
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M12 5L7 10L12 15" stroke={C.outline} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <KinetiqLogoWithTealQ />
          <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.57rem', fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', color: C.outline }}>
            {quizIndex + 1} / 12
          </span>
        </div>

        {/* Progress bar */}
        <div style={{ height: 3, background: C.outlineVariant }}>
          <div style={{ height: '100%', width: `${quizPct}%`, background: `linear-gradient(90deg, ${C.primary}, ${C.tertiary})`, transition: 'width 0.45s cubic-bezier(0.34,1.4,0.64,1)' }} />
        </div>

        <div style={{ maxWidth: 600, margin: '0 auto', padding: '26px 16px 100px' }}>

          {/* Domain pill */}
          <div style={{ marginBottom: 16 }}>
            <span style={{ fontSize: '0.52rem', fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: domColor, background: `rgba(${hexToRgb(domColor)},0.1)`, borderRadius: 6, padding: '3px 9px' }}>
              {currentQ.domain}
            </span>
          </div>

          {/* Education note — first question only */}
          {quizIndex === 0 && (
            <div style={{ background: `rgba(${hexToRgb(C.tertiary)},0.07)`, border: `1px solid rgba(${hexToRgb(C.tertiary)},0.2)`, borderLeft: `3px solid ${C.tertiary}`, borderRadius: 12, padding: '12px 14px', marginBottom: 20 }}>
              <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: 12, fontWeight: 600, color: C.onSurfaceVariant, margin: 0, lineHeight: 1.55 }}>
                <span style={{ color: C.tertiary, fontWeight: 800 }}>No prize for a higher level.</span> Accurate classification means better prescriptions from day one. Answer honestly — Kinetiq works harder when you do.
              </p>
            </div>
          )}

          {/* Question */}
          <h2 style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 900, fontSize: 'clamp(1.2rem,4vw,1.5rem)', letterSpacing: '-0.03em', lineHeight: 1.2, color: C.onSurface, margin: '0 0 22px' }}>
            {currentQ.question}
          </h2>

          {/* Options */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {currentQ.options.map((opt, i) => (
              <QuizOption
                key={i}
                label={opt}
                index={i}
                selected={answers[quizIndex] === i}
                accent={domColor}
                onClick={() => advanceQuiz(i)}
              />
            ))}
          </div>

          {answers[quizIndex] !== -1 && (
            <div style={{ marginTop: 20, textAlign: 'center' }}>
              <button
                onClick={() => advanceQuiz(answers[quizIndex])}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'Manrope, sans-serif', fontSize: 12, fontWeight: 700, color: C.outline, letterSpacing: '0.06em' }}
              >
                {quizIndex < 11 ? 'Next →' : 'See my results →'}
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ════ RESULT ══════════════════════════════════════════════════════
  if (phase === 'result' && result) {
    const overrideDir = chosenLevel !== result.level
      ? (['BEGINNER','INTERMEDIATE','ADVANCED'].indexOf(chosenLevel) > ['BEGINNER','INTERMEDIATE','ADVANCED'].indexOf(result.level) ? 'up' : 'down')
      : null;
    const domainEntries = Object.entries(result.domainScores).sort((a,b) => b[1]-a[1]);
    const highest = domainEntries.slice(0, 2).map(d => d[0]);
    const lowest  = domainEntries[domainEntries.length - 1][0];

    return (
      <div style={{ minHeight: '100vh', background: C.surface, color: C.onSurface, fontFamily: 'Manrope, sans-serif', overflowX: 'hidden' }}>

        {/* Level hero — muscle background per level */}
        <div style={{ position: 'relative', height: 260, overflow: 'hidden' }}>
          <img
            src={LEVEL_BG[chosenLevel]}
            alt={LEVEL_LABELS[chosenLevel]}
            style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 30%', opacity: 0.48, filter: 'grayscale(10%)' }}
          />
          <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(to top, #111318 28%, rgba(17,19,24,0.55) 68%, rgba(17,19,24,0.18) 100%)` }} />
          <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(ellipse at 15% 100%, rgba(${hexToRgb(resultAccent)},0.18) 0%, transparent 55%)` }} />

          {/* Score bubble */}
          <div style={{ position: 'absolute', top: 18, right: 18, background: 'rgba(17,19,24,0.88)', backdropFilter: 'blur(14px)', border: `1px solid ${C.outlineVariant}`, borderRadius: 14, padding: '12px 16px', textAlign: 'center' }}>
            <span style={{ display: 'block', fontFamily: 'Space Grotesk, sans-serif', fontWeight: 900, fontSize: 26, color: resultAccent, letterSpacing: '-0.04em', lineHeight: 1 }}>
              <AnimatedScore target={result.score} />
            </span>
            <span style={{ display: 'block', fontSize: '0.52rem', fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: C.outline, marginTop: 2 }}>/ 36</span>
          </div>

          {/* Level label overlaid */}
          <div style={{ position: 'absolute', bottom: 20, left: 22 }}>
            <span style={{ fontSize: '0.57rem', fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', color: resultAccent, background: `rgba(${hexToRgb(resultAccent)},0.1)`, borderRadius: 6, padding: '3px 9px' }}>
              Kinetiq Recommends
            </span>
          </div>
        </div>

        <div style={{ maxWidth: 600, margin: '0 auto', padding: '0 16px 120px' }}>

          {/* Level name */}
          <div style={{ marginTop: 16, marginBottom: 10 }}>
            <h1 style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 900, fontSize: 'clamp(2.2rem,7vw,3rem)', letterSpacing: '-0.05em', lineHeight: 1.0, color: C.onSurface, margin: '0 0 10px' }}>
              {LEVEL_LABELS[result.level]}
            </h1>
            <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: 13, fontWeight: 500, color: C.onSurfaceVariant, margin: '0 0 14px', lineHeight: 1.6 }}>
              {LEVEL_SUMMARY[result.level]}
            </p>

            {/* Personalised explanation */}
            <div style={{ background: C.surfaceContainer, border: `1px solid ${C.outlineVariant}`, borderLeft: `3px solid ${resultAccent}`, borderRadius: 14, padding: '14px 16px', marginBottom: 16 }}>
              <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: 12, fontWeight: 600, color: C.onSurfaceVariant, margin: 0, lineHeight: 1.6 }}>
                Your <span style={{ color: resultAccent, fontWeight: 800 }}>{highest[0]}</span> and <span style={{ color: resultAccent, fontWeight: 800 }}>{highest[1]}</span> were your strongest signals.
                {' '}<span style={{ color: C.secondary, fontWeight: 800 }}>{lowest}</span> scored lower — pay close attention to the load suggestions the engine gives you each session.
              </p>
            </div>
          </div>

          {/* Domain breakdown */}
          <div style={{ background: C.surfaceContainer, border: `1px solid ${C.outlineVariant}`, borderRadius: 14, padding: 16, marginBottom: 16 }}>
            <p style={{ margin: '0 0 14px', fontSize: '0.57rem', fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', color: C.outline }}>Score Breakdown</p>
            {Object.entries(result.domainScores).map(([domain, score]) => (
              <DomainBar key={domain} domain={domain} score={score} visible={barsVisible} />
            ))}
          </div>

          {/* Accept / Override */}
          {!showOverride ? (
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => setPhase('bodyweight')}
                style={{ flex: 2, padding: '14px 0', borderRadius: 12, border: 'none', background: `linear-gradient(135deg, ${C.primary} 0%, #3a5cbf 100%)`, color: '#05080f', fontFamily: 'Space Grotesk, sans-serif', fontWeight: 900, fontSize: 13, cursor: 'pointer' }}
              >
                Accept → {LEVEL_LABELS[result.level]}
              </button>
              <button
                onClick={() => setShowOverride(true)}
                style={{ flex: 1, padding: '14px 0', borderRadius: 12, border: `1px solid ${C.outlineVariant}`, background: 'transparent', color: C.onSurfaceVariant, fontFamily: 'Manrope, sans-serif', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}
              >
                Override
              </button>
            </div>
          ) : (
            <div style={{ background: C.surfaceContainer, border: `1px solid ${C.outlineVariant}`, borderRadius: 14, padding: 16 }}>
              <p style={{ margin: '0 0 12px', fontSize: '0.57rem', fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', color: C.outline }}>Choose Your Level</p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
                {(['BEGINNER','INTERMEDIATE','ADVANCED'] as const).map(lvl => (
                  <button
                    key={lvl}
                    onClick={() => setChosenLevel(lvl)}
                    style={{
                      padding: '12px 16px', borderRadius: 10, cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s',
                      border: `1px solid ${chosenLevel === lvl ? LEVEL_ACCENT[lvl] : C.outlineVariant}`,
                      borderLeft: `3px solid ${chosenLevel === lvl ? LEVEL_ACCENT[lvl] : C.outlineVariant}`,
                      background: chosenLevel === lvl ? `rgba(${hexToRgb(LEVEL_ACCENT[lvl])},0.08)` : C.surfaceHigh,
                      color: chosenLevel === lvl ? LEVEL_ACCENT[lvl] : C.onSurface,
                      fontFamily: 'Space Grotesk, sans-serif', fontWeight: 800, fontSize: 13,
                    }}
                  >
                    {LEVEL_LABELS[lvl]}{lvl === result.level ? '  —  Recommended' : ''}
                  </button>
                ))}
              </div>

              {overrideDir && (
                <div style={{ background: overrideDir === 'up' ? 'rgba(255,107,107,0.07)' : `rgba(${hexToRgb(C.tertiary)},0.07)`, border: `1px solid ${overrideDir === 'up' ? 'rgba(255,107,107,0.22)' : `rgba(${hexToRgb(C.tertiary)},0.22)`}`, borderLeft: `3px solid ${overrideDir === 'up' ? '#ff6b6b' : C.tertiary}`, borderRadius: 10, padding: '12px 14px', marginBottom: 14 }}>
                  <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: 12, fontWeight: 600, color: C.onSurfaceVariant, margin: 0, lineHeight: 1.55 }}>
                    {overrideDir === 'up'
                      ? <><span style={{ color: '#ff6b6b', fontWeight: 800 }}>Heads up:</span> A higher level means more volume and faster progression. If your body isn't ready, you'll stall quickly. You know your body — proceed if you're confident.</>
                      : <><span style={{ color: C.tertiary, fontWeight: 800 }}>No problem.</span> Starting conservative means a gentler volume build. You can update this in Profile settings whenever you feel underchallenged.</>
                    }
                  </p>
                </div>
              )}

              <button
                onClick={() => setPhase('bodyweight')}
                style={{ width: '100%', padding: '14px 0', borderRadius: 12, border: 'none', background: `linear-gradient(135deg, ${LEVEL_ACCENT[chosenLevel]} 0%, #3a5cbf 100%)`, color: '#05080f', fontFamily: 'Space Grotesk, sans-serif', fontWeight: 900, fontSize: 13, cursor: 'pointer' }}
              >
                Continue as {LEVEL_LABELS[chosenLevel]} →
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ════ BODYWEIGHT ═════════════════════════════════════════════════
  if (phase === 'bodyweight') {
    const accent = LEVEL_ACCENT[chosenLevel] ?? C.primary;
    return (
      <div style={{ minHeight: '100vh', background: C.surface, color: C.onSurface, fontFamily: 'Manrope, sans-serif', overflowX: 'hidden', display: 'flex', flexDirection: 'column' }}>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 20px 0', maxWidth: 600, margin: '0 auto', width: '100%' }}>
          <KinetiqLogoWithTealQ />
          <div style={{ display: 'flex', gap: 6 }}>
            {['Goal','Level','Body'].map((_, i) => (
              <div key={i} style={{ height: 3, width: i === 2 ? 22 : 12, borderRadius: 100, background: `linear-gradient(90deg, ${C.primary}, ${C.secondary})`, transition: 'all 0.3s' }} />
            ))}
          </div>
        </div>

        <div style={{ maxWidth: 600, margin: '0 auto', padding: '28px 16px 40px', width: '100%', flex: 1, display: 'flex', flexDirection: 'column' }}>

          <p style={{ margin: '0 0 6px', fontSize: '0.57rem', letterSpacing: '0.24em', textTransform: 'uppercase', color: C.outline, fontWeight: 700 }}>Final Step</p>
          <h1 style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 900, fontSize: 'clamp(1.85rem,6vw,2.4rem)', letterSpacing: '-0.045em', lineHeight: 1.05, color: C.onSurface, margin: '0 0 6px' }}>Your bodyweight</h1>
          <p style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 500, fontSize: 13, color: C.outline, margin: '0 0 22px' }}>Used for fatigue load calculations.</p>

          {/* Calibration summary chip */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 22, background: C.surfaceContainer, border: `1px solid ${C.outlineVariant}`, borderLeft: `3px solid ${accent}`, borderRadius: 12, padding: '12px 14px' }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: accent, flexShrink: 0 }} />
            <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: 12, fontWeight: 700, color: C.onSurfaceVariant }}>
              <span style={{ color: accent }}>{LEVEL_LABELS[chosenLevel]}</span>  ·  Goal: <span style={{ color: C.primary }}>{GOAL_OPTIONS.find(g => g.value === goalMode)?.label}</span>
            </span>
          </div>

          <label style={{ display: 'block', fontFamily: 'Manrope, sans-serif', fontSize: 12, fontWeight: 700, color: C.onSurfaceVariant, letterSpacing: '0.04em', marginBottom: 8 }}>
            Bodyweight (kg)
          </label>
          <input
            type="number"
            value={bodyweightKg}
            onChange={e => setBodyweightKg(e.target.value)}
            onFocus={() => setInputFocused(true)}
            onBlur={() => setInputFocused(false)}
            placeholder="80"
            style={{
              width: '100%', boxSizing: 'border-box', background: C.surfaceLow,
              border: `1px solid ${inputFocused ? C.primary : C.outlineVariant}`,
              borderRadius: 12, padding: '14px 16px', color: C.onSurface,
              fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: 28,
              outline: 'none', transition: 'border-color 0.18s', letterSpacing: '-0.02em',
            }}
          />
          <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: 11, fontWeight: 500, color: C.outline, margin: '10px 0 14px' }}>
            Optional but recommended. You can update this anytime in your profile.
          </p>

          <div style={{ background: C.surfaceContainer, border: `1px solid ${C.outlineVariant}`, borderRadius: 12, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10, marginBottom: 32 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: C.tertiary, flexShrink: 0 }} />
            <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: 12, fontWeight: 500, color: C.onSurfaceVariant, margin: 0 }}>
              Used to calculate your Systemic Fatigue Load and set safe starting weights.
            </p>
          </div>

          {error && (
            <div style={{ background: 'rgba(255,107,107,0.08)', border: '1px solid rgba(255,107,107,0.25)', borderLeft: '3px solid #ff6b6b', borderRadius: 12, padding: '10px 14px', marginBottom: 16 }}>
              <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: 12, fontWeight: 700, color: '#ff6b6b', margin: 0 }}>{error}</p>
            </div>
          )}

          <div style={{ marginTop: 'auto', display: 'flex', gap: 10 }}>
            <button
              onClick={() => setPhase('result')}
              style={{ flex: 1, padding: '14px 0', borderRadius: 12, border: `1px solid ${C.outlineVariant}`, background: 'transparent', color: C.onSurfaceVariant, fontFamily: 'Manrope, sans-serif', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}
            >
              Back
            </button>
            <button
              onClick={handleFinish}
              disabled={loading}
              style={{
                flex: 2, padding: '14px 0', borderRadius: 12, border: 'none',
                background: loading ? C.surfaceHigh : 'linear-gradient(135deg, #b1c5ff 0%, #3a5cbf 100%)',
                color: loading ? C.outline : '#05080f',
                fontFamily: 'Space Grotesk, sans-serif', fontWeight: 900, fontSize: 14, letterSpacing: '0.01em',
                cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, transition: 'all 0.18s',
              }}
            >
              {loading ? 'Saving...' : "Let's Train →"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}