'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import AppHeader from '@/components/AppHeader';
import { mesocyclesApi } from '@/lib/api/mesocycles';
import { Plus, ChevronRight, CheckCircle, Clock, Zap } from 'lucide-react';

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
    <div style={{ minHeight: '100dvh', backgroundColor: '#111318', paddingBottom: '96px' }}>
      <AppHeader title="Mesocycles" />

      <div style={{ maxWidth: '480px', margin: '0 auto', padding: '0 20px' }}>

        {/* Create CTA */}
        <button
          onClick={() => router.push('/mesocycles/new')}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            width: '100%',
            padding: '16px',
            background: 'linear-gradient(45deg, #b1c5ff, #002560)',
            border: 'none',
            borderTopRightRadius: '0.75rem',
            borderBottomLeftRadius: '0px',
            borderTopLeftRadius: '0.125rem',
            borderBottomRightRadius: '0.125rem',
            cursor: 'pointer',
            marginBottom: '32px',
          }}
        >
          <Plus size={16} color="#002c70" />
          <span style={{
            fontFamily: 'Manrope, sans-serif',
            fontSize: '0.75rem',
            fontWeight: 700,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: '#002c70',
          }}>
            Create new block
          </span>
        </button>

        {loading ? (
          <p style={{ fontFamily: 'Manrope', fontSize: '0.875rem', color: '#444650' }}>
            Loading...
          </p>
        ) : mesocycles.length === 0 ? (
          <EmptyState onCreate={() => router.push('/mesocycles/new')} />
        ) : (
          <>
            {active.length > 0 && (
              <section style={{ marginBottom: '32px' }}>
                <p className="label-sm" style={{ color: '#444650', marginBottom: '12px' }}>
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
                <p className="label-sm" style={{ color: '#444650', marginBottom: '12px' }}>
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
          </>
        )}
      </div>
    </div>
  );
}

function MesocycleCard({ mesocycle, onClick }: { mesocycle: any; onClick: () => void }) {
  const status = STATUS_CONFIG[mesocycle.status] ?? STATUS_CONFIG.ACTIVE;
  const StatusIcon = status.icon;

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
        padding: '16px 20px',
        backgroundColor: '#1a1c20',
        borderTopRightRadius: '0.75rem',
        borderBottomLeftRadius: '0px',
        borderTopLeftRadius: '0.125rem',
        borderBottomRightRadius: '0.125rem',
        border: 'none',
        cursor: 'pointer',
        width: '100%',
        textAlign: 'left',
        borderLeft: mesocycle.status === 'ACTIVE' ? '2px solid #59d8de' : '2px solid transparent',
      }}
    >
      {/* Top row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div style={{ flex: 1 }}>
          <p style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: '1rem', fontWeight: 600,
            letterSpacing: '-0.02em', color: '#e2e2e8',
            margin: '0 0 4px',
          }}>
            {mesocycle.name}
          </p>
          <p style={{
            fontFamily: 'Manrope', fontSize: '0.75rem', color: '#444650',
          }}>
            {createdDate}
          </p>
        </div>
        <ChevronRight size={16} color="#444650" style={{ flexShrink: 0, marginTop: '2px' }} />
      </div>

      {/* Meta row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: '4px',
          padding: '4px 10px', borderRadius: '9999px',
          backgroundColor: 'rgba(68,70,80,0.2)',
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
          fontFamily: 'Manrope', fontSize: '0.75rem', color: '#8e909c',
        }}>
          Week {mesocycle.currentWeek} of {mesocycle.totalWeeks}
        </span>

        {mesocycle.templateId && (
          <span style={{
            fontFamily: 'Manrope', fontSize: '0.75rem', color: '#444650',
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
            backgroundColor: '#282a2e',
            borderRadius: '9999px',
            overflow: 'hidden',
          }}>
            <div style={{
              height: '100%',
              width: `${progressPct}%`,
              background: 'linear-gradient(90deg, #b1c5ff, #59d8de)',
              borderRadius: '9999px',
              transition: 'width 0.3s ease',
            }} />
          </div>
          <p style={{
            fontFamily: 'Manrope', fontSize: '0.625rem',
            color: '#444650', marginTop: '4px',
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
        <Zap size={24} color="#444650" />
      </div>
      <div>
        <p style={{
          fontFamily: "'Space Grotesk', sans-serif",
          fontSize: '1.1rem', fontWeight: 600,
          letterSpacing: '-0.02em', color: '#e2e2e8', marginBottom: '8px',
        }}>
          No training blocks yet
        </p>
        <p style={{
          fontFamily: 'Manrope', fontSize: '0.875rem',
          color: '#8e909c', lineHeight: 1.7, maxWidth: '260px',
        }}>
          Create your first mesocycle to start structured, adaptive training.
        </p>
      </div>
      <button onClick={onCreate} className="btn-primary" style={{ color: '#002c70', width: '200px', marginTop: '8px' }}>
        Get started
      </button>
    </div>
  );
}