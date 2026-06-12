'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { adminApi, type AdminActivity, type AdminStats } from '@/lib/api/admin';
import { ApiError } from '@/lib/api/client';

const PRIMARY = '#b1c5ff';
const TERTIARY = '#59d8de';
const SURFACE_HIGH = '#282a30';
const ON_SURFACE = '#e2e2e8';
const OUTLINE = '#8e909c';

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div
      style={{
        backgroundColor: SURFACE_HIGH,
        borderRadius: 14,
        padding: '20px',
        flex: '1 1 160px',
      }}
    >
      <p style={{ margin: '0 0 8px', fontSize: 11, color: OUTLINE, textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 700 }}>
        {label}
      </p>
      <p style={{ margin: 0, fontFamily: 'Space Grotesk, sans-serif', fontWeight: 900, fontSize: 28, color: ON_SURFACE }}>
        {value}
      </p>
    </div>
  );
}

export default function AdminDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [activity, setActivity] = useState<AdminActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      try {
        const [statsRes, activityRes] = await Promise.all([
          adminApi.stats(),
          adminApi.activity(),
        ]);
        setStats(statsRes.data);
        setActivity(activityRes.data ?? []);
      } catch (err) {
        if (err instanceof ApiError && err.status === 403) {
          router.push('/more');
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [router]);

  if (loading) {
    return <p style={{ color: OUTLINE, fontFamily: 'Manrope, sans-serif' }}>Loading dashboard…</p>;
  }

  return (
    <div style={{ maxWidth: 960, display: 'flex', flexDirection: 'column', gap: 28 }}>
      <div>
        <h1 style={{ margin: '0 0 6px', fontFamily: 'Space Grotesk, sans-serif', fontWeight: 900, fontSize: 28, color: ON_SURFACE }}>
          Dashboard
        </h1>
        <p style={{ margin: 0, fontSize: 14, color: OUTLINE }}>Catalog and activity overview</p>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
        <StatCard label="Templates" value={stats?.templateCount ?? 0} />
        <StatCard label="Exercises" value={stats?.exerciseCount ?? 0} />
        <StatCard label="Active users (30d)" value={stats?.activeUsers ?? 0} />
        <StatCard label="Workouts logged (30d)" value={stats?.workoutsLogged ?? 0} />
      </div>

      <div style={{ display: 'flex', gap: 12 }}>
        <button
          type="button"
          onClick={() => router.push('/admin/exercises?new=1')}
          style={{
            padding: '10px 18px',
            borderRadius: 10,
            border: `1px solid ${PRIMARY}44`,
            background: `${PRIMARY}14`,
            color: PRIMARY,
            fontFamily: 'Manrope, sans-serif',
            fontWeight: 700,
            fontSize: 13,
            cursor: 'pointer',
          }}
        >
          New exercise
        </button>
        <button
          type="button"
          onClick={() => router.push('/admin/templates?new=1')}
          style={{
            padding: '10px 18px',
            borderRadius: 10,
            border: `1px solid ${TERTIARY}44`,
            background: `${TERTIARY}14`,
            color: TERTIARY,
            fontFamily: 'Manrope, sans-serif',
            fontWeight: 700,
            fontSize: 13,
            cursor: 'pointer',
          }}
        >
          New template
        </button>
      </div>

      <section>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h2 style={{ margin: 0, fontFamily: 'Space Grotesk, sans-serif', fontWeight: 800, fontSize: 16, color: ON_SURFACE }}>
            Recent activity
          </h2>
          <button
            type="button"
            onClick={() => router.push('/admin/audit')}
            style={{ background: 'none', border: 'none', color: PRIMARY, fontSize: 12, cursor: 'pointer' }}
          >
            View all logs
          </button>
        </div>
        <div style={{ backgroundColor: SURFACE_HIGH, borderRadius: 14, overflow: 'hidden' }}>
          {activity.length === 0 ? (
            <p style={{ margin: 0, padding: 20, fontSize: 13, color: OUTLINE }}>No admin actions yet.</p>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #3a3c44', textAlign: 'left' }}>
                  <th style={{ padding: '12px 16px', color: OUTLINE, fontWeight: 600 }}>Admin</th>
                  <th style={{ padding: '12px 16px', color: OUTLINE, fontWeight: 600 }}>Action</th>
                  <th style={{ padding: '12px 16px', color: OUTLINE, fontWeight: 600 }}>Entity</th>
                  <th style={{ padding: '12px 16px', color: OUTLINE, fontWeight: 600 }}>Summary</th>
                  <th style={{ padding: '12px 16px', color: OUTLINE, fontWeight: 600 }}>When</th>
                </tr>
              </thead>
              <tbody>
                {activity.map((row) => (
                  <tr key={row.id} style={{ borderBottom: '1px solid #3a3c4422' }}>
                    <td style={{ padding: '12px 16px', color: ON_SURFACE }}>{row.actor?.displayName ?? row.actorId.slice(0, 8)}</td>
                    <td style={{ padding: '12px 16px', color: PRIMARY, fontWeight: 700 }}>{row.action}</td>
                    <td style={{ padding: '12px 16px', color: ON_SURFACE }}>{row.entityType}</td>
                    <td style={{ padding: '12px 16px', color: ON_SURFACE }}>{row.summary ?? row.entityId}</td>
                    <td style={{ padding: '12px 16px', color: OUTLINE }}>
                      {new Date(row.createdAt).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>
    </div>
  );
}
