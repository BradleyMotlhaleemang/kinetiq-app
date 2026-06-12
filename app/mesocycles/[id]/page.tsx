'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { CheckCircle, Play, Settings } from 'lucide-react';
import AppHeader from '@/components/AppHeader';
import { mesocyclesApi } from '@/lib/api/mesocycles';
import {
  type ExpandProgram,
  computeCalendarWeek,
  computeSessionProgress,
  computeTodayDayNumber,
  startMesocycleSession,
} from '@/lib/programs/sessionNavigation';
import { templatesApi, type TemplateDetail } from '@/lib/api/templates';
import StructuralEditWarningModal from '@/components/StructuralEditWarningModal';
import TrainingDayAccordion, { parsePrescriptionExercises, type TrainingDayItem } from '@/components/TrainingDayAccordion';
import { exercisesApi } from '@/lib/api/exercises';
import api, { ApiError } from '@/lib/api/client';
import { TYPE } from '@/lib/design/typography';

const C = {
  primary: '#b1c5ff',
  secondary: '#d4bbff',
  tertiary: '#59d8de',
  surface: '#111318',
  surfaceLow: '#161820',
  surfaceContainer: '#1e2026',
  surfaceContainerLow: '#1a1b21',
  surfaceHigh: '#282a30',
  outline: '#8e909c',
  outlineVariant: '#3a3c44',
  onSurface: '#e2e2e8',
  onSurfaceVariant: '#c5c6d2',
  buttonText: '#05080f',
};

const DAY_COLORS = [C.primary, C.tertiary, C.secondary, '#a2e7ff'];
const VOLUME_COLORS = [C.secondary, C.primary, C.tertiary];

const primaryBtn: React.CSSProperties = {
  width: '100%',
  padding: '16px 0',
  borderRadius: 8,
  border: 'none',
  background: `linear-gradient(135deg, ${C.primary} 0%, #3a5cbf 100%)`,
  color: C.buttonText,
  fontFamily: 'Space Grotesk, sans-serif',
  fontWeight: 900,
  fontSize: 16,
  letterSpacing: '0.02em',
  textTransform: 'uppercase',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 12,
  boxShadow: '0 4px 16px rgba(58,92,191,0.35)',
};

const ghostBtn: React.CSSProperties = {
  width: '100%',
  padding: '14px 0',
  borderRadius: 8,
  border: `1px solid ${C.outlineVariant}`,
  background: 'transparent',
  color: C.onSurfaceVariant,
  fontFamily: 'Manrope, sans-serif',
  fontWeight: 700,
  fontSize: 13,
  cursor: 'pointer',
};

type MesocycleRecord = {
  id: string;
  name: string;
  status: string;
  currentWeek: number;
  totalWeeks: number;
  splitTemplateId?: string;
};

type ProgramSlot = {
  splitDayExerciseId: string;
  dayLabel: string;
  exerciseId: string;
  exerciseName: string;
};

type ExerciseOverride = {
  splitDayExerciseId: string;
  substituteExerciseId: string;
};

function formatWeekdayLabel(dateStr: string, isToday: boolean): string {
  const weekday = new Date(dateStr).toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase();
  return isToday ? `${weekday} — TODAY` : weekday;
}

export default function MesocycleDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const editSectionRef = useRef<HTMLDivElement>(null);

  const [mesocycle, setMesocycle] = useState<MesocycleRecord | null>(null);
  const [program, setProgram] = useState<ExpandProgram | null>(null);
  const [volumeTargets, setVolumeTargets] = useState<Record<string, { mev: number; mrv: number; prescribed: number; current?: number }>>({});
  const [volumeActual, setVolumeActual] = useState<Record<string, { thisWeek: number; blockTotal: number }>>({});
  const [experienceLevel, setExperienceLevel] = useState('INTERMEDIATE');
  const [showStructuralModal, setShowStructuralModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [showEditProgram, setShowEditProgram] = useState(false);
  const [programSlots, setProgramSlots] = useState<ProgramSlot[]>([]);
  const [overrides, setOverrides] = useState<ExerciseOverride[]>([]);
  const [selectedSlotId, setSelectedSlotId] = useState('');
  const [substituteOptions, setSubstituteOptions] = useState<Array<{ id: string; name: string }>>([]);
  const [selectedSubstituteId, setSelectedSubstituteId] = useState('');
  const [overrideSubmitting, setOverrideSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, [id]);

  async function loadData() {
    try {
      const [mRes, vRes, expandRes, userRes] = await Promise.allSettled([
        mesocyclesApi.findOne(id),
        mesocyclesApi.volumeStatus(id),
        api.get(`/api/v1/mesocycles/${id}/expand`),
        api.get('/api/v1/users/me'),
      ]);
      if (mRes.status === 'fulfilled') setMesocycle(mRes.value.data as MesocycleRecord);
      if (vRes.status === 'fulfilled') {
        const data = vRes.value.data as {
          volumeTargets?: typeof volumeTargets;
          volumeActual?: typeof volumeActual;
        };
        setVolumeTargets(data.volumeTargets ?? {});
        setVolumeActual(data.volumeActual ?? {});
      }
      if (userRes.status === 'fulfilled') {
        const level = (userRes.value.data as { experienceLevel?: string })?.experienceLevel;
        if (level) setExperienceLevel(level);
      }
      if (expandRes.status === 'fulfilled') setProgram(expandRes.value.data as ExpandProgram);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) return;
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleStartToday() {
    if (!mesocycle || !program || starting) return;
    setStarting(true);
    try {
      const workoutId = await startMesocycleSession(mesocycle.id, program);
      router.push(`/workout/${workoutId}`);
    } catch (err) {
      console.error('Failed to start workout', err);
    } finally {
      setStarting(false);
    }
  }

  async function loadEditProgramData(meso: MesocycleRecord) {
    if (!meso.splitTemplateId) return;
    try {
      const [templateRes, overridesRes] = await Promise.all([
        templatesApi.findOne(meso.splitTemplateId),
        mesocyclesApi.listExerciseOverrides(meso.id),
      ]);
      const template = templateRes.data as TemplateDetail;
      const slots: ProgramSlot[] = [];
      for (const config of template.splitConfigs ?? []) {
        for (const day of config.days) {
          if (day.exercises.length === 0) continue;
          for (const entry of day.exercises) {
            const slotId = (entry as { id?: string }).id;
            const exercise = entry.exercise;
            if (!slotId || !exercise) continue;
            slots.push({
              splitDayExerciseId: slotId,
              dayLabel: day.label,
              exerciseId: exercise.id,
              exerciseName: exercise.name,
            });
          }
        }
      }
      setProgramSlots(slots);
      setOverrides(
        Array.isArray(overridesRes.data)
          ? (overridesRes.data as ExerciseOverride[])
          : [],
      );
    } catch (err) {
      console.error('Failed to load program editor', err);
    }
  }

  function handleOpenStructuralEdit() {
    if (experienceLevel === 'BEGINNER') return;
    setShowStructuralModal(true);
  }

  async function handleNewFromProgress() {
    if (!mesocycle?.splitTemplateId) return;
    try {
      const forkRes = await templatesApi.fork(mesocycle.splitTemplateId);
      const forkedId = (forkRes.data as { id?: string })?.id;
      if (!forkedId) return;
      await mesocyclesApi.close(id);
      setShowStructuralModal(false);
      router.push(`/templates/${forkedId}/edit`);
    } catch {
      alert('Failed to create new block from progress');
    }
  }

  async function handleForceEdit() {
    if (!mesocycle?.splitTemplateId) return;
    setShowStructuralModal(false);
    router.push(`/templates/${mesocycle.splitTemplateId}/edit?mesocycleId=${id}&structural=1`);
  }

  async function handleToggleEditProgram() {
    const next = !showEditProgram;
    setShowEditProgram(next);
    if (next && mesocycle) {
      await loadEditProgramData(mesocycle);
    }
  }

  function scrollToEditProgram() {
    setShowEditProgram(true);
    if (mesocycle) void loadEditProgramData(mesocycle);
    requestAnimationFrame(() => {
      editSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  async function handleSlotSelect(slotId: string) {
    setSelectedSlotId(slotId);
    setSelectedSubstituteId('');
    const slot = programSlots.find((s) => s.splitDayExerciseId === slotId);
    if (!slot) {
      setSubstituteOptions([]);
      return;
    }
    try {
      const pools = await exercisesApi.getExerciseSubstitutions(slot.exerciseId);
      const options = pools.map((pool) => ({
        id: pool.exercise.id,
        name: pool.exercise.name,
      }));
      setSubstituteOptions(options);
    } catch {
      setSubstituteOptions([]);
    }
  }

  async function handleApplyOverride() {
    if (!mesocycle || !selectedSlotId || !selectedSubstituteId || overrideSubmitting) return;
    setOverrideSubmitting(true);
    try {
      await mesocyclesApi.createExerciseOverride(mesocycle.id, {
        splitDayExerciseId: selectedSlotId,
        substituteExerciseId: selectedSubstituteId,
        scope: 'REMAINING_BLOCK',
        source: 'MANUAL',
      });
      await loadEditProgramData(mesocycle);
      setSelectedSubstituteId('');
    } catch (err) {
      console.error('Failed to apply override', err);
      alert('Failed to update program');
    } finally {
      setOverrideSubmitting(false);
    }
  }

  async function handleClose() {
    if (!confirm('Mark this block as completed?')) return;
    try {
      await mesocyclesApi.close(id);
      router.push('/mesocycles');
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) return;
      console.error('Failed to close mesocycle:', err);
      alert('Failed to close mesocycle');
    }
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100dvh', backgroundColor: C.surface }}>
        <AppHeader showBack backHref="/mesocycles" />
        <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: 13, color: C.outline, padding: 20 }}>Loading...</p>
      </div>
    );
  }

  if (!mesocycle) {
    return (
      <div style={{ minHeight: '100dvh', backgroundColor: C.surface }}>
        <AppHeader showBack backHref="/mesocycles" />
        <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: 13, color: '#ff6b6b', padding: 20 }}>Block not found.</p>
      </div>
    );
  }

  const sessionProgress = computeSessionProgress(program);
  const progressPct = sessionProgress.pct;
  const displayWeek = program
    ? computeCalendarWeek(program.startDate, mesocycle.totalWeeks)
    : mesocycle.currentWeek;
  const weeksLeft = Math.max(mesocycle.totalWeeks - displayWeek, 0);

  const muscles = Object.entries(volumeTargets) as [string, { mev: number; mrv: number; prescribed: number; current?: number }][];
  const currentWeekData = program?.weeks.find((w) => w.weekNumber === displayWeek);
  const todayDayNumber = program
    ? computeTodayDayNumber(program.startDate, displayWeek)
    : null;

  const weekDays: TrainingDayItem[] =
    currentWeekData?.days.map((day, index) => {
      const isToday = day.dayNumber === todayDayNumber;
      return {
        id: day.id,
        label: day.date
          ? formatWeekdayLabel(day.date, isToday)
          : `DAY ${day.dayNumber}${isToday ? ' — TODAY' : ''}`,
        subtitle: day.dayLabel ?? day.sessionType,
        completed: day.completed,
        isToday,
        accentColor: DAY_COLORS[index % DAY_COLORS.length],
        exercises: parsePrescriptionExercises(day.prescription),
      };
    }) ?? [];

  return (
    <div style={{ minHeight: '100dvh', backgroundColor: C.surface, paddingBottom: 110 }}>
      <AppHeader title={mesocycle.name} showBack backHref="/mesocycles" />

      <main style={{ maxWidth: 600, margin: '0 auto', padding: '16px 16px 0', display: 'flex', flexDirection: 'column', gap: 24 }}>

        {/* Status card */}
        <section
          style={{
            background: C.surfaceContainer,
            border: `1px solid ${C.outlineVariant}`,
            borderRadius: 8,
            padding: 16,
            overflow: 'hidden',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
            <div>
              <span style={{ ...TYPE.labelCaps, color: C.onSurfaceVariant, display: 'block', marginBottom: 4 }}>
                Current Status
              </span>
              <h2 style={{ ...TYPE.headlineMd, color: C.primary, margin: 0 }}>
                Week {displayWeek} of {mesocycle.totalWeeks}
              </h2>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span style={{ ...TYPE.labelCaps, color: C.onSurfaceVariant, display: 'block', marginBottom: 4 }}>
                Completion
              </span>
              <span style={{ ...TYPE.headlineSm, color: C.secondary }}>
                {sessionProgress.completed}/{sessionProgress.total || '—'} Sessions
              </span>
            </div>
          </div>
          <div style={{ height: 6, width: '100%', background: C.surfaceHigh, borderRadius: 9999, overflow: 'hidden' }}>
            <div
              style={{
                height: '100%',
                width: `${progressPct}%`,
                background: `linear-gradient(135deg, ${C.primary} 0%, #3a5cbf 100%)`,
                borderRadius: 9999,
                transition: 'width 0.7s ease-out',
              }}
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
            <span style={{ ...TYPE.labelMeta, color: C.outline }}>
              {progressPct}% of block complete
            </span>
            <span style={{ ...TYPE.labelMeta, color: C.outline }}>
              {weeksLeft === 1 ? 'Est. 1 week left' : `Est. ${weeksLeft} weeks left`}
            </span>
          </div>
        </section>

        {/* Primary CTA */}
        {mesocycle.status === 'ACTIVE' && (
          <button
            type="button"
            onClick={handleStartToday}
            disabled={starting}
            style={{
              ...primaryBtn,
              opacity: starting ? 0.7 : 1,
              cursor: starting ? 'not-allowed' : 'pointer',
            }}
          >
            <Play size={20} fill={C.buttonText} color={C.buttonText} />
            {starting ? 'Starting...' : "Start Today's Session"}
          </button>
        )}

        {/* Week schedule */}
        {currentWeekData && weekDays.length > 0 && (
          <section style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h3 style={{ ...TYPE.headlineSm, color: C.onSurface, margin: 0 }}>Week Schedule</h3>
              <button
                type="button"
                style={{
                  ...TYPE.labelMeta,
                  color: C.primary,
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 0,
                }}
              >
                View Month
              </button>
            </div>
            <TrainingDayAccordion
              days={weekDays}
              variant="blockDetail"
              onEditSession={scrollToEditProgram}
            />
          </section>
        )}

        {/* Volume targets */}
        {muscles.length > 0 && (
          <section style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <h3 style={{ ...TYPE.headlineSm, color: C.onSurface, margin: 0 }}>Weekly Volume Targets</h3>
            <div
              style={{
                background: C.surfaceContainer,
                border: `1px solid ${C.outlineVariant}`,
                borderRadius: 8,
                padding: 16,
                display: 'flex',
                flexDirection: 'column',
                gap: 16,
              }}
            >
              {muscles.map(([muscle, targets], index) => {
                const logged = volumeActual[muscle]?.thisWeek ?? 0;
                const prescribed = targets.prescribed ?? targets.current ?? 0;
                const barPct = prescribed > 0 ? Math.min((logged / prescribed) * 100, 100) : 0;
                const barColor = VOLUME_COLORS[index % VOLUME_COLORS.length]!;
                return (
                  <div key={muscle} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', ...TYPE.labelMeta }}>
                      <span style={{ color: C.onSurface, textTransform: 'uppercase' }}>
                        {muscle.replace(/_/g, ' ')}
                      </span>
                      <span style={{ color: barColor }}>
                        {logged}/{prescribed} Sets
                      </span>
                    </div>
                    <div style={{ height: 4, background: C.surfaceHigh, borderRadius: 9999 }}>
                      <div
                        style={{
                          height: '100%',
                          width: `${barPct}%`,
                          background: barColor,
                          borderRadius: 9999,
                          transition: 'width 0.5s ease',
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Edit program structure */}
        {mesocycle.status === 'ACTIVE' && (
          <section ref={editSectionRef}>
            <button
              type="button"
              onClick={handleToggleEditProgram}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: 16,
                background: C.surfaceLow,
                border: `1px solid ${C.outlineVariant}`,
                borderRadius: 8,
                cursor: 'pointer',
              }}
            >
              <span style={{ ...TYPE.labelCaps, color: C.outline }}>Edit Program Structure</span>
              <Settings size={18} color={C.outline} />
            </button>
            {showEditProgram && (
              <div
                style={{
                  marginTop: 8,
                  padding: 16,
                  background: C.surfaceContainerLow,
                  border: `1px solid ${C.outlineVariant}`,
                  borderRadius: 8,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 16,
                }}
              >
                <p style={{ ...TYPE.bodyMd, color: C.onSurfaceVariant, margin: 0 }}>
                  Modify exercises, frequency, and deload parameters for this block.
                </p>

                {overrides.length > 0 && (
                  <div>
                    <p style={{ ...TYPE.labelCaps, color: C.outline, margin: '0 0 8px' }}>Active swaps</p>
                    {overrides.map((override) => {
                      const slot = programSlots.find((s) => s.splitDayExerciseId === override.splitDayExerciseId);
                      return (
                        <p key={override.splitDayExerciseId} style={{ margin: '0 0 4px', ...TYPE.labelMeta, color: C.onSurfaceVariant }}>
                          {slot?.exerciseName ?? 'Slot'} → substitute applied
                        </p>
                      );
                    })}
                  </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <button
                    type="button"
                    style={{
                      padding: '12px 16px',
                      background: C.surfaceHigh,
                      border: `1px solid ${C.outlineVariant}`,
                      borderRadius: 4,
                      ...TYPE.labelCaps,
                      color: C.onSurface,
                      cursor: 'pointer',
                    }}
                  >
                    Swap Exercises
                  </button>
                  {experienceLevel !== 'BEGINNER' && (
                    <button
                      type="button"
                      onClick={handleOpenStructuralEdit}
                      style={{
                        padding: '12px 16px',
                        background: C.surfaceHigh,
                        border: `1px solid ${C.outlineVariant}`,
                        borderRadius: 4,
                        ...TYPE.labelCaps,
                        color: C.onSurface,
                        cursor: 'pointer',
                      }}
                    >
                      Adjust Deload
                    </button>
                  )}
                </div>

                <select
                  value={selectedSlotId}
                  onChange={(e) => handleSlotSelect(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: 8,
                    border: `1px solid ${C.outlineVariant}`,
                    background: C.surfaceLow,
                    color: C.onSurface,
                    fontFamily: 'Manrope, sans-serif',
                    fontSize: 13,
                  }}
                >
                  <option value="">Select exercise slot…</option>
                  {programSlots.map((slot) => (
                    <option key={slot.splitDayExerciseId} value={slot.splitDayExerciseId}>
                      {slot.dayLabel}: {slot.exerciseName}
                    </option>
                  ))}
                </select>
                <select
                  value={selectedSubstituteId}
                  onChange={(e) => setSelectedSubstituteId(e.target.value)}
                  disabled={!selectedSlotId || substituteOptions.length === 0}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: 8,
                    border: `1px solid ${C.outlineVariant}`,
                    background: C.surfaceLow,
                    color: C.onSurface,
                    fontFamily: 'Manrope, sans-serif',
                    fontSize: 13,
                  }}
                >
                  <option value="">Select substitute…</option>
                  {substituteOptions.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.name}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={handleApplyOverride}
                  disabled={!selectedSlotId || !selectedSubstituteId || overrideSubmitting}
                  style={{
                    ...ghostBtn,
                    borderColor: C.primary,
                    color: C.primary,
                    opacity: overrideSubmitting ? 0.6 : 1,
                  }}
                >
                  {overrideSubmitting ? 'Applying…' : 'Apply for rest of block'}
                </button>
                <button type="button" onClick={handleClose} style={ghostBtn}>
                  Mark as completed
                </button>
              </div>
            )}
          </section>
        )}

        {mesocycle.status === 'COMPLETED' && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '14px 16px',
              background: 'rgba(89,216,222,0.07)',
              border: '1px solid rgba(89,216,222,0.2)',
              borderLeft: `3px solid ${C.tertiary}`,
              borderRadius: 8,
            }}
          >
            <CheckCircle size={14} color={C.tertiary} />
            <p style={{ margin: 0, fontFamily: 'Manrope, sans-serif', fontSize: 12, fontWeight: 700, color: C.tertiary }}>
              Block completed
            </p>
          </div>
        )}
      </main>

      {showStructuralModal && (
        <StructuralEditWarningModal
          onKeep={() => setShowStructuralModal(false)}
          onNewFromProgress={handleNewFromProgress}
          onForceEdit={handleForceEdit}
        />
      )}
    </div>
  );
}
