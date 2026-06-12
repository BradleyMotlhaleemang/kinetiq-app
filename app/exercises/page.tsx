'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { exercisesApi, type Exercise } from '@/lib/api/exercises';
import { ApiError } from '@/lib/api/client';

const C = {
  primary: '#b1c5ff',
  secondary: '#d4bbff',
  tertiary: '#59d8de',
  surface: '#111318',
  surfaceLow: '#161820',
  surfaceContainer: '#1e2026',
  surfaceHigh: '#282a30',
  outline: '#8e909c',
  outlineVariant: '#3a3c44',
  onSurface: '#e2e2e8',
  onSurfaceVariant: '#c5c6d2',
  glass: 'rgba(22,24,32,0.80)',
};

const MUSCLE_OPTIONS = [
  'ALL',
  'CHEST',
  'BACK',
  'FRONT_DELT',
  'SIDE_DELT',
  'REAR_DELT',
  'BICEPS',
  'TRICEPS',
  'QUADS',
  'HAMSTRINGS',
  'GLUTES',
  'CALVES',
  'LATS',
] as const;

const PATTERN_OPTIONS = [
  'ALL',
  'PUSH',
  'PULL',
  'HINGE',
  'SQUAT',
  'CARRY',
  'ISOLATION',
  'CORE',
] as const;

// muscle → accent color map — same coordination as the workout execution page
const muscleColor = (muscle: string | null | undefined): string => {
  if (!muscle) return C.outline;
  if (muscle.includes('CHEST'))                      return '#ff6b6b'; // warm red
  if (muscle.includes('BACK'))                       return C.primary; // brand blue
  if (muscle.includes('DELT') || muscle.includes('SHOULDER')) return C.tertiary; // teal
  if (muscle.includes('QUAD'))                       return '#6cd68f'; // green
  if (muscle.includes('GLUTE'))                      return '#ff7ac8'; // pink
  if (muscle.includes('HAMSTRING'))                  return '#f5d76e'; // gold
  if (muscle.includes('BICEP'))                      return '#b1c5ff'; // primary
  if (muscle.includes('TRICEP'))                     return '#59d8de'; // tertiary
  return C.tertiary;
};

function SearchIcon({ size = 16, color = C.outline }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <circle cx="9" cy="9" r="5.5" stroke={color} strokeWidth="1.6" />
      <path d="M13.5 13.5L17 17" stroke={color} strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function ChevronRight({ color = C.outline }: { color?: string }) {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path
        d="M5 2.5L9.5 7L5 11.5"
        stroke={color}
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function ExercisesPage() {
  return (
    <Suspense fallback={<p style={{ padding: 24, color: '#8e909c' }}>Loading exercises…</p>}>
      <ExercisesPageContent />
    </Suspense>
  );
}

function ExercisesPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectMode = searchParams.get('select') === 'true';

  const [muscle, setMuscle] = useState<(typeof MUSCLE_OPTIONS)[number]>('ALL');
  const [pattern, setPattern] = useState<(typeof PATTERN_OPTIONS)[number]>('ALL');
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [items, setItems] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const timeout = setTimeout(
      () => setDebouncedSearch(searchInput.trim().toLowerCase()),
      300,
    );
    return () => clearTimeout(timeout);
  }, [searchInput]);

  const fetchExercises = async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await exercisesApi.getExercises({
        primaryMuscle: muscle === 'ALL' ? undefined : muscle,
        movementPattern: pattern === 'ALL' ? undefined : pattern,
      });
      setItems(Array.isArray(data) ? data : []);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) return;
      setError("Couldn't load exercises.");
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchExercises();
  }, [muscle, pattern]);

  const visibleItems = useMemo(() => {
    if (!debouncedSearch) return items;
    return items.filter((exercise) =>
      exercise.name.toLowerCase().includes(debouncedSearch),
    );
  }, [items, debouncedSearch]);

  const hasActiveFilters =
    muscle !== 'ALL' || pattern !== 'ALL' || searchInput.trim().length > 0;
  const noResultsAfterFilters =
    !loading && !error && visibleItems.length === 0 && hasActiveFilters;
  const noResultsFromApi =
    !loading && !error && visibleItems.length === 0 && !hasActiveFilters;

  function clearFilters() {
    setMuscle('ALL');
    setPattern('ALL');
    setSearchInput('');
  }

  function handleSelectExercise(exerciseId: string) {
    sessionStorage.setItem('kinetiq_selected_exercise', exerciseId);
    const returnTo = searchParams.get('returnTo');
    if (returnTo) {
      router.push(returnTo);
      return;
    }
    router.back();
  }

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
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 40,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 20px',
          height: 58,
          background: C.glass,
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          borderBottom: `1px solid ${C.outlineVariant}`,
        }}
      >
        <p
          style={{
            margin: 0,
            fontFamily: 'Space Grotesk, sans-serif',
            fontWeight: 900,
            fontSize: '1.05rem',
            letterSpacing: '-0.03em',
            color: C.onSurface,
          }}
        >
          {selectMode ? 'Select Exercise' : 'Exercises'}
        </p>
        <button style={{ background: 'none', border: 'none', padding: 6 }}>
          <SearchIcon size={18} color={C.outline} />
        </button>
      </header>

      <div style={{ maxWidth: 600, margin: '0 auto', padding: '26px 16px 0' }}>
        <p
          style={{
            margin: '0 0 6px',
            color: C.outline,
            fontSize: '0.57rem',
            letterSpacing: '0.24em',
            textTransform: 'uppercase',
            fontWeight: 700,
          }}
        >
          Library
        </p>
        <h1
          style={{
            margin: '0 0 14px',
            fontFamily: 'Space Grotesk, sans-serif',
            fontWeight: 900,
            fontSize: 'clamp(1.85rem,6vw,2.4rem)',
            letterSpacing: '-0.045em',
            lineHeight: 1.05,
            color: C.onSurface,
          }}
        >
          {selectMode ? 'Select Exercise' : 'Exercises'}
        </h1>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 10,
            marginBottom: 12,
          }}
        >
          <select
            value={muscle}
            onChange={(event) =>
              setMuscle(event.target.value as (typeof MUSCLE_OPTIONS)[number])
            }
            style={{
              width: '100%',
              background: C.surfaceLow,
              border: `1px solid ${C.outlineVariant}`,
              borderRadius: 12,
              padding: '12px 12px',
              color: C.onSurface,
              fontFamily: 'Manrope, sans-serif',
              fontSize: 13,
              outline: 'none',
              cursor: 'pointer',
            }}
          >
            {MUSCLE_OPTIONS.map((value) => (
              <option key={value} value={value}>
                {value === 'ALL' ? 'Muscle: ALL' : value}
              </option>
            ))}
          </select>

          <select
            value={pattern}
            onChange={(event) =>
              setPattern(event.target.value as (typeof PATTERN_OPTIONS)[number])
            }
            style={{
              width: '100%',
              background: C.surfaceLow,
              border: `1px solid ${C.outlineVariant}`,
              borderRadius: 12,
              padding: '12px 12px',
              color: C.onSurface,
              fontFamily: 'Manrope, sans-serif',
              fontSize: 13,
              outline: 'none',
              cursor: 'pointer',
            }}
          >
            {PATTERN_OPTIONS.map((value) => (
              <option key={value} value={value}>
                {value === 'ALL' ? 'Pattern: ALL' : value}
              </option>
            ))}
          </select>
        </div>

        <div style={{ position: 'relative', marginBottom: 14 }}>
          <span
            style={{
              position: 'absolute',
              left: 14,
              top: '50%',
              transform: 'translateY(-50%)',
            }}
          >
            <SearchIcon size={16} color={C.outline} />
          </span>
          <input
            placeholder="Search exercises..."
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            style={{
              width: '100%',
              boxSizing: 'border-box',
              background: C.surfaceLow,
              border: `1px solid ${C.outlineVariant}`,
              borderRadius: 12,
              padding: '12px 14px 12px 40px',
              color: C.onSurface,
              fontFamily: 'Manrope, sans-serif',
              fontSize: 14,
              outline: 'none',
            }}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {loading && (
            <>
              {[1, 2, 3].map((row) => (
                <div
                  key={row}
                  style={{
                    background: C.surfaceContainer,
                    border: `1px solid ${C.outlineVariant}`,
                    borderLeft: `3px solid ${C.primary}`,
                    borderRadius: 16,
                    padding: '14px 14px',
                  }}
                >
                  <div
                    style={{
                      height: 14,
                      width: '56%',
                      borderRadius: 8,
                      background: C.surfaceHigh,
                      marginBottom: 10,
                    }}
                  />
                  <div
                    style={{
                      height: 11,
                      width: '38%',
                      borderRadius: 8,
                      background: C.surfaceHigh,
                      opacity: 0.85,
                      marginBottom: 8,
                    }}
                  />
                  <div
                    style={{
                      height: 11,
                      width: '28%',
                      borderRadius: 8,
                      background: C.surfaceHigh,
                      opacity: 0.75,
                    }}
                  />
                </div>
              ))}
            </>
          )}

          {!loading && error && (
            <div
              style={{
                background: C.surfaceContainer,
                border: `1px solid ${C.outlineVariant}`,
                borderLeft: `3px solid ${C.secondary}`,
                borderRadius: 16,
                padding: '16px',
              }}
            >
              <p style={{ margin: '0 0 10px', color: C.onSurface, fontSize: 13 }}>
                {error}
              </p>
              <button
                onClick={() => void fetchExercises()}
                style={{
                  padding: '10px 14px',
                  borderRadius: 12,
                  border: 'none',
                  background: `linear-gradient(135deg, ${C.primary} 0%, #3a5cbf 100%)`,
                  color: '#05080f',
                  fontFamily: 'Space Grotesk, sans-serif',
                  fontWeight: 900,
                  fontSize: 13,
                  cursor: 'pointer',
                }}
              >
                Retry →
              </button>
            </div>
          )}

          {!loading &&
            !error &&
            visibleItems.map((exercise) => {
              const accent = muscleColor(exercise.primaryMuscle);
              return (
              <button
                key={exercise.id}
                onClick={() => {
                  if (selectMode) {
                    handleSelectExercise(exercise.id);
                    return;
                  }
                  router.push(`/exercises/${exercise.id}`);
                }}
                style={{
                  background: C.surfaceContainer,
                  border: `1px solid ${C.outlineVariant}`,
                  borderLeft: `3px solid ${accent}`,
                  borderRadius: 16,
                  padding: '14px 14px',
                  cursor: 'pointer',
                  textAlign: 'left',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 10,
                }}
              >
                <div style={{ minWidth: 0 }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 7,
                      flexWrap: 'wrap',
                      marginBottom: 6,
                    }}
                  >
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        color: C.surface,
                        background: accent,
                        borderRadius: 6,
                        padding: '3px 8px',
                        letterSpacing: '0.06em',
                      }}
                    >
                      {exercise.primaryMuscle}
                    </span>
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        color: C.outline,
                        background: C.surfaceHigh,
                        borderRadius: 6,
                        padding: '3px 8px',
                        letterSpacing: '0.06em',
                      }}
                    >
                      {exercise.movementPattern}
                    </span>
                    {exercise.isCompound && (
                      <span
                        title="Compound"
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          background: C.tertiary,
                          boxShadow: `0 0 8px ${C.tertiary}`,
                        }}
                      />
                    )}
                  </div>
                  <p
                    style={{
                      margin: 0,
                      fontFamily: 'Space Grotesk, sans-serif',
                      fontSize: '1.05rem',
                      fontWeight: 800,
                      color: C.onSurface,
                      letterSpacing: '-0.015em',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {exercise.name}
                  </p>
                </div>

                {selectMode ? (
                  <span
                    style={{
                      flexShrink: 0,
                      padding: '10px 12px',
                      borderRadius: 10,
                      background: C.primary,
                      color: '#05080f',
                      fontFamily: 'Space Grotesk, sans-serif',
                      fontWeight: 900,
                      fontSize: 12,
                      letterSpacing: '0.02em',
                    }}
                  >
                    Add
                  </span>
                ) : (
                  <span
                    style={{
                      flexShrink: 0,
                      width: 28,
                      height: 28,
                      borderRadius: 8,
                      border: `1px solid ${C.outlineVariant}`,
                      background: C.surfaceLow,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <ChevronRight color={C.outline} />
                  </span>
                )}
              </button>
              );
            })}

          {noResultsAfterFilters && (
            <div
              style={{
                background: C.surfaceContainer,
                border: `1px solid ${C.outlineVariant}`,
                borderLeft: `3px solid ${C.secondary}`,
                borderRadius: 16,
                padding: '16px',
              }}
            >
              <p style={{ margin: '0 0 10px', color: C.onSurface, fontSize: 13 }}>
                No exercises match these filters.
              </p>
              <button
                onClick={clearFilters}
                style={{
                  padding: '10px 14px',
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
                Clear filters
              </button>
            </div>
          )}

          {noResultsFromApi && (
            <div
              style={{
                background: C.surfaceContainer,
                border: `1px solid ${C.outlineVariant}`,
                borderLeft: `3px solid ${C.outline}`,
                borderRadius: 16,
                padding: '16px',
              }}
            >
              <p style={{ margin: 0, color: C.onSurfaceVariant, fontSize: 13 }}>
                No exercises found.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}