'use client';

import { type ReactNode, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import AppHeader from '@/components/AppHeader';
import { biofeedbackApi, type PrePopulationItem } from '@/lib/api/biofeedback';

const C = {
  primary: '#b1c5ff',
  tertiary: '#59d8de',
  surface: '#111318',
  surfaceLow: '#161820',
  surfaceContainer: '#1e2026',
  surfaceHigh: '#282a30',
  outline: '#8e909c',
  outlineVariant: '#3a3c44',
  onSurface: '#e2e2e8',
  onSurfaceVariant: '#c5c6d2',
};

type SorenessKey =
  | 'NEVER_SORE'
  | 'HEALED_LONG_AGO'
  | 'HEALED_ON_TIME'
  | 'STILL_SORE';
type JointComfortKey =
  | 'FEELS_GREAT'
  | 'FEELS_NORMAL'
  | 'SLIGHT_DISCOMFORT'
  | 'VERY_UNCOMFORTABLE'
  | 'SHARP_PAIN';
type JointAreaKey =
  | 'SHOULDER'
  | 'ELBOW'
  | 'WRIST'
  | 'HIP'
  | 'KNEE'
  | 'ANKLE'
  | 'LOWER_BACK';

const SORENESS_OPTIONS: Array<{ key: SorenessKey; label: string }> = [
  { key: 'NEVER_SORE', label: 'Fresh - no soreness at all' },
  { key: 'HEALED_LONG_AGO', label: 'Recovered well before today' },
  { key: 'HEALED_ON_TIME', label: 'Recovered just in time' },
  { key: 'STILL_SORE', label: 'Still sore going into this session' },
];

const JOINT_COMFORT_OPTIONS: Array<{
  key: JointComfortKey;
  score: number;
  label: string;
}> = [
  { key: 'FEELS_GREAT', score: 0, label: 'Joints felt great - full range, no issues' },
  { key: 'FEELS_NORMAL', score: 1, label: 'Normal - nothing worth noting' },
  {
    key: 'SLIGHT_DISCOMFORT',
    score: 3,
    label: 'Slight discomfort in one or two movements',
  },
  {
    key: 'VERY_UNCOMFORTABLE',
    score: 6,
    label: 'Noticeable discomfort that affected my training',
  },
  { key: 'SHARP_PAIN', score: 9, label: 'Sharp pain during one or more movements' },
];

const JOINT_AREA_OPTIONS: Array<{ key: JointAreaKey; label: string }> = [
  { key: 'SHOULDER', label: 'Shoulders' },
  { key: 'ELBOW', label: 'Elbows' },
  { key: 'WRIST', label: 'Wrists' },
  { key: 'HIP', label: 'Hips' },
  { key: 'KNEE', label: 'Knees' },
  { key: 'ANKLE', label: 'Ankles' },
  { key: 'LOWER_BACK', label: 'Lower Back' },
];

const PERFORMANCE_OPTIONS = [
  { value: 1, label: "Struggled - couldn't complete prescribed work" },
  { value: 2, label: 'Below normal - reps felt grinding or sloppy' },
  { value: 3, label: 'Solid - completed everything, good form' },
  { value: 4, label: 'Excellent - strong execution throughout' },
];

const TRAINING_DRIVE_OPTIONS = [
  { value: 1, label: 'Had to force myself through it' },
  { value: 2, label: "Wasn't feeling it, but got it done" },
  { value: 3, label: 'Normal - showed up ready to work' },
  { value: 4, label: 'Locked in - wanted to be here' },
];

const EFFORT_OPTIONS = [
  { value: 1, label: 'Noticeably easier than usual' },
  { value: 2, label: 'About normal' },
  { value: 3, label: 'Harder than usual' },
  { value: 4, label: "One of the harder sessions I've had" },
];

const PUMP_OPTIONS = [
  { value: 1, label: 'Flat all session - nothing there' },
  { value: 2, label: 'Below average' },
  { value: 3, label: 'Good pump' },
  { value: 4, label: 'Skin-splitting - dialled in' },
];

const SORENESS_SCORE_MAP: Record<SorenessKey, number> = {
  NEVER_SORE: 0,
  HEALED_LONG_AGO: 2,
  HEALED_ON_TIME: 5,
  STILL_SORE: 8,
};

const JOINT_SCORE_MAP: Record<JointComfortKey, number> = {
  FEELS_GREAT: 0,
  FEELS_NORMAL: 1,
  SLIGHT_DISCOMFORT: 3,
  VERY_UNCOMFORTABLE: 6,
  SHARP_PAIN: 9,
};

const MUSCLE_LABELS: Record<string, string> = {
  CHEST: 'Chest',
  BACK: 'Back',
  LATS: 'Lats',
  QUADS: 'Quads',
  HAMSTRINGS: 'Hamstrings',
  GLUTES: 'Glutes',
  FRONT_DELT: 'Front Delts',
  SIDE_DELT: 'Side Delts',
  REAR_DELT: 'Rear Delts',
  BICEPS: 'Biceps',
  TRICEPS: 'Triceps',
  CALVES: 'Calves',
  LOWER_BACK: 'Lower Back',
  ABS: 'Abs',
};

function InfoIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="6.5" stroke={C.outline} strokeWidth="1.4" />
      <path d="M8 7v4" stroke={C.outline} strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="8" cy="5.5" r="0.75" fill={C.outline} />
    </svg>
  );
}

function OptionRow({
  options,
  selected,
  onChange,
}: {
  options: Array<{ value: string | number; label: string }>;
  selected: string | number;
  onChange: (value: string | number) => void;
}) {
  return (
    <div style={{ display: 'grid', gap: 8 }}>
      {options.map((option) => {
        const active = selected === option.value;
        return (
          <button
            key={String(option.value)}
            type="button"
            onClick={() => onChange(option.value)}
            style={{
              width: '100%',
              textAlign: 'left',
              background: active ? 'rgba(177,197,255,0.18)' : C.surfaceLow,
              border: `1px solid ${active ? C.primary : C.outlineVariant}`,
              color: active ? C.primary : C.onSurfaceVariant,
              borderRadius: 12,
              padding: '11px 12px',
              fontFamily: 'Manrope, sans-serif',
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.18s ease',
            }}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

function SectionCard({
  category,
  title,
  instruction,
  info,
  children,
}: {
  category: string;
  title: string;
  instruction: string;
  info: string;
  children: ReactNode;
}) {
  const [showInfo, setShowInfo] = useState(false);
  return (
    <section
      style={{
        background: C.surfaceContainer,
        border: `1px solid ${C.outlineVariant}`,
        borderLeft: `3px solid ${C.primary}`,
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
        <div style={{ flex: 1 }}>
          <p
            style={{
              margin: '0 0 6px',
              color: C.outline,
              fontSize: '0.57rem',
              letterSpacing: '0.22em',
              textTransform: 'uppercase',
              fontWeight: 700,
              fontFamily: 'Manrope, sans-serif',
            }}
          >
            {category}
          </p>
          <h2
            style={{
              margin: '0 0 8px',
              color: C.onSurface,
              fontFamily: 'Space Grotesk, sans-serif',
              fontSize: 18,
              fontWeight: 800,
              letterSpacing: '-0.02em',
            }}
          >
            {title}
          </h2>
          <p
            style={{
              margin: 0,
              color: C.onSurfaceVariant,
              fontFamily: 'Manrope, sans-serif',
              fontSize: 12,
            }}
          >
            {instruction}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowInfo((prev) => !prev)}
          title="Show info"
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: 4,
            height: 24,
          }}
        >
          <InfoIcon />
        </button>
      </div>
      {showInfo && (
        <p
          style={{
            margin: '10px 0 0',
            padding: '10px 12px',
            borderRadius: 10,
            border: `1px solid ${C.outlineVariant}`,
            background: C.surfaceLow,
            color: C.onSurfaceVariant,
            fontFamily: 'Manrope, sans-serif',
            fontSize: 12,
            lineHeight: 1.35,
          }}
        >
          {info}
        </p>
      )}
      <div style={{ marginTop: 12 }}>{children}</div>
    </section>
  );
}

function BiofeedbackForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const workoutId = searchParams.get('workoutId');

  const [prePopulation, setPrePopulation] = useState<PrePopulationItem[]>([]);
  const [sorenessByMuscle, setSorenessByMuscle] = useState<Record<string, SorenessKey>>({});
  const [globalJointComfort, setGlobalJointComfort] =
    useState<JointComfortKey>('FEELS_NORMAL');
  const [affectedJoints, setAffectedJoints] = useState<JointAreaKey[]>([]);
  const [sessionPerformance, setSessionPerformance] = useState<number>(3);
  const [trainingDrive, setTrainingDrive] = useState<number>(3);
  const [effortLevel, setEffortLevel] = useState<number>(2);
  const [pumpScore, setPumpScore] = useState<number>(3);
  const [isInitializing, setIsInitializing] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!workoutId) {
      setError('Missing workoutId query param.');
      setIsInitializing(false);
      return;
    }
    void loadPrePopulation(workoutId);
  }, [workoutId]);

  async function loadPrePopulation(id: string) {
    setIsInitializing(true);
    setError(null);
    try {
      const res = await biofeedbackApi.getPrePopulation(id);
      const items = res.data ?? [];
      setPrePopulation(items);
      setSorenessByMuscle(
        Object.fromEntries(
          items.map((item) => [
            item.muscle,
            (item.lastSorenessLabel as SorenessKey) ?? 'HEALED_ON_TIME',
          ]),
        ),
      );
    } catch {
      setError('Unable to load pre-population data.');
    } finally {
      setIsInitializing(false);
    }
  }

  function toggleAffectedJoint(joint: JointAreaKey) {
    setAffectedJoints((prev) =>
      prev.includes(joint) ? prev.filter((j) => j !== joint) : [...prev, joint],
    );
  }

  const globalJointComfortScore = JOINT_SCORE_MAP[globalJointComfort];
  const showJointAreas = globalJointComfortScore >= 6;
  const sorenessLog = useMemo(
    () =>
      Object.fromEntries(
        prePopulation.map(({ muscle }) => [
          muscle,
          SORENESS_SCORE_MAP[sorenessByMuscle[muscle] ?? 'HEALED_ON_TIME'],
        ]),
      ),
    [prePopulation, sorenessByMuscle],
  );
  const jointComfortLog = useMemo(() => {
    if (globalJointComfortScore < 6) return {};
    return Object.fromEntries(
      affectedJoints.map((joint) => [joint, globalJointComfortScore]),
    );
  }, [affectedJoints, globalJointComfortScore]);

  async function handleSubmit() {
    if (!workoutId) return;
    setLoading(true);
    setError(null);
    try {
      const muscleGroupFeedback = prePopulation.map(({ muscle }) => ({
        muscleGroup: muscle,
        soreness: sorenessByMuscle[muscle] ?? 'HEALED_ON_TIME',
        jointComfort: globalJointComfort,
        volume: 'JUST_RIGHT',
      }));

      await biofeedbackApi.submit({
        workoutId,
        sorenessLog,
        muscleGroupFeedback,
        globalJointComfortScore,
        jointComfortLog,
        sessionPerformance,
        trainingDrive,
        effortScore: effortLevel,
        pumpScore,
      });
      router.push('/dashboard');
    } catch {
      setError('Unable to submit biofeedback. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  if (isInitializing) {
    return (
      <p
        style={{
          color: C.outline,
          fontFamily: 'Manrope, sans-serif',
          fontSize: 12,
          padding: '0 16px',
        }}
      >
        Loading feedback form...
      </p>
    );
  }

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', padding: '26px 16px 0' }}>
      <p
        style={{
          margin: '0 0 6px',
          color: C.outline,
          fontSize: '0.57rem',
          letterSpacing: '0.24em',
          textTransform: 'uppercase',
          fontWeight: 700,
          fontFamily: 'Manrope, sans-serif',
        }}
      >
        SESSION FEEDBACK
      </p>
      <h1
        style={{
          margin: '0 0 12px',
          fontFamily: 'Space Grotesk, sans-serif',
          fontWeight: 900,
          fontSize: 'clamp(1.6rem,6vw,2.1rem)',
          letterSpacing: '-0.045em',
          color: C.onSurface,
        }}
      >
        Post-Workout Biofeedback
      </h1>
      <p
        style={{
          margin: '0 0 22px',
          color: C.onSurfaceVariant,
          fontFamily: 'Manrope, sans-serif',
          fontSize: 12,
        }}
      >
        Log how this session felt so Kinetiq can adapt your next one.
      </p>

      {error && (
        <p
          style={{
            margin: '0 0 12px',
            border: `1px solid ${C.outlineVariant}`,
            background: C.surfaceLow,
            color: C.tertiary,
            borderRadius: 12,
            padding: '10px 12px',
            fontFamily: 'Manrope, sans-serif',
            fontSize: 12,
          }}
        >
          {error}
        </p>
      )}

      <SectionCard
        category="Category 1"
        title="How are your muscles feeling?"
        instruction="For each muscle group trained, rate how sore you still feel."
        info="Rate how sore this muscle feels right now, not how hard you worked it. Soreness tells us whether your recovery is keeping up with your training volume."
      >
        {prePopulation.length === 0 ? (
          <p
            style={{
              margin: 0,
              color: C.outline,
              fontFamily: 'Manrope, sans-serif',
              fontSize: 12,
            }}
          >
            No trained muscles were found for this workout.
          </p>
        ) : (
          <div style={{ display: 'grid', gap: 10 }}>
            {prePopulation.map((entry) => (
              <div
                key={entry.muscle}
                style={{
                  background: C.surfaceLow,
                  border: `1px solid ${C.outlineVariant}`,
                  borderRadius: 12,
                  padding: 12,
                }}
              >
                <p
                  style={{
                    margin: '0 0 8px',
                    color: C.onSurface,
                    fontFamily: 'Space Grotesk, sans-serif',
                    fontSize: 15,
                    fontWeight: 700,
                  }}
                >
                  {MUSCLE_LABELS[entry.muscle] ?? entry.muscle}
                </p>
                <OptionRow
                  options={SORENESS_OPTIONS.map((o) => ({
                    value: o.key,
                    label: o.label,
                  }))}
                  selected={sorenessByMuscle[entry.muscle] ?? 'HEALED_ON_TIME'}
                  onChange={(value) =>
                    setSorenessByMuscle((prev) => ({
                      ...prev,
                      [entry.muscle]: value as SorenessKey,
                    }))
                  }
                />
                {entry.carrySoreness && (
                  <p
                    style={{
                      margin: '9px 0 0',
                      color: C.tertiary,
                      fontFamily: 'Manrope, sans-serif',
                      fontSize: 12,
                      fontWeight: 700,
                    }}
                  >
                    ⚠ Carrying soreness from last session
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      <SectionCard
        category="Category 2"
        title="How did your joints feel during training?"
        instruction="Think across all your movements today - not just one exercise."
        info="Joint comfort tracks joint health across your training cycle - not muscle burn or effort. Sharp or persistent discomfort is a signal we use to protect you from injury by adjusting your exercise selection."
      >
        <OptionRow
          options={JOINT_COMFORT_OPTIONS.map((o) => ({
            value: o.key,
            label: o.label,
          }))}
          selected={globalJointComfort}
          onChange={(value) => {
            setGlobalJointComfort(value as JointComfortKey);
            if (JOINT_SCORE_MAP[value as JointComfortKey] < 6) {
              setAffectedJoints([]);
            }
          }}
        />
        {showJointAreas && (
          <div style={{ marginTop: 12 }}>
            <p
              style={{
                margin: '0 0 8px',
                color: C.onSurfaceVariant,
                fontFamily: 'Manrope, sans-serif',
                fontSize: 12,
                fontWeight: 700,
              }}
            >
              Which area(s) were affected?
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {JOINT_AREA_OPTIONS.map((joint) => {
                const active = affectedJoints.includes(joint.key);
                return (
                  <button
                    key={joint.key}
                    type="button"
                    onClick={() => toggleAffectedJoint(joint.key)}
                    style={{
                      borderRadius: 100,
                      border: `1px solid ${active ? C.primary : C.outlineVariant}`,
                      background: active ? 'rgba(177,197,255,0.18)' : C.surfaceLow,
                      color: active ? C.primary : C.onSurfaceVariant,
                      padding: '7px 12px',
                      fontFamily: 'Manrope, sans-serif',
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    {joint.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </SectionCard>

      <SectionCard
        category="Category 3"
        title="How well did you execute today?"
        instruction="Think about rep quality, form, and whether you completed what was prescribed."
        info="Performance tracks how well training went on this occasion - not how hard you pushed. A 'struggled' session isn't bad; it tells us your prescription may need adjusting."
      >
        <OptionRow
          options={PERFORMANCE_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
          selected={sessionPerformance}
          onChange={(value) => setSessionPerformance(Number(value))}
        />
      </SectionCard>

      <SectionCard
        category="Category 4"
        title="What was your drive to train today?"
        instruction="Your psychological readiness and desire to be in the gym."
        info="Training drive is separate from how the session went. Don't confuse this with energy levels - rate your desire to train, not how you felt physically."
      >
        <OptionRow
          options={TRAINING_DRIVE_OPTIONS.map((o) => ({
            value: o.value,
            label: o.label,
          }))}
          selected={trainingDrive}
          onChange={(value) => setTrainingDrive(Number(value))}
        />
      </SectionCard>

      <SectionCard
        category="Category 5"
        title="How hard did this session feel?"
        instruction="Relative to a typical session for you - not how hard you tried."
        info="This is perceived exertion - how difficult training felt compared to your normal baseline, not a measure of how hard you pushed or how motivated you were."
      >
        <OptionRow
          options={EFFORT_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
          selected={effortLevel}
          onChange={(value) => setEffortLevel(Number(value))}
        />
      </SectionCard>

      <SectionCard
        category="Category 6"
        title="How was the pump?"
        instruction="Global feeling of muscle fullness and blood volume during the session."
        info="Pump reflects blood flow and cellular hydration during training. Consistently low pump can indicate under-eating, dehydration, or systemic fatigue."
      >
        <OptionRow
          options={PUMP_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
          selected={pumpScore}
          onChange={(value) => setPumpScore(Number(value))}
        />
      </SectionCard>

      <button
        type="button"
        onClick={handleSubmit}
        disabled={loading || !workoutId}
        style={{
          width: '100%',
          padding: '14px 0',
          borderRadius: 12,
          border: 'none',
          background: 'linear-gradient(135deg, #b1c5ff 0%, #3a5cbf 100%)',
          color: '#05080f',
          fontFamily: 'Space Grotesk, sans-serif',
          fontWeight: 900,
          fontSize: 13,
          letterSpacing: '0.01em',
          cursor: loading ? 'wait' : 'pointer',
          opacity: loading || !workoutId ? 0.65 : 1,
          marginBottom: 28,
        }}
      >
        {loading ? 'Saving...' : 'Submit biofeedback →'}
      </button>
    </div>
  );
}

export default function BiofeedbackPage() {
  return (
    <div
      style={{
        minHeight: '100vh',
        background: C.surface,
        color: C.onSurface,
        fontFamily: 'Manrope, sans-serif',
        paddingBottom: 110,
        overflowX: 'hidden',
      }}
    >
      <AppHeader title="Biofeedback" showBack backHref="/dashboard" />
      <Suspense
        fallback={
          <p style={{ color: C.outline, padding: '20px', fontFamily: 'Manrope, sans-serif' }}>
            Loading...
          </p>
        }
      >
        <BiofeedbackForm />
      </Suspense>
    </div>
  );
}