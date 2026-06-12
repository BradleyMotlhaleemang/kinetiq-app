'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import { adminApi, type ProgramTemplate } from '@/lib/api/admin';
import { ApiError } from '@/lib/api/client';
import AdminConfirmDialog from '@/components/admin/AdminConfirmDialog';

const PRIMARY = '#b1c5ff';
const TERTIARY = '#59d8de';
const SURFACE_HIGH = '#282a30';
const ON_SURFACE = '#e2e2e8';
const OUTLINE = '#8e909c';

type RoutineRow = {
  id: string;
  name: string;
  level: string;
  goal: string;
  daysPerWeek: number;
  isSystem: boolean;
  _count?: { days: number };
};

type DayDetail = {
  id: string;
  dayNumber: number;
  dayType: string;
  label: string;
  exercises: Array<{
    id: string;
    orderIndex: number;
    setsTarget: number;
    repRangeMin: number;
    repRangeMax: number;
    rpeTarget: number;
    exercise: { id: string; name: string };
  }>;
};

export default function AdminTemplatesPage() {
  const router = useRouter();
  const role = useAuthStore((s) => s.role);
  const [tab, setTab] = useState<'programs' | 'routines'>('programs');
  const [programs, setPrograms] = useState<ProgramTemplate[]>([]);
  const [routines, setRoutines] = useState<RoutineRow[]>([]);
  const [selected, setSelected] = useState<ProgramTemplate | null>(null);
  const [days, setDays] = useState<DayDetail[]>([]);
  const [activeDay, setActiveDay] = useState(0);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const newTemplateHandled = useRef(false);
  const duplicatingRef = useRef(false);

  useEffect(() => {
    if (role && role !== 'ADMIN') router.replace('/more');
  }, [role, router]);

  useEffect(() => {
    void load();
  }, []);

  useEffect(() => {
    if (newTemplateHandled.current) return;
    if (typeof window === 'undefined' || !window.location.search.includes('new=1')) return;
    if (programs.length === 0) return;

    newTemplateHandled.current = true;
    router.replace('/admin/templates');
    void handleDuplicate(programs[0].id);
  }, [programs, router]);

  async function load() {
    setLoading(true);
    try {
      const [pRes, rRes] = await Promise.all([
        adminApi.listPrograms(),
        adminApi.listRoutines(),
      ]);
      setPrograms((pRes.data ?? []) as ProgramTemplate[]);
      setRoutines((rRes.data ?? []) as RoutineRow[]);
    } catch (err) {
      if (err instanceof ApiError && err.status === 403) router.push('/more');
    } finally {
      setLoading(false);
    }
  }

  async function openProgram(program: ProgramTemplate) {
    setSelected({ ...program });
    try {
      const res = await adminApi.getProgram(program.id);
      const detail = res.data as { splitTemplate?: { days: DayDetail[] } };
      setDays(detail.splitTemplate?.days ?? []);
      setActiveDay(0);
    } catch {
      setDays([]);
    }
  }

  async function handleSaveProgram() {
    if (!selected) return;
    setSaving(true);
    try {
      await adminApi.updateProgram(selected.id, {
        name: selected.name,
        featured: selected.featured,
        isPublished: selected.isPublished,
        progressionNotes: selected.progressionNotes ?? undefined,
        progressionType: selected.progressionType,
        level: selected.level,
        goal: selected.goal,
        durationWeeksMin: selected.durationWeeksMin,
        durationWeeksMax: selected.durationWeeksMax,
        deloadWeek: selected.deloadWeek,
        deloadNotes: selected.deloadNotes ?? undefined,
        difficultyWarning: selected.difficultyWarning ?? undefined,
      });
      await load();
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteProgram() {
    if (!selected) return;
    setDeleting(true);
    setError(null);
    try {
      await adminApi.deleteProgram(selected.id);
      setDeleteOpen(false);
      setSelected(null);
      setDays([]);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to delete program.');
    } finally {
      setDeleting(false);
    }
  }

  async function handleDuplicate(id: string) {
    if (duplicatingRef.current) return;
    duplicatingRef.current = true;
    setSaving(true);
    setError(null);
    try {
      const res = await adminApi.duplicateProgram(id);
      const created = res.data as ProgramTemplate;
      const listRes = await adminApi.listPrograms();
      const refreshed = (listRes.data ?? []) as ProgramTemplate[];
      setPrograms(refreshed);
      const found = refreshed.find((p) => p.id === created.id) ?? created;
      await openProgram(found);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Failed to duplicate program. Please try again.');
      }
    } finally {
      setSaving(false);
      duplicatingRef.current = false;
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, height: 'calc(100dvh - 64px)' }}>
      <div>
        <h1 style={{ margin: '0 0 6px', fontFamily: 'Space Grotesk, sans-serif', fontWeight: 900, fontSize: 28, color: ON_SURFACE }}>
          Template Manager
        </h1>
        <p style={{ margin: 0, fontSize: 14, color: OUTLINE }}>Programs and split structure</p>
      </div>

      {error && (
        <div
          style={{
            padding: '12px 16px',
            borderRadius: 10,
            backgroundColor: 'rgba(255,107,107,0.12)',
            border: '1px solid rgba(255,107,107,0.35)',
            color: '#ffb4ab',
            fontSize: 13,
          }}
        >
          {error}
        </div>
      )}

      <div style={{ display: 'flex', gap: 8 }}>
        {(['programs', 'routines'] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            style={{
              padding: '8px 16px',
              borderRadius: 9999,
              border: 'none',
              cursor: 'pointer',
              backgroundColor: tab === t ? `${PRIMARY}22` : SURFACE_HIGH,
              color: tab === t ? PRIMARY : OUTLINE,
              fontWeight: 700,
              fontSize: 13,
              textTransform: 'capitalize',
            }}
          >
            {t}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', flex: 1, gap: 0, minHeight: 0, borderRadius: 14, overflow: 'hidden', border: `1px solid ${SURFACE_HIGH}` }}>
        <div style={{ width: '40%', backgroundColor: SURFACE_HIGH, overflowY: 'auto' }}>
          {loading ? (
            <p style={{ padding: 16, color: OUTLINE }}>Loading…</p>
          ) : tab === 'programs' ? (
            programs.map((row) => (
              <button
                key={row.id}
                type="button"
                onClick={() => void openProgram(row)}
                style={{
                  display: 'block',
                  width: '100%',
                  textAlign: 'left',
                  padding: '14px 16px',
                  border: 'none',
                  borderBottom: '1px solid #33353a',
                  borderLeft: selected?.id === row.id ? `3px solid ${PRIMARY}` : '3px solid transparent',
                  background: selected?.id === row.id ? 'rgba(177,197,255,0.06)' : 'transparent',
                  cursor: 'pointer',
                }}
              >
                <div style={{ color: ON_SURFACE, fontWeight: 700, fontSize: 14 }}>{row.name}</div>
                <div style={{ fontSize: 11, color: OUTLINE, marginTop: 4 }}>
                  {row.level} · {row.goal} · {row.splitTemplate?.daysPerWeek ?? '?'}d
                  {!row.isPublished && ' · Draft'}
                </div>
              </button>
            ))
          ) : (
            routines.map((row) => (
              <div key={row.id} style={{ padding: '14px 16px', borderBottom: '1px solid #33353a', color: ON_SURFACE }}>
                <div style={{ fontWeight: 700 }}>{row.name}</div>
                <div style={{ fontSize: 11, color: OUTLINE }}>{row.level} · {row._count?.days ?? row.daysPerWeek} days</div>
              </div>
            ))
          )}
        </div>

        <div style={{ flex: 1, backgroundColor: '#111318', overflowY: 'auto', padding: 24 }}>
          {!selected ? (
            <p style={{ color: OUTLINE }}>Select a program to edit</p>
          ) : (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 20 }}>
                <h2 style={{ margin: 0, fontFamily: 'Space Grotesk, sans-serif', fontWeight: 900, fontSize: 24, color: ON_SURFACE }}>
                  {selected.name}
                </h2>
                <div style={{ display: 'flex', gap: 8 }}>
                  {tab === 'programs' && (
                    <button
                      type="button"
                      disabled={saving || deleting}
                      onClick={() => setDeleteOpen(true)}
                      style={{
                        ...btnSecondary,
                        borderColor: 'rgba(255,107,107,0.4)',
                        color: '#ff6b6b',
                        opacity: saving || deleting ? 0.6 : 1,
                        cursor: saving || deleting ? 'not-allowed' : 'pointer',
                      }}
                    >
                      Delete
                    </button>
                  )}
                  <button
                    type="button"
                    disabled={saving || deleting}
                    onClick={() => void handleDuplicate(selected.id)}
                    style={{ ...btnSecondary, opacity: saving || deleting ? 0.6 : 1, cursor: saving || deleting ? 'not-allowed' : 'pointer' }}
                  >
                    {saving ? 'Duplicating…' : 'Duplicate'}
                  </button>
                  <button type="button" disabled={saving || deleting} onClick={() => void handleSaveProgram()} style={btnPrimary}>
                    {saving ? 'Saving…' : 'Save'}
                  </button>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 20 }}>
                <Field label="Level">
                  <select
                    value={selected.level}
                    onChange={(e) => setSelected({ ...selected, level: e.target.value })}
                    style={inputStyle}
                  >
                    {['BEGINNER', 'INTERMEDIATE', 'ADVANCED'].map((v) => (
                      <option key={v} value={v}>{v}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Goal">
                  <select
                    value={selected.goal}
                    onChange={(e) => setSelected({ ...selected, goal: e.target.value })}
                    style={inputStyle}
                  >
                    {['HYPERTROPHY', 'STRENGTH', 'POWERBUILDING', 'POWERLIFTING'].map((v) => (
                      <option key={v} value={v}>{v}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Weeks">
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input type="number" value={selected.durationWeeksMin} onChange={(e) => setSelected({ ...selected, durationWeeksMin: Number(e.target.value) })} style={{ ...inputStyle, width: 60 }} />
                    <span style={{ color: OUTLINE, alignSelf: 'center' }}>–</span>
                    <input type="number" value={selected.durationWeeksMax} onChange={(e) => setSelected({ ...selected, durationWeeksMax: Number(e.target.value) })} style={{ ...inputStyle, width: 60 }} />
                  </div>
                </Field>
              </div>

              <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, color: ON_SURFACE, fontSize: 13 }}>
                  <input type="checkbox" checked={selected.featured} onChange={(e) => setSelected({ ...selected, featured: e.target.checked })} />
                  Featured
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, color: ON_SURFACE, fontSize: 13 }}>
                  <input type="checkbox" checked={selected.isPublished} onChange={(e) => setSelected({ ...selected, isPublished: e.target.checked })} />
                  Published
                </label>
              </div>

              <Field label="Progression notes">
                <textarea
                  value={selected.progressionNotes ?? ''}
                  onChange={(e) => setSelected({ ...selected, progressionNotes: e.target.value })}
                  rows={3}
                  style={{ ...inputStyle, width: '100%', resize: 'vertical' }}
                />
              </Field>

              {days.length > 0 && (
                <>
                  <div style={{ display: 'flex', gap: 4, borderBottom: `1px solid ${SURFACE_HIGH}`, margin: '20px 0 12px' }}>
                    {days.map((day, i) => (
                      <button
                        key={day.id}
                        type="button"
                        onClick={() => setActiveDay(i)}
                        style={{
                          padding: '8px 14px',
                          border: 'none',
                          borderBottom: activeDay === i ? `2px solid ${PRIMARY}` : '2px solid transparent',
                          background: 'transparent',
                          color: activeDay === i ? PRIMARY : OUTLINE,
                          cursor: 'pointer',
                          fontSize: 13,
                          fontWeight: 600,
                        }}
                      >
                        {day.label}
                      </button>
                    ))}
                  </div>
                  {days[activeDay]?.dayType === 'WORKOUT' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {days[activeDay].exercises.map((ex) => (
                        <div key={ex.id} style={{ padding: 12, backgroundColor: SURFACE_HIGH, borderRadius: 8, fontSize: 13 }}>
                          <div style={{ color: ON_SURFACE, fontWeight: 600 }}>{ex.exercise.name}</div>
                          <div style={{ color: OUTLINE, marginTop: 4 }}>
                            {ex.setsTarget} sets · {ex.repRangeMin}–{ex.repRangeMax} reps · RPE {ex.rpeTarget}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </div>
      </div>

      {selected && tab === 'programs' && (
        <AdminConfirmDialog
          open={deleteOpen}
          title="Delete program template?"
          message={[
            `Permanently remove "${selected.name}"?`,
            selected.isPublished ? 'This program is published and visible to users.' : 'This program is a draft.',
            (selected._count?.mesocycles ?? 0) > 0
              ? `${selected._count?.mesocycles} user block(s) were created from this program.`
              : 'No user blocks reference this program.',
            'This cannot be undone.',
          ].join('\n')}
          confirmLabel="Delete program"
          destructive
          requireTypedName={selected.isPublished}
          expectedName={selected.name}
          loading={deleting}
          onConfirm={handleDeleteProgram}
          onCancel={() => {
            if (!deleting) setDeleteOpen(false);
          }}
        />
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: 'block' }}>
      <span style={{ display: 'block', fontSize: 10, color: '#8e909c', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>{label}</span>
      {children}
    </label>
  );
}

const inputStyle: React.CSSProperties = {
  padding: '8px 10px',
  borderRadius: 8,
  border: '1px solid #3a3c44',
  background: '#282a30',
  color: '#e2e2e8',
  fontSize: 13,
};

const btnPrimary: React.CSSProperties = {
  padding: '8px 16px',
  borderRadius: 8,
  border: 'none',
  background: PRIMARY,
  color: '#05080f',
  fontWeight: 800,
  cursor: 'pointer',
};

const btnSecondary: React.CSSProperties = {
  padding: '8px 16px',
  borderRadius: 8,
  border: '1px solid #3a3c44',
  background: 'transparent',
  color: '#e2e2e8',
  cursor: 'pointer',
};
