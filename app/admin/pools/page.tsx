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

type Pool = {
  id: string;
  name: string;
  primaryMuscle: string;
  movementPattern: string;
  exercises: Array<{
    id: string;
    priority: number;
    suitableWhenPain: string[];
    exercise: { id: string; name: string };
  }>;
};

const JOINTS = ['SHOULDER', 'ELBOW', 'WRIST', 'HIP', 'KNEE', 'ANKLE', 'LOWER_BACK'];

export default function AdminPoolsPage() {
  const router = useRouter();
  const role = useAuthStore((s) => s.role);
  const [pools, setPools] = useState<Pool[]>([]);
  const [selected, setSelected] = useState<Pool | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (role && role !== 'ADMIN') router.replace('/more');
  }, [role, router]);

  useEffect(() => {
    void load();
  }, []);

  async function load() {
    setLoading(true);
    try {
      const res = await adminApi.listSubstitutionPools();
      setPools((res.data ?? []) as Pool[]);
    } catch (err) {
      if (err instanceof ApiError && err.status === 403) router.push('/more');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 1100, display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div>
        <h1 style={{ margin: '0 0 6px', fontFamily: 'Space Grotesk, sans-serif', fontWeight: 900, fontSize: 28, color: ON_SURFACE }}>
          Substitution Pools
        </h1>
        <p style={{ margin: 0, fontSize: 14, color: OUTLINE }}>Manage exercise swap groups and joint pain tags</p>
      </div>

      {loading ? (
        <p style={{ color: OUTLINE }}>Loading…</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div style={{ backgroundColor: SURFACE_HIGH, borderRadius: 14, overflow: 'hidden' }}>
            {pools.map((pool) => (
              <button
                key={pool.id}
                type="button"
                onClick={() => setSelected(pool)}
                style={{
                  display: 'block',
                  width: '100%',
                  textAlign: 'left',
                  padding: '14px 16px',
                  border: 'none',
                  borderBottom: '1px solid #33353a',
                  background: selected?.id === pool.id ? 'rgba(177,197,255,0.08)' : 'transparent',
                  color: ON_SURFACE,
                  cursor: 'pointer',
                }}
              >
                <div style={{ fontWeight: 700 }}>{pool.name}</div>
                <div style={{ fontSize: 12, color: OUTLINE }}>{pool.exercises.length} exercises</div>
              </button>
            ))}
          </div>

          {selected && (
            <div style={{ backgroundColor: SURFACE_HIGH, borderRadius: 14, padding: 20 }}>
              <h2 style={{ margin: '0 0 4px', color: PRIMARY, fontSize: 18 }}>{selected.name}</h2>
              <p style={{ margin: '0 0 16px', fontSize: 12, color: OUTLINE }}>
                {selected.primaryMuscle} · {selected.movementPattern}
              </p>
              {selected.exercises.map((entry) => (
                <div key={entry.id} style={{ padding: '10px 0', borderBottom: '1px solid #33353a', fontSize: 13 }}>
                  <div style={{ color: ON_SURFACE, fontWeight: 600 }}>
                    #{entry.priority} {entry.exercise.name}
                  </div>
                  <div style={{ fontSize: 11, color: OUTLINE, marginTop: 4 }}>
                    Pain joints: {entry.suitableWhenPain.length ? entry.suitableWhenPain.join(', ') : 'default slot'}
                  </div>
                </div>
              ))}
              <p style={{ marginTop: 16, fontSize: 11, color: OUTLINE }}>
                Joint keys: {JOINTS.join(', ')}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
