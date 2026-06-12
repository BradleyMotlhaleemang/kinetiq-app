'use client';

import { type ReactNode, useEffect, useMemo, useState } from 'react';
import {
  biofeedbackApi,
  type JointTriage,
  type PrePopulationItem,
} from '@/lib/api/biofeedback';
import {
  ALL_JOINT_KEYS,
  JOINT_AREA_LABELS,
  JOINT_SEVERITY_OPTIONS,
  JOINT_TRIAGE_OPTIONS,
  rotatedSessionMetaFields,
  uiSeverityToInternal,
  type JointAreaKey,
} from '@/lib/biofeedback/joint-pain-scale';

const C = {
  primary: '#b1c5ff',
  tertiary: '#59d8de',
  surfaceLow: '#161820',
  surfaceContainer: '#1e2026',
  outline: '#8e909c',
  outlineVariant: '#3a3c44',
  onSurface: '#e2e2e8',
  onSurfaceVariant: '#c5c6d2',
  danger: '#ff8a80',
};

type SorenessKey =
  | 'NEVER_SORE'
  | 'HEALED_LONG_AGO'
  | 'HEALED_ON_TIME'
  | 'STILL_SORE';

const SORENESS_OPTIONS: Array<{ key: SorenessKey; label: string }> = [
  { key: 'NEVER_SORE', label: 'Fresh - no soreness at all' },
  { key: 'HEALED_LONG_AGO', label: 'Recovered well before today' },
  { key: 'HEALED_ON_TIME', label: 'Recovered just in time' },
  { key: 'STILL_SORE', label: 'Still sore going into this session' },
];

const SORENESS_SCORE_MAP: Record<SorenessKey, number> = {
  NEVER_SORE: 0,
  HEALED_LONG_AGO: 2,
  HEALED_ON_TIME: 5,
  STILL_SORE: 8,
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
  children,
}: {
  category: string;
  title: string;
  instruction: string;
  children: ReactNode;
}) {
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
      <p
        style={{
          margin: '0 0 6px',
          color: C.outline,
          fontSize: '0.57rem',
          letterSpacing: '0.22em',
          textTransform: 'uppercase',
          fontWeight: 700,
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
        }}
      >
        {title}
      </h2>
      <p style={{ margin: '0 0 12px', color: C.onSurfaceVariant, fontSize: 12 }}>
        {instruction}
      </p>
      {children}
    </section>
  );
}

export type BiofeedbackFormProps = {
  workoutId: string;
  onSuccess: () => void;
  onSkip?: () => void;
  compact?: boolean;
  initialJointTriage?: JointTriage | null;
  hideJointTriage?: boolean;
};

export default function BiofeedbackForm({
  workoutId,
  onSuccess,
  onSkip,
  compact = false,
  initialJointTriage = null,
  hideJointTriage = false,
}: BiofeedbackFormProps) {
  const [prePopulation, setPrePopulation] = useState<PrePopulationItem[]>([]);
  const [workoutJoints, setWorkoutJoints] = useState<JointAreaKey[]>([]);
  const [recentJointHints, setRecentJointHints] = useState<Record<string, number>>({});
  const [jointTriage, setJointTriage] = useState<JointTriage | null>(
    initialJointTriage,
  );
  const [selectedJoints, setSelectedJoints] = useState<Set<JointAreaKey>>(new Set());
  const [showSomewhereElse, setShowSomewhereElse] = useState(false);
  const [jointSeverity, setJointSeverity] = useState<Partial<Record<JointAreaKey, number>>>({});
  const [batchSeverity, setBatchSeverity] = useState(2);
  const [sorenessByMuscle, setSorenessByMuscle] = useState<Record<string, SorenessKey>>({});
  const [sorenessExpanded, setSorenessExpanded] = useState(false);
  const [sessionPerformance, setSessionPerformance] = useState(3);
  const [trainingDrive, setTrainingDrive] = useState(3);
  const [effortLevel, setEffortLevel] = useState(2);
  const [pumpScore, setPumpScore] = useState(3);
  const [isInitializing, setIsInitializing] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const metaFields = useMemo(
    () => rotatedSessionMetaFields(workoutId),
    [workoutId],
  );

  useEffect(() => {
    void loadPrePopulation(workoutId);
  }, [workoutId]);

  useEffect(() => {
    if (initialJointTriage === 'SIGNIFICANT') {
      setBatchSeverity(3);
    }
  }, [initialJointTriage]);

  async function loadPrePopulation(id: string) {
    setIsInitializing(true);
    setError(null);
    try {
      const res = await biofeedbackApi.getPrePopulation(id);
      const payload = res.data;
      const items = payload.muscles ?? [];
      const joints = (payload.relevantJoints ?? []) as JointAreaKey[];
      setPrePopulation(items);
      setWorkoutJoints(joints);
      setRecentJointHints(payload.recentJointHints ?? {});
      setSorenessByMuscle(
        Object.fromEntries(
          items.map((item) => [
            item.muscle,
            (item.lastSorenessLabel as SorenessKey) ?? 'HEALED_ON_TIME',
          ]),
        ),
      );
      const hinted = new Set<JointAreaKey>();
      for (const j of joints) {
        if ((payload.recentJointHints?.[j] ?? 0) >= 3) {
          hinted.add(j);
        }
      }
      if (hinted.size > 0) {
        setSelectedJoints(hinted);
      }
    } catch {
      setError('Unable to load pre-population data.');
    } finally {
      setIsInitializing(false);
    }
  }

  const musclesNeedingAttention = useMemo(
    () => prePopulation.filter((m) => m.carrySoreness),
    [prePopulation],
  );

  const musclesCollapsed = useMemo(
    () => prePopulation.filter((m) => !m.carrySoreness),
    [prePopulation],
  );

  const pickerJoints = useMemo(() => {
    const base = workoutJoints.length > 0 ? workoutJoints : ALL_JOINT_KEYS;
    if (!showSomewhereElse) return base;
    const merged = new Set<JointAreaKey>([...base, ...ALL_JOINT_KEYS]);
    return [...merged];
  }, [workoutJoints, showSomewhereElse]);

  const jointComfortLog = useMemo(() => {
    if (jointTriage === 'HEALTHY') return {};
    const log: Record<string, number> = {};
    for (const joint of selectedJoints) {
      const uiScore = jointSeverity[joint] ?? batchSeverity;
      const internal = uiSeverityToInternal(uiScore);
      if (internal >= 1) {
        log[joint] = internal;
      }
    }
    return log;
  }, [jointTriage, selectedJoints, jointSeverity, batchSeverity]);

  const globalJointComfortScore = useMemo(() => {
    if (jointTriage === 'HEALTHY') return 0;
    const scores = Object.values(jointComfortLog);
    return scores.length > 0 ? Math.max(...scores) : 0;
  }, [jointTriage, jointComfortLog]);

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

  function toggleJoint(joint: JointAreaKey) {
    setSelectedJoints((prev) => {
      const next = new Set(prev);
      if (next.has(joint)) next.delete(joint);
      else next.add(joint);
      return next;
    });
  }

  async function handleSubmit() {
    if (!workoutId || jointTriage === null) {
      setError('Please rate how your joints felt during this workout.');
      return;
    }
    if (
      jointTriage !== 'HEALTHY' &&
      selectedJoints.size === 0
    ) {
      setError('Select at least one joint, or choose "No pain or discomfort".');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const muscleGroupFeedback = prePopulation.map(({ muscle }) => ({
        muscleGroup: muscle,
        soreness: sorenessByMuscle[muscle] ?? 'HEALED_ON_TIME',
        jointComfort: 'FEELS_NORMAL',
        volume: 'JUST_RIGHT',
      }));

      await biofeedbackApi.submit({
        workoutId,
        jointTriage,
        sorenessLog,
        muscleGroupFeedback,
        globalJointComfortScore,
        jointComfortLog,
        sessionPerformance,
        trainingDrive: metaFields.showDrive ? trainingDrive : 3,
        effortScore: metaFields.showEffort ? effortLevel : undefined,
        pumpScore: metaFields.showPump ? pumpScore : 3,
      });
      onSuccess();
    } catch {
      setError('Unable to submit biofeedback. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  if (isInitializing) {
    return (
      <p style={{ color: C.outline, fontSize: 12, padding: compact ? 0 : '0 16px' }}>
        Loading feedback form...
      </p>
    );
  }

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', padding: compact ? 0 : '0 16px' }}>
      {error && (
        <p
          style={{
            margin: '0 0 12px',
            border: `1px solid ${C.outlineVariant}`,
            background: C.surfaceLow,
            color: C.tertiary,
            borderRadius: 12,
            padding: '10px 12px',
            fontSize: 12,
          }}
        >
          {error}
        </p>
      )}

      {!hideJointTriage && (
        <SectionCard
          category="Joints"
          title="How did your joints feel during this workout?"
          instruction="Start here. If everything felt fine, one tap is enough."
        >
          <OptionRow
            options={JOINT_TRIAGE_OPTIONS.map((o) => ({
              value: o.value,
              label: `${o.label} — ${o.hint}`,
            }))}
            selected={jointTriage ?? ''}
            onChange={(v) => {
              const t = v as JointTriage;
              setJointTriage(t);
              if (t === 'HEALTHY') {
                setSelectedJoints(new Set());
              }
              if (t === 'SIGNIFICANT') {
                setBatchSeverity(3);
              }
            }}
          />
        </SectionCard>
      )}

      {jointTriage && jointTriage !== 'HEALTHY' && (
        <SectionCard
          category="Joints"
          title="Which joints were affected?"
          instruction={
            jointTriage === 'SIGNIFICANT'
              ? 'Select all that apply, then set severity below.'
              : 'Select joints with mild discomfort.'
          }
        >
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
            {pickerJoints.map((joint) => {
              const active = selectedJoints.has(joint);
              return (
                <button
                  key={joint}
                  type="button"
                  onClick={() => toggleJoint(joint)}
                  style={{
                    padding: '8px 12px',
                    borderRadius: 999,
                    border: `1px solid ${active ? C.primary : C.outlineVariant}`,
                    background: active ? 'rgba(177,197,255,0.2)' : C.surfaceLow,
                    color: active ? C.primary : C.onSurfaceVariant,
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  {JOINT_AREA_LABELS[joint]}
                </button>
              );
            })}
            {!showSomewhereElse && (
              <button
                type="button"
                onClick={() => setShowSomewhereElse(true)}
                style={{
                  padding: '8px 12px',
                  borderRadius: 999,
                  border: `1px dashed ${C.outline}`,
                  background: 'transparent',
                  color: C.outline,
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Somewhere else…
              </button>
            )}
          </div>

          {selectedJoints.size > 0 && (
            <>
              <p style={{ margin: '0 0 8px', fontSize: 12, color: C.onSurfaceVariant }}>
                Overall severity for selected joints
              </p>
              <OptionRow
                options={JOINT_SEVERITY_OPTIONS.filter((o) => o.value >= 1).map((o) => ({
                  value: o.value,
                  label: o.label,
                }))}
                selected={batchSeverity}
                onChange={(v) => {
                  const val = Number(v);
                  setBatchSeverity(val);
                  setJointSeverity({});
                }}
              />

              {(selectedJoints.size > 1 || jointTriage === 'SIGNIFICANT') && (
                <div style={{ marginTop: 12, display: 'grid', gap: 10 }}>
                  <p style={{ margin: 0, fontSize: 12, color: C.onSurfaceVariant }}>
                    Fine-tune per joint (optional)
                  </p>
                  {[...selectedJoints].map((joint) => (
                    <div key={joint}>
                      <p style={{ margin: '0 0 6px', fontWeight: 700, fontSize: 13 }}>
                        {JOINT_AREA_LABELS[joint]}
                      </p>
                      <OptionRow
                        options={JOINT_SEVERITY_OPTIONS.map((o) => ({
                          value: o.value,
                          label: o.label,
                        }))}
                        selected={jointSeverity[joint] ?? batchSeverity}
                        onChange={(v) =>
                          setJointSeverity((prev) => ({
                            ...prev,
                            [joint]: Number(v),
                          }))
                        }
                      />
                    </div>
                  ))}
                </div>
              )}

              {jointTriage === 'SIGNIFICANT' && globalJointComfortScore >= 6 && (
                <p
                  style={{
                    margin: '12px 0 0',
                    padding: '10px 12px',
                    borderRadius: 10,
                    background: 'rgba(255,138,128,0.12)',
                    border: `1px solid ${C.danger}`,
                    color: C.danger,
                    fontSize: 12,
                    fontWeight: 700,
                  }}
                >
                  Significant pain logged — review substitutions before your next session.
                </p>
              )}
            </>
          )}
        </SectionCard>
      )}

      <SectionCard
        category="Muscles"
        title="Muscle soreness"
        instruction={
          musclesNeedingAttention.length > 0
            ? 'Muscles carrying soreness from last time need your input.'
            : 'All trained muscles still feel fine? Confirm below.'
        }
      >
        {musclesNeedingAttention.map((entry) => (
          <div key={entry.muscle} style={{ marginBottom: 10 }}>
            <p style={{ margin: '0 0 8px', fontWeight: 700 }}>
              {MUSCLE_LABELS[entry.muscle] ?? entry.muscle}
            </p>
            <OptionRow
              options={SORENESS_OPTIONS.map((o) => ({ value: o.key, label: o.label }))}
              selected={sorenessByMuscle[entry.muscle] ?? 'HEALED_ON_TIME'}
              onChange={(v) =>
                setSorenessByMuscle((prev) => ({
                  ...prev,
                  [entry.muscle]: v as SorenessKey,
                }))
              }
            />
          </div>
        ))}

        {musclesCollapsed.length > 0 && !sorenessExpanded && (
          <button
            type="button"
            onClick={() => setSorenessExpanded(true)}
            style={{
              width: '100%',
              padding: '12px',
              borderRadius: 12,
              border: `1px solid ${C.outlineVariant}`,
              background: C.surfaceLow,
              color: C.onSurfaceVariant,
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer',
              textAlign: 'left',
            }}
          >
            {musclesCollapsed.map((m) => MUSCLE_LABELS[m.muscle] ?? m.muscle).join(', ')} —
            still feel fine? Tap to adjust.
          </button>
        )}

        {sorenessExpanded &&
          musclesCollapsed.map((entry) => (
            <div key={entry.muscle} style={{ marginBottom: 10 }}>
              <p style={{ margin: '0 0 8px', fontWeight: 700 }}>
                {MUSCLE_LABELS[entry.muscle] ?? entry.muscle}
              </p>
              <OptionRow
                options={SORENESS_OPTIONS.map((o) => ({ value: o.key, label: o.label }))}
                selected={sorenessByMuscle[entry.muscle] ?? 'HEALED_ON_TIME'}
                onChange={(v) =>
                  setSorenessByMuscle((prev) => ({
                    ...prev,
                    [entry.muscle]: v as SorenessKey,
                  }))
                }
              />
            </div>
          ))}
      </SectionCard>

      <SectionCard
        category="Session"
        title="Quick session check-in"
        instruction="Two questions this time — we rotate the rest across sessions."
      >
        <p style={{ margin: '0 0 8px', fontWeight: 700, fontSize: 13 }}>Execution</p>
        <OptionRow
          options={PERFORMANCE_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
          selected={sessionPerformance}
          onChange={(v) => setSessionPerformance(Number(v))}
        />
        {metaFields.showDrive && (
          <>
            <p style={{ margin: '12px 0 8px', fontWeight: 700, fontSize: 13 }}>Training drive</p>
            <OptionRow
              options={TRAINING_DRIVE_OPTIONS.map((o) => ({
                value: o.value,
                label: o.label,
              }))}
              selected={trainingDrive}
              onChange={(v) => setTrainingDrive(Number(v))}
            />
          </>
        )}
        {metaFields.showEffort && (
          <>
            <p style={{ margin: '12px 0 8px', fontWeight: 700, fontSize: 13 }}>Session effort</p>
            <OptionRow
              options={EFFORT_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
              selected={effortLevel}
              onChange={(v) => setEffortLevel(Number(v))}
            />
          </>
        )}
        {metaFields.showPump && (
          <>
            <p style={{ margin: '12px 0 8px', fontWeight: 700, fontSize: 13 }}>Pump</p>
            <OptionRow
              options={PUMP_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
              selected={pumpScore}
              onChange={(v) => setPumpScore(Number(v))}
            />
          </>
        )}
      </SectionCard>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 28 }}>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={loading || jointTriage === null}
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
            cursor: loading ? 'wait' : 'pointer',
            opacity: loading || jointTriage === null ? 0.65 : 1,
          }}
        >
          {loading ? 'Saving...' : 'Submit feedback'}
        </button>
        {onSkip && (
          <button
            type="button"
            onClick={onSkip}
            style={{
              width: '100%',
              padding: '12px 0',
              borderRadius: 12,
              border: `1px solid ${C.outlineVariant}`,
              background: 'transparent',
              color: C.outline,
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Skip for now
          </button>
        )}
      </div>
    </div>
  );
}
