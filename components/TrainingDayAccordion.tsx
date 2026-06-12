'use client';

import { useState } from 'react';
import { Calendar, CheckCircle, ChevronDown, ChevronUp, Clock } from 'lucide-react';
import { WORKOUT_TOKENS as T } from '@/lib/design/workoutTokens';
import { TYPE } from '@/lib/design/typography';

export type TrainingDayExercise = {
  key: string;
  name: string;
  setsTarget?: number;
  repRangeMin?: number;
  repRangeMax?: number;
};

export type TrainingDayItem = {
  id: string;
  label: string;
  subtitle?: string;
  exercises: TrainingDayExercise[];
  completed?: boolean;
  isToday?: boolean;
  accentColor?: string;
};

type TrainingDayAccordionProps = {
  days: TrainingDayItem[];
  sectionLabel?: string;
  defaultExpandedId?: string | null;
  compactHeader?: boolean;
  variant?: 'default' | 'blockDetail';
  onEditSession?: () => void;
};

const DAY_COLORS = [T.primary, T.tertiary, '#d4bbff', '#a2e7ff'];

function formatPrescription(ex: TrainingDayExercise): string {
  const sets = ex.setsTarget;
  const min = ex.repRangeMin;
  const max = ex.repRangeMax;
  if (typeof sets === 'number' && typeof min === 'number' && typeof max === 'number') {
    if (min === max) return `${sets} x ${min}`;
    return `${sets} x ${min}–${max}`;
  }
  if (typeof sets === 'number') return `${sets} sets`;
  return '';
}

export function parsePrescriptionExercises(prescription: unknown): TrainingDayExercise[] {
  if (!prescription || typeof prescription !== 'object') return [];
  const raw = (prescription as { exercises?: Array<Record<string, unknown>> }).exercises;
  if (!Array.isArray(raw)) return [];

  return raw.map((entry, index) => ({
    key: String(entry.exerciseId ?? entry.orderIndex ?? index),
    name: String(entry.exerciseName ?? 'Exercise'),
    setsTarget: typeof entry.setsTarget === 'number' ? entry.setsTarget : undefined,
    repRangeMin: typeof entry.repRangeMin === 'number' ? entry.repRangeMin : undefined,
    repRangeMax: typeof entry.repRangeMax === 'number' ? entry.repRangeMax : undefined,
  }));
}

function BlockDetailDayCard({
  day,
  isOpen,
  onToggle,
  onEditSession,
}: {
  day: TrainingDayItem;
  isOpen: boolean;
  onToggle: () => void;
  onEditSession?: () => void;
}) {
  const exerciseCount = day.exercises.length;
  const isToday = day.isToday && !day.completed;

  const leftBorder = day.completed
    ? T.outlineVariant
    : isToday
      ? T.primary
      : T.tertiary;

  const DayIcon = day.completed ? CheckCircle : isToday ? Calendar : Clock;
  const iconColor = day.completed ? T.outline : isToday ? T.primary : '#59d8de';

  return (
    <div
      style={{
        background: isToday ? T.surfaceContainer : T.surfaceLow,
        border: `1px solid ${T.outlineVariant}`,
        borderLeft: `3px solid ${leftBorder}`,
        borderRadius: 8,
        overflow: 'hidden',
        opacity: day.completed ? 0.6 : 1,
        boxShadow: isToday ? '0 4px 12px rgba(0,0,0,0.25)' : undefined,
      }}
    >
      <button
        type="button"
        onClick={onToggle}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          textAlign: 'left',
          padding: 16,
          background: 'none',
          border: 'none',
          borderBottom: isOpen ? `1px solid ${T.outlineVariant}` : 'none',
          cursor: 'pointer',
          color: T.onSurface,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 0 }}>
          <DayIcon size={20} color={iconColor} fill={day.completed ? iconColor : 'none'} />
          <span style={{ minWidth: 0 }}>
            <span
              style={{
                display: 'block',
                ...TYPE.labelCaps,
                color: isToday ? T.primary : day.completed ? T.outline : T.onSurfaceVariant,
              }}
            >
              {day.label}
            </span>
            {day.subtitle && (
              <span style={{ display: 'block', marginTop: 2, ...TYPE.bodyLg, color: day.completed ? T.onSurfaceVariant : T.onSurface }}>
                {day.subtitle}
              </span>
            )}
          </span>
        </div>
        <span style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          {day.completed && (
            <span
              style={{
                ...TYPE.chipLabel,
                color: T.onSurfaceVariant,
                background: T.surfaceHigh,
                padding: '4px 8px',
                borderRadius: 4,
                textTransform: 'uppercase',
              }}
            >
              Done
            </span>
          )}
          {isOpen ? (
            <ChevronUp size={20} color={T.onSurfaceVariant} />
          ) : (
            <ChevronDown size={20} color={T.outline} />
          )}
        </span>
      </button>
      {isOpen && exerciseCount > 0 && (
        <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {day.exercises.map((ex) => {
              const prescription = formatPrescription(ex);
              return (
                <div
                  key={ex.key}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: 12,
                    padding: 12,
                    background: T.surfaceLow,
                    borderRadius: 4,
                    border: `1px solid rgba(58,60,68,0.3)`,
                  }}
                >
                  <span style={{ ...TYPE.bodyMd, color: T.onSurface }}>{ex.name}</span>
                  {prescription && (
                    <span style={{ ...TYPE.labelMeta, color: '#d4bbff', flexShrink: 0 }}>
                      {prescription}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
          {isToday && onEditSession && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onEditSession();
              }}
              style={{
                width: '100%',
                padding: '8px 0',
                borderRadius: 4,
                border: `1px solid rgba(177,197,255,0.2)`,
                background: 'transparent',
                color: T.primary,
                ...TYPE.labelCaps,
                cursor: 'pointer',
              }}
            >
              Edit Session Structure
            </button>
          )}
        </div>
      )}
      {isOpen && exerciseCount === 0 && (
        <p style={{ margin: 0, padding: 16, ...TYPE.labelMeta, color: T.outline }}>
          No exercises listed for this day.
        </p>
      )}
    </div>
  );
}

export default function TrainingDayAccordion({
  days,
  sectionLabel,
  defaultExpandedId = null,
  compactHeader = false,
  variant = 'default',
  onEditSession,
}: TrainingDayAccordionProps) {
  const initialExpanded = defaultExpandedId ?? days.find((d) => d.isToday)?.id ?? null;
  const [expandedId, setExpandedId] = useState<string | null>(initialExpanded);

  if (days.length === 0) return null;

  if (variant === 'blockDetail') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {days.map((day) => {
          const isOpen = expandedId === day.id;
          return (
            <BlockDetailDayCard
              key={day.id}
              day={day}
              isOpen={isOpen}
              onToggle={() => setExpandedId(isOpen ? null : day.id)}
              onEditSession={onEditSession}
            />
          );
        })}
      </div>
    );
  }

  return (
    <div>
      {sectionLabel && (
        <p
          style={{
            margin: '0 0 8px',
            ...TYPE.labelCaps,
            color: T.onSurfaceVariant,
          }}
        >
          {sectionLabel}
        </p>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {days.map((day, index) => {
          const color = day.accentColor ?? DAY_COLORS[index % DAY_COLORS.length]!;
          const isOpen = expandedId === day.id;
          const exerciseCount = day.exercises.length;
          const subtitle =
            day.subtitle ??
            (exerciseCount > 0 ? `${exerciseCount} exercise${exerciseCount === 1 ? '' : 's'}` : 'No exercises');

          return (
            <div
              key={day.id}
              style={{
                background: T.surfaceLow,
                border: `1px solid ${T.outlineVariant}`,
                borderRadius: 8,
                overflow: 'hidden',
                opacity: day.completed ? 0.75 : 1,
              }}
            >
              <button
                type="button"
                onClick={() => setExpandedId(isOpen ? null : day.id)}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 12,
                  textAlign: 'left',
                  padding: 16,
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: T.onSurface,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      width: 4,
                      height: 24,
                      borderRadius: 9999,
                      background: day.completed ? T.outline : color,
                      flexShrink: 0,
                    }}
                  />
                  <span style={{ minWidth: 0 }}>
                    <span style={{ display: 'block', ...TYPE.headlineSm, color: T.onSurface }}>
                      {day.label}
                    </span>
                    {!compactHeader && (
                      <span
                        style={{
                          display: 'block',
                          marginTop: 2,
                          ...TYPE.labelMeta,
                          fontSize: 11,
                          fontWeight: 600,
                          color: T.outline,
                        }}
                      >
                        {day.completed ? 'Completed' : subtitle}
                      </span>
                    )}
                  </span>
                </div>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                  {day.completed && (
                    <span style={{ ...TYPE.chipLabel, color: T.outline, textTransform: 'uppercase' }}>
                      Done
                    </span>
                  )}
                  <ChevronDown
                    size={20}
                    color={T.onSurfaceVariant}
                    style={{
                      transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                      transition: 'transform 0.3s ease',
                    }}
                  />
                </span>
              </button>
              {isOpen && exerciseCount > 0 && (
                <ul
                  style={{
                    margin: 0,
                    padding: '0 16px 16px',
                    listStyle: 'none',
                    borderTop: `1px solid ${T.outlineVariant}`,
                    paddingTop: 16,
                  }}
                >
                  {day.exercises.map((ex) => {
                    const prescription = formatPrescription(ex);
                    return (
                      <li
                        key={ex.key}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          gap: 12,
                          padding: '4px 0',
                        }}
                      >
                        <span style={{ ...TYPE.bodyMd, color: T.onSurface }}>{ex.name}</span>
                        {prescription && (
                          <span
                            style={{
                              ...TYPE.labelMeta,
                              color: T.onSurfaceVariant,
                              background: T.surfaceContainer,
                              border: `1px solid ${T.outlineVariant}`,
                              borderRadius: 4,
                              padding: '2px 8px',
                              flexShrink: 0,
                            }}
                          >
                            {prescription}
                          </span>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
              {isOpen && exerciseCount === 0 && (
                <p
                  style={{
                    margin: 0,
                    padding: '0 16px 16px',
                    ...TYPE.labelMeta,
                    color: T.outline,
                    borderTop: `1px solid ${T.outlineVariant}`,
                    paddingTop: 16,
                  }}
                >
                  No exercises listed for this day.
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
