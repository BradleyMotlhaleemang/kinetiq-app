'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import { adminApi } from '@/lib/api/admin';
import { ApiError } from '@/lib/api/client';

const ON_SURFACE = '#e2e2e8';
const OUTLINE = '#8e909c';
const SURFACE_HIGH = '#282a30';
const PRIMARY = '#b1c5ff';

type Analytics = {
  totalUsers: number;
  newUsers30d: number;
  dau: number;
  wau: number;
  workoutsCompleted30d: number;
  templatePopularity: Array<{ templateId: string | null; name: string; starts: number }>;
  topExercises: Array<{ exerciseId: string; name: string; setCount: number }>;
};

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div style={{ backgroundColor: SURFACE_HIGH, borderRadius: 14, padding: 20, flex: '1 1 140px' }}>
      <p style={{ margin: '0 0 8px', fontSize: 11, color: OUTLINE, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{label}</p>
      <p style={{ margin: 0, fontFamily: 'Space Grotesk, sans-serif', fontWeight: 900, fontSize: 28, color: ON_SURFACE }}>{value}</p>
    </div>
  );
}

export default function AdminAnalyticsPage() {
  const router = useRouter();
  const role = useAuthStore((s) => s.role);
  const [data, setData] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (role && role !== 'ADMIN') router.replace('/more');
  }, [role, router]);

  useEffect(() => {
    void (async () => {
      try {
        const res = await adminApi.getAnalytics();
        setData(res.data as Analytics);
      } catch (err) {
        if (err instanceof ApiError && err.status === 403) router.push('/more');
      } finally {
        setLoading(false);
      }
    })();
  }, [router]);

  if (loading) return <p style={{ color: OUTLINE }}>Loading analytics…</p>;
  if (!data) return <p style={{ color: OUTLINE }}>No data</p>;

  return (
    <div style={{ maxWidth: 960, display: 'flex', flexDirection: 'column', gap: 28 }}>
      <div>
        <h1 style={{ margin: '0 0 6px', fontFamily: 'Space Grotesk, sans-serif', fontWeight: 900, fontSize: 28, color: ON_SURFACE }}>
          Analytics
        </h1>
        <p style={{ margin: 0, fontSize: 14, color: OUTLINE }}>Platform adoption (30-day window where noted)</p>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
        <StatCard label="Total users" value={data.totalUsers} />
        <StatCard label="New users (30d)" value={data.newUsers30d} />
        <StatCard label="DAU" value={data.dau} />
        <StatCard label="WAU" value={data.wau} />
        <StatCard label="Workouts (30d)" value={data.workoutsCompleted30d} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <div style={{ backgroundColor: SURFACE_HIGH, borderRadius: 14, padding: 20 }}>
          <h3 style={{ margin: '0 0 12px', color: PRIMARY, fontSize: 14 }}>Template starts (30d)</h3>
          {data.templatePopularity.map((t) => (
            <div key={t.templateId ?? t.name} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: 13, color: ON_SURFACE }}>
              <span>{t.name}</span>
              <span style={{ color: OUTLINE }}>{t.starts}</span>
            </div>
          ))}
        </div>
        <div style={{ backgroundColor: SURFACE_HIGH, borderRadius: 14, padding: 20 }}>
          <h3 style={{ margin: '0 0 12px', color: PRIMARY, fontSize: 14 }}>Top exercises by sets (30d)</h3>
          {data.topExercises.map((e) => (
            <div key={e.exerciseId} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: 13, color: ON_SURFACE }}>
              <span>{e.name}</span>
              <span style={{ color: OUTLINE }}>{e.setCount}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
