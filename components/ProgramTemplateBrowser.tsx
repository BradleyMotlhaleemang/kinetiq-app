'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { PlusCircle } from 'lucide-react';
import { templatesApi, type TemplateListItem } from '@/lib/api/templates';
import { usersApi } from '@/lib/api/users';
import { ApiError } from '@/lib/api/client';
import {
  GOAL_CHIP_FILTERS,
  type GoalChip,
  goalChipToQuery,
  experienceToLevel,
  daysPerWeekToQuery,
  mergeTemplateQueries,
} from '@/lib/programs/filterMap';
import { mapApiTemplate, type BrowseTemplate } from '@/lib/programs/templateBrowse';
import ProgramSummaryCard from '@/components/ProgramSummaryCard';
import { TYPE } from '@/lib/design/typography';

const C = {
  primary: '#b1c5ff',
  primaryContainer: '#b1c5ff',
  onPrimaryContainer: '#3d5183',
  tertiary: '#59d8de',
  surfaceLow: '#161820',
  surfaceContainer: '#1e2026',
  surfaceHigh: '#282a30',
  outline: '#8e909c',
  outlineVariant: '#3a3c44',
  onSurface: '#e2e2e8',
  onSurfaceVariant: '#c5c6d2',
};

const MATRIX_OPTIONS: Record<string, string[]> = {
  Experience: ['Any', 'Beginner', 'Intermediate', 'Advanced'],
  Duration: ['Any', '≤6w', '6–8w', '8–12w', '12w+'],
  'Days/Week': ['Any', '3', '4', '5', '6+'],
};

function rgb(hex: string) {
  const r = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return r ? `${parseInt(r[1], 16)},${parseInt(r[2], 16)},${parseInt(r[3], 16)}` : '177,197,255';
}

function experienceLabelFromLevel(level?: string): string {
  if (!level) return 'Any';
  const lower = level.toLowerCase();
  return lower.charAt(0).toUpperCase() + lower.slice(1);
}

function goalChipDisplay(label: string): string {
  if (label === 'All Goals') return 'All';
  return label.toUpperCase();
}

type ProgramTemplateBrowserProps = {
  hideCreateCta?: boolean;
};

export default function ProgramTemplateBrowser({ hideCreateCta = false }: ProgramTemplateBrowserProps) {
  const router = useRouter();
  const [templates, setTemplates] = useState<BrowseTemplate[]>([]);
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('All Goals');
  const [matrixFilters, setMatrixFilters] = useState<Record<string, string>>({
    Experience: 'Any',
    Duration: 'Any',
    'Days/Week': 'Any',
  });
  const [loading, setLoading] = useState(true);
  const [myPrograms, setMyPrograms] = useState<TemplateListItem[]>([]);
  const [myProgramsLoading, setMyProgramsLoading] = useState(true);
  const [recommendedTemplateId, setRecommendedTemplateId] = useState<string | null>(null);
  const [contextProgram, setContextProgram] = useState<TemplateListItem | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<TemplateListItem | null>(null);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    Promise.all([templatesApi.recommended(), usersApi.me()])
      .then(([recRes, userRes]) => {
        const rec = recRes.data?.recommended as TemplateListItem | undefined;
        if (rec?.id) setRecommendedTemplateId(rec.id);
        const user = userRes.data as { experienceLevel?: string };
        if (user.experienceLevel) {
          setMatrixFilters((prev) => ({
            ...prev,
            Experience: experienceLabelFromLevel(user.experienceLevel),
          }));
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    let cancelled = false;
    setMyProgramsLoading(true);
    templatesApi
      .mine()
      .then((res) => {
        if (cancelled) return;
        const list = Array.isArray(res.data) ? (res.data as TemplateListItem[]) : [];
        setMyPrograms(list);
      })
      .catch(() => {
        if (!cancelled) setMyPrograms([]);
      })
      .finally(() => {
        if (!cancelled) setMyProgramsLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const query = mergeTemplateQueries(
      goalChipToQuery(activeFilter as GoalChip),
      { level: experienceToLevel(matrixFilters.Experience ?? 'Any') },
      daysPerWeekToQuery(matrixFilters['Days/Week'] ?? 'Any'),
      search.trim() ? { search: search.trim() } : {},
    );
    templatesApi
      .all(query)
      .then((res) => {
        if (cancelled) return;
        const list = Array.isArray(res.data) ? (res.data as TemplateListItem[]) : [];
        setTemplates(list.map(mapApiTemplate));
      })
      .catch(() => {
        if (!cancelled) setTemplates([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [activeFilter, matrixFilters, search]);

  const filtered = templates.filter((t) => {
    const dur = matrixFilters.Duration ?? 'Any';
    if (dur === 'Any') return true;
    const w = t.durationWeeks;
    if (dur === '≤6w') return w <= 6;
    if (dur === '6–8w') return w >= 6 && w <= 8;
    if (dur === '8–12w') return w > 8 && w <= 12;
    if (dur === '12w+') return w > 12;
    return true;
  });

  function cycleMatrix(label: string) {
    const options = MATRIX_OPTIONS[label] ?? ['Any'];
    const current = matrixFilters[label] ?? 'Any';
    const next = options[(options.indexOf(current) + 1) % options.length] ?? 'Any';
    setMatrixFilters((prev) => ({ ...prev, [label]: next }));
  }

  function startLongPress(program: TemplateListItem) {
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
    longPressTimer.current = setTimeout(() => {
      setContextProgram(program);
    }, 500);
  }

  function cancelLongPress() {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }

  async function handleDeleteProgram(program: TemplateListItem) {
    try {
      await templatesApi.remove(program.id);
      setMyPrograms((prev) => prev.filter((p) => p.id !== program.id));
      setDeleteConfirm(null);
      setContextProgram(null);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) return;
      alert('Unable to delete this program.');
    }
  }

  return (
    <section>
      {!hideCreateCta && (
        <CreateNewProgramButton onClick={() => router.push('/templates/new')} />
      )}

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
        My Programs
      </p>
      {myProgramsLoading ? (
        <p style={{ color: C.outline, fontSize: 13, marginBottom: 24 }}>Loading your programs…</p>
      ) : myPrograms.length === 0 ? (
        <p style={{ color: C.onSurfaceVariant, fontSize: 13, marginBottom: 24, lineHeight: 1.5 }}>
          No custom programs yet — use Create New Program above.
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 28 }}>
          {myPrograms.map((program) => (
            <div
              key={program.id}
              onContextMenu={(e) => {
                e.preventDefault();
                setContextProgram(program);
              }}
              onTouchStart={() => startLongPress(program)}
              onTouchEnd={cancelLongPress}
              onTouchMove={cancelLongPress}
              onMouseDown={() => startLongPress(program)}
              onMouseUp={cancelLongPress}
              onMouseLeave={cancelLongPress}
            >
              <ProgramSummaryCard
                name={program.name}
                eyebrow={program.primaryFocus}
                experienceLevel={program.level}
                daysPerWeek={program.daysPerWeek}
                durationWeeks={program.durationWeeks?.split('–')[0] ?? program.durationWeeks}
                accentColor={C.tertiary}
                onClick={() => router.push(`/templates/${program.id}/edit`)}
              />
            </div>
          ))}
        </div>
      )}

      <h3
        style={{
          margin: '0 0 12px',
          ...TYPE.headlineSm,
          color: C.onSurface,
        }}
      >
        Browse Templates
      </h3>

      <div
        style={{
          display: 'flex',
          gap: 8,
          overflowX: 'auto',
          marginBottom: 12,
          paddingBottom: 4,
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}
      >
        {GOAL_CHIP_FILTERS.map((label) => {
          const active = label === activeFilter;
          return (
            <button
              key={label}
              type="button"
              onClick={() => setActiveFilter(label)}
              style={{
                flexShrink: 0,
                padding: '6px 16px',
                borderRadius: 9999,
                border: active ? `1px solid ${C.primary}` : `1px solid ${C.outlineVariant}`,
                background: active ? C.primaryContainer : C.surfaceContainer,
                color: active ? C.onPrimaryContainer : C.onSurfaceVariant,
                ...TYPE.chipLabel,
                textTransform: 'uppercase',
                cursor: 'pointer',
                transition: 'border-color 0.15s ease',
              }}
            >
              {goalChipDisplay(label)}
            </button>
          );
        })}
      </div>

      <input
        placeholder="Search programs…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{
          width: '100%',
          boxSizing: 'border-box',
          background: C.surfaceLow,
          border: `1px solid ${C.outlineVariant}`,
          borderRadius: 12,
          padding: '10px 14px',
          color: C.onSurface,
          ...TYPE.bodyMd,
          fontSize: 13,
          outline: 'none',
          marginBottom: 10,
        }}
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 6, marginBottom: 16 }}>
        {Object.keys(MATRIX_OPTIONS).map((label) => {
          const value = matrixFilters[label] ?? 'Any';
          const active = value !== 'Any';
          return (
            <button
              key={label}
              type="button"
              onClick={() => cycleMatrix(label)}
              style={{
                background: active ? `rgba(${rgb(C.primary)},0.1)` : C.surfaceLow,
                borderRadius: 8,
                padding: '6px 8px',
                border: `1px solid ${active ? C.primary : C.outlineVariant}`,
                textAlign: 'left',
                cursor: 'pointer',
              }}
            >
              <span
                style={{
                  display: 'block',
                  fontSize: '0.5rem',
                  letterSpacing: '0.16em',
                  textTransform: 'uppercase',
                  color: active ? C.primary : C.outline,
                  fontWeight: 700,
                }}
              >
                {label}
              </span>
              <span
                style={{
                  display: 'block',
                  fontSize: 10,
                  fontWeight: 800,
                  color: active ? C.primary : C.tertiary,
                }}
              >
                {value}
              </span>
            </button>
          );
        })}
      </div>

      {loading ? (
        <p style={{ color: C.outline, fontSize: 13 }}>Loading programs…</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {filtered.map((template) => {
            const accent =
              template.accentKey === 'secondary'
                ? '#d4bbff'
                : template.accentKey === 'tertiary'
                  ? C.tertiary
                  : C.primary;
            const isRecommended = template.id === recommendedTemplateId;
            return (
              <ProgramSummaryCard
                key={template.id}
                name={template.name}
                eyebrow={template.tag}
                experienceLevel={template.experience}
                daysPerWeek={template.frequencyPerWeek}
                durationWeeks={template.durationWeeks}
                accentColor={accent}
                recommended={isRecommended}
                onClick={() => router.push(`/mesocycles/new?templateId=${template.id}`)}
              />
            );
          })}
          {filtered.length === 0 && (
            <p style={{ textAlign: 'center', color: C.outline, fontSize: 13, padding: '24px 0' }}>
              No programs match this filter.
            </p>
          )}
        </div>
      )}

      {contextProgram && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 80,
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center',
          }}
        >
          <div
            style={{ position: 'absolute', inset: 0, background: 'rgba(8,10,16,0.85)' }}
            onClick={() => setContextProgram(null)}
          />
          <div
            style={{
              position: 'relative',
              width: '100%',
              maxWidth: 560,
              background: C.surfaceContainer,
              borderRadius: '20px 20px 0 0',
              border: `1px solid ${C.outlineVariant}`,
              padding: 20,
            }}
          >
            <p
              style={{
                margin: '0 0 12px',
                ...TYPE.headlineSm,
                color: C.onSurface,
              }}
            >
              {contextProgram.name}
            </p>
            <button
              type="button"
              onClick={() => {
                router.push(`/templates/${contextProgram.id}/edit`);
                setContextProgram(null);
              }}
              style={actionBtnStyle(false)}
            >
              Edit program
            </button>
            <button
              type="button"
              onClick={() => {
                router.push(`/mesocycles/new?templateId=${contextProgram.id}`);
                setContextProgram(null);
              }}
              style={actionBtnStyle(false)}
            >
              Start block
            </button>
            <button
              type="button"
              onClick={() => {
                setDeleteConfirm(contextProgram);
                setContextProgram(null);
              }}
              style={actionBtnStyle(true)}
            >
              Delete program
            </button>
          </div>
        </div>
      )}

      {deleteConfirm && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 90,
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center',
          }}
        >
          <div
            style={{ position: 'absolute', inset: 0, background: 'rgba(8,10,16,0.85)' }}
            onClick={() => setDeleteConfirm(null)}
          />
          <div
            style={{
              position: 'relative',
              width: '100%',
              maxWidth: 560,
              background: C.surfaceContainer,
              borderRadius: '20px 20px 0 0',
              border: `1px solid ${C.outlineVariant}`,
              padding: 20,
            }}
          >
            <p
              style={{
                margin: '0 0 8px',
                ...TYPE.headlineSm,
                color: C.onSurface,
              }}
            >
              Delete program?
            </p>
            <p style={{ margin: '0 0 16px', fontSize: 13, color: C.onSurfaceVariant, lineHeight: 1.5 }}>
              {deleteConfirm.name} will be permanently removed. This cannot be undone.
            </p>
            <button type="button" onClick={() => void handleDeleteProgram(deleteConfirm)} style={actionBtnStyle(true)}>
              Delete
            </button>
            <button type="button" onClick={() => setDeleteConfirm(null)} style={actionBtnStyle(false)}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

export function CreateNewProgramButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        width: '100%',
        padding: '16px 24px',
        borderRadius: 8,
        border: 'none',
        background: `linear-gradient(135deg, ${C.primary} 0%, #3a5cbf 100%)`,
        color: '#05080f',
        ...TYPE.titleCta,
        cursor: 'pointer',
        marginBottom: 32,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        boxShadow: '0 4px 24px rgba(58,92,191,0.25)',
      }}
    >
      <PlusCircle size={20} strokeWidth={2.5} />
      Create New Program
    </button>
  );
}

function actionBtnStyle(destructive: boolean): React.CSSProperties {
  return {
    width: '100%',
    padding: '13px 0',
    borderRadius: 12,
    border: destructive ? 'none' : '1px solid #3a3c44',
    background: destructive ? 'linear-gradient(135deg, #ff8b8b 0%, #c44 100%)' : 'transparent',
    color: destructive ? '#05080f' : '#c5c6d2',
    ...TYPE.labelMeta,
    fontWeight: 700,
    fontSize: 13,
    cursor: 'pointer',
    marginBottom: 8,
  };
}
