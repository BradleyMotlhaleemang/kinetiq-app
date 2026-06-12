'use client';

import { WORKOUT_TOKENS as T } from '@/lib/design/workoutTokens';
import { TYPE } from '@/lib/design/typography';

const LEVEL_COLORS: Record<string, string> = {
  beginner: T.tertiary,
  intermediate: T.primary,
  advanced: '#d4bbff',
};

const LEVEL_ON_COLORS: Record<string, string> = {
  beginner: '#005c5f',
  intermediate: '#3d5183',
  advanced: '#503c76',
};

function normalizeLevel(level: string): string {
  return level.trim().toLowerCase();
}

export function formatExperienceLevel(level?: string | null): string | null {
  if (!level?.trim()) return null;
  const lower = normalizeLevel(level);
  return lower.charAt(0).toUpperCase() + lower.slice(1);
}

export default function ExperienceLevelChip({ level }: { level?: string | null }) {
  const label = formatExperienceLevel(level);
  if (!label) return null;

  const normalized = normalizeLevel(label);
  const color = LEVEL_COLORS[normalized] ?? T.primary;
  const onColor = LEVEL_ON_COLORS[normalized] ?? '#3d5183';

  return (
    <span
      style={{
        display: 'inline-block',
        ...TYPE.chipLabel,
        textTransform: 'uppercase',
        color: onColor,
        background: color,
        borderRadius: 9999,
        padding: '2px 8px',
        flexShrink: 0,
      }}
    >
      {label}
    </span>
  );
}
