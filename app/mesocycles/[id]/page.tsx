'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import AppHeader from '@/components/AppHeader';
import { mesocyclesApi } from '@/lib/api/mesocycles';
import { ApiError } from '@/lib/api/client';
import { TrendingUp, BarChart2, CheckCircle } from 'lucide-react';

export default function MesocycleDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [mesocycle, setMesocycle] = useState<any>(null);
  const [volumeStatus, setVolumeStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [mRes, vRes] = await Promise.allSettled([
        mesocyclesApi.findOne(id),
        mesocyclesApi.volumeStatus(id),
      ]);
      if (mRes.status === 'fulfilled') setMesocycle(mRes.value.data);
      if (vRes.status === 'fulfilled') setVolumeStatus(vRes.value.data);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        return;
      }
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleClose() {
    if (!confirm('Mark this block as completed?')) return;
    try {
      console.log('Closing mesocycle:', id);
      const result = await mesocyclesApi.close(id);
      console.log('Mesocycle closed successfully:', result);
      router.push('/mesocycles');
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        return;
      }
      console.error('Failed to close mesocycle:', err);
      alert('Failed to close mesocycle');
    }
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100dvh', backgroundColor: '#111318' }}>
        <AppHeader showBack backHref="/mesocycles" />
        <p style={{ fontFamily: 'Manrope', fontSize: '0.875rem', color: '#444650', padding: '20px' }}>Loading...</p>
      </div>
    );
  }

  if (!mesocycle) {
    return (
      <div style={{ minHeight: '100dvh', backgroundColor: '#111318' }}>
        <AppHeader showBack backHref="/mesocycles" />
        <p style={{ fontFamily: 'Manrope', fontSize: '0.875rem', color: '#ffb4ab', padding: '20px' }}>Block not found.</p>
      </div>
    );
  }

  const progressPct = mesocycle.totalWeeks > 0
    ? Math.round((mesocycle.currentWeek / mesocycle.totalWeeks) * 100)
    : 0;

  const volumeTargets = volumeStatus?.volumeTargets ?? {};
  const muscles = Object.entries(volumeTargets) as [string, { mev: number; mrv: number; current: number }][];

  return (
    <div style={{ minHeight: '100dvh', backgroundColor: '#111318', paddingBottom: '96px' }}>
      <AppHeader title={mesocycle.name} showBack backHref="/mesocycles" />

      <div style={{ maxWidth: '480px', margin: '0 auto', padding: '0 20px' }}>

        {/* Status + progress */}
        <div style={{
          backgroundColor: '#1a1c20',
          borderTopRightRadius: '0.75rem',
          borderBottomLeftRadius: '0px',
          borderTopLeftRadius: '0.125rem',
          borderBottomRightRadius: '0.125rem',
          padding: '20px',
          marginBottom: '12px',
          borderLeft: '2px solid #59d8de',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <p className="label-sm" style={{ color: '#59d8de', marginBottom: '4px' }}>
                {mesocycle.statusLabel ?? mesocycle.status}
              </p>
              <p style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '1.5rem', fontWeight: 700, letterSpacing: '-0.04em', color: '#e2e2e8' }}>
                Week {mesocycle.currentWeek}
                <span style={{ fontSize: '0.875rem', color: '#444650', fontWeight: 400 }}> / {mesocycle.totalWeeks}</span>
              </p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '2rem', fontWeight: 700, letterSpacing: '-0.04em', color: '#b1c5ff' }}>
                {progressPct}%
              </p>
              <p style={{ fontFamily: 'Manrope', fontSize: '0.625rem', color: '#444650', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                Complete
              </p>
            </div>
          </div>

          <div style={{ height: '3px', backgroundColor: '#282a2e', borderRadius: '9999px', overflow: 'hidden' }}>
            <div style={{
              height: '100%', width: `${progressPct}%`,
              background: 'linear-gradient(90deg, #b1c5ff, #59d8de)',
              borderRadius: '9999px',
            }} />
          </div>
        </div>

        {/* Volume targets */}
        {muscles.length > 0 && (
          <div style={{
            backgroundColor: '#1a1c20',
            borderTopRightRadius: '0.75rem',
            borderBottomLeftRadius: '0px',
            borderTopLeftRadius: '0.125rem',
            borderBottomRightRadius: '0.125rem',
            padding: '20px',
            marginBottom: '12px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <BarChart2 size={14} color="#b1c5ff" />
              <p className="label-sm" style={{ color: '#b1c5ff' }}>Volume targets</p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {muscles.map(([muscle, targets]) => {
                const currentPct = targets.mrv > targets.mev
                  ? Math.min(((targets.current - targets.mev) / (targets.mrv - targets.mev)) * 100, 100)
                  : 0;
                return (
                  <div key={muscle}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <p style={{ fontFamily: 'Manrope', fontSize: '0.75rem', color: '#c5c6d2', textTransform: 'capitalize' }}>
                        {muscle.replace('_', ' ').toLowerCase()}
                      </p>
                      <p style={{ fontFamily: 'Manrope', fontSize: '0.75rem', color: '#444650' }}>
                        {targets.current} sets &nbsp;·&nbsp; MEV {targets.mev} / MRV {targets.mrv}
                      </p>
                    </div>
                    <div style={{ height: '2px', backgroundColor: '#282a2e', borderRadius: '9999px' }}>
                      <div style={{
                        height: '100%',
                        width: `${currentPct}%`,
                        backgroundColor: currentPct >= 90 ? '#ffb4ab' : currentPct >= 60 ? '#a2e7ff' : '#b1c5ff',
                        borderRadius: '9999px',
                      }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Actions */}
        {mesocycle.status === 'ACTIVE' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
            <button
              onClick={() => router.push('/dashboard')}
              className="btn-primary"
              style={{ color: '#002c70' }}
            >
              Start today's session
            </button>
            <button
              onClick={handleClose}
              className="btn-ghost"
            >
              Mark as completed
            </button>
          </div>
        )}

        {mesocycle.status === 'COMPLETED' && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            padding: '14px 16px',
            backgroundColor: 'rgba(89,216,222,0.06)',
            borderRadius: '0.125rem',
            borderTopRightRadius: '0.75rem',
            marginTop: '8px',
          }}>
            <CheckCircle size={14} color="#59d8de" />
            <p style={{ fontFamily: 'Manrope', fontSize: '0.75rem', color: '#59d8de' }}>
              Block completed
            </p>
          </div>
        )}
      </div>
    </div>
  );
}