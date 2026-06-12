'use client';



import { useEffect, useRef, useState } from 'react';

import { useParams, useRouter, useSearchParams } from 'next/navigation';

import AppHeader from '@/components/AppHeader';

import { templatesApi, type TemplateDetail } from '@/lib/api/templates';

import { mesocyclesApi } from '@/lib/api/mesocycles';

import { ApiError } from '@/lib/api/client';

import { usersApi } from '@/lib/api/users';

import { exercisesApi } from '@/lib/api/exercises';

import { validateHypertrophyRepMin } from '@/lib/programs/programGoal';
import TemplateValidationModal from '@/components/TemplateValidationModal';
import { muscleColor } from '@/lib/design/muscleColors';
import { WORKOUT_TOKENS as T } from '@/lib/design/workoutTokens';
import { Trash2 } from 'lucide-react';



const C = {

  primary: '#b1c5ff',

  surface: '#111318',

  surfaceLow: '#161820',

  surfaceContainer: '#1e2026',

  outline: '#8e909c',

  outlineVariant: '#3a3c44',

  onSurface: '#e2e2e8',

  onSurfaceVariant: '#c5c6d2',

};



type EditorDay = {

  dayNumber: number;

  dayType: 'WORKOUT' | 'REST';

  label: string;

  exercises: Array<{

    exerciseId: string;

    exerciseName: string;

    primaryMuscle?: string | null;

    orderIndex: number;

    setsTarget: number;

    repRangeMin: number;

    repRangeMax: number;

    rpeTarget: number;

  }>;

};



type EditorDraft = {

  days: EditorDay[];

  selectedDay: number;

  name: string;

};



function draftKey(templateId: string) {

  return `kinetiq_editor_draft_${templateId}`;

}



function mapTemplateDays(detail: TemplateDetail): EditorDay[] {

  return (detail.splitConfigs?.[0]?.days ?? []).map((day) => ({

    dayNumber: day.dayNumber,

    dayType: ((day as { dayType?: string }).dayType ?? (day.exercises.length > 0 ? 'WORKOUT' : 'REST')) as 'WORKOUT' | 'REST',

    label: day.label,

    exercises: day.exercises

      .filter((entry) => entry.exercise?.id)

      .map((entry, index) => ({

        exerciseId: entry.exercise!.id,

        exerciseName: entry.exercise!.name,

        primaryMuscle: entry.exercise!.primaryMuscle ?? null,

        orderIndex: entry.orderIndex ?? index + 1,

        setsTarget: entry.setsTarget,

        repRangeMin: entry.repRangeMin,

        repRangeMax: entry.repRangeMax,

        rpeTarget: Math.round(entry.rpeTarget),

      })),

  }));

}



function readDraft(templateId: string): EditorDraft | null {

  try {

    const raw = sessionStorage.getItem(draftKey(templateId));

    if (!raw) return null;

    return JSON.parse(raw) as EditorDraft;

  } catch {

    return null;

  }

}



function writeDraft(templateId: string, draft: EditorDraft) {

  sessionStorage.setItem(draftKey(templateId), JSON.stringify(draft));

}



function clearDraft(templateId: string) {

  sessionStorage.removeItem(draftKey(templateId));

  sessionStorage.removeItem('kinetiq_editor_day');

  sessionStorage.removeItem('kinetiq_selected_exercise');

}



export default function TemplateEditorPage() {

  const router = useRouter();

  const params = useParams();

  const searchParams = useSearchParams();

  const id = params.id as string;

  const mesocycleId = searchParams.get('mesocycleId');

  const structural = searchParams.get('structural') === '1';



  const [name, setName] = useState('');

  const [days, setDays] = useState<EditorDay[]>([]);

  const [selectedDay, setSelectedDay] = useState(0);

  const [loading, setLoading] = useState(true);

  const [saving, setSaving] = useState(false);

  const [experienceLevel, setExperienceLevel] = useState<string>('INTERMEDIATE');

  const [blockedMessage, setBlockedMessage] = useState<string | null>(null);

  const [programGoal, setProgramGoal] = useState<string>('HYPERTROPHY');

  const [validationIssues, setValidationIssues] = useState<string[] | null>(null);

  const [deleteConfirmIndex, setDeleteConfirmIndex] = useState<number | null>(null);

  const exerciseReturnHandled = useRef(false);



  const isCalendarSchedule = days.length === 7;



  useEffect(() => {

    let cancelled = false;

    exerciseReturnHandled.current = false;

    setLoading(true);



    Promise.all([templatesApi.findOne(id), usersApi.me()])

      .then(([templateRes, userRes]) => {

        if (cancelled) return;

        const detail = templateRes.data as TemplateDetail;

        const level = (userRes.data as { experienceLevel?: string })?.experienceLevel ?? 'INTERMEDIATE';

        setExperienceLevel(level);

        if (mesocycleId && structural && level === 'BEGINNER') {

          setBlockedMessage('Complete your current block before changing program structure.');

        }

        setProgramGoal(detail.goal ?? 'HYPERTROPHY');



        const draft = readDraft(id);

        const mapped = draft?.days ?? mapTemplateDays(detail);

        setName(draft?.name ?? detail.name);

        setSelectedDay(draft?.selectedDay ?? 0);

        setDays(mapped);

      })

      .catch(() => router.push('/mesocycles'))

      .finally(() => {

        if (!cancelled) setLoading(false);

      });



    return () => { cancelled = true; };

  }, [id, mesocycleId, structural, router]);



  useEffect(() => {

    if (loading || exerciseReturnHandled.current) return;



    const selectedId = sessionStorage.getItem('kinetiq_selected_exercise');

    if (!selectedId) return;



    exerciseReturnHandled.current = true;

    sessionStorage.removeItem('kinetiq_selected_exercise');



    const dayIndexRaw = sessionStorage.getItem('kinetiq_editor_day');

    const dayIndex = dayIndexRaw !== null ? parseInt(dayIndexRaw, 10) : selectedDay;

    sessionStorage.removeItem('kinetiq_editor_day');



    void exercisesApi.getExercise(selectedId).then((exercise) => {

      if (!exercise?.id) return;

      setSelectedDay(Number.isNaN(dayIndex) ? 0 : dayIndex);

      setDays((prev) => prev.map((day, index) => {

        const targetIndex = Number.isNaN(dayIndex) ? selectedDay : dayIndex;

        if (index !== targetIndex || day.dayType !== 'WORKOUT') return day;

        if (day.exercises.some((slot) => slot.exerciseId === exercise.id)) return day;

        return {

          ...day,

          exercises: [

            ...day.exercises,

            {

              exerciseId: exercise.id,

              exerciseName: exercise.name,

              primaryMuscle: exercise.primaryMuscle ?? null,

              orderIndex: day.exercises.length + 1,

              setsTarget: 3,

              repRangeMin: 8,

              repRangeMax: 12,

              rpeTarget: 8,

            },

          ],

        };

      }));

    }).catch(() => { /* ignore invalid selection */ });

  }, [loading, id, selectedDay]);



  useEffect(() => {

    if (loading || days.length === 0) return;

    writeDraft(id, { days, selectedDay, name });

  }, [days, selectedDay, name, id, loading]);



  function updateSlot(dayIndex: number, slotIndex: number, patch: Partial<EditorDay['exercises'][0]>) {

    setDays((prev) => prev.map((day, di) => {

      if (di !== dayIndex) return day;

      return {

        ...day,

        exercises: day.exercises.map((slot, si) => (si === slotIndex ? { ...slot, ...patch } : slot)),

      };

    }));

  }



  function addWorkoutDay() {

    if (blockedMessage) return;

    const nextNumber = days.length + 1;

    setDays((prev) => [

      ...prev,

      { dayNumber: nextNumber, dayType: 'WORKOUT', label: `Day ${prev.filter((d) => d.dayType === 'WORKOUT').length + 1}`, exercises: [] },

    ]);

  }



  function goToExercisePicker() {

    sessionStorage.setItem('kinetiq_editor_day', String(selectedDay));

    writeDraft(id, { days, selectedDay, name });

    router.push(`/exercises?select=true&returnTo=/templates/${id}/edit`);

  }



  function collectValidationIssues(): string[] {
    const issues: string[] = [];
    for (const day of days) {
      if (day.dayType === 'WORKOUT' && day.exercises.length === 0) {
        issues.push(`${day.label} is a workout day but has no exercises.`);
      }
    }
    return issues;
  }

  function removeSlot(dayIndex: number, slotIndex: number) {
    setDays((prev) => prev.map((day, di) => {
      if (di !== dayIndex) return day;
      return { ...day, exercises: day.exercises.filter((_, si) => si !== slotIndex) };
    }));
    setDeleteConfirmIndex(null);
  }

  async function handleSave() {

    if (saving || blockedMessage) return;

    const issues = collectValidationIssues();
    if (issues.length > 0) {
      setValidationIssues(issues);
      return;
    }

    for (const day of days) {

      if (day.dayType !== 'WORKOUT') continue;

      for (const slot of day.exercises) {

        const repError = validateHypertrophyRepMin(programGoal, slot.repRangeMin);

        if (repError) {

          alert(repError);

          return;

        }

      }

    }



    setSaving(true);

    try {

      await templatesApi.update(id, { name: name.trim() });

      await templatesApi.replaceDays(

        id,

        days.map((day) => ({

          dayNumber: day.dayNumber,

          dayType: day.dayType,

          label: day.label,

          exercises: day.dayType === 'WORKOUT'

            ? day.exercises.map((slot, index) => ({

                exerciseId: slot.exerciseId,

                orderIndex: index + 1,

                setsTarget: slot.setsTarget,

                repRangeMin: slot.repRangeMin,

                repRangeMax: slot.repRangeMax,

                rpeTarget: Math.round(slot.rpeTarget),

              }))

            : [],

        })),

      );

      clearDraft(id);

      if (mesocycleId && structural) {

        await mesocyclesApi.regenerate(mesocycleId, id);

        router.push(`/mesocycles/${mesocycleId}`);

        return;

      }

      router.push(`/mesocycles/new?templateId=${id}`);

    } catch (err) {

      if (err instanceof ApiError && err.status === 401) return;

      const apiIssues = (err as ApiError)?.data as { errors?: string[]; message?: string } | undefined;
      if (Array.isArray(apiIssues?.errors) && apiIssues.errors.length > 0) {
        setValidationIssues(apiIssues.errors);
      } else {
        setValidationIssues([apiIssues?.message ?? 'Unable to save program. Check all workout days are complete.']);
      }

    } finally {

      setSaving(false);

    }

  }



  if (loading) {

    return (

      <div style={{ minHeight: '100dvh', background: C.surface, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>

        <p style={{ color: C.outline, fontSize: 13 }}>Loading editor…</p>

      </div>

    );

  }



  const activeDay = days[selectedDay];



  return (

    <div style={{ minHeight: '100dvh', background: C.surface, paddingBottom: 110 }}>

      <AppHeader title="Edit Program" showBack backHref="/mesocycles" />

      <div style={{ maxWidth: 640, margin: '0 auto', padding: '0 20px' }}>

        {blockedMessage && (

          <p style={{ margin: '0 0 16px', padding: 12, borderRadius: 10, background: C.surfaceLow, border: `1px solid ${C.outlineVariant}`, color: C.onSurfaceVariant, fontSize: 13 }}>

            {blockedMessage}

          </p>

        )}



        <label style={{ display: 'block', fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase', color: C.outline, fontWeight: 700, marginBottom: 8 }}>

          Program name

        </label>

        <input

          value={name}

          onChange={(e) => setName(e.target.value)}

          style={{ width: '100%', boxSizing: 'border-box', marginBottom: 20, background: C.surfaceLow, border: `1px solid ${C.outlineVariant}`, borderRadius: 12, padding: '12px 14px', color: C.onSurface, fontSize: 14 }}

        />



        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', marginBottom: 16 }}>

          {days.map((day, index) => (

            <button

              key={`${day.dayNumber}-${index}`}

              type="button"

              onClick={() => setSelectedDay(index)}

              style={{

                flexShrink: 0,

                padding: '8px 12px',

                borderRadius: 8,

                border: `1px solid ${selectedDay === index ? C.primary : C.outlineVariant}`,

                background: selectedDay === index ? 'rgba(177,197,255,0.12)' : C.surfaceLow,

                color: selectedDay === index ? C.primary : C.onSurfaceVariant,

                fontSize: 12,

                fontWeight: 700,

                cursor: 'pointer',

                opacity: day.dayType === 'REST' ? 0.75 : 1,

              }}

            >

              {day.label}

            </button>

          ))}

          {!blockedMessage && !isCalendarSchedule && (

            <button type="button" onClick={addWorkoutDay} style={{ flexShrink: 0, padding: '8px 12px', borderRadius: 8, border: `1px dashed ${C.outlineVariant}`, background: 'transparent', color: C.primary, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>

              + Day

            </button>

          )}

        </div>



        {activeDay && activeDay.dayType === 'REST' && (

          <div style={{ marginBottom: 20, padding: 16, borderRadius: 12, background: C.surfaceLow, border: `1px solid ${C.outlineVariant}` }}>

            <p style={{ margin: 0, fontSize: 13, color: C.onSurfaceVariant }}>

              Rest day — no exercises scheduled.

            </p>

          </div>

        )}



        {activeDay && activeDay.dayType === 'WORKOUT' && (

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>

            {activeDay.exercises.map((slot, slotIndex) => {
              const accent = muscleColor(slot.primaryMuscle);
              const inputStyle: React.CSSProperties = { ...T.input, width: '100%', boxSizing: 'border-box', color: C.onSurface, marginTop: 4 };
              return (
              <div key={`${slot.exerciseId}-${slotIndex}`} style={{ background: T.surfaceContainer, border: `1px solid ${T.outlineVariant}`, borderLeft: `3px solid ${accent}`, borderRadius: T.cardRadius, padding: T.cardPadding }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, marginBottom: 8 }}>
                  <div>
                    <p style={{ margin: 0, ...T.exerciseName, color: C.onSurface }}>{slot.exerciseName}</p>
                    <p style={{ margin: '4px 0 0', ...T.metadata, color: C.outline }}>{(slot.primaryMuscle ?? 'General').replace(/_/g, ' ')}</p>
                  </div>
                  {deleteConfirmIndex === slotIndex ? (
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                      <span style={{ fontSize: 11, color: C.onSurfaceVariant }}>Remove?</span>
                      <button type="button" onClick={() => removeSlot(selectedDay, slotIndex)} style={{ fontSize: 11, fontWeight: 700, color: '#ff8b8b', background: 'none', border: 'none', cursor: 'pointer' }}>Yes</button>
                      <button type="button" onClick={() => setDeleteConfirmIndex(null)} style={{ fontSize: 11, fontWeight: 700, color: C.outline, background: 'none', border: 'none', cursor: 'pointer' }}>No</button>
                    </div>
                  ) : (
                    <button type="button" onClick={() => setDeleteConfirmIndex(slotIndex)} aria-label="Remove exercise" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
                      <Trash2 size={16} color={C.outline} />
                    </button>
                  )}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: T.cardGap }}>
                  <label style={T.fieldLabel}>Sets
                    <input type="number" min={1} value={slot.setsTarget} onChange={(e) => updateSlot(selectedDay, slotIndex, { setsTarget: Number(e.target.value) })} style={inputStyle} />
                  </label>
                  <label style={T.fieldLabel}>Min Reps
                    <input type="number" min={1} value={slot.repRangeMin} onChange={(e) => updateSlot(selectedDay, slotIndex, { repRangeMin: Number(e.target.value) })} style={inputStyle} />
                  </label>
                  <label style={T.fieldLabel}>Max Reps
                    <input type="number" min={1} value={slot.repRangeMax} onChange={(e) => updateSlot(selectedDay, slotIndex, { repRangeMax: Number(e.target.value) })} style={inputStyle} />
                  </label>
                  <label style={T.fieldLabel}>RPE
                    <input type="number" step="1" min={6} max={10} value={slot.rpeTarget} onChange={(e) => updateSlot(selectedDay, slotIndex, { rpeTarget: Math.round(Number(e.target.value)) })} style={inputStyle} />
                  </label>
                </div>
              </div>
            );})}

            <button

              type="button"

              onClick={goToExercisePicker}

              style={{ padding: '11px 0', borderRadius: 10, border: `1px solid ${C.outlineVariant}`, background: 'transparent', color: C.primary, fontWeight: 700, fontSize: 12, cursor: 'pointer' }}

            >

              + Add exercise

            </button>

          </div>

        )}



        {validationIssues && (
          <TemplateValidationModal issues={validationIssues} onClose={() => setValidationIssues(null)} />
        )}

        <button

          type="button"

          disabled={saving || !!blockedMessage}

          onClick={handleSave}

          style={{

            width: '100%',

            padding: '15px 0',

            borderRadius: 14,

            border: 'none',

            background: `linear-gradient(135deg, ${C.primary} 0%, #3a5cbf 100%)`,

            color: '#05080f',

            fontFamily: 'Space Grotesk, sans-serif',

            fontWeight: 900,

            fontSize: 15,

            cursor: saving || blockedMessage ? 'not-allowed' : 'pointer',

            opacity: saving || blockedMessage ? 0.6 : 1,

          }}

        >

          {saving ? 'Saving…' : 'Continue to block setup →'}

        </button>

      </div>

    </div>

  );

}


