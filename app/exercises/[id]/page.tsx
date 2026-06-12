'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { exercisesApi, type ExerciseDetail, type SfrScore } from '@/lib/api/exercises';
import { ApiError } from '@/lib/api/client';

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
  glass: 'rgba(22,24,32,0.80)',
};

function BackIcon({ color = C.onSurface }: { color?: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path
        d="M10.5 3.5L5.5 8L10.5 12.5"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function normalizeRequiredEquipment(value: unknown): string {
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) return value.filter((v) => typeof v === 'string').join(', ');
  return '—';
}

export default function ExerciseDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [exercise, setExercise] = useState<ExerciseDetail | null>(null);
  const [sfr, setSfr] = useState<SfrScore>(null);
  const [substitutions, setSubstitutions] = useState<ExerciseDetail['substitutionPools']>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);

    try {
      const [exerciseRes, sfrRes, subsRes] = await Promise.all([
        exercisesApi.getExercise(id),
        exercisesApi.getExerciseSfr(id),
        exercisesApi.getExerciseSubstitutions(id),
      ]);
      setExercise(exerciseRes);
      setSfr(
        sfrRes && typeof sfrRes.sfrScore === 'number' ? sfrRes : null,
      );
      setSubstitutions(Array.isArray(subsRes) ? subsRes : []);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) return;
      setError("Couldn't load exercise.");
      setExercise(null);
      setSfr(null);
      setSubstitutions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!id) return;
    void fetchData();
  }, [id]);

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
          gap: 10,
        }}
      >
        <button
          onClick={() => router.back()}
          style={{
            width: 34,
            height: 34,
            borderRadius: 10,
            border: `1px solid ${C.outlineVariant}`,
            background: C.surfaceLow,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            flexShrink: 0,
          }}
        >
          <BackIcon />
        </button>

        <p
          style={{
            margin: 0,
            flex: 1,
            fontFamily: 'Space Grotesk, sans-serif',
            fontWeight: 800,
            fontSize: '1rem',
            letterSpacing: '-0.02em',
            color: C.onSurface,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            textAlign: 'center',
          }}
        >
          {exercise?.name ?? 'Exercise'}
        </p>

        <div style={{ width: 34, height: 34, display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
          {exercise?.isCompound ? (
            <span
              style={{
                padding: '5px 8px',
                borderRadius: 999,
                fontSize: '0.58rem',
                fontWeight: 800,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: '#05080f',
                background: C.tertiary,
                whiteSpace: 'nowrap',
              }}
            >
              Compound
            </span>
          ) : null}
        </div>
      </header>

      <div style={{ maxWidth: 600, margin: '0 auto', padding: '26px 16px 0' }}>
        {loading && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[1, 2, 3, 4].map((section) => (
              <div
                key={section}
                style={{
                  background: C.surfaceContainer,
                  border: `1px solid ${C.outlineVariant}`,
                  borderLeft: `3px solid ${C.primary}`,
                  borderRadius: 16,
                  padding: 16,
                }}
              >
                <div style={{ height: 14, width: '40%', borderRadius: 8, background: C.surfaceHigh, marginBottom: 10 }} />
                <div style={{ height: 12, width: '75%', borderRadius: 8, background: C.surfaceHigh, opacity: 0.85, marginBottom: 8 }} />
                <div style={{ height: 12, width: '58%', borderRadius: 8, background: C.surfaceHigh, opacity: 0.72 }} />
              </div>
            ))}
          </div>
        )}

        {!loading && error && (
          <div
            style={{
              background: C.surfaceContainer,
              border: `1px solid ${C.outlineVariant}`,
              borderLeft: `3px solid ${C.primary}`,
              borderRadius: 16,
              padding: 16,
            }}
          >
            <p style={{ margin: '0 0 10px', color: C.onSurface, fontSize: 13 }}>{error}</p>
            <button
              onClick={() => void fetchData()}
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

        {!loading && !error && exercise && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <section
              style={{
                background: C.surfaceContainer,
                border: `1px solid ${C.outlineVariant}`,
                borderLeft: `3px solid ${C.primary}`,
                borderRadius: 16,
                padding: 16,
              }}
            >
              <p
                style={{
                  margin: '0 0 10px',
                  fontSize: '0.57rem',
                  letterSpacing: '0.22em',
                  textTransform: 'uppercase',
                  color: C.outline,
                  fontWeight: 700,
                }}
              >
                Muscles
              </p>

              <div style={{ marginBottom: 10 }}>
                <span
                  style={{
                    display: 'inline-block',
                    fontSize: 12,
                    fontWeight: 800,
                    color: '#05080f',
                    background: C.primary,
                    borderRadius: 8,
                    padding: '6px 10px',
                    letterSpacing: '0.05em',
                  }}
                >
                  {exercise.primaryMuscle}
                </span>
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {(exercise.secondaryMuscles ?? []).map((muscle) => (
                  <span
                    key={muscle}
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      color: C.onSurfaceVariant,
                      background: C.surfaceHigh,
                      borderRadius: 6,
                      padding: '4px 8px',
                      letterSpacing: '0.05em',
                    }}
                  >
                    {muscle}
                  </span>
                ))}
                {(!exercise.secondaryMuscles || exercise.secondaryMuscles.length === 0) && (
                  <span style={{ color: C.outline, fontSize: 12 }}>—</span>
                )}
              </div>
            </section>

            <section
              style={{
                background: C.surfaceContainer,
                border: `1px solid ${C.outlineVariant}`,
                borderLeft: `3px solid ${C.tertiary}`,
                borderRadius: 16,
                padding: 16,
              }}
            >
              <p
                style={{
                  margin: '0 0 10px',
                  fontSize: '0.57rem',
                  letterSpacing: '0.22em',
                  textTransform: 'uppercase',
                  color: C.outline,
                  fontWeight: 700,
                }}
              >
                Details
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <div style={{ background: C.surfaceLow, borderRadius: 10, padding: '10px 12px' }}>
                  <p style={{ margin: '0 0 3px', fontSize: '0.52rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: C.outline, fontWeight: 700 }}>
                    Equipment
                  </p>
                  <p style={{ margin: 0, fontSize: 12, color: C.onSurface, fontWeight: 700 }}>
                    {exercise.metadata?.equipmentProfile?.name ?? 'Bodyweight'}
                  </p>
                </div>

                <div style={{ background: C.surfaceLow, borderRadius: 10, padding: '10px 12px' }}>
                  <p style={{ margin: '0 0 3px', fontSize: '0.52rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: C.outline, fontWeight: 700 }}>
                    Execution Zone
                  </p>
                  <p style={{ margin: 0, fontSize: 12, color: C.onSurface, fontWeight: 700 }}>
                    {exercise.metadata?.executionProfile?.zone ?? '—'}
                  </p>
                </div>

                <div style={{ background: C.surfaceLow, borderRadius: 10, padding: '10px 12px' }}>
                  <p style={{ margin: '0 0 3px', fontSize: '0.52rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: C.outline, fontWeight: 700 }}>
                    Movement Pattern
                  </p>
                  <p style={{ margin: 0, fontSize: 12, color: C.onSurface, fontWeight: 700 }}>
                    {exercise.movementPattern}
                  </p>
                </div>

                <div style={{ background: C.surfaceLow, borderRadius: 10, padding: '10px 12px' }}>
                  <p style={{ margin: '0 0 3px', fontSize: '0.52rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: C.outline, fontWeight: 700 }}>
                    Category
                  </p>
                  <p style={{ margin: 0, fontSize: 12, color: C.onSurface, fontWeight: 700 }}>
                    {exercise.category}
                  </p>
                </div>
              </div>

              <div style={{ marginTop: 10, fontSize: 11, color: C.onSurfaceVariant }}>
                {exercise.metadata?.equipmentProfile?.requiredEquipment ? (
                  <span>
                    Required equipment: {normalizeRequiredEquipment(exercise.metadata.equipmentProfile.requiredEquipment)}
                  </span>
                ) : null}
              </div>
            </section>

            <section
              style={{
                background: C.surfaceContainer,
                border: `1px solid ${C.outlineVariant}`,
                borderLeft: `3px solid ${C.primary}`,
                borderRadius: 16,
                padding: 16,
              }}
            >
              <p
                style={{
                  margin: '0 0 10px',
                  fontSize: '0.57rem',
                  letterSpacing: '0.22em',
                  textTransform: 'uppercase',
                  color: C.outline,
                  fontWeight: 700,
                }}
              >
                SFR Score
              </p>

              {sfr && typeof sfr.sfrScore === 'number' ? (
                <div>
                  <p
                    style={{
                      margin: '0 0 2px',
                      fontFamily: 'Space Grotesk, sans-serif',
                      fontWeight: 900,
                      fontSize: '2rem',
                      letterSpacing: '-0.04em',
                      color: C.primary,
                    }}
                  >
                    {sfr.sfrScore.toFixed(2)}
                  </p>
                  <p style={{ margin: '0 0 4px', fontSize: 13, color: C.onSurface, fontWeight: 700 }}>
                    Stimulus-to-Fatigue Ratio
                  </p>
                  <p style={{ margin: 0, fontSize: 12, color: C.onSurfaceVariant }}>
                    Based on {sfr.sampleSize} sessions
                  </p>
                </div>
              ) : (
                <div
                  style={{
                    background: C.surfaceLow,
                    border: `1px solid ${C.outlineVariant}`,
                    borderRadius: 10,
                    padding: 12,
                  }}
                >
                  <p style={{ margin: 0, fontSize: 12, color: C.onSurfaceVariant }}>
                    SFR score builds after several logged sessions with this exercise.
                  </p>
                </div>
              )}
            </section>

            <section
              style={{
                background: C.surfaceContainer,
                border: `1px solid ${C.outlineVariant}`,
                borderLeft: `3px solid ${C.tertiary}`,
                borderRadius: 16,
                padding: 16,
              }}
            >
              <p
                style={{
                  margin: '0 0 10px',
                  fontSize: '0.57rem',
                  letterSpacing: '0.22em',
                  textTransform: 'uppercase',
                  color: C.outline,
                  fontWeight: 700,
                }}
              >
                Substitution Pool
              </p>

              {substitutions.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {substitutions.map((pool) => {
                    const isPrimary = pool.priority === 1;
                    return (
                      <div
                        key={pool.id}
                        style={{
                          background: C.surfaceLow,
                          borderRadius: 10,
                          border: `1px solid ${C.outlineVariant}`,
                          padding: '10px 12px',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                          <p style={{ margin: 0, fontSize: 13, color: C.onSurface, fontWeight: 700 }}>
                            {pool.exercise?.name ?? 'Unnamed exercise'}
                          </p>
                          <span
                            style={{
                              fontSize: 10,
                              fontWeight: 800,
                              letterSpacing: '0.08em',
                              textTransform: 'uppercase',
                              color: isPrimary ? '#05080f' : C.onSurfaceVariant,
                              background: isPrimary ? C.primary : C.surfaceHigh,
                              borderRadius: 6,
                              padding: '4px 7px',
                              flexShrink: 0,
                            }}
                          >
                            {isPrimary ? 'Primary' : 'Alternative'}
                          </span>
                        </div>

                        {Array.isArray(pool.suitableWhenPain) &&
                          pool.suitableWhenPain.length > 0 && (
                            <div
                              style={{
                                marginTop: 6,
                                display: 'flex',
                                flexWrap: 'wrap',
                                gap: 5,
                              }}
                            >
                              <span
                                style={{
                                  fontSize: 10,
                                  color: C.tertiary,
                                  background: `${C.tertiary}20`,
                                  border: `1px solid ${C.tertiary}55`,
                                  borderRadius: 6,
                                  padding: '3px 7px',
                                  fontWeight: 700,
                                }}
                              >
                                Safe: {pool.suitableWhenPain.join(', ')}
                              </span>
                            </div>
                          )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p style={{ margin: 0, fontSize: 12, color: C.onSurfaceVariant }}>
                  No substitutions configured for this exercise.
                </p>
              )}
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
