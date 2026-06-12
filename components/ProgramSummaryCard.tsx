'use client';

import { useState, type CSSProperties, type ReactNode } from 'react';
import { Calendar, Timer } from 'lucide-react';
import ExperienceLevelChip from '@/components/ExperienceLevelChip';
import { WORKOUT_TOKENS as T } from '@/lib/design/workoutTokens';
import { TYPE } from '@/lib/design/typography';

export type ProgramSummaryCardProps = {
  name: string;
  eyebrow?: string;
  summary?: string;
  daysPerWeek?: number;
  durationWeeks?: number | string;
  experienceLevel?: string | null;
  accentColor?: string;
  recommended?: boolean;
  onClick?: () => void;
  footer?: ReactNode;
  titleSize?: 'md' | 'lg';
  variant?: 'browse' | 'configure';
  onChangeProgram?: () => void;
};

const ACCENT_DEFAULT = T.primary;

export default function ProgramSummaryCard({
  name,
  eyebrow,
  summary,
  daysPerWeek,
  durationWeeks,
  experienceLevel,
  accentColor = ACCENT_DEFAULT,
  recommended = false,
  onClick,
  footer,
  titleSize = 'md',
  variant = 'browse',
  onChangeProgram,
}: ProgramSummaryCardProps) {
  const [pressed, setPressed] = useState(false);
  const isConfigure = variant === 'configure';

  const shellStyle: CSSProperties = isConfigure
    ? {
        width: '100%',
        textAlign: 'left',
        background: T.surfaceContainer,
        border: `1px solid ${T.outlineVariant}`,
        borderLeft: `3px solid ${T.primary}`,
        borderRadius: 8,
        padding: 16,
      }
    : {
        width: '100%',
        textAlign: 'left',
        background: T.surfaceContainer,
        border: `1px solid ${T.outlineVariant}`,
        borderRadius: 12,
        overflow: 'hidden',
        display: 'flex',
        transform: pressed ? 'scale(0.99)' : 'scale(1)',
        transition: 'transform 0.15s ease',
      };

  const titleStyle: CSSProperties = isConfigure
    ? { ...TYPE.headlineMd, margin: '0 0 4px', color: T.primary }
    : {
        ...TYPE.headlineMd,
        margin: '0 0 4px',
        fontSize: titleSize === 'lg' ? 20 : 17,
        fontWeight: titleSize === 'lg' ? 900 : 800,
        letterSpacing: titleSize === 'lg' ? '-0.04em' : '-0.02em',
        color: T.onSurface,
      };

  const metaItems: Array<{ icon: typeof Calendar; text: string }> = [];
  if (!isConfigure) {
    if (daysPerWeek != null) {
      metaItems.push({ icon: Calendar, text: `${daysPerWeek} days/week` });
    }
    if (durationWeeks != null && durationWeeks !== '') {
      metaItems.push({ icon: Timer, text: `${durationWeeks} weeks` });
    }
  }

  const configureContent = (
    <>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: 8,
        }}
      >
        <div style={{ flex: 1 }}>
          <span
            style={{
              ...TYPE.labelCaps,
              display: 'block',
              marginBottom: 4,
              color: T.onSurfaceVariant,
            }}
          >
            Selected Program
          </span>
          <h3 style={titleStyle}>{name}</h3>
          <div style={{ marginTop: 4 }}>
            <ExperienceLevelChip level={experienceLevel} />
          </div>
        </div>
        {onChangeProgram && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onChangeProgram();
            }}
            style={{
              ...TYPE.labelMeta,
              background: 'none',
              border: 'none',
              padding: 0,
              cursor: 'pointer',
              color: T.primary,
              flexShrink: 0,
            }}
          >
            Change program →
          </button>
        )}
      </div>
    </>
  );

  const browseContent = (
    <>
      <div style={{ width: 6, flexShrink: 0, background: accentColor }} />
      <div style={{ flex: 1, padding: titleSize === 'lg' ? '16px 18px' : '14px 16px' }}>
        {(eyebrow || experienceLevel) && (
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              gap: 8,
              marginBottom: 4,
            }}
          >
            {eyebrow ? (
              <span
                style={{
                  ...TYPE.labelCaps,
                  color: accentColor,
                }}
              >
                {eyebrow}
              </span>
            ) : (
              <span />
            )}
            <ExperienceLevelChip level={experienceLevel} />
          </div>
        )}

        <h3 style={titleStyle}>{name}</h3>

        {recommended && (
          <span
            style={{
              display: 'inline-block',
              marginBottom: 8,
              ...TYPE.labelCaps,
              letterSpacing: '0.12em',
              color: T.tertiary,
              background: 'rgba(89,216,222,0.12)',
              borderRadius: 4,
              padding: '2px 6px',
            }}
          >
            Recommended
          </span>
        )}

        {metaItems.length > 0 ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, color: T.onSurfaceVariant }}>
            {metaItems.map(({ icon: Icon, text }) => (
              <div key={text} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <Icon size={16} strokeWidth={2} />
                <span style={{ ...TYPE.labelMeta }}>{text}</span>
              </div>
            ))}
          </div>
        ) : summary ? (
          <p style={{ margin: 0, ...TYPE.labelMeta, color: T.onSurfaceVariant, lineHeight: 1.5 }}>{summary}</p>
        ) : null}

        {footer}
      </div>
    </>
  );

  const content = isConfigure ? configureContent : browseContent;

  const pressHandlers = {
    onMouseDown: () => setPressed(true),
    onMouseUp: () => setPressed(false),
    onMouseLeave: () => setPressed(false),
    onTouchStart: () => setPressed(true),
    onTouchEnd: () => setPressed(false),
  };

  if (onClick && !isConfigure) {
    return (
      <button
        type="button"
        onClick={onClick}
        {...pressHandlers}
        style={{ ...shellStyle, cursor: 'pointer', border: shellStyle.border as string }}
      >
        {content}
      </button>
    );
  }

  return <div style={shellStyle}>{content}</div>;
}
