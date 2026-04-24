'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import { mesocyclesApi } from '@/lib/api/mesocycles';
import { workoutsApi } from '@/lib/api/workouts';
import { ChevronRight, Play, Trophy, Zap } from 'lucide-react';
import AppHeader from '@/components/AppHeader';

// ─── Brand Tokens ─────────────────────────────────────────────────────────────
const PRIMARY          = '#b1c5ff';
const PRIMARY_DIM      = 'rgba(177,197,255,0.12)';
const PRIMARY_GLOW     = 'rgba(177,197,255,0.35)';
const SECONDARY        = '#d4bbff';
const TERTIARY         = '#59d8de';
const SURFACE          = '#111318';
const SURFACE_CONTAINER = '#1a1c22';
const SURFACE_HIGH     = '#282a30';
const OUTLINE          = '#8e909c';
const ON_SURFACE       = '#e2e2e8';
const INVERSE          = '#e2e2e8';

// ─────────────────────────────────────────────────────────────────────────────
//  STATIC CONTENT BLOCK
//  All strings marked @static below are safe to edit freely.
//  Strings marked @dynamic are derived from API/auth data — do not hardcode.
// ─────────────────────────────────────────────────────────────────────────────

/** @static Sub-tagline shown above the greeting headline */
const STATIC_TAGLINE = 'Performance Protocol Activated';

/** @static Word(s) appended after the user's name in the main greeting */
const STATIC_GREETING_SUFFIX = 'Lightweight!!!';

/** @static Label for the philosophy footer section */
const STATIC_PHILOSOPHY_LABEL = 'Philosophy';

/**
 * @static Philosophy quote shown in the footer banner.
 * Edit freely — line breaks are handled automatically.
 */
const STATIC_PHILOSOPHY_HEADLINE =
  'Information without movement is useless. Movement without information is wasted.';

/**
 * @static URL of the motivational background image in the philosophy section.
 * Replace with a local asset path e.g. '/images/gym-bg.jpg' or a CDN URL.
 */
const STATIC_MOTIVATION_IMAGE_URL =
  'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?q=80&w=2000&auto=format&fit=crop';

/** @static Alt text for the motivation image (accessibility) */
const STATIC_MOTIVATION_IMAGE_ALT = 'Athletic gym atmosphere';

/** @static Small label above the "Start Session" button */
const STATIC_START_LABEL = 'Ready to Engage';

/**
 * @static Next suggested day label.
 * TODO: replace with real split-day logic from mesocycle/workout data.
 */
const STATIC_SUGGESTED_DAY = 'Day 2 – Week 1';

/**
 * @static PR exercise name displayed in the Milestones card.
 * TODO: wire to PRRecord API endpoint.
 */
const STATIC_PR_EXERCISE = 'Deadlift';

/** @static PR value. TODO: wire to PRRecord API. */
const STATIC_PR_VALUE = '220';

/** @static PR unit (kg / lbs). */
const STATIC_PR_UNIT = 'kg';

/**
 * @static Muscle group shown in the Performance Insight card.
 * TODO: replace with most-trained muscle from analytics API.
 */
const STATIC_INSIGHT_MUSCLE = 'Chest';

/** @static Volume delta badge text. TODO: wire to analytics/volume API. */
const STATIC_INSIGHT_CHANGE = '+5%';

/** @static Sub-label under the insight muscle heading. */
const STATIC_INSIGHT_LABEL = 'Volume vs last week';

/**
 * @static Bar heights for the muscle volume chart (0–100 scale, 6 weeks).
 * TODO: replace with weekly VolumeSnapshot data from analytics API.
 */
const STATIC_INSIGHT_BARS: number[] = [30, 25, 40, 35, 55, 90];

/**
 * @static Sparkline exercise label in the Milestones card.
 * TODO: replace with analytics/e1rm/:exerciseId label.
 */
const STATIC_SPARKLINE_LABEL = 'Bench Press e1RM';

/**
 * @static Sparkline data points (7-session rolling e1RM in kg).
 * TODO: wire to GET /analytics/e1rm/:exerciseId.
 */
const STATIC_SPARKLINE_DATA: number[] = [100, 105, 102, 108, 111, 110, 115];

/** @static Unit for sparkline axis label. */
const STATIC_SPARKLINE_UNIT = 'kg';

/**
 * @static Fallback recent workout rows shown when API returns no history.
 * Replace label/date/duration with real data — these are display-only placeholders.
 */
const STATIC_FALLBACK_WORKOUTS = [
  { label: 'Push Focused A',  date: 'Oct 22', duration: '72 mins' },
  { label: 'Pull Focused B',  date: 'Oct 20', duration: '65 mins' },
  { label: 'Leg Power Load',  date: 'Oct 18', duration: '88 mins' },
];

// ─── Sparkline SVG ────────────────────────────────────────────────────────────

function Sparkline({ data, color, height = 56 }: { data: number[]; color: string; height?: number }) {
  const max = Math.max(...data, 1);
  const w   = 100;
  const pts = data.map((v, i) => {
    const x = data.length < 2 ? 50 : (i / (data.length - 1)) * w;
    const y = height - (v / max) * (height - 8);
    return `${x},${y}`;
  });
  const lastPt = pts[pts.length - 1]?.split(',') ?? ['100', '8'];

  return (
    <svg viewBox={`0 0 ${w} ${height}`} preserveAspectRatio="none" style={{ width: '100%', height }}>
      <defs>
        <linearGradient id={`sg${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor={color} stopOpacity="0.4" />
          <stop offset="100%" stopColor={color} stopOpacity="0"   />
        </linearGradient>
      </defs>
      <polygon
        points={`0,${height} ${pts.join(' ')} ${w},${height}`}
        fill={`url(#sg${color.replace('#', '')})`}
      />
      <polyline
        points={pts.join(' ')}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <circle
        cx={lastPt[0]}
        cy={lastPt[1]}
        r="3"
        fill={color}
        style={{ filter: `drop-shadow(0 0 5px ${color})` }}
      />
    </svg>
  );
}

// ─── Bar chart ────────────────────────────────────────────────────────────────

function BarChart({ bars, color }: { bars: number[]; color: string }) {
  const max = Math.max(...bars, 1);
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: '4px', height: '80px' }}>
      {bars.map((v, i) => {
        const isFinal = i === bars.length - 1;
        const h       = Math.max((v / max) * 80, 6);
        return (
          <div
            key={i}
            style={{
              flex: 1,
              height: `${h}px`,
              borderRadius: '4px 4px 2px 2px',
              backgroundColor: isFinal ? color : `${color}28`,
              boxShadow: isFinal ? `0 0 16px ${color}66` : 'none',
            }}
          />
        );
      })}
    </div>
  );
}

// ─── Workout row ──────────────────────────────────────────────────────────────

function WorkoutRow({ label, date, duration, accent }: { label: string; date: string; duration: string; accent: string }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '14px',
        backgroundColor: SURFACE_HIGH,
        borderRadius: '14px',
        cursor: 'pointer',
        border: '1px solid transparent',
        transition: 'border-color 0.15s',
      }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = `${accent}44`; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = 'transparent'; }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <div style={{ width: '5px', height: '40px', borderRadius: '9999px', backgroundColor: accent, flexShrink: 0 }} />
        <div>
          <p style={{ margin: 0, fontFamily: 'Manrope, sans-serif', fontWeight: 700, fontSize: '0.88rem', color: ON_SURFACE }}>
            {label}
          </p>
          <p style={{ margin: '2px 0 0', fontFamily: 'Manrope, sans-serif', fontSize: '0.68rem', color: OUTLINE }}>
            {date} · {duration}
          </p>
        </div>
      </div>
      <ChevronRight size={16} color={OUTLINE} />
    </div>
  );
}

// ─── Section label ────────────────────────────────────────────────────────────

function SectionLabel({ children, light }: { children: React.ReactNode; light?: boolean }) {
  return (
    <p style={{ margin: 0, fontFamily: 'Manrope, sans-serif', fontSize: '0.58rem', fontWeight: 700, color: light ? 'rgba(0,0,0,0.45)' : OUTLINE, letterSpacing: '0.2em', textTransform: 'uppercase' }}>
      {children}
    </p>
  );
}

// ─── Card wrapper ─────────────────────────────────────────────────────────────

function Card({ children, style, accentLeft }: { children: React.ReactNode; style?: React.CSSProperties; accentLeft?: string }) {
  return (
    <div style={{ backgroundColor: SURFACE_CONTAINER, border: `1px solid ${SURFACE_HIGH}`, borderLeft: accentLeft ? `4px solid ${accentLeft}` : undefined, borderRadius: '20px', padding: '20px', ...style }}>
      {children}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const router = useRouter();
  const [mesocycle, setMesocycle]       = useState<any>(null);
  const [recentWorkouts, setRecentWorkouts] = useState<any[]>([]);
  const [loading, setLoading]           = useState(true);

  const { isAuthenticated, hydrated, email } = useAuthStore();

  // @dynamic: derived from auth store email until profile displayName is available
  const userName: string = email?.split('@')[0] ?? 'Athlete';

  useEffect(() => {
    if (!hydrated) return;
    if (!isAuthenticated()) { router.push('/auth/login'); return; }
    loadData();
  }, [hydrated]);

  async function loadData() {
    try {
      const [mesoRes, histRes] = await Promise.allSettled([
        mesocyclesApi.active(),
        workoutsApi.history(),
      ]);
      if (mesoRes.status === 'fulfilled') setMesocycle(mesoRes.value.data);
      if (histRes.status === 'fulfilled') setRecentWorkouts(histRes.value.data.slice(0, 3));
    } catch (err) { console.error(err); }
    finally      { setLoading(false); }
  }

  async function startWorkout() {
    try {
      const res = await workoutsApi.create({ mesocycleId: mesocycle?.id });
      router.push(`/workout/${res.data.id}`);
    } catch (err) { console.error(err); }
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100dvh', backgroundColor: SURFACE, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: OUTLINE, fontFamily: 'Manrope, sans-serif', fontSize: '0.85rem' }}>Loading...</p>
      </div>
    );
  }

  // @dynamic: from mesocycle API response
  const activeWeek    = mesocycle?.currentWeek ?? 1;
  const totalWeeks    = mesocycle?.totalWeeks  ?? 8;
  const progressPct   = Math.round((activeWeek / totalWeeks) * 100);
  const mesocycleName: string = mesocycle?.name ?? 'No active block';

  const rowAccents = [PRIMARY, SECONDARY, TERTIARY];

  return (
    <div style={{ minHeight: '100dvh', backgroundColor: SURFACE, fontFamily: 'Manrope, sans-serif', color: ON_SURFACE }}>
      <div style={{ maxWidth: '980px', margin: '0 auto', padding: '0 20px 140px' }}>

        {/* AppHeader — existing component, unchanged */}
        <AppHeader />

        <main style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

          {/* ══════════════════════════
              HERO — Greeting + Block
          ══════════════════════════ */}
          <section style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

            {/* Greeting text */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>

              {/* @static: edit STATIC_TAGLINE */}
              <p style={{ margin: 0, fontSize: '0.6rem', fontWeight: 700, color: PRIMARY, letterSpacing: '0.22em', textTransform: 'uppercase' }}>
                {STATIC_TAGLINE}
              </p>

              {/* @dynamic userName | @static STATIC_GREETING_SUFFIX */}
              <h1 style={{ margin: 0, fontFamily: "'Space Grotesk', sans-serif", fontSize: 'clamp(2rem, 8vw, 4.5rem)', fontWeight: 900, lineHeight: 1.0, letterSpacing: '-0.025em', color: ON_SURFACE, textTransform: 'uppercase' }}>
                Welcome {userName},
                <br />
                <span style={{ fontStyle: 'italic', WebkitTextStroke: '1.5px', WebkitTextStrokeColor: PRIMARY, color: 'transparent' }}>
                  {STATIC_GREETING_SUFFIX}
                </span>
              </h1>

              {/* @dynamic current date */}
              <p style={{ margin: 0, fontSize: '0.75rem', color: OUTLINE }}>
                {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
              </p>
            </div>

            {/* Active Block card — @dynamic mesocycle data */}
            <Card accentLeft={PRIMARY} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <SectionLabel>Active Block</SectionLabel>
              <p style={{ margin: 0, fontFamily: "'Space Grotesk', sans-serif", fontSize: '1.25rem', fontWeight: 800, color: ON_SURFACE, letterSpacing: '-0.01em' }}>
                {/* @dynamic */}
                {mesocycleName}
              </p>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                {/* @dynamic */}
                <p style={{ margin: 0, fontSize: '0.78rem', color: OUTLINE }}>Week {activeWeek} of {totalWeeks}</p>
                <div style={{ width: '140px', height: '5px', borderRadius: '9999px', backgroundColor: SURFACE_HIGH, overflow: 'hidden' }}>
                  {/* @dynamic progressPct */}
                  <div style={{ width: `${progressPct}%`, height: '100%', borderRadius: '9999px', backgroundColor: PRIMARY, boxShadow: `0 0 8px ${PRIMARY_GLOW}`, transition: 'width 0.6s ease' }} />
                </div>
              </div>
            </Card>
          </section>

          {/* ══════════════════════════
              START SESSION CTA
          ══════════════════════════ */}
          <button
            type="button"
            onClick={startWorkout}
            style={{ width: '100%', minHeight: '110px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 28px', borderRadius: '28px', border: 'none', background: `linear-gradient(135deg, ${PRIMARY} 0%, ${TERTIARY} 100%)`, cursor: 'pointer', boxShadow: `0 20px 60px -15px ${PRIMARY_GLOW}`, position: 'relative', overflow: 'hidden', transition: 'transform 0.2s' }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(0.99)'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)'; }}
          >
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, rgba(0,0,0,0.12), transparent)', pointerEvents: 'none' }} />

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', zIndex: 1 }}>
              {/* @static */}
              <span style={{ fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(17,19,24,0.7)', marginBottom: '4px' }}>
                {STATIC_START_LABEL}
              </span>
              <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 'clamp(1.6rem, 5vw, 2.8rem)', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '-0.02em', color: SURFACE, lineHeight: 1 }}>
                Start Session
              </span>
            </div>

            <div style={{ width: '60px', height: '60px', borderRadius: '9999px', backgroundColor: 'rgba(17,19,24,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, zIndex: 1 }}>
              <Play size={28} color={SURFACE} fill={SURFACE} style={{ marginLeft: '3px' }} />
            </div>
          </button>

          {/* ══════════════════════════
              BENTO GRID
          ══════════════════════════ */}
          <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>

            {/* ── Recent Volume ── */}
            <Card style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <SectionLabel>Recent Volume</SectionLabel>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {/* @dynamic recentWorkouts — falls back to @static placeholders */}
                {recentWorkouts.length > 0
                  ? recentWorkouts.map((w, i) => (
                      <WorkoutRow
                        key={w.id}
                        label={w.splitDayLabel ?? 'Training Session'}
                        date={new Date(w.completedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        duration={w.durationMinutes ? `${w.durationMinutes} mins` : '–'}
                        accent={rowAccents[i % rowAccents.length]}
                      />
                    ))
                  : STATIC_FALLBACK_WORKOUTS.map((w, i) => (
                      /* @static fallback — edit STATIC_FALLBACK_WORKOUTS above */
                      <WorkoutRow key={w.label} label={w.label} date={w.date} duration={w.duration} accent={rowAccents[i % rowAccents.length]} />
                    ))
                }
              </div>
            </Card>

            {/* ── Performance Insight (Inverse / Light card) ── */}
            <div style={{ backgroundColor: INVERSE, borderRadius: '20px', padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', borderLeft: `6px solid ${PRIMARY}`, position: 'relative', overflow: 'hidden' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <SectionLabel light>Performance Insight</SectionLabel>
                {/* @static badge — edit STATIC_INSIGHT_CHANGE */}
                <span style={{ backgroundColor: `${PRIMARY}22`, color: SURFACE, fontSize: '0.6rem', fontWeight: 900, padding: '3px 8px', borderRadius: '6px', letterSpacing: '0.06em' }}>
                  {STATIC_INSIGHT_CHANGE} VOL
                </span>
              </div>

              <div style={{ marginTop: '12px' }}>
                {/* @static muscle name — edit STATIC_INSIGHT_MUSCLE */}
                <h3 style={{ margin: 0, fontFamily: "'Space Grotesk', sans-serif", fontSize: '2rem', fontWeight: 900, letterSpacing: '-0.02em', textTransform: 'uppercase', color: SURFACE, lineHeight: 1.05 }}>
                  {STATIC_INSIGHT_MUSCLE} Progress
                </h3>
                {/* @static sub-label — edit STATIC_INSIGHT_LABEL */}
                <p style={{ margin: '6px 0 0', fontSize: '0.75rem', color: 'rgba(0,0,0,0.55)', fontWeight: 500 }}>
                  {STATIC_INSIGHT_LABEL}
                </p>
              </div>

              {/* @static bars — edit STATIC_INSIGHT_BARS */}
              <div style={{ marginTop: '20px' }}>
                <BarChart bars={STATIC_INSIGHT_BARS} color={SURFACE} />
              </div>
            </div>

            {/* ── Milestones / PRs ── */}
            <Card style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <SectionLabel>Milestones</SectionLabel>
                <Trophy size={16} color={SECONDARY} />
              </div>

              {/* PR card — @static STATIC_PR_* values, wire to PRRecord API */}
              <div style={{ backgroundColor: SURFACE_HIGH, borderRadius: '16px', padding: '16px', display: 'flex', alignItems: 'center', gap: '16px', border: `1px solid ${SECONDARY}33` }}>
                <div style={{ width: '52px', height: '52px', borderRadius: '14px', backgroundColor: `${SECONDARY}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Trophy size={24} color={SECONDARY} />
                </div>
                <div>
                  {/* @static */}
                  <p style={{ margin: 0, fontSize: '0.62rem', fontWeight: 700, color: OUTLINE, letterSpacing: '0.16em', textTransform: 'uppercase' }}>
                    {STATIC_PR_EXERCISE}
                  </p>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginTop: '2px' }}>
                    {/* @static */}
                    <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '1.6rem', fontWeight: 900, color: ON_SURFACE }}>{STATIC_PR_VALUE}</span>
                    <span style={{ fontSize: '0.78rem', fontWeight: 600, color: OUTLINE }}>{STATIC_PR_UNIT}</span>
                  </div>
                  <p style={{ margin: '2px 0 0', fontSize: '0.6rem', fontWeight: 900, color: SECONDARY, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                    New Personal Record!
                  </p>
                </div>
              </div>

              {/* e1RM sparkline — @static STATIC_SPARKLINE_* values */}
              <div style={{ backgroundColor: SURFACE_HIGH, borderRadius: '16px', padding: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  {/* @static */}
                  <p style={{ margin: 0, fontSize: '0.68rem', fontWeight: 700, color: ON_SURFACE }}>{STATIC_SPARKLINE_LABEL}</p>
                  {/* @static last data point */}
                  <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '0.9rem', fontWeight: 800, color: PRIMARY }}>
                    {STATIC_SPARKLINE_DATA[STATIC_SPARKLINE_DATA.length - 1]}{STATIC_SPARKLINE_UNIT}
                  </span>
                </div>
                {/* @static */}
                <Sparkline data={STATIC_SPARKLINE_DATA} color={PRIMARY} height={52} />
              </div>
            </Card>
          </section>

          {/* ══════════════════════════
              NEXT SUGGESTED SESSION
          ══════════════════════════ */}
          <Card style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '12px', backgroundColor: PRIMARY_DIM, border: `1px solid ${PRIMARY}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Zap size={18} color={PRIMARY} />
              </div>
              <div>
                <SectionLabel>Next Suggested Session</SectionLabel>
                {/* @static — edit STATIC_SUGGESTED_DAY, or wire to split API */}
                <p style={{ margin: '4px 0 0', fontFamily: "'Space Grotesk', sans-serif", fontSize: '1.05rem', fontWeight: 800, color: ON_SURFACE, letterSpacing: '-0.01em' }}>
                  {STATIC_SUGGESTED_DAY}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={startWorkout}
              style={{ padding: '10px 18px', borderRadius: '12px', border: 'none', backgroundColor: PRIMARY_DIM, color: PRIMARY, fontFamily: 'Manrope, sans-serif', fontWeight: 800, fontSize: '0.72rem', letterSpacing: '0.1em', textTransform: 'uppercase', cursor: 'pointer', flexShrink: 0, transition: 'background-color 0.15s' }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = `${PRIMARY}28`; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = PRIMARY_DIM; }}
            >
              Begin
            </button>
          </Card>

          {/* ══════════════════════════════════════════
              PHILOSOPHY FOOTER BANNER
              @static: edit STATIC_PHILOSOPHY_* constants above
              @static: edit STATIC_MOTIVATION_IMAGE_URL above
          ══════════════════════════════════════════ */}
          <section style={{ position: 'relative', borderRadius: '28px', overflow: 'hidden', minHeight: '320px' }}>

            {/* Background image — @static: change STATIC_MOTIVATION_IMAGE_URL */}
            <img
              src={STATIC_MOTIVATION_IMAGE_URL}
              alt={STATIC_MOTIVATION_IMAGE_ALT}
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', filter: 'grayscale(100%)', opacity: 0.35, mixBlendMode: 'luminosity' }}
            />

            {/* Gradient overlay */}
            <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(to top, ${SURFACE} 40%, ${SURFACE}cc 65%, transparent 100%)` }} />

            {/* Text */}
            <div style={{ position: 'relative', padding: '40px 32px', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', minHeight: '320px' }}>

              {/* @static: edit STATIC_PHILOSOPHY_LABEL */}
              <span style={{ fontSize: '0.6rem', fontWeight: 700, color: `${PRIMARY}cc`, letterSpacing: '0.4em', textTransform: 'uppercase', display: 'block', marginBottom: '12px' }}>
                {STATIC_PHILOSOPHY_LABEL}
              </span>

              {/* @static: edit STATIC_PHILOSOPHY_HEADLINE */}
              <h2 style={{ margin: 0, fontFamily: "'Space Grotesk', sans-serif", fontSize: 'clamp(1.1rem, 3.5vw, 1.75rem)', fontWeight: 900, lineHeight: 1.15, letterSpacing: '-0.01em', textTransform: 'uppercase', fontStyle: 'italic', color: ON_SURFACE, maxWidth: '680px' }}>
                {STATIC_PHILOSOPHY_HEADLINE}
              </h2>
            </div>
          </section>

        </main>
      </div>
    </div>
  );
}
