'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  workoutsApi,
  type Prescription,
  type PrescriptionSubstitution,
} from '@/lib/api/workouts';
import { exercisesApi } from '@/lib/api/exercises';
import { ApiError } from '@/lib/api/client';
import { useSessionStore } from '@/store/session.store';
import { Check, GripVertical, Plus, Search, Trash2, X, RotateCcw } from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────

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

const EMPTY_EXERCISES: ExerciseItem[] = [];

// ─── Brand color palette (Kinetiq) ───────────────────────────────────────────

const PRIMARY = '#b1c5ff';       // brand primary (cool blue)
const PRIMARY_GLOW = 'rgba(177,197,255,0.45)';
const TERTIARY = '#59d8de';      // teal accent
const SURFACE = '#111318';       // darkest bg
const SURFACE_CONTAINER = '#1a1c22';
const SURFACE_HIGH = '#282a30';
const OUTLINE = '#8e909c';
const ON_SURFACE = '#e2e2e8';
const ERROR = '#ffb4ab';
const WARNING = '#f5d76e';
const CONFIDENCE_HIGH = '#6cd68f';
const CONFIDENCE_MOD = '#f5d76e';
const CONFIDENCE_LOW = '#ff6b6b';

const confidenceColor = (level: string | null | undefined): string => {
  switch ((level ?? '').toUpperCase()) {
    case 'HIGH':
      return CONFIDENCE_HIGH;
    case 'MODERATE':
      return CONFIDENCE_MOD;
    case 'LOW':
    case 'VERY_LOW':
      return CONFIDENCE_LOW;
    case 'INSUFFICIENT_DATA':
      return OUTLINE;
    default:
      return OUTLINE;
  }
};

const confidenceLabel = (level: string | null | undefined): string =>
  (level ?? 'INSUFFICIENT_DATA').replace(/_/g, ' ').toLowerCase();

const formatRepRange = (low: number, high: number): string =>
  low === high ? `${low}` : `${low}–${high}`;

// muscle → accent color map (Kinetiq palette only — no random purples/oranges)
const muscleColor = (muscle: string | null | undefined): string => {
  if (!muscle) return OUTLINE;
  if (muscle.includes('CHEST'))                      return '#ff6b6b'; // warm red
  if (muscle.includes('BACK'))                       return PRIMARY;    // brand blue
  if (muscle.includes('DELT') || muscle.includes('SHOULDER')) return TERTIARY; // teal
  if (muscle.includes('QUAD'))                       return '#6cd68f'; // green
  if (muscle.includes('GLUTE'))                      return '#ff7ac8'; // pink
  if (muscle.includes('HAMSTRING'))                  return '#f5d76e'; // gold
  if (muscle.includes('BICEP'))                      return '#b1c5ff'; // primary
  if (muscle.includes('TRICEP'))                     return '#59d8de'; // tertiary
  return TERTIARY;
};

// ─── Sub-component: Set Row ───────────────────────────────────────────────────

const SET_ROW_GRID = '26px 1fr 1fr 1fr 1fr 40px';
const SET_ROW_GAP = '6px';

function SetRowItem({
  row,
  rowIndex,
  accentColor,
  prescribedWeight,
  prescribedReps,
  onWeightChange,
  onRepsChange,
  onComplete,
}: {
  row: SetRow;
  rowIndex: number;
  accentColor: string;
  prescribedWeight: string;
  prescribedReps: string;
  onWeightChange: (val: string) => void;
  onRepsChange: (val: string) => void;
  onComplete: () => void;
}) {
  const isCompleted = row.completed;
  const mutedCellStyle: React.CSSProperties = {
    backgroundColor: 'transparent',
    border: `1px dashed ${SURFACE_HIGH}`,
    borderRadius: '10px',
    padding: '10px 0',
    textAlign: 'center',
    color: OUTLINE,
    fontFamily: 'Manrope, sans-serif',
    fontWeight: 600,
    fontSize: '0.78rem',
    opacity: 0.85,
  };
  const inputStyle: React.CSSProperties = {
    backgroundColor: isCompleted ? `${accentColor}18` : SURFACE,
    border: `1px solid ${isCompleted ? accentColor + '55' : SURFACE_HIGH}`,
    borderRadius: '12px',
    padding: '10px 0',
    textAlign: 'center',
    color: isCompleted ? accentColor : ON_SURFACE,
    fontFamily: 'Manrope, sans-serif',
    fontWeight: 700,
    fontSize: '0.84rem',
    outline: 'none',
    width: '100%',
    transition: 'all 0.2s',
    appearance: 'textfield',
  };

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: SET_ROW_GRID,
        gap: SET_ROW_GAP,
        alignItems: 'center',
        padding: '2px 0',
        opacity: isCompleted ? 0.75 : 1,
        transition: 'opacity 0.2s',
      }}
    >
      {/* Set label */}
      <span
        style={{
          fontFamily: 'Manrope, sans-serif',
          fontSize: '0.66rem',
          fontWeight: 700,
          color: isCompleted ? accentColor : OUTLINE,
          letterSpacing: '0.06em',
          transition: 'color 0.2s',
        }}
      >
        S{rowIndex + 1}
      </span>

      {/* Prescribed weight (muted, non-editable) */}
      <div style={mutedCellStyle}>{prescribedWeight}</div>

      {/* Prescribed reps (muted, non-editable) */}
      <div style={mutedCellStyle}>{prescribedReps}</div>

      {/* Actual weight input */}
      <input
        type="number"
        placeholder="—"
        value={row.weight}
        disabled={isCompleted}
        onChange={(e) => onWeightChange(e.target.value)}
        style={inputStyle}
      />

      {/* Actual reps input */}
      <input
        type="number"
        placeholder="—"
        value={row.reps}
        disabled={isCompleted}
        onChange={(e) => onRepsChange(e.target.value)}
        style={inputStyle}
      />

      {/* Check button */}
      <button
        type="button"
        onClick={onComplete}
        style={{
          width: '40px',
          height: '40px',
          borderRadius: '12px',
          border: isCompleted ? `1.5px solid ${accentColor}88` : `1.5px solid ${SURFACE_HIGH}`,
          backgroundColor: isCompleted ? `${accentColor}22` : SURFACE,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.18s',
          boxShadow: isCompleted ? `0 0 14px ${accentColor}44` : 'none',
          flexShrink: 0,
        }}
      >
        <Check
          size={14}
          color={isCompleted ? accentColor : OUTLINE}
          strokeWidth={isCompleted ? 2.5 : 1.8}
          style={{ transition: 'all 0.18s' }}
        />
      </button>
    </div>
  );
}

// ─── Sub-component: Exercise Card ─────────────────────────────────────────────

function ExerciseCard({
  exercise,
  rows,
  accentColor,
  prescription,
  isActive,
  onActivate,
  draggingId,
  onDragStart,
  onDragOver,
  onDrop,
  onDelete,
  onSetWeightChange,
  onSetRepsChange,
  onSetComplete,
  onAddSet,
}: {
  exercise: ExerciseItem;
  rows: SetRow[];
  accentColor: string;
  prescription: Prescription | undefined;
  isActive: boolean;
  onActivate: () => void;
  draggingId: string | null;
  onDragStart: () => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: () => void;
  onDelete: () => void;
  onSetWeightChange: (rowIndex: number, val: string) => void;
  onSetRepsChange: (rowIndex: number, val: string) => void;
  onSetComplete: (rowIndex: number) => void;
  onAddSet: () => void;
}) {
  const phase = prescription?.enginePhase;
  const isBaselineLike = phase === 'BASELINE' || phase === 'CALIBRATING';
  const prescribedWeight = !prescription
    ? '—'
    : isBaselineLike
      ? '—'
      : `${prescription.weightTarget}`;
  const prescribedReps = prescription
    ? formatRepRange(prescription.repRangeLow, prescription.repRangeHigh)
    : '—';
  const [note, setNote] = useState('');
  const isDragging = draggingId === exercise.id;

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onClick={onActivate}
      style={{
        backgroundColor: SURFACE_CONTAINER,
        border: `1px solid ${isActive ? accentColor + '88' : isDragging ? accentColor + '66' : SURFACE_HIGH}`,
        borderRadius: '20px',
        padding: '18px 16px 14px',
        position: 'relative',
        opacity: isDragging ? 0.5 : 1,
        transition: 'opacity 0.15s, border-color 0.15s, box-shadow 0.15s',
        overflow: 'hidden',
        boxShadow: isActive ? `0 0 20px -10px ${accentColor}99` : 'none',
      }}
    >
      {/* Left accent line */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: '20px',
          bottom: '20px',
          width: '5px',
          borderRadius: '0 5px 5px 0',
          backgroundColor: accentColor,
          opacity: 0.7,
        }}
      />

      {/* Card header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: '14px',
          marginLeft: '10px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
          <GripVertical size={14} color={OUTLINE} style={{ marginTop: '4px', cursor: 'grab', flexShrink: 0 }} />
          <div>
            <p
              style={{
                margin: 0,
                fontFamily: 'Manrope, sans-serif',
                fontSize: '0.62rem',
                fontWeight: 700,
                color: accentColor,
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                marginBottom: '3px',
              }}
            >
              {(exercise.primaryMuscle ?? 'General').replace(/_/g, ' ')}
            </p>
            <h2
              style={{
                margin: 0,
                fontFamily: "'Space Grotesk', sans-serif",
                fontSize: '1.12rem',
                fontWeight: 800,
                color: ON_SURFACE,
                letterSpacing: '-0.01em',
                lineHeight: 1.15,
                textTransform: 'uppercase',
              }}
            >
              {exercise.name}
            </h2>
            {exercise.equipment && (
              <p
                style={{
                  margin: '5px 0 0',
                  fontFamily: 'Manrope, sans-serif',
                  fontSize: '0.68rem',
                  color: OUTLINE,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M6 4v16M18 4v16M2 8h4M18 8h4M2 16h4M18 16h4" />
                </svg>
                {exercise.equipment}
              </p>
            )}
          </div>
        </div>

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button
            type="button"
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px', opacity: 0.6 }}
            title="View history"
          >
            <RotateCcw size={14} color={OUTLINE} />
          </button>
          <button
            type="button"
            onClick={onDelete}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px', opacity: 0.7 }}
            title="Remove exercise"
          >
            <Trash2 size={14} color={ERROR} />
          </button>
        </div>
      </div>

      {/* Column headers: SET | PRESCRIBED KG | PRESCRIBED REPS | ACTUAL KG | ACTUAL REPS | ✓ */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: SET_ROW_GRID,
          gap: SET_ROW_GAP,
          marginBottom: '6px',
          marginLeft: '10px',
          padding: '0 2px',
        }}
      >
        <span style={{ fontSize: '0.54rem', fontFamily: 'Manrope, sans-serif', fontWeight: 700, color: OUTLINE, letterSpacing: '0.1em' }}>SET</span>
        <span style={{ fontSize: '0.5rem', fontFamily: 'Manrope, sans-serif', fontWeight: 700, color: OUTLINE, letterSpacing: '0.08em', textAlign: 'center' }}>RX KG</span>
        <span style={{ fontSize: '0.5rem', fontFamily: 'Manrope, sans-serif', fontWeight: 700, color: OUTLINE, letterSpacing: '0.08em', textAlign: 'center' }}>RX REPS</span>
        <span style={{ fontSize: '0.5rem', fontFamily: 'Manrope, sans-serif', fontWeight: 700, color: accentColor, letterSpacing: '0.08em', textAlign: 'center' }}>KG</span>
        <span style={{ fontSize: '0.5rem', fontFamily: 'Manrope, sans-serif', fontWeight: 700, color: accentColor, letterSpacing: '0.08em', textAlign: 'center' }}>REPS</span>
        <span />
      </div>

      {/* Set rows */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginLeft: '10px', marginBottom: '12px' }}>
        {rows.map((row, rowIndex) => (
          <SetRowItem
            key={row.id}
            row={row}
            rowIndex={rowIndex}
            accentColor={accentColor}
            prescribedWeight={prescribedWeight}
            prescribedReps={prescribedReps}
            onWeightChange={(val) => onSetWeightChange(rowIndex, val)}
            onRepsChange={(val) => onSetRepsChange(rowIndex, val)}
            onComplete={() => onSetComplete(rowIndex)}
          />
        ))}
      </div>

      {/* Add set */}
      <button
        type="button"
        onClick={onAddSet}
        style={{
          marginLeft: '10px',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          color: accentColor,
          fontFamily: 'Manrope, sans-serif',
          fontSize: '0.7rem',
          fontWeight: 700,
          letterSpacing: '0.08em',
          display: 'flex',
          alignItems: 'center',
          gap: '5px',
          opacity: 0.8,
          padding: '0',
          marginBottom: '8px',
        }}
      >
        <Plus size={13} />
        ADD SET
      </button>

      {/* Notes divider + input */}
      <div
        style={{
          borderTop: `1px solid ${SURFACE_HIGH}`,
          marginLeft: '10px',
          paddingTop: '10px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={OUTLINE} strokeWidth="2">
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="3" y1="12" x2="15" y2="12" />
          <line x1="3" y1="18" x2="18" y2="18" />
        </svg>
        <input
          type="text"
          placeholder="Add exercise notes..."
          value={note}
          onChange={(e) => setNote(e.target.value)}
          style={{
            background: 'none',
            border: 'none',
            outline: 'none',
            color: ON_SURFACE,
            fontFamily: 'Manrope, sans-serif',
            fontSize: '0.75rem',
            width: '100%',
          }}
        />
      </div>
    </div>
  );
}

// ─── Sub-component: Prescription Card ─────────────────────────────────────────

function PrescriptionCard({
  prescription,
  loading,
  hasError,
}: {
  prescription: Prescription | undefined;
  loading: boolean;
  hasError: boolean;
}) {
  // Loading skeleton
  if (loading && !prescription) {
    return (
      <div
        style={{
          backgroundColor: SURFACE_CONTAINER,
          border: `1px solid ${SURFACE_HIGH}`,
          borderLeft: `3px solid ${PRIMARY}`,
          borderRadius: '16px',
          padding: '14px 14px 12px',
        }}
      >
        <p
          style={{
            margin: '0 0 6px',
            fontSize: '0.58rem',
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            fontWeight: 700,
            color: OUTLINE,
          }}
        >
          Engine Prescription
        </p>
        <div
          style={{
            width: '42%',
            height: '22px',
            borderRadius: '8px',
            backgroundColor: SURFACE_HIGH,
            marginBottom: '8px',
          }}
        />
        <div
          style={{
            width: '100%',
            height: '12px',
            borderRadius: '6px',
            backgroundColor: SURFACE_HIGH,
            opacity: 0.7,
          }}
        />
      </div>
    );
  }

  // No prescription yet
  if (!prescription) {
    return (
      <div
        style={{
          backgroundColor: SURFACE_CONTAINER,
          border: `1px solid ${SURFACE_HIGH}`,
          borderLeft: `3px solid ${PRIMARY}`,
          borderRadius: '16px',
          padding: '14px 14px 12px',
        }}
      >
        <p
          style={{
            margin: '0 0 6px',
            fontSize: '0.58rem',
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            fontWeight: 700,
            color: OUTLINE,
          }}
        >
          Engine Prescription
        </p>
        <p
          style={{
            margin: 0,
            color: hasError ? ERROR : OUTLINE,
            fontSize: '0.74rem',
          }}
        >
          {hasError
            ? 'Could not load recommendation'
            : 'No recommendation available'}
        </p>
      </div>
    );
  }

  const phase = prescription.enginePhase;
  const repRange = formatRepRange(
    prescription.repRangeLow,
    prescription.repRangeHigh,
  );
  const isBaselineLike = phase === 'BASELINE' || phase === 'CALIBRATING';
  const isLearning = phase === 'LEARNING';
  const isActive = phase === 'ACTIVE';
  const confColor = confidenceColor(prescription.confidenceLevel);

  // ── BASELINE / CALIBRATING: muted baseline card ──
  if (isBaselineLike) {
    return (
      <div
        style={{
          backgroundColor: SURFACE_CONTAINER,
          border: `1px solid ${SURFACE_HIGH}`,
          borderLeft: `3px solid ${OUTLINE}`,
          borderRadius: '16px',
          padding: '14px 14px 12px',
          opacity: 0.92,
        }}
      >
        <p
          style={{
            margin: '0 0 6px',
            fontSize: '0.58rem',
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            fontWeight: 700,
            color: OUTLINE,
          }}
        >
          Engine Prescription
        </p>
        <p
          style={{
            margin: '0 0 4px',
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: '1.02rem',
            fontWeight: 800,
            color: ON_SURFACE,
          }}
        >
          Building your baseline
        </p>
        <p
          style={{
            margin: '0 0 10px',
            color: OUTLINE,
            fontSize: '0.74rem',
            lineHeight: 1.4,
          }}
        >
          Log your best effort — prescriptions personalise from session 3 onward.
        </p>
        <div
          style={{
            display: 'flex',
            gap: '14px',
            color: OUTLINE,
            fontSize: '0.7rem',
            fontWeight: 700,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
          }}
        >
          <span>{prescription.setTarget} sets</span>
          <span>{repRange} reps</span>
        </div>
      </div>
    );
  }

  // ── LEARNING / ACTIVE: full prescription card ──
  return (
    <div
      style={{
        backgroundColor: SURFACE_CONTAINER,
        border: `1px solid ${SURFACE_HIGH}`,
        borderLeft: `3px solid ${PRIMARY}`,
        borderRadius: '16px',
        padding: '14px 14px 12px',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '8px',
          gap: '8px',
          flexWrap: 'wrap',
        }}
      >
        <p
          style={{
            margin: 0,
            fontSize: '0.58rem',
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            fontWeight: 700,
            color: OUTLINE,
          }}
        >
          Engine Prescription
        </p>
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
          {isLearning && (
            <span
              style={{
                fontSize: '0.58rem',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                fontWeight: 800,
                color: TERTIARY,
                backgroundColor: `${TERTIARY}1f`,
                border: `1px solid ${TERTIARY}55`,
                borderRadius: '9999px',
                padding: '3px 8px',
              }}
            >
              Learning
            </span>
          )}
          <span
            style={{
              fontSize: '0.64rem',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              fontWeight: 800,
              color: SURFACE,
              backgroundColor: PRIMARY,
              border: `1px solid ${PRIMARY}`,
              borderRadius: '9999px',
              padding: '4px 10px',
              boxShadow: `0 0 12px -4px ${PRIMARY_GLOW}`,
            }}
          >
            {prescription.actionLabel}
          </span>
        </div>
      </div>

      {/* Target metrics */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr',
          gap: '8px',
          marginBottom: '10px',
        }}
      >
        <div>
          <p style={{ margin: 0, fontSize: '0.54rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: OUTLINE, fontWeight: 700 }}>
            Weight
          </p>
          <p
            style={{
              margin: '2px 0 0',
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: '1.1rem',
              fontWeight: 900,
              color: ON_SURFACE,
            }}
          >
            {prescription.weightTarget}
            <span style={{ fontSize: '0.7rem', fontWeight: 600, color: OUTLINE, marginLeft: '3px' }}>kg</span>
          </p>
        </div>
        <div>
          <p style={{ margin: 0, fontSize: '0.54rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: OUTLINE, fontWeight: 700 }}>
            Reps
          </p>
          <p
            style={{
              margin: '2px 0 0',
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: '1.1rem',
              fontWeight: 900,
              color: ON_SURFACE,
            }}
          >
            {repRange}
          </p>
        </div>
        <div>
          <p style={{ margin: 0, fontSize: '0.54rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: OUTLINE, fontWeight: 700 }}>
            Sets
          </p>
          <p
            style={{
              margin: '2px 0 0',
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: '1.1rem',
              fontWeight: 900,
              color: ON_SURFACE,
            }}
          >
            {prescription.setTarget}
          </p>
        </div>
      </div>

      {/* Confidence indicator (ACTIVE only) */}
      {isActive && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            marginBottom: '8px',
          }}
        >
          <span
            style={{
              width: '6px',
              height: '6px',
              borderRadius: '9999px',
              backgroundColor: confColor,
              boxShadow: `0 0 6px ${confColor}`,
            }}
          />
          <span
            style={{
              fontSize: '0.62rem',
              fontWeight: 700,
              color: confColor,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
            }}
          >
            {confidenceLabel(prescription.confidenceLevel)} confidence
          </span>
        </div>
      )}

      {/* Coaching note */}
      {prescription.coachingNote && (
        <div
          style={{
            backgroundColor: `${PRIMARY}12`,
            border: `1px solid ${PRIMARY}33`,
            borderRadius: '10px',
            padding: '8px 10px',
            marginBottom: '8px',
          }}
        >
          <p
            style={{
              margin: 0,
              color: ON_SURFACE,
              fontSize: '0.72rem',
              lineHeight: 1.4,
            }}
          >
            <span
              style={{
                color: PRIMARY,
                fontWeight: 800,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                fontSize: '0.56rem',
                marginRight: '6px',
              }}
            >
              Coach tip
            </span>
            {prescription.coachingNote}
          </p>
        </div>
      )}

      {/* Reason */}
      <p
        style={{
          margin: 0,
          color: OUTLINE,
          fontSize: '0.72rem',
          lineHeight: 1.4,
        }}
      >
        {prescription.reason}
      </p>

      {/* Progression step */}
      {prescription.progressionStep && (
        <p
          style={{
            margin: '8px 0 0',
            color: TERTIARY,
            fontSize: '0.66rem',
            fontWeight: 700,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
          }}
        >
          {prescription.progressionStep}
        </p>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function WorkoutPage() {
  const router = useRouter();
  const params = useParams();
  const workoutId = params.id as string;
  const {
    addSet,
    clearSession,
    prescriptions,
    rehydrate,
    setPrescription,
    setWorkoutId,
  } = useSessionStore();

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
  const [exerciseQuery, setExerciseQuery] = useState('');
  const [exerciseLoadError, setExerciseLoadError] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [draggingExerciseId, setDraggingExerciseId] = useState<string | null>(null);
  const [activeExerciseId, setActiveExerciseId] = useState<string | null>(null);
  const [prescriptionLoadingByExercise, setPrescriptionLoadingByExercise] =
    useState<Record<string, boolean>>({});
  const [prescriptionErrorByExercise, setPrescriptionErrorByExercise] =
    useState<Record<string, boolean>>({});
  const [dismissedSubstitutionByExercise, setDismissedSubstitutionByExercise] =
    useState<Record<string, boolean>>({});
  const [substitutionSubmitting, setSubstitutionSubmitting] = useState(false);

  // Live timer
  const [elapsedSec, setElapsedSec] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const hasRehydrated = useRef(false);

  useEffect(() => {
    setWorkoutId(workoutId);
    rehydrate(workoutId);
    loadWorkout();
    loadExercises();
    timerRef.current = setInterval(() => setElapsedSec((s) => s + 1), 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [rehydrate, setWorkoutId, workoutId]);

  async function loadWorkout() {
    try {
      const res = await workoutsApi.findOne(workoutId);
      setWorkout(res.data);
      const fallbackLabel = res.data?.splitDayLabel ?? 'Day 1';
      setSessionDays((prev) => [{
        ...prev[0],
        label: fallbackLabel,
      }]);
    } catch {
      router.push('/dashboard');
    } finally {
      setLoading(false);
    }
  }

  async function loadExercises() {
    try {
      setExerciseLoadError(false);
      const list = await exercisesApi.getExercises();
      setExercises(list);
      setSessionDays((current) => {
        if (current[0]?.exercises.length) return current;
        return [{ ...current[0], exercises: list.slice(0, 4) }];
      });

      if (!hasRehydrated.current) {
        hasRehydrated.current = true;
        const rehydratedSets = useSessionStore.getState().sets;
        if (Object.keys(rehydratedSets).length > 0) {
          setSetRows((prev) => {
            const merged: Record<string, SetRow[]> = { ...prev };
            for (const [exerciseId, setLogs] of Object.entries(rehydratedSets)) {
              const existingIds = new Set(
                (prev[exerciseId] ?? []).map((r) => r.id)
              );
              const newRows = setLogs
                .filter((log) => !existingIds.has(log.id))
                .map((log) => ({
                  id: log.id,
                  weight: String(log.weight),
                  reps: String(log.reps),
                  completed: true,
                }));
              merged[exerciseId] = [
                ...(prev[exerciseId] ?? []),
                ...newRows,
              ];
            }
            return merged;
          });
        }
      }
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        return;
      }
      console.error(err);
      setExerciseLoadError(true);
    }
  }

  async function completeSession() {
    setCompleting(true);
    try {
      await workoutsApi.complete(workoutId);
      clearSession();
      router.push(`/biofeedback?workoutId=${workoutId}`);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        return;
      }
      console.error(err);
    } finally {
      setCompleting(false);
    }
  }

  // ── Helpers ──

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

  function addRowForExercise(exerciseId: string) {
    setSetRows((prev) => {
      const current = prev[exerciseId] ?? [];
      return {
        ...prev,
        [exerciseId]: [
          ...current,
          { id: `${exerciseId}-${current.length + 1}`, weight: '', reps: '', completed: false },
        ],
      };
    });
  }

  async function handleSetComplete(exerciseId: string, rowIndex: number) {
    const rows = setRows[exerciseId] ?? [];
    const row = rows[rowIndex];
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
        [exerciseId]: (prev[exerciseId] ?? []).map((current, index) =>
          index === rowIndex ? { ...current, completed: true } : current
        ),
      }));
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        return;
      }
      console.error(err);
    }
  }

  function handleWeightChange(exerciseId: string, rowIndex: number, val: string) {
    setSetRows((prev) => ({
      ...prev,
      [exerciseId]: (prev[exerciseId] ?? []).map((row, i) =>
        i === rowIndex ? { ...row, weight: val } : row
      ),
    }));
  }

  function handleRepsChange(exerciseId: string, rowIndex: number, val: string) {
    setSetRows((prev) => ({
      ...prev,
      [exerciseId]: (prev[exerciseId] ?? []).map((row, i) =>
        i === rowIndex ? { ...row, reps: val } : row
      ),
    }));
  }

  function deleteExercise(exerciseId: string) {
    setSessionDays((prev) =>
      prev.map((day, index) =>
        index === activeDayIndex
          ? { ...day, exercises: day.exercises.filter((item) => item.id !== exerciseId) }
          : day
      )
    );
  }

  function addExercise(exercise: ExerciseItem) {
    setSessionDays((prev) =>
      prev.map((day, index) =>
        index === activeDayIndex ? { ...day, exercises: [...day.exercises, exercise] } : day
      )
    );
    ensureRows(exercise.id);
  }

  // Timer display
  const timerStr = (() => {
    const m = Math.floor(elapsedSec / 60).toString().padStart(2, '0');
    const s = (elapsedSec % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  })();

  // Volume
  const totalVolume = Object.values(setRows)
    .flat()
    .reduce((acc, row) => acc + (Number(row.weight) || 0) * (Number(row.reps) || 0), 0);

  const currentDay = sessionDays[activeDayIndex] ?? sessionDays[0];
  const currentWeek = workout?.currentWeek ?? 1;
  const dayLabel = currentDay?.label ?? workout?.splitDayLabel ?? 'Day 1';
  const dayNumber = activeDayIndex + 1;
  const dayExercises = currentDay?.exercises ?? EMPTY_EXERCISES;
  const activeExercise =
    dayExercises.find((exercise) => exercise.id === activeExerciseId) ??
    dayExercises[0] ??
    null;
  const activePrescription = activeExercise
    ? prescriptions[activeExercise.id]
    : undefined;
  const prescriptionLoading = activeExercise
    ? !!prescriptionLoadingByExercise[activeExercise.id]
    : false;
  const prescriptionError = activeExercise
    ? !!prescriptionErrorByExercise[activeExercise.id]
    : false;
  const activeSubstitution = activePrescription?.substitution;
  const shouldShowSubstitutionCard =
    !!activeExercise &&
    !!activeSubstitution &&
    activeSubstitution.action === 'SUBSTITUTE' &&
    !!activeSubstitution.recommended &&
    !!activeSubstitution.originalExercise &&
    !dismissedSubstitutionByExercise[activeExercise.id];
  const candidateOptions = shouldShowSubstitutionCard
    ? (activeSubstitution?.candidates ?? []).filter(
        (candidate) =>
          candidate.exerciseId !== activeSubstitution?.recommended?.exerciseId,
      )
    : [];

  const formatJointLabel = (joint?: string) =>
    (joint ?? 'JOINT')
      .toLowerCase()
      .replace(/_/g, ' ');

  const fetchPrescriptionForExercise = useCallback(
    async (exerciseId: string, options?: { force?: boolean }) => {
      const cached = prescriptions[exerciseId];
      if (cached && !options?.force) return;

      setPrescriptionLoadingByExercise((current) => ({
        ...current,
        [exerciseId]: true,
      }));
      setPrescriptionErrorByExercise((current) => ({
        ...current,
        [exerciseId]: false,
      }));

      try {
        const res = await workoutsApi.getPrescription(workoutId, exerciseId);
        const data = res?.data;
        if (!data || typeof data !== 'object') {
          throw new Error('Invalid prescription response');
        }

        const substitutionRaw = (data as Prescription).substitution;
        const prescription: Prescription = {
          exerciseId,
          action: data.action ?? 'HOLD',
          actionLabel: data.actionLabel ?? 'Hold',
          weightTarget:
            typeof data.weightTarget === 'number' ? data.weightTarget : 0,
          repRangeLow:
            typeof data.repRangeLow === 'number' ? data.repRangeLow : 0,
          repRangeHigh:
            typeof data.repRangeHigh === 'number' ? data.repRangeHigh : 0,
          setTarget:
            typeof data.setTarget === 'number' ? data.setTarget : 0,
          reason: data.reason ?? 'No detailed recommendation provided.',
          enginePhase: (data.enginePhase ?? 'BASELINE') as Prescription['enginePhase'],
          physiologicalState: data.physiologicalState ?? 'UNKNOWN',
          confidenceLevel: data.confidenceLevel ?? 'INSUFFICIENT_DATA',
          coachingNote: data.coachingNote ?? null,
          progressionStep: data.progressionStep ?? null,
          volumeProgressionReason: data.volumeProgressionReason,
          substitution:
            substitutionRaw && typeof substitutionRaw === 'object'
              ? {
                  action: (substitutionRaw.action ?? 'NONE') as PrescriptionSubstitution['action'],
                  reason: substitutionRaw.reason ?? '',
                  affectedJoint: substitutionRaw.affectedJoint,
                  originalExercise: substitutionRaw.originalExercise,
                  recommended: substitutionRaw.recommended,
                  candidates: Array.isArray(substitutionRaw.candidates)
                    ? substitutionRaw.candidates
                    : [],
                }
              : { action: 'NONE', reason: '' },
        };

        setPrescription(exerciseId, prescription);
      } catch {
        setPrescriptionErrorByExercise((current) => ({
          ...current,
          [exerciseId]: true,
        }));
      } finally {
        setPrescriptionLoadingByExercise((current) => ({
          ...current,
          [exerciseId]: false,
        }));
      }
    },
    [prescriptions, setPrescription, workoutId],
  );

  useEffect(() => {
    if (!dayExercises.length) {
      setActiveExerciseId(null);
      return;
    }

    setActiveExerciseId((current) => {
      if (current && dayExercises.some((exercise) => exercise.id === current)) {
        return current;
      }
      return dayExercises[0].id;
    });
  }, [dayExercises]);

  useEffect(() => {
    if (!activeExerciseId) return;
    void fetchPrescriptionForExercise(activeExerciseId);
  }, [
    activeExerciseId,
    fetchPrescriptionForExercise,
  ]);

  // Fire prescription fetches for ALL exercises in the active day in parallel.
  // Each call is fire-and-forget; no awaiting blocks render.
  useEffect(() => {
    if (!dayExercises.length) return;
    dayExercises.forEach((exercise) => {
      void fetchPrescriptionForExercise(exercise.id);
    });
  }, [dayExercises, fetchPrescriptionForExercise]);

  async function handleConfirmSwap() {
    if (
      !activeExercise ||
      !activeSubstitution?.recommended ||
      !activeSubstitution?.originalExercise
    ) {
      return;
    }

    const originalExerciseId =
      activeSubstitution.originalExercise.exerciseId ?? activeExercise.id;
    const substituteExerciseId = activeSubstitution.recommended.exerciseId;
    const substituteExerciseName = activeSubstitution.recommended.name;

    setSubstitutionSubmitting(true);
    try {
      await workoutsApi.confirmSubstitution({
        workoutId,
        exerciseId: originalExerciseId,
        substituteExerciseId,
      });

      setDismissedSubstitutionByExercise((current) => ({
        ...current,
        [activeExercise.id]: true,
        [substituteExerciseId]: true,
      }));

      setSessionDays((prev) =>
        prev.map((day, index) => {
          if (index !== activeDayIndex) return day;
          return {
            ...day,
            exercises: day.exercises.map((exercise) =>
              exercise.id === originalExerciseId
                ? {
                    ...exercise,
                    id: substituteExerciseId,
                    name: substituteExerciseName,
                  }
                : exercise,
            ),
          };
        }),
      );

      setSetRows((prev) => {
        const originalRows = prev[originalExerciseId];
        if (!originalRows) return prev;
        const rest = { ...prev };
        delete rest[originalExerciseId];
        const updatedRows = originalRows.map((row, idx) => ({
          ...row,
          id: `${substituteExerciseId}-${idx + 1}`,
        }));
        return {
          ...rest,
          [substituteExerciseId]: prev[substituteExerciseId] ?? updatedRows,
        };
      });

      setActiveExerciseId(substituteExerciseId);
      await fetchPrescriptionForExercise(substituteExerciseId, { force: true });
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        return;
      }
      console.error(err);
    } finally {
      setSubstitutionSubmitting(false);
    }
  }

  function handleKeepOriginal() {
    if (!activeExercise) return;
    setDismissedSubstitutionByExercise((current) => ({
      ...current,
      [activeExercise.id]: true,
    }));
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100dvh', backgroundColor: SURFACE, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: OUTLINE, fontFamily: 'Manrope, sans-serif', fontSize: '0.85rem' }}>Loading session...</p>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: '100dvh',
        backgroundColor: SURFACE,
        color: ON_SURFACE,
        fontFamily: 'Manrope, sans-serif',
      }}
    >
      {/* Scrollable content area */}
      <div
        style={{
          maxWidth: '520px',
          margin: '0 auto',
          padding: '24px 16px 160px',
          display: 'flex',
          flexDirection: 'column',
          gap: '0',
        }}
      >
        {/* ── Header ── */}
        <header
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '24px',
          }}
        >
          <button
            type="button"
            onClick={() => router.push('/dashboard')}
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '9999px',
              backgroundColor: SURFACE_CONTAINER,
              border: `1px solid ${SURFACE_HIGH}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            <X size={16} color={OUTLINE} />
          </button>

          <div style={{ textAlign: 'center' }}>
            <p
              style={{
                margin: 0,
                fontSize: '0.6rem',
                fontWeight: 700,
                color: PRIMARY,
                letterSpacing: '0.22em',
                textTransform: 'uppercase',
              }}
            >
              Week {currentWeek} • Day {dayNumber}
            </p>
            <h1
              style={{
                margin: '2px 0 0',
                fontFamily: "'Space Grotesk', sans-serif",
                fontSize: '1.5rem',
                fontWeight: 900,
                color: ON_SURFACE,
                letterSpacing: '-0.02em',
                textTransform: 'uppercase',
                fontStyle: 'italic',
              }}
            >
              {dayLabel}
            </h1>
          </div>

          <div style={{ width: '38px', height: '38px' }} />
        </header>

        {/* ── Day tabs ── */}
        {sessionDays.length > 1 && (
          <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', marginBottom: '16px' }}>
            {sessionDays.map((day, index) => (
              <button
                key={day.label}
                type="button"
                onClick={() => setActiveDayIndex(index)}
                style={{
                  border: `1px solid ${index === activeDayIndex ? TERTIARY : SURFACE_HIGH}`,
                  color: index === activeDayIndex ? TERTIARY : OUTLINE,
                  borderRadius: '9999px',
                  padding: '5px 12px',
                  backgroundColor: index === activeDayIndex ? `${TERTIARY}15` : SURFACE_CONTAINER,
                  fontFamily: 'Manrope, sans-serif',
                  fontWeight: 700,
                  fontSize: '0.7rem',
                  letterSpacing: '0.06em',
                  whiteSpace: 'nowrap',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
              >
                {day.label}
              </button>
            ))}
          </div>
        )}

        {/* ── Exercise cards ── */}
        {activeExercise && (
          <div style={{ marginBottom: '14px', display: 'grid', gap: '10px' }}>
            {shouldShowSubstitutionCard && (
              <div
                style={{
                  backgroundColor: SURFACE_CONTAINER,
                  border: `1px solid ${SURFACE_HIGH}`,
                  borderLeft: `3px solid ${WARNING}`,
                  borderRadius: '16px',
                  padding: '14px',
                }}
              >
                <p
                  style={{
                    margin: 0,
                    fontFamily: "'Space Grotesk', sans-serif",
                    fontSize: '1rem',
                    fontWeight: 800,
                    color: WARNING,
                    letterSpacing: '-0.01em',
                  }}
                >
                  ⚠ Joint discomfort detected
                </p>
                <p
                  style={{
                    margin: '8px 0 0',
                    color: ON_SURFACE,
                    fontSize: '0.74rem',
                    lineHeight: 1.4,
                  }}
                >
                  Your {formatJointLabel(activeSubstitution?.affectedJoint)} was
                  uncomfortable last session. We recommend swapping{' '}
                  {activeSubstitution?.originalExercise?.name} to{' '}
                  {activeSubstitution?.recommended?.name}.
                </p>
                {candidateOptions.length > 0 && (
                  <div style={{ marginTop: '10px' }}>
                    <p
                      style={{
                        margin: 0,
                        color: OUTLINE,
                        fontSize: '0.66rem',
                        textTransform: 'uppercase',
                        letterSpacing: '0.08em',
                        fontWeight: 700,
                      }}
                    >
                      Other options from your pool:
                    </p>
                    <ul
                      style={{
                        margin: '6px 0 0',
                        paddingLeft: '16px',
                        color: ON_SURFACE,
                        fontSize: '0.72rem',
                        lineHeight: 1.35,
                      }}
                    >
                      {candidateOptions.map((candidate) => (
                        <li key={candidate.exerciseId}>{candidate.name}</li>
                      ))}
                    </ul>
                  </div>
                )}
                <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                  <button
                    type="button"
                    onClick={handleConfirmSwap}
                    disabled={substitutionSubmitting}
                    style={{
                      flex: 1,
                      padding: '12px 0',
                      borderRadius: '12px',
                      border: 'none',
                      background:
                        substitutionSubmitting
                          ? SURFACE_HIGH
                          : `linear-gradient(135deg, ${PRIMARY} 0%, ${TERTIARY} 100%)`,
                      color: substitutionSubmitting ? OUTLINE : SURFACE,
                      fontFamily: "'Space Grotesk', sans-serif",
                      fontWeight: 900,
                      fontSize: '0.74rem',
                      letterSpacing: '0.04em',
                      cursor: substitutionSubmitting ? 'wait' : 'pointer',
                    }}
                  >
                    {substitutionSubmitting ? 'Confirming…' : 'Confirm swap'}
                  </button>
                  <button
                    type="button"
                    onClick={handleKeepOriginal}
                    disabled={substitutionSubmitting}
                    style={{
                      flex: 1,
                      padding: '12px 0',
                      borderRadius: '12px',
                      border: `1px solid ${SURFACE_HIGH}`,
                      background: 'transparent',
                      color: ON_SURFACE,
                      fontFamily: 'Manrope, sans-serif',
                      fontWeight: 700,
                      fontSize: '0.74rem',
                      cursor: substitutionSubmitting ? 'not-allowed' : 'pointer',
                    }}
                  >
                    Keep original
                  </button>
                </div>
              </div>
            )}

            <PrescriptionCard
              prescription={activePrescription}
              loading={prescriptionLoading}
              hasError={prescriptionError}
            />
          </div>
        )}

        {exerciseLoadError && (
          <div>
            <p>Could not load exercises.</p>
            <button onClick={loadExercises}>Retry</button>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {dayExercises.map((exercise) => {
            const rows = setRows[exercise.id] ?? (() => {
              const defaultRows = [
                { id: `${exercise.id}-1`, weight: '', reps: '', completed: false },
                { id: `${exercise.id}-2`, weight: '', reps: '', completed: false },
                { id: `${exercise.id}-3`, weight: '', reps: '', completed: false },
              ];
              // ensure rows are initialized
              setTimeout(() => ensureRows(exercise.id), 0);
              return defaultRows;
            })();
            const accent = muscleColor(exercise.primaryMuscle);

            return (
              <ExerciseCard
                key={exercise.id}
                exercise={exercise}
                rows={rows}
                accentColor={accent}
                prescription={prescriptions[exercise.id]}
                isActive={activeExerciseId === exercise.id}
                onActivate={() => setActiveExerciseId(exercise.id)}
                draggingId={draggingExerciseId}
                onDragStart={() => setDraggingExerciseId(exercise.id)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => {
                  if (!draggingExerciseId || draggingExerciseId === exercise.id) return;
                  setSessionDays((prev) =>
                    prev.map((day, index) => {
                      if (index !== activeDayIndex) return day;
                      const copy = [...day.exercises];
                      const from = copy.findIndex((item) => item.id === draggingExerciseId);
                      const to = copy.findIndex((item) => item.id === exercise.id);
                      if (from < 0 || to < 0) return day;
                      const [moved] = copy.splice(from, 1);
                      copy.splice(to, 0, moved);
                      return { ...day, exercises: copy };
                    })
                  );
                  setDraggingExerciseId(null);
                }}
                onDelete={() => deleteExercise(exercise.id)}
                onSetWeightChange={(rowIndex, val) => handleWeightChange(exercise.id, rowIndex, val)}
                onSetRepsChange={(rowIndex, val) => handleRepsChange(exercise.id, rowIndex, val)}
                onSetComplete={(rowIndex) => handleSetComplete(exercise.id, rowIndex)}
                onAddSet={() => addRowForExercise(exercise.id)}
              />
            );
          })}
        </div>

        {/* ── Add exercise button ── */}
        <button
          type="button"
          onClick={() => setShowExercisePicker((v) => !v)}
          style={{
            marginTop: '14px',
            width: '100%',
            backgroundColor: 'transparent',
            border: `2px dashed ${SURFACE_HIGH}`,
            borderRadius: '18px',
            padding: '16px',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '8px',
            color: OUTLINE,
            fontFamily: 'Manrope, sans-serif',
            fontWeight: 700,
            fontSize: '0.72rem',
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
            cursor: 'pointer',
            transition: 'all 0.15s',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.borderColor = PRIMARY + '88';
            (e.currentTarget as HTMLButtonElement).style.color = PRIMARY;
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.borderColor = SURFACE_HIGH;
            (e.currentTarget as HTMLButtonElement).style.color = OUTLINE;
          }}
        >
          <Plus size={16} />
          Add Exercise
        </button>

        {/* ── Exercise picker ── */}
        {showExercisePicker && (
          <div
            style={{
              marginTop: '10px',
              backgroundColor: SURFACE_CONTAINER,
              border: `1px solid ${SURFACE_HIGH}`,
              borderRadius: '16px',
              padding: '14px',
            }}
          >
            {/* Search */}
            <div style={{ position: 'relative', marginBottom: '10px' }}>
              <Search
                size={14}
                color={OUTLINE}
                style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }}
              />
              <input
                value={exerciseQuery}
                onChange={(e) => setExerciseQuery(e.target.value)}
                placeholder="Search exercises..."
                style={{
                  width: '100%',
                  backgroundColor: SURFACE,
                  border: `1px solid ${SURFACE_HIGH}`,
                  borderRadius: '10px',
                  padding: '10px 12px 10px 34px',
                  color: ON_SURFACE,
                  fontFamily: 'Manrope, sans-serif',
                  fontSize: '0.8rem',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            {/* Muscle filter */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              style={{
                width: '100%',
                backgroundColor: SURFACE,
                border: `1px solid ${SURFACE_HIGH}`,
                borderRadius: '10px',
                padding: '8px 12px',
                color: ON_SURFACE,
                fontFamily: 'Manrope, sans-serif',
                fontSize: '0.78rem',
                outline: 'none',
                marginBottom: '10px',
                cursor: 'pointer',
              }}
            >
              <option value="ALL">All muscle groups</option>
              {[...new Set(exercises.map((item) => item.primaryMuscle).filter(Boolean))].map(
                (muscle) => (
                  <option key={muscle} value={muscle ?? ''}>
                    {muscle}
                  </option>
                )
              )}
            </select>

            {/* Exercise list */}
            <div
              style={{
                maxHeight: '220px',
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
              }}
            >
              {exercises
                .filter(
                  (item) =>
                    (categoryFilter === 'ALL' || item.primaryMuscle === categoryFilter) &&
                    item.name.toLowerCase().includes(exerciseQuery.toLowerCase())
                )
                .slice(0, 40)
                .map((exercise) => {
                  const accent = muscleColor(exercise.primaryMuscle);
                  return (
                    <button
                      key={exercise.id}
                      type="button"
                      onClick={() => {
                        addExercise(exercise);
                        setShowExercisePicker(false);
                        setExerciseQuery('');
                      }}
                      style={{
                        backgroundColor: SURFACE,
                        border: `1px solid ${SURFACE_HIGH}`,
                        borderRadius: '10px',
                        padding: '10px 12px',
                        textAlign: 'left',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        transition: 'border-color 0.12s',
                      }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLButtonElement).style.borderColor = accent + '66';
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLButtonElement).style.borderColor = SURFACE_HIGH;
                      }}
                    >
                      <div
                        style={{
                          width: '4px',
                          height: '28px',
                          borderRadius: '4px',
                          backgroundColor: accent,
                          flexShrink: 0,
                        }}
                      />
                      <div>
                        <p style={{ margin: 0, color: ON_SURFACE, fontFamily: 'Manrope, sans-serif', fontSize: '0.82rem', fontWeight: 600 }}>
                          {exercise.name}
                        </p>
                        <p style={{ margin: 0, color: OUTLINE, fontFamily: 'Manrope, sans-serif', fontSize: '0.68rem' }}>
                          {exercise.primaryMuscle ?? 'General'}
                        </p>
                      </div>
                    </button>
                  );
                })}
            </div>
          </div>
        )}

        {/* ── Footer stats ── */}
        <div style={{ marginTop: '28px', padding: '0 4px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <div>
              <p
                style={{
                  margin: 0,
                  fontSize: '0.58rem',
                  fontWeight: 700,
                  color: OUTLINE,
                  letterSpacing: '0.16em',
                  textTransform: 'uppercase',
                  marginBottom: '3px',
                }}
              >
                Workout Volume
              </p>
              <p
                style={{
                  margin: 0,
                  fontFamily: "'Space Grotesk', sans-serif",
                  fontSize: '1.6rem',
                  fontWeight: 900,
                  color: ON_SURFACE,
                  lineHeight: 1,
                }}
              >
                {totalVolume.toLocaleString()}{' '}
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: OUTLINE }}>KG</span>
              </p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p
                style={{
                  margin: 0,
                  fontSize: '0.58rem',
                  fontWeight: 700,
                  color: OUTLINE,
                  letterSpacing: '0.16em',
                  textTransform: 'uppercase',
                  marginBottom: '3px',
                }}
              >
                Duration
              </p>
              <p
                style={{
                  margin: 0,
                  fontFamily: "'Space Grotesk', sans-serif",
                  fontSize: '1.6rem',
                  fontWeight: 900,
                  color: PRIMARY,
                  lineHeight: 1,
                }}
              >
                {timerStr}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Sticky Finish button ── */}
      <div
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          padding: '16px',
          paddingBottom: 'calc(16px + env(safe-area-inset-bottom))',
          background: `linear-gradient(to top, ${SURFACE} 70%, transparent)`,
          display: 'flex',
          justifyContent: 'center',
        }}
      >
        <button
          type="button"
          onClick={completeSession}
          disabled={completing}
          style={{
            width: '100%',
            maxWidth: '520px',
            padding: '18px',
            borderRadius: '18px',
            border: 'none',
            background: completing
              ? SURFACE_HIGH
              : `linear-gradient(135deg, ${PRIMARY} 0%, ${TERTIARY} 100%)`,
            color: completing ? OUTLINE : SURFACE,
            fontFamily: 'Manrope, sans-serif',
            fontWeight: 900,
            fontSize: '0.82rem',
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            cursor: completing ? 'not-allowed' : 'pointer',
            boxShadow: completing
              ? 'none'
              : `0 10px 40px -10px ${PRIMARY_GLOW}`,
            transition: 'all 0.2s',
          }}
        >
          {completing ? 'Submitting…' : 'Finish Workout'}
        </button>
      </div>
    </div>
  );
}
