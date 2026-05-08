'use client';

import { useState } from 'react';
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

// ── DATA ─────────────────────────────────────────────────────────
const GOAL_OPTIONS = [
  { value: 'MUSCLE_GAIN', label: 'Build Muscle',    description: 'Maximize hypertrophy and size',          accent: C.primary   },
  { value: 'STRENGTH',    label: 'Build Strength',  description: 'Focus on compound lifts and PRs',         accent: C.secondary },
  { value: 'WEIGHT_LOSS', label: 'Lose Fat',        description: 'Maintain muscle while losing fat',        accent: C.tertiary  },
  { value: 'MAINTAIN',    label: 'Maintain',        description: 'Keep current fitness level',              accent: C.outline   },
];

const EXPERIENCE_OPTIONS = [
  { value: 'BEGINNER',     label: 'Beginner',     description: 'Less than 1 year training', accent: C.tertiary  },
  { value: 'INTERMEDIATE', label: 'Intermediate', description: '1–3 years training',         accent: C.primary   },
  { value: 'ADVANCED',     label: 'Advanced',     description: '3+ years training',          accent: C.secondary },
];

const STEP_META = [
  { label: 'Goal',        subtitle: 'This shapes your training prescriptions' },
  { label: 'Experience',  subtitle: 'This helps calibrate your starting loads'  },
  { label: 'Bodyweight',  subtitle: 'Used for fatigue calculations'             },
];

// ── LOGO ─────────────────────────────────────────────────────────
function KinetiqLogoWithTealQ() {
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
        Kineti
      </span>
      <span style={{ color: '#59d8de' }}>q</span>
    </span>
  );
}

// ── OPTION CARD ───────────────────────────────────────────────────
function OptionCard({
  label,
  description,
  accent,
  selected,
  onClick,
}: {
  label: string;
  description: string;
  accent: string;
  selected: boolean;
  onClick: () => void;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: '100%',
        textAlign: 'left',
        borderRadius: 16,
        padding: '16px 18px',
        border: `1px solid ${selected ? accent : C.outlineVariant}`,
        borderLeft: `3px solid ${selected ? accent : C.outlineVariant}`,
        background: selected
          ? `rgba(${hexToRgb(accent)}, 0.07)`
          : hovered
          ? C.surfaceHigh
          : C.surfaceContainer,
        cursor: 'pointer',
        transition: 'all 0.18s ease',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
      }}
    >
      <div>
        <p style={{
          fontFamily: 'Space Grotesk, sans-serif',
          fontWeight: 800,
          fontSize: 14,
          color: selected ? accent : C.onSurface,
          margin: 0,
          letterSpacing: '-0.01em',
          transition: 'color 0.18s ease',
        }}>
          {label}
        </p>
        <p style={{
          fontFamily: 'Manrope, sans-serif',
          fontWeight: 500,
          fontSize: 12,
          color: selected ? C.onSurfaceVariant : C.outline,
          margin: '3px 0 0',
          transition: 'color 0.18s ease',
        }}>
          {description}
        </p>
      </div>

      {/* Selection indicator */}
      <div style={{
        width: 18,
        height: 18,
        borderRadius: '50%',
        border: `1.5px solid ${selected ? accent : C.outlineVariant}`,
        background: selected ? accent : 'transparent',
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'all 0.18s ease',
      }}>
        {selected && (
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <path
              d="M2 5l2.5 2.5L8 3"
              stroke="#05080f"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </div>
    </button>
  );
}

// ── UTILITY ───────────────────────────────────────────────────────
function hexToRgb(hex: string): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return '177,197,255';
  return `${parseInt(result[1], 16)},${parseInt(result[2], 16)},${parseInt(result[3], 16)}`;
}

// ── PAGE ──────────────────────────────────────────────────────────
export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep]                   = useState(1);
  const [goalMode, setGoalMode]           = useState('');
  const [experienceLevel, setExperienceLevel] = useState('');
  const [bodyweightKg, setBodyweightKg]   = useState('');
  const [loading, setLoading]             = useState(false);
  const [error, setError]                 = useState('');
  const [inputFocused, setInputFocused]   = useState(false);

  async function handleFinish() {
    if (!goalMode) { setError('Please select a goal'); return; }
    setLoading(true);
    setError('');
    try {
      await api.patch('/api/v1/users/me/onboarding', {
        goalMode,
        experienceLevel: experienceLevel || 'INTERMEDIATE',
        bodyweightKg: bodyweightKg ? parseFloat(bodyweightKg) : undefined,
      });
      router.push('/dashboard');
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  const canAdvance = step === 1 ? !!goalMode : true;
  const currentMeta = STEP_META[step - 1];

  return (
    <div style={{
      minHeight: '100vh',
      background: C.surface,
      color: C.onSurface,
      fontFamily: 'Manrope, sans-serif',
      overflowX: 'hidden',
      display: 'flex',
      flexDirection: 'column',
    }}>

      {/* ── TOP BAR ── */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '18px 20px 0',
        maxWidth: 600,
        margin: '0 auto',
        width: '100%',
      }}>
        <KinetiqLogoWithTealQ />
        <span style={{
          fontFamily: 'Manrope, sans-serif',
          fontSize: '0.57rem',
          fontWeight: 700,
          letterSpacing: '0.22em',
          textTransform: 'uppercase',
          color: C.outline,
        }}>
          Step {step} of 3
        </span>
      </div>

      {/* ── PAGE CONTENT ── */}
      <div style={{
        maxWidth: 600,
        margin: '0 auto',
        padding: '28px 16px 40px',
        width: '100%',
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        gap: 0,
      }}>

        {/* ── PROGRESS BAR ── */}
        <div style={{
          display: 'flex',
          gap: 6,
          marginBottom: 28,
        }}>
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              style={{
                height: 3,
                flex: 1,
                borderRadius: 100,
                background: s <= step
                  ? `linear-gradient(90deg, ${C.primary}, ${C.secondary})`
                  : C.outlineVariant,
                transition: 'background 0.3s ease',
              }}
            />
          ))}
        </div>

        {/* ── STEP HEADER ── */}
        <div style={{ marginBottom: 22 }}>
          <p style={{
            margin: '0 0 6px',
            fontSize: '0.57rem',
            letterSpacing: '0.24em',
            textTransform: 'uppercase',
            color: C.outline,
            fontWeight: 700,
          }}>
            {currentMeta.label}
          </p>
          <h1 style={{
            fontFamily: 'Space Grotesk, sans-serif',
            fontWeight: 900,
            fontSize: 'clamp(1.85rem,6vw,2.4rem)',
            letterSpacing: '-0.045em',
            lineHeight: 1.05,
            color: C.onSurface,
            margin: '0 0 8px',
          }}>
            {step === 1 && 'What is your goal?'}
            {step === 2 && 'Experience level'}
            {step === 3 && 'Your bodyweight'}
          </h1>
          <p style={{
            fontFamily: 'Manrope, sans-serif',
            fontWeight: 500,
            fontSize: 13,
            color: C.outline,
            margin: 0,
          }}>
            {currentMeta.subtitle}
          </p>
        </div>

        {/* ── STEP 1 — GOAL ── */}
        {step === 1 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 28 }}>
            {GOAL_OPTIONS.map((option) => (
              <OptionCard
                key={option.value}
                label={option.label}
                description={option.description}
                accent={option.accent}
                selected={goalMode === option.value}
                onClick={() => setGoalMode(option.value)}
              />
            ))}
          </div>
        )}

        {/* ── STEP 2 — EXPERIENCE ── */}
        {step === 2 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 28 }}>
            {EXPERIENCE_OPTIONS.map((option) => (
              <OptionCard
                key={option.value}
                label={option.label}
                description={option.description}
                accent={option.accent}
                selected={experienceLevel === option.value}
                onClick={() => setExperienceLevel(option.value)}
              />
            ))}
          </div>
        )}

        {/* ── STEP 3 — BODYWEIGHT ── */}
        {step === 3 && (
          <div style={{ marginBottom: 28 }}>
            <label style={{
              display: 'block',
              fontFamily: 'Manrope, sans-serif',
              fontSize: 12,
              fontWeight: 700,
              color: C.onSurfaceVariant,
              letterSpacing: '0.04em',
              marginBottom: 8,
            }}>
              Bodyweight (kg)
            </label>
            <input
              type="number"
              value={bodyweightKg}
              onChange={(e) => setBodyweightKg(e.target.value)}
              onFocus={() => setInputFocused(true)}
              onBlur={() => setInputFocused(false)}
              placeholder="80"
              style={{
                width: '100%',
                boxSizing: 'border-box',
                background: C.surfaceLow,
                border: `1px solid ${inputFocused ? C.primary : C.outlineVariant}`,
                borderRadius: 12,
                padding: '14px 16px',
                color: C.onSurface,
                fontFamily: 'Space Grotesk, sans-serif',
                fontWeight: 700,
                fontSize: 22,
                outline: 'none',
                transition: 'border-color 0.18s ease',
                letterSpacing: '-0.02em',
              }}
            />
            <p style={{
              fontFamily: 'Manrope, sans-serif',
              fontSize: 11,
              fontWeight: 500,
              color: C.outline,
              margin: '10px 0 0',
            }}>
              You can update this anytime in your profile.
            </p>

            {/* Stat pill context */}
            <div style={{
              marginTop: 16,
              background: C.surfaceContainer,
              border: `1px solid ${C.outlineVariant}`,
              borderRadius: 12,
              padding: '12px 14px',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
            }}>
              <div style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: C.tertiary,
                flexShrink: 0,
              }} />
              <p style={{
                fontFamily: 'Manrope, sans-serif',
                fontSize: 12,
                fontWeight: 500,
                color: C.onSurfaceVariant,
                margin: 0,
              }}>
                Used to calculate your Systemic Fatigue Load and set safe starting weights.
              </p>
            </div>
          </div>
        )}

        {/* ── ERROR ── */}
        {error && (
          <div style={{
            background: 'rgba(255,107,107,0.08)',
            border: '1px solid rgba(255,107,107,0.25)',
            borderLeft: '3px solid #ff6b6b',
            borderRadius: 12,
            padding: '10px 14px',
            marginBottom: 16,
          }}>
            <p style={{
              fontFamily: 'Manrope, sans-serif',
              fontSize: 12,
              fontWeight: 700,
              color: '#ff6b6b',
              margin: 0,
            }}>
              {error}
            </p>
          </div>
        )}

        {/* ── NAVIGATION BUTTONS ── */}
        <div style={{ display: 'flex', gap: 10, marginTop: 'auto' }}>

          {/* Back */}
          {step > 1 && (
            <button
              onClick={() => setStep((s) => s - 1)}
              style={{
                flex: 1,
                padding: '14px 0',
                borderRadius: 12,
                border: `1px solid ${C.outlineVariant}`,
                background: 'transparent',
                color: C.onSurfaceVariant,
                fontFamily: 'Manrope, sans-serif',
                fontWeight: 700,
                fontSize: 13,
                cursor: 'pointer',
              }}
            >
              Back
            </button>
          )}

          {/* Continue / Get Started */}
          {step < 3 ? (
            <button
              onClick={() => setStep((s) => s + 1)}
              disabled={!canAdvance}
              style={{
                flex: 1,
                padding: '14px 0',
                borderRadius: 12,
                border: 'none',
                background: canAdvance
                  ? 'linear-gradient(135deg, #b1c5ff 0%, #3a5cbf 100%)'
                  : C.surfaceHigh,
                color: canAdvance ? '#05080f' : C.outline,
                fontFamily: 'Space Grotesk, sans-serif',
                fontWeight: 900,
                fontSize: 13,
                letterSpacing: '0.01em',
                cursor: canAdvance ? 'pointer' : 'not-allowed',
                transition: 'all 0.18s ease',
                opacity: canAdvance ? 1 : 0.6,
              }}
            >
              Continue →
            </button>
          ) : (
            <button
              onClick={handleFinish}
              disabled={loading}
              style={{
                flex: 1,
                padding: '14px 0',
                borderRadius: 12,
                border: 'none',
                background: loading
                  ? C.surfaceHigh
                  : 'linear-gradient(135deg, #b1c5ff 0%, #3a5cbf 100%)',
                color: loading ? C.outline : '#05080f',
                fontFamily: 'Space Grotesk, sans-serif',
                fontWeight: 900,
                fontSize: 13,
                letterSpacing: '0.01em',
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'all 0.18s ease',
                opacity: loading ? 0.7 : 1,
              }}
            >
              {loading ? 'Saving...' : 'Get Started →'}
            </button>
          )}
        </div>

      </div>
    </div>
  );
}