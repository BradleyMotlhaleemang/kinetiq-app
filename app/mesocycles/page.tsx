'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import AppHeader from '@/components/AppHeader';
import ActiveMesocycleCard, { type ActiveMesocycleSummary } from '@/components/ActiveMesocycleCard';
import { MesocycleExplainerAccordion } from '@/components/MesocycleExplainer';
import ProgramSummaryCard from '@/components/ProgramSummaryCard';
import ProgramTemplateBrowser, { CreateNewProgramButton } from '@/components/ProgramTemplateBrowser';
import { mesocyclesApi } from '@/lib/api/mesocycles';
import { type TemplateListItem } from '@/lib/api/templates';
import { ApiError } from '@/lib/api/client';
import { loadRecommendedPrograms } from '@/lib/programs/loadRecommendations';
import { WORKOUT_TOKENS as T } from '@/lib/design/workoutTokens';
import { FONTS, TYPE } from '@/lib/design/typography';

const C = {
  surface: '#111318',
  surfaceContainer: '#1e2026',
  outline: '#8e909c',
  outlineVariant: '#3a3c44',
  onSurface: '#e2e2e8',
  onSurfaceVariant: '#c5c6d2',
  primary: '#b1c5ff',
  secondary: '#d4bbff',
  tertiary: '#59d8de',
};

const ACCENT: Record<'primary' | 'secondary' | 'tertiary', string> = {
  primary: C.primary,
  secondary: C.secondary,
  tertiary: C.tertiary,
};

type MesocycleSummary = ActiveMesocycleSummary & {
  status?: string;
  startDate?: string;
  totalWeeks?: number;
};

export default function MesocyclesPage() {
  const router = useRouter();
  const pathname = usePathname();
  const [mesocycles, setMesocycles] = useState<MesocycleSummary[]>([]);
  const [activeBlock, setActiveBlock] = useState<ActiveMesocycleSummary | null>(null);
  const [recommended, setRecommended] = useState<TemplateListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAllPast, setShowAllPast] = useState(false);

  useEffect(() => {
    void loadMesocycles();
  }, [pathname]);

  async function loadMesocycles() {
    try {
      const [allRes, activeRes] = await Promise.allSettled([
        mesocyclesApi.all(),
        mesocyclesApi.active(),
      ]);

      let data: MesocycleSummary[] = [];
      if (allRes.status === 'fulfilled') {
        data = Array.isArray(allRes.value.data) ? (allRes.value.data as MesocycleSummary[]) : [];
        setMesocycles(data);
      }

      if (activeRes.status === 'fulfilled' && activeRes.value.data) {
        setActiveBlock(activeRes.value.data as ActiveMesocycleSummary);
      } else {
        const fallback = data.find(
          (m) => m.status === 'ACTIVE' || m.status === 'DELOAD_TRIGGERED' || m.status === 'DELOAD_ACTIVE',
        );
        setActiveBlock(fallback ?? null);
      }

      if (data.length === 0) {
        const programs = await loadRecommendedPrograms();
        setRecommended(programs);
      }
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setMesocycles([]);
        setActiveBlock(null);
        return;
      }
      console.error('Failed to load mesocycles:', err);
      setMesocycles([]);
      setActiveBlock(null);
    } finally {
      setLoading(false);
    }
  }

  const mesocyclesArray = Array.isArray(mesocycles) ? mesocycles : [];
  const past = mesocyclesArray.filter((m) => m.status === 'COMPLETED');
  const visiblePast = showAllPast ? past : past.slice(0, 3);
  const hasMesocycles = mesocyclesArray.length > 0;

  return (
    <div style={{ minHeight: '100dvh', backgroundColor: C.surface, paddingBottom: 128 }}>
      <AppHeader title="Program" />

      <div style={{ maxWidth: 600, margin: '0 auto', padding: '0 16px' }}>
        {loading ? (
          <p style={{ ...TYPE.bodyMd, fontSize: 13, color: C.outline, paddingTop: 8 }}>
            Loading...
          </p>
        ) : !hasMesocycles ? (
          <>
            <p
              style={{
                margin: '0 0 6px',
                ...TYPE.labelCaps,
                color: C.outline,
                letterSpacing: '0.24em',
              }}
            >
              Programs
            </p>
            <h1
              style={{
                fontFamily: FONTS.display,
                fontWeight: 900,
                fontSize: 'clamp(1.85rem,6vw,2.4rem)',
                letterSpacing: '-0.045em',
                color: C.onSurface,
                margin: '0 0 10px',
              }}
            >
              Choose your training program
            </h1>
            <p style={{ ...TYPE.bodyMd, fontSize: 13, color: C.onSurfaceVariant, margin: '0 0 24px' }}>
              Pick a proven split to generate your first training block in under two minutes.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
              {recommended.map((t) => (
                <ProgramSummaryCard
                  key={t.id}
                  name={t.name}
                  eyebrow={t.primaryFocus}
                  experienceLevel={t.level}
                  daysPerWeek={t.daysPerWeek}
                  durationWeeks={t.durationWeeks?.split('–')[0] ?? t.durationWeeks}
                  accentColor={T.tertiary}
                  titleSize="lg"
                  onClick={() => router.push(`/mesocycles/new?templateId=${t.id}`)}
                />
              ))}
            </div>
            <CreateNewProgramButton onClick={() => router.push('/templates/new')} />
            <ProgramTemplateBrowser hideCreateCta />
          </>
        ) : (
          <>
            {activeBlock && (
              <ActiveMesocycleCard mesocycle={activeBlock} onUpdated={() => void loadMesocycles()} />
            )}

            <CreateNewProgramButton onClick={() => router.push('/templates/new')} />

            <ProgramTemplateBrowser hideCreateCta />

            {past.length > 0 && (
              <section style={{ marginTop: 24, marginBottom: 8 }}>
                <p
                  style={{
                    margin: '0 0 12px',
                    ...TYPE.labelCaps,
                    color: C.outline,
                  }}
                >
                  Past Programs
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {visiblePast.map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => router.push(`/mesocycles/${m.id}`)}
                      style={{
                        width: '100%',
                        textAlign: 'left',
                        cursor: 'pointer',
                        background: C.surfaceContainer,
                        border: `1px solid ${C.outlineVariant}`,
                        borderLeft: `3px solid ${ACCENT[accentKeyFromStatus(m.status)]}`,
                        borderRadius: 12,
                        padding: '14px 16px',
                      }}
                    >
                      <p
                        style={{
                          margin: '0 0 4px',
                          ...TYPE.labelCaps,
                          letterSpacing: '0.2em',
                          color: C.outline,
                        }}
                      >
                        Completed
                      </p>
                      <p
                        style={{
                          margin: 0,
                          ...TYPE.headlineSm,
                          color: C.onSurface,
                        }}
                      >
                        {m.name ?? 'Untitled Block'}
                      </p>
                      <p style={{ margin: '4px 0 0', fontSize: 12, color: C.outline }}>
                        {m.totalWeeks ?? 0} weeks · {formatReadableDate(m.startDate)}
                      </p>
                    </button>
                  ))}
                </div>
                {past.length > 3 && !showAllPast && (
                  <button
                    type="button"
                    onClick={() => setShowAllPast(true)}
                    style={{
                      marginTop: 12,
                      background: 'none',
                      border: 'none',
                      padding: 0,
                      cursor: 'pointer',
                      ...TYPE.labelMeta,
                      fontWeight: 700,
                      color: C.primary,
                    }}
                  >
                    Show more
                  </button>
                )}
              </section>
            )}
          </>
        )}

        {!loading && <MesocycleExplainerAccordion />}
      </div>
    </div>
  );
}

function accentKeyFromStatus(status: string | undefined): 'primary' | 'secondary' | 'tertiary' {
  if (status === 'ACTIVE') return 'primary';
  if (status === 'COMPLETED') return 'secondary';
  return 'tertiary';
}

function formatReadableDate(value: string | undefined): string {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}
