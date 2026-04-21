'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { workoutsApi } from '@/lib/api/workouts';
import { exercisesApi } from '@/lib/api/exercises';
import { useSessionStore } from '@/store/session.store';
import { Check, Clock3, GripVertical, Plus, Search, Trash2, X } from 'lucide-react';

type ExerciseItem = {
  id: string;
  name: string;
  equipment?: string | null;
  primaryMuscle?: string | null;
};

type SetRow = {
  id: string;
  weight: string;
  reps: string;
  completed: boolean;
};

export default function WorkoutPage() {
  const router = useRouter();
  const params = useParams();
  const workoutId = params.id as string;

  const { addSet, clearSession } =
    useSessionStore();

  const [workout, setWorkout] = useState<any>(null);
  const [exercises, setExercises] = useState<ExerciseItem[]>([]);
  const [sessionDays, setSessionDays] = useState<Array<{ label: string; exercises: ExerciseItem[] }>>([
    { label: 'Day 1', exercises: [] },
  ]);
  const [activeDayIndex, setActiveDayIndex] = useState(0);
  const [setRows, setSetRows] = useState<Record<string, SetRow[]>>({});
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState(false);
  const [showExercisePicker, setShowExercisePicker] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [exerciseQuery, setExerciseQuery] = useState('');
  const [draggingExerciseId, setDraggingExerciseId] = useState<string | null>(null);

  useEffect(() => {
    loadWorkout();
    loadExercises();
  }, []);

  async function loadWorkout() {
    try {
      const res = await workoutsApi.findOne(workoutId);
      setWorkout(res.data);
      const fallbackLabel = res.data?.splitDayLabel ?? 'Day 1';
      setSessionDays([{ label: fallbackLabel, exercises: [] }]);
    } catch {
      router.push('/dashboard');
    } finally {
      setLoading(false);
    }
  }

  async function loadExercises() {
    try {
      const res = await exercisesApi.findAll();
      const list = Array.isArray(res.data) ? res.data : [];
      setExercises(list);
      setSessionDays((current) => {
        if (current[0]?.exercises.length) return current;
        return [{ ...current[0], exercises: list.slice(0, 4) }];
      });
    } catch (err) {
      console.error(err);
    }
  }

  async function completeSession() {
    setCompleting(true);
    try {
      await workoutsApi.complete(workoutId);
      clearSession();
      router.push('/dashboard');
    } catch (err) {
      console.error(err);
    } finally {
      setCompleting(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <p className="text-zinc-400 text-sm">Loading session...</p>
      </div>
    );
  }

  const currentDay = sessionDays[activeDayIndex] ?? sessionDays[0];
  const currentWeek = workout?.currentWeek ?? 1;
  const totalWeeks = workout?.totalWeeks ?? 4;
  const dayLabel = currentDay?.label ?? workout?.splitDayLabel ?? 'Day 1';
  const dayNumber = activeDayIndex + 1;
  const dayExercises = currentDay?.exercises ?? [];
  const muscleColor = (muscle: string | null | undefined) => {
    if (!muscle) return '#8e909c';
    if (muscle.includes('CHEST')) return '#ff6b6b';
    if (muscle.includes('BACK')) return '#6aa9ff';
    if (muscle.includes('DELT') || muscle.includes('SHOULDER')) return '#b084ff';
    if (muscle.includes('QUAD')) return '#6cd68f';
    if (muscle.includes('GLUTE')) return '#ff7ac8';
    return '#59d8de';
  };

  function ensureRows(exerciseId: string) {
    setSetRows((prev) => {
      if (prev[exerciseId]?.length) return prev;
      return {
        ...prev,
        [exerciseId]: [
          { id: `${exerciseId}-1`, weight: '', reps: '', completed: false },
          { id: `${exerciseId}-2`, weight: '', reps: '', completed: false },
          { id: `${exerciseId}-3`, weight: '', reps: '', completed: false },
        ],
      };
    });
  }

  async function completeSet(exerciseId: string, rowIndex: number) {
    const row = setRows[exerciseId]?.[rowIndex];
    if (!row || !row.weight || !row.reps || row.completed) return;
    try {
      const res = await workoutsApi.addSet(workoutId, {
        exerciseId,
        setNumber: rowIndex + 1,
        weight: parseFloat(row.weight),
        reps: parseInt(row.reps, 10),
      });
      addSet(exerciseId, res.data);
      setSetRows((prev) => ({
        ...prev,
        [exerciseId]: prev[exerciseId].map((current, index) => (
          index === rowIndex ? { ...current, completed: true } : current
        )),
      }));
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <div style={{ minHeight: '100dvh', backgroundColor: 'var(--surface)', padding: '20px 16px 120px' }}>
      <div style={{ maxWidth: '520px', margin: '0 auto', display: 'flex', flexDirection: 'column', minHeight: '100dvh' }}>
        <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <button type="button" onClick={() => router.push('/dashboard')} style={{ width: '36px', height: '36px', borderRadius: '9999px', backgroundColor: 'var(--surface-container)', border: '1px solid var(--surface-high)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <X size={16} color="var(--outline)" />
          </button>
          <div style={{ textAlign: 'center' }}>
            <p className="label-sm" style={{ color: 'var(--primary)' }}>Week {currentWeek} • Day {dayNumber}</p>
            <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '1.55rem', fontWeight: 700, color: 'var(--on-surface)', margin: 0 }}>{dayLabel}</h1>
          </div>
          <button type="button" style={{ width: '36px', height: '36px', borderRadius: '9999px', backgroundColor: 'rgba(177,197,255,0.14)', border: '1px solid var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Clock3 size={15} color="var(--primary)" />
          </button>
        </header>

        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', marginBottom: '12px' }}>
            {sessionDays.map((day, index) => (
              <button
                key={day.label}
                type="button"
                onClick={() => setActiveDayIndex(index)}
                style={{
                  border: index === activeDayIndex ? '1px solid #59d8de' : '1px solid #282a2e',
                  color: index === activeDayIndex ? '#59d8de' : '#8e909c',
                  borderRadius: '9999px',
                  padding: '4px 10px',
                  backgroundColor: '#111318',
                  fontFamily: 'Manrope',
                  fontSize: '0.72rem',
                  whiteSpace: 'nowrap',
                  cursor: 'pointer',
                }}
              >
                {day.label}
              </button>
            ))}
          </div>

        <button
          onClick={() => setShowExercisePicker((v) => !v)}
          style={{ width: '100%', backgroundColor: 'var(--surface-container)', border: '1px dashed var(--outline-variant)', borderRadius: '14px', padding: '14px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', color: 'var(--outline)', fontFamily: 'Manrope', fontWeight: 700, cursor: 'pointer', marginBottom: '12px' }}
        >
          <Plus size={14} /> Add exercise
        </button>

        {showExercisePicker && (
          <div style={{ backgroundColor: 'var(--surface-container)', border: '1px solid var(--surface-high)', borderRadius: '10px', padding: '10px', marginBottom: '12px' }}>
            <div style={{ position: 'relative', marginBottom: '8px' }}>
              <Search size={14} color="#8e909c" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }} />
              <input className="k-input" style={{ paddingLeft: '30px' }} value={exerciseQuery} onChange={(e) => setExerciseQuery(e.target.value)} placeholder="Search exercises" />
            </div>
            <select className="k-input" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} style={{ marginBottom: '8px' }}>
              <option value="ALL">All muscle groups</option>
              {[...new Set(exercises.map((item) => item.primaryMuscle).filter(Boolean))].map((muscle) => (
                <option key={muscle} value={muscle ?? ''}>{muscle}</option>
              ))}
            </select>
            <div style={{ maxHeight: '220px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {exercises
                .filter((item) => (categoryFilter === 'ALL' || item.primaryMuscle === categoryFilter)
                  && item.name.toLowerCase().includes(exerciseQuery.toLowerCase()))
                .slice(0, 40)
                .map((exercise) => (
                  <button
                    key={exercise.id}
                    type="button"
                    onClick={() => {
                      setSessionDays((prev) => prev.map((day, index) => (
                        index === activeDayIndex ? { ...day, exercises: [...day.exercises, exercise] } : day
                      )));
                      ensureRows(exercise.id);
                    }}
                    style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--surface-high)', borderRadius: '8px', padding: '8px', textAlign: 'left', cursor: 'pointer' }}
                  >
                    <p style={{ margin: 0, color: '#e2e2e8', fontFamily: 'Manrope', fontSize: '0.82rem' }}>{exercise.name}</p>
                    <p style={{ margin: 0, color: '#8e909c', fontFamily: 'Manrope', fontSize: '0.68rem' }}>{exercise.primaryMuscle ?? 'General'}</p>
                  </button>
                ))}
            </div>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1 }}>
          {dayExercises.map((exercise) => {
            const rows = setRows[exercise.id] ?? [
              { id: `${exercise.id}-1`, weight: '', reps: '', completed: false },
              { id: `${exercise.id}-2`, weight: '', reps: '', completed: false },
              { id: `${exercise.id}-3`, weight: '', reps: '', completed: false },
            ];
            const tagColor = muscleColor(exercise.primaryMuscle);
            return (
              <div
                key={exercise.id}
                draggable
                onDragStart={() => setDraggingExerciseId(exercise.id)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => {
                  if (!draggingExerciseId || draggingExerciseId === exercise.id) return;
                  setSessionDays((prev) => prev.map((day, index) => {
                    if (index !== activeDayIndex) return day;
                    const copy = [...day.exercises];
                    const from = copy.findIndex((item) => item.id === draggingExerciseId);
                    const to = copy.findIndex((item) => item.id === exercise.id);
                    if (from < 0 || to < 0) return day;
                    const [moved] = copy.splice(from, 1);
                    copy.splice(to, 0, moved);
                    return { ...day, exercises: copy };
                  }));
                  setDraggingExerciseId(null);
                }}
                style={{ backgroundColor: 'var(--surface-container)', border: '1px solid var(--surface-high)', borderRadius: '16px', padding: '12px', position: 'relative' }}
              >
                <div style={{ position: 'absolute', left: 0, top: '14px', bottom: '14px', width: '6px', borderRadius: '0 6px 6px 0', backgroundColor: tagColor, opacity: 0.55 }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: '8px' }}>
                    <GripVertical size={14} color="#444650" />
                    <div>
                      <p style={{ margin: 0, fontFamily: "'Space Grotesk', sans-serif", color: '#e2e2e8', fontSize: '0.92rem' }}>{exercise.name}</p>
                      <p style={{ margin: 0, fontFamily: 'Manrope', color: 'var(--outline)', fontSize: '0.68rem' }}>{exercise.equipment ?? 'Equipment optional'}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSessionDays((prev) => prev.map((day, index) => (
                        index === activeDayIndex ? { ...day, exercises: day.exercises.filter((item) => item.id !== exercise.id) } : day
                      )));
                    }}
                    style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}
                  >
                    <Trash2 size={14} color="#ffb4ab" />
                  </button>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', marginLeft: '8px' }}>
                  <span style={{ border: `1px solid ${tagColor}`, color: tagColor, borderRadius: '9999px', padding: '2px 8px', fontFamily: 'Manrope', fontSize: '0.66rem', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                    {(exercise.primaryMuscle ?? 'GENERAL').replace('_', ' ')}
                  </span>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <span style={{ width: '26px', height: '3px', borderRadius: '9999px', backgroundColor: tagColor, opacity: 1 }} />
                    <span style={{ width: '26px', height: '3px', borderRadius: '9999px', backgroundColor: tagColor, opacity: 0.6 }} />
                    <span style={{ width: '26px', height: '3px', borderRadius: '9999px', backgroundColor: tagColor, opacity: 0.3 }} />
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginLeft: '8px' }}>
                  {rows.map((row, rowIndex) => (
                    <div key={row.id} style={{ display: 'grid', gridTemplateColumns: '44px 1fr 1fr 44px', gap: '6px', alignItems: 'center' }}>
                      <span style={{ fontFamily: 'Manrope', fontSize: '0.7rem', color: '#8e909c' }}>S{rowIndex + 1}</span>
                      <input
                        type="number"
                        placeholder="kg"
                        value={row.weight}
                        onChange={(e) => setSetRows((prev) => ({
                          ...prev,
                          [exercise.id]: rows.map((current, index) => (index === rowIndex ? { ...current, weight: e.target.value } : current)),
                        }))}
                        className="k-input"
                      />
                      <input
                        type="number"
                        placeholder="reps"
                        value={row.reps}
                        onChange={(e) => setSetRows((prev) => ({
                          ...prev,
                          [exercise.id]: rows.map((current, index) => (index === rowIndex ? { ...current, reps: e.target.value } : current)),
                        }))}
                        className="k-input"
                      />
                      <button
                        type="button"
                        onClick={() => completeSet(exercise.id, rowIndex)}
                        style={{ width: '36px', height: '36px', borderRadius: '10px', border: row.completed ? '1px solid var(--tertiary)' : '1px solid var(--surface-high)', backgroundColor: row.completed ? 'rgba(89,216,222,0.18)' : 'var(--surface)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      >
                        <Check size={14} color={row.completed ? 'var(--tertiary)' : 'var(--outline)'} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {showExercisePicker && (
          <button
            type="button"
            onClick={() => setShowExercisePicker(false)}
            style={{ position: 'fixed', right: 20, bottom: 92, width: 40, height: 40, borderRadius: '9999px', border: '1px solid #282a2e', backgroundColor: '#1a1c20', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <X size={14} color="#8e909c" />
          </button>
        )}

        <div style={{ marginTop: '18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', padding: '0 4px' }}>
            <div>
              <p className="label-sm" style={{ color: 'var(--outline)' }}>Workout Volume</p>
              <p style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '1.35rem', color: 'var(--on-surface)', fontWeight: 700 }}>
                {(Object.values(setRows).flat().reduce((acc, row) => acc + ((Number(row.weight) || 0) * (Number(row.reps) || 0)), 0)).toLocaleString()} <span style={{ color: 'var(--outline)', fontSize: '0.8rem' }}>kg</span>
              </p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p className="label-sm" style={{ color: 'var(--outline)' }}>Duration</p>
              <p style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '1.35rem', color: 'var(--primary)', fontWeight: 700 }}>42:15</p>
            </div>
          </div>
        </div>

        <button
          onClick={completeSession}
          disabled={completing}
          style={{ position: 'fixed', left: '50%', transform: 'translateX(-50%)', bottom: 22, width: 'min(520px, calc(100% - 32px))', padding: '16px', borderRadius: '16px', border: 'none', background: completing ? 'var(--outline-variant)' : 'var(--primary)', color: completing ? 'var(--outline)' : 'var(--on-primary)', fontFamily: 'Manrope', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', cursor: completing ? 'not-allowed' : 'pointer' }}
        >
          {completing ? 'Submitting...' : 'End Workout / Submit'}
        </button>
      </div>
    </div>
  );
}