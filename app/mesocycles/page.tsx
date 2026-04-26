'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import AppHeader from '@/components/AppHeader';
import { mesocyclesApi } from '@/lib/api/mesocycles';
import { Plus, ChevronRight, CheckCircle, Clock, Zap } from 'lucide-react';
import { MUSCLE_FOCUS_COLOR, TEMPLATE_CATALOG, SPLIT_LABELS } from '@/lib/templates/catalog';

const C = {
  surface: '#111318',
  surfaceLow: '#161820',
  surfaceContainer: '#1e2026',
  surfaceHigh: '#282a30',
  outline: '#8e909c',
  outlineVariant: '#3a3c44',
  onSurface: '#e2e2e8',
  onSurfaceVariant: '#c5c6d2',
  primary: '#b1c5ff',
  secondary: '#d4bbff',
  tertiary: '#59d8de',
};

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  ACTIVE: { label: 'Active', color: '#59d8de', icon: Zap },
  COMPLETED: { label: 'Completed', color: '#444650', icon: CheckCircle },
  DELOAD_TRIGGERED: { label: 'Deload', color: '#a2e7ff', icon: Clock },
  DELOAD_ACTIVE: { label: 'Deloading', color: '#a2e7ff', icon: Clock },
};

const SPLIT_TYPE_LABELS: Record<string, string> = {
  PPL: 'Push Pull Legs',
  UPPER_LOWER: 'Upper / Lower',
  FULL_BODY: 'Full Body',
  POWERLIFTING: 'Powerlifting',
  POWERBUILDING: 'Powerbuilding',
  GLUTE_FOCUS: 'Glute Focus',
  QUAD_FOCUS: 'Quadzilla',
  CHEST_FOCUS: 'Chest Focus',
  SHOULDER_FOCUS: 'Shoulder Focus',
};

export default function MesocyclesPage() {
  const router = useRouter();
  const pathname = usePathname();
  const [mesocycles, setMesocycles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMesocycles();
  }, [pathname]);

  async function loadMesocycles() {
    try {
      console.log('Loading mesocycles...');
      const res = await mesocyclesApi.all();
      // Ensure we always set an array
      const data = Array.isArray(res.data) ? res.data : [];
      console.log('Loaded mesocycles:', data);
      setMesocycles(data);
    } catch (err) {
      console.error('Failed to load mesocycles:', err);
      // Set empty array to prevent crashes - this will show the empty state
      setMesocycles([]);
    } finally {
      setLoading(false);
    }
  }

  // Ensure mesocycles is always an array for filtering
  const mesocyclesArray = Array.isArray(mesocycles) ? mesocycles : [];
  const active = mesocyclesArray.filter((m) => m.status === 'ACTIVE' || m.status === 'DELOAD_TRIGGERED' || m.status === 'DELOAD_ACTIVE');
  const past = mesocyclesArray.filter((m) => m.status === 'COMPLETED');

  return (
    <div style={{ minHeight: '100dvh', backgroundColor: C.surface, paddingBottom: '96px' }}>
      <AppHeader title="Mesocycles" />

      <div style={{ maxWidth: '480px', margin: '0 auto', padding: '0 20px' }}>

        {/* Create CTA */}
        <button
          onClick={() => router.push('/mesocycles/new')}
          className="btn-primary"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            width: '100%',
            padding: '16px',
            borderRadius: '12px',
            marginBottom: '32px',
          }}
        >
          <Plus size={16} color="#05080f" />
          <span style={{
            fontFamily: 'Manrope, sans-serif',
            fontSize: '0.75rem',
            fontWeight: 700,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: '#05080f',
          }}>
            Create new block
          </span>
        </button>

        {loading ? (
          <p style={{ fontFamily: 'Manrope', fontSize: '0.875rem', color: C.outline }}>
            Loading...
          </p>
        ) : mesocycles.length === 0 ? (
          <EmptyState onCreate={() => router.push('/mesocycles/new')} />
        ) : (
          <>
            {active.length > 0 && (
              <section style={{ marginBottom: '32px' }}>
                <p className="label-sm" style={{ color: C.outline, marginBottom: '12px' }}>
                  Current
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {active.map((m) => (
                    <MesocycleCard
                      key={m.id}
                      mesocycle={m}
                      onClick={() => router.push(`/mesocycles/${m.id}`)}
                    />
                  ))}
                </div>
              </section>
            )}

            {past.length > 0 && (
              <section>
                <p className="label-sm" style={{ color: C.outline, marginBottom: '12px' }}>
                  Past blocks
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {past.map((m) => (
                    <MesocycleCard
                      key={m.id}
                      mesocycle={m}
                      onClick={() => router.push(`/mesocycles/${m.id}`)}
                    />
                  ))}
                </div>
              </section>
            )}

            <section style={{ marginTop: '32px' }}>
              <p className="label-sm" style={{ color: C.outline, marginBottom: '12px' }}>
                Templates
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {TEMPLATE_CATALOG.map((template) => (
                  <div key={template.id} style={{ position: 'relative', backgroundColor: C.surfaceContainer, border: `1px solid ${C.outlineVariant}`, borderRadius: '12px', padding: '12px 12px 12px 16px' }}>
                    <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '5px', borderRadius: '12px 0 0 12px', backgroundColor: MUSCLE_FOCUS_COLOR[template.muscleFocus] ?? C.tertiary, boxShadow: `0 0 10px ${MUSCLE_FOCUS_COLOR[template.muscleFocus] ?? C.tertiary}` }} />
                    <p style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '0.92rem', fontWeight: 600, color: C.onSurface }}>
                      {template.programName}
                    </p>
                    <p style={{ fontFamily: 'Manrope', fontSize: '0.72rem', color: C.onSurfaceVariant, marginTop: '2px' }}>
                      {SPLIT_LABELS[template.splitType]} • {template.weeklyStructure.length} days/week • {template.durationWeeks} weeks
                    </p>
                  </div>
                ))}
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  );
}

function MesocycleCard({ mesocycle, onClick }: { mesocycle: any; onClick: () => void }) {
  const status = STATUS_CONFIG[mesocycle.status] ?? STATUS_CONFIG.ACTIVE;
  const StatusIcon = status.icon;
  const sideStripColor =
    mesocycle.status === 'ACTIVE'
      ? C.tertiary
      : mesocycle.status === 'COMPLETED'
        ? C.secondary
        : C.primary;

  const progressPct = mesocycle.totalWeeks > 0
    ? Math.round((mesocycle.currentWeek / mesocycle.totalWeeks) * 100)
    : 0;

  const createdDate = new Date(mesocycle.createdAt).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });

  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        padding: '16px 16px 16px 18px',
        backgroundColor: C.surfaceContainer,
        borderRadius: '14px',
        border: `1px solid ${C.outlineVariant}`,
        cursor: 'pointer',
        width: '100%',
        textAlign: 'left',
        borderLeft: `5px solid ${sideStripColor}`,
        boxShadow: `0 0 18px -12px ${sideStripColor}`,
      }}
    >
      {/* Top row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div style={{ flex: 1 }}>
          <p style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: '1rem', fontWeight: 600,
            letterSpacing: '-0.02em', color: C.onSurface,
            margin: '0 0 4px',
          }}>
            {mesocycle.name}
          </p>
          <p style={{
            fontFamily: 'Manrope', fontSize: '0.75rem', color: C.outline,
          }}>
            {createdDate}
          </p>
        </div>
        <ChevronRight size={16} color={C.outline} style={{ flexShrink: 0, marginTop: '2px' }} />
      </div>

      {/* Meta row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: '4px',
          padding: '4px 10px', borderRadius: '9999px',
          backgroundColor: `${status.color}22`,
        }}>
          <StatusIcon size={10} color={status.color} />
          <span style={{
            fontFamily: 'Manrope', fontSize: '0.625rem',
            fontWeight: 700, letterSpacing: '0.08em',
            textTransform: 'uppercase', color: status.color,
          }}>
            {mesocycle.statusLabel ?? status.label}
          </span>
        </div>

        <span style={{
          fontFamily: 'Manrope', fontSize: '0.75rem', color: C.onSurfaceVariant,
        }}>
          Week {mesocycle.currentWeek} of {mesocycle.totalWeeks}
        </span>

        {mesocycle.templateId && (
          <span style={{
            fontFamily: 'Manrope', fontSize: '0.75rem', color: C.outline,
          }}>
            {SPLIT_TYPE_LABELS[mesocycle.templateId] ?? mesocycle.templateId}
          </span>
        )}
      </div>

      {/* Progress bar — only for active */}
      {mesocycle.status === 'ACTIVE' && (
        <div style={{ width: '100%' }}>
          <div style={{
            height: '2px',
            backgroundColor: C.surfaceHigh,
            borderRadius: '9999px',
            overflow: 'hidden',
          }}>
            <div style={{
              height: '100%',
              width: `${progressPct}%`,
              background: `linear-gradient(90deg, ${C.primary}, ${C.tertiary})`,
              borderRadius: '9999px',
              transition: 'width 0.3s ease',
            }} />
          </div>
          <p style={{
            fontFamily: 'Manrope', fontSize: '0.625rem',
            color: C.outline, marginTop: '4px',
            textAlign: 'right', letterSpacing: '0.05em',
          }}>
            {progressPct}% complete
          </p>
        </div>
      )}
    </button>
  );
}

function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '60px 20px', textAlign: 'center', gap: '16px',
    }}>
      <div style={{
        width: '56px', height: '56px',
        borderRadius: '14px',
        backgroundColor: 'rgba(177,197,255,0.08)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Zap size={24} color={C.outline} />
      </div>
      <div>
        <p style={{
          fontFamily: "'Space Grotesk', sans-serif",
          fontSize: '1.1rem', fontWeight: 600,
          letterSpacing: '-0.02em', color: C.onSurface, marginBottom: '8px',
        }}>
          No training blocks yet
        </p>
        <p style={{
          fontFamily: 'Manrope', fontSize: '0.875rem',
          color: C.onSurfaceVariant, lineHeight: 1.7, maxWidth: '260px',
        }}>
          Create your first mesocycle to start structured, adaptive training.
        </p>
      </div>
      <button onClick={onCreate} className="btn-primary" style={{ width: '200px', marginTop: '8px' }}>
        Get started
      </button>
    </div>
  );
}