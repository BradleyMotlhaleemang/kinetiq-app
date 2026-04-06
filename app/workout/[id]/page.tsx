'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { workoutsApi } from '@/lib/api/workouts';
import { exercisesApi } from '@/lib/api/exercises';
import { useSessionStore } from '@/store/session.store';
import { ChevronDown, ChevronUp, Check, X } from 'lucide-react';

export default function WorkoutPage() {
  const router = useRouter();
  const params = useParams();
  const workoutId = params.id as string;

  const { addSet, setPrescription, prescriptions, sets, clearSession } =
    useSessionStore();

  const [workout, setWorkout] = useState<any>(null);
  const [exercises, setExercises] = useState<any[]>([]);
  const [selectedExercise, setSelectedExercise] = useState<any>(null);
  const [prescription, setPrescriptionState] = useState<any>(null);
  const [weight, setWeight] = useState('');
  const [reps, setReps] = useState('');
  const [rpe, setRpe] = useState('');
  const [setNumber, setSetNumber] = useState(1);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState(false);
  const [showExercisePicker, setShowExercisePicker] = useState(false);

  useEffect(() => {
    loadWorkout();
    loadExercises();
  }, []);

  async function loadWorkout() {
    try {
      const res = await workoutsApi.findOne(workoutId);
      setWorkout(res.data);
    } catch {
      router.push('/dashboard');
    } finally {
      setLoading(false);
    }
  }

  async function loadExercises() {
    try {
      const res = await exercisesApi.findAll();
      setExercises(res.data);
    } catch (err) {
      console.error(err);
    }
  }

  async function selectExercise(exercise: any) {
    setSelectedExercise(exercise);
    setShowExercisePicker(false);
    setWeight('');
    setReps('');
    setRpe('');
    setSetNumber((sets[exercise.id]?.length ?? 0) + 1);

    try {
      const res = await workoutsApi.getPrescription(workoutId, exercise.id);
      setPrescriptionState(res.data);
      setPrescription(exercise.id, res.data);
      if (res.data.weightTarget) {
        setWeight(String(res.data.weightTarget));
      }
    } catch (err) {
      console.error(err);
    }
  }

  async function logSet() {
    if (!selectedExercise || !weight || !reps) return;
    try {
      const res = await workoutsApi.addSet(workoutId, {
        exerciseId: selectedExercise.id,
        setNumber,
        weight: parseFloat(weight),
        reps: parseInt(reps),
        rpe: rpe ? parseFloat(rpe) : undefined,
      });
      addSet(selectedExercise.id, res.data);
      setSetNumber((n) => n + 1);
      setReps('');
      setRpe('');
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

  const currentSets = selectedExercise ? (sets[selectedExercise.id] ?? []) : [];

  return (
    <div className="min-h-screen bg-black px-4 pt-10 pb-32">
      <div className="max-w-sm mx-auto space-y-6">

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white">
              {workout?.splitDayLabel ?? 'Training Session'}
            </h1>
            <p className="text-zinc-400 text-xs mt-0.5">
              {workout?.statusLabel ?? workout?.status}
            </p>
          </div>
          <button
            onClick={completeSession}
            disabled={completing}
            className="bg-white text-black text-xs font-semibold px-4 py-2 rounded-lg hover:bg-zinc-200 transition disabled:opacity-50"
          >
            {completing ? 'Finishing...' : 'Finish'}
          </button>
        </div>

        <button
          onClick={() => setShowExercisePicker((v) => !v)}
          className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-4 flex items-center justify-between"
        >
          <span className="text-white text-sm">
            {selectedExercise ? selectedExercise.name : 'Select Exercise'}
          </span>
          {showExercisePicker ? (
            <ChevronUp size={16} className="text-zinc-400" />
          ) : (
            <ChevronDown size={16} className="text-zinc-400" />
          )}
        </button>

        {showExercisePicker && (
          <div className="bg-zinc-900 border border-zinc-700 rounded-xl overflow-hidden max-h-64 overflow-y-auto">
            {exercises.map((ex) => (
              <button
                key={ex.id}
                onClick={() => selectExercise(ex)}
                className="w-full text-left px-4 py-3 text-sm text-white hover:bg-zinc-800 border-b border-zinc-800 last:border-0"
              >
                <p className="font-medium">{ex.name}</p>
                <p className="text-zinc-400 text-xs mt-0.5">
                  {ex.primaryMuscle}
                </p>
              </button>
            ))}
          </div>
        )}

        {prescription && selectedExercise && (
          <div className={`rounded-xl p-4 border ${
            prescription.action === 'PROGRESS'
              ? 'bg-green-950 border-green-800'
              : prescription.action === 'HOLD'
              ? 'bg-zinc-900 border-zinc-700'
              : prescription.action === 'REDUCE'
              ? 'bg-amber-950 border-amber-800'
              : 'bg-red-950 border-red-800'
          }`}>
            <div className="flex items-center justify-between mb-1">
              <p className="text-white text-sm font-medium">
                {prescription.actionLabel ?? prescription.action}
              </p>
              <p className="text-white font-bold">
                {prescription.weightTarget}kg
              </p>
            </div>
            <p className="text-zinc-300 text-xs">{prescription.reason}</p>
          </div>
        )}

        {selectedExercise && (
          <div className="space-y-4">
            <p className="text-zinc-400 text-xs font-medium uppercase tracking-wider">
              Set {setNumber}
            </p>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-zinc-400 text-xs block mb-1">
                  Weight (kg)
                </label>
                <input
                  type="number"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-3 text-white text-sm focus:outline-none focus:border-zinc-400"
                  placeholder="80"
                />
              </div>
              <div>
                <label className="text-zinc-400 text-xs block mb-1">Reps</label>
                <input
                  type="number"
                  value={reps}
                  onChange={(e) => setReps(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-3 text-white text-sm focus:outline-none focus:border-zinc-400"
                  placeholder="8"
                />
              </div>
              <div>
                <label className="text-zinc-400 text-xs block mb-1">
                  RPE
                </label>
                <input
                  type="number"
                  value={rpe}
                  onChange={(e) => setRpe(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-3 text-white text-sm focus:outline-none focus:border-zinc-400"
                  placeholder="7"
                  min="1"
                  max="10"
                />
              </div>
            </div>

            <button
              onClick={logSet}
              disabled={!weight || !reps}
              className="w-full bg-white text-black font-semibold py-3 rounded-xl hover:bg-zinc-200 transition disabled:opacity-50"
            >
              Log Set
            </button>
          </div>
        )}

        {currentSets.length > 0 && (
          <div className="space-y-2">
            <p className="text-zinc-400 text-xs font-medium uppercase tracking-wider">
              Logged Sets
            </p>
            {currentSets.map((s: any, i: number) => (
              <div
                key={s.id ?? i}
                className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <span className="text-zinc-500 text-xs w-6">
                    {i + 1}
                  </span>
                  <div>
                    <p className="text-white text-sm">
                      {s.weight}kg × {s.reps} reps
                    </p>
                    {s.rpe && (
                      <p className="text-zinc-400 text-xs">RPE {s.rpe}</p>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-zinc-400 text-xs">
                    e1RM {Math.round(s.e1rm ?? 0)}kg
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}