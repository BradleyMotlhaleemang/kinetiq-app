'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import { adminApi, type AdminExercise } from '@/lib/api/admin';
import { ApiError } from '@/lib/api/client';
import AdminConfirmDialog from '@/components/admin/AdminConfirmDialog';

const PRIMARY = '#b1c5ff';
const SURFACE_HIGH = '#282a30';
const ON_SURFACE = '#e2e2e8';
const OUTLINE = '#8e909c';

export default function AdminExercisesPage() {
  const router = useRouter();
  const role = useAuthStore((s) => s.role);
  const [exercises, setExercises] = useState<AdminExercise[]>([]);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<AdminExercise | null>(null);
  const [creating, setCreating] = useState(false);
  const [newExercise, setNewExercise] = useState({
    name: '',
    primaryMuscle: 'CHEST',
    movementPattern: 'HORIZONTAL_PUSH',
    exerciseType: 'COMPOUND',
    equipmentProfileId: '',
    executionProfileId: '',
  });
  const [profiles, setProfiles] = useState<{ equipment: Array<{ id: string; name: string }>; execution: Array<{ id: string; zone: string }> }>({ equipment: [], execution: [] });
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    if (role && role !== 'ADMIN') router.replace('/more');
  }, [role, router]);

  useEffect(() => {
    void loadExercises();
    void (async () => {
      const [eq, ex] = await Promise.all([
        adminApi.listEquipmentProfiles(),
        adminApi.listExecutionProfiles(),
      ]);
      setProfiles({
        equipment: (eq.data ?? []) as Array<{ id: string; name: string }>,
        execution: (ex.data ?? []) as Array<{ id: string; zone: string }>,
      });
    })();
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.search.includes('new=1')) {
      setCreating(true);
    }
  }, []);

  async function loadExercises(q?: string) {
    setLoading(true);
    try {
      const res = await adminApi.listExercises(q);
      setExercises(res.data ?? []);
    } catch (err) {
      if (err instanceof ApiError && err.status === 403) router.push('/more');
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    if (!selected) return;
    setSaving(true);
    try {
      await adminApi.updateExercise(selected.id, {
        name: selected.name,
        primaryMuscle: selected.primaryMuscle,
        movementClass: selected.movementClass,
        chestRegion: selected.chestRegion,
        inclineAngleDegrees: selected.inclineAngleDegrees,
        movementPattern: selected.movementPattern,
        exerciseType: selected.exerciseType,
        category: selected.category,
      });
      await loadExercises(search || undefined);
      setSelected(null);
    } finally {
      setSaving(false);
    }
  }

  async function handleCreate() {
    setSaving(true);
    try {
      await adminApi.createExercise(newExercise);
      setCreating(false);
      await loadExercises();
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!selected) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      await adminApi.deleteExercise(selected.id);
      setDeleteOpen(false);
      setSelected(null);
      await loadExercises(search || undefined);
    } catch (err) {
      setDeleteError(err instanceof ApiError ? err.message : 'Failed to delete exercise.');
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div style={{ maxWidth: 1100, display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div>
        <h1 style={{ margin: '0 0 6px', fontFamily: 'Space Grotesk, sans-serif', fontWeight: 900, fontSize: 28, color: ON_SURFACE }}>
          Exercise Repository
        </h1>
        <p style={{ margin: 0, fontSize: 14, color: OUTLINE }}>Operator catalog — substitutions and chest classification</p>
      </div>

      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
      <button
        type="button"
        onClick={() => setCreating(true)}
        style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: PRIMARY, color: '#05080f', fontWeight: 700, cursor: 'pointer' }}
      >
        + New exercise
      </button>
      <input
        type="search"
        placeholder="Search exercises…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && void loadExercises(search || undefined)}
        style={{
          maxWidth: 360,
          padding: '10px 14px',
          borderRadius: 10,
          border: `1px solid ${SURFACE_HIGH}`,
          backgroundColor: SURFACE_HIGH,
          color: ON_SURFACE,
          fontFamily: 'Manrope, sans-serif',
          fontSize: 14,
        }}
      />
      </div>

      {loading ? (
        <p style={{ color: OUTLINE }}>Loading…</p>
      ) : (
        <div style={{ backgroundColor: SURFACE_HIGH, borderRadius: 14, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #3a3c44', textAlign: 'left' }}>
                <th style={{ padding: '12px 16px', color: OUTLINE }}>Name</th>
                <th style={{ padding: '12px 16px', color: OUTLINE }}>Muscle</th>
                <th style={{ padding: '12px 16px', color: OUTLINE }}>Class</th>
                <th style={{ padding: '12px 16px', color: OUTLINE }}>Equipment</th>
              </tr>
            </thead>
            <tbody>
              {exercises.map((ex) => (
                <tr
                  key={ex.id}
                  onClick={() => setSelected({ ...ex })}
                  style={{ borderBottom: '1px solid #3a3c4422', cursor: 'pointer' }}
                >
                  <td style={{ padding: '12px 16px', color: ON_SURFACE, fontWeight: 600 }}>{ex.name}</td>
                  <td style={{ padding: '12px 16px', color: ON_SURFACE }}>{ex.primaryMuscle}</td>
                  <td style={{ padding: '12px 16px', color: OUTLINE }}>{ex.movementClass ?? '—'}</td>
                  <td style={{ padding: '12px 16px', color: OUTLINE }}>
                    {ex.metadata?.equipmentProfile?.name ?? '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {creating && (
        <div style={{ position: 'fixed', top: 0, right: 0, width: 400, height: '100dvh', backgroundColor: '#1a1c22', borderLeft: '1px solid #282a30', padding: 24, zIndex: 50 }}>
          <h2 style={{ margin: '0 0 20px', color: ON_SURFACE, fontWeight: 800 }}>New exercise</h2>
          <input value={newExercise.name} onChange={(e) => setNewExercise({ ...newExercise, name: e.target.value })} placeholder="Name" style={{ width: '100%', marginBottom: 12, padding: 10, borderRadius: 8, background: SURFACE_HIGH, color: ON_SURFACE, border: 'none' }} />
          <select value={newExercise.equipmentProfileId} onChange={(e) => setNewExercise({ ...newExercise, equipmentProfileId: e.target.value })} style={{ width: '100%', marginBottom: 12, padding: 10, borderRadius: 8, background: SURFACE_HIGH, color: ON_SURFACE, border: 'none' }}>
            <option value="">Equipment profile</option>
            {profiles.equipment.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <select value={newExercise.executionProfileId} onChange={(e) => setNewExercise({ ...newExercise, executionProfileId: e.target.value })} style={{ width: '100%', marginBottom: 20, padding: 10, borderRadius: 8, background: SURFACE_HIGH, color: ON_SURFACE, border: 'none' }}>
            <option value="">Execution profile</option>
            {profiles.execution.map((p) => <option key={p.id} value={p.id}>{p.zone}</option>)}
          </select>
          <button type="button" disabled={saving} onClick={() => void handleCreate()} style={{ width: '100%', padding: 12, borderRadius: 10, border: 'none', background: PRIMARY, color: '#05080f', fontWeight: 800, cursor: 'pointer' }}>Create</button>
          <button type="button" onClick={() => setCreating(false)} style={{ marginTop: 8, width: '100%', padding: 10, background: 'transparent', border: 'none', color: OUTLINE, cursor: 'pointer' }}>Cancel</button>
        </div>
      )}

      {selected && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            right: 0,
            width: 400,
            height: '100dvh',
            backgroundColor: '#1a1c22',
            borderLeft: '1px solid #282a30',
            padding: 24,
            overflowY: 'auto',
            zIndex: 50,
            boxShadow: '-8px 0 32px rgba(0,0,0,0.4)',
          }}
        >
          <h2 style={{ margin: '0 0 20px', fontFamily: 'Space Grotesk, sans-serif', fontWeight: 800, fontSize: 18, color: ON_SURFACE }}>
            Edit exercise
          </h2>
          <label style={{ display: 'block', marginBottom: 16 }}>
            <span style={{ display: 'block', fontSize: 11, color: OUTLINE, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Name</span>
            <input
              value={selected.name}
              onChange={(e) => setSelected({ ...selected, name: e.target.value })}
              style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #3a3c44', background: SURFACE_HIGH, color: ON_SURFACE }}
            />
          </label>
          <label style={{ display: 'block', marginBottom: 16 }}>
            <span style={{ display: 'block', fontSize: 11, color: OUTLINE, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Chest region</span>
            <select
              value={selected.chestRegion ?? ''}
              onChange={(e) => setSelected({ ...selected, chestRegion: e.target.value || null })}
              style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #3a3c44', background: SURFACE_HIGH, color: ON_SURFACE }}
            >
              <option value="">—</option>
              {['UPPER', 'MID', 'LOWER', 'OVERALL'].map((v) => (
                <option key={v} value={v}>{v}</option>
              ))}
            </select>
          </label>
          <label style={{ display: 'block', marginBottom: 16 }}>
            <span style={{ display: 'block', fontSize: 11, color: OUTLINE, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Incline angle (°)</span>
            <input
              type="number"
              min={0}
              max={90}
              value={selected.inclineAngleDegrees ?? ''}
              onChange={(e) =>
                setSelected({
                  ...selected,
                  inclineAngleDegrees: e.target.value ? Number(e.target.value) : null,
                })
              }
              style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #3a3c44', background: SURFACE_HIGH, color: ON_SURFACE }}
            />
          </label>
          {selected.substitutionPools && selected.substitutionPools.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <p style={{ fontSize: 11, color: OUTLINE, textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 8px' }}>Substitution pools</p>
              {selected.substitutionPools.map((sp) => (
                <p key={sp.pool.id} style={{ margin: '4px 0', fontSize: 13, color: ON_SURFACE }}>
                  {sp.pool.name} (priority {sp.priority})
                </p>
              ))}
            </div>
          )}
          {deleteError && (
            <p style={{ margin: '0 0 12px', fontSize: 13, color: '#ff6b6b' }}>{deleteError}</p>
          )}
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              type="button"
              onClick={() => void handleSave()}
              disabled={saving || deleting}
              style={{
                flex: 1,
                padding: '12px',
                borderRadius: 10,
                border: 'none',
                background: PRIMARY,
                color: '#05080f',
                fontWeight: 800,
                cursor: 'pointer',
              }}
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
            <button
              type="button"
              onClick={() => {
                setDeleteError(null);
                setDeleteOpen(true);
              }}
              disabled={saving || deleting}
              style={{
                padding: '12px 16px',
                borderRadius: 10,
                border: '1px solid rgba(255,107,107,0.4)',
                background: 'rgba(255,107,107,0.1)',
                color: '#ff6b6b',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Delete
            </button>
            <button
              type="button"
              onClick={() => setSelected(null)}
              disabled={deleting}
              style={{
                padding: '12px 16px',
                borderRadius: 10,
                border: '1px solid #3a3c44',
                background: 'transparent',
                color: OUTLINE,
                cursor: 'pointer',
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {selected && (
        <AdminConfirmDialog
          open={deleteOpen}
          title="Delete exercise?"
          message={
            (selected._count?.sets ?? 0) > 0
              ? `"${selected.name}" has ${selected._count?.sets} logged set(s). This cannot be undone.`
              : `Permanently remove "${selected.name}" from the catalog? This cannot be undone.`
          }
          confirmLabel="Delete exercise"
          destructive
          requireTypedName={(selected._count?.sets ?? 0) > 0}
          expectedName={selected.name}
          loading={deleting}
          onConfirm={handleDelete}
          onCancel={() => {
            if (!deleting) setDeleteOpen(false);
          }}
        />
      )}
    </div>
  );
}
