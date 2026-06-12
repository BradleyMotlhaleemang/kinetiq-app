import type { CSSProperties } from 'react';

export const FONTS = {
  display: 'var(--font-space-grotesk), sans-serif',
  body: 'var(--font-manrope), sans-serif',
} as const;

export const TYPE: Record<string, CSSProperties> = {
  headlineMd: {
    fontFamily: FONTS.display,
    fontSize: 20,
    fontWeight: 800,
    letterSpacing: '-0.04em',
    lineHeight: 1.2,
  },
  headlineSm: {
    fontFamily: FONTS.display,
    fontSize: 17,
    fontWeight: 800,
    letterSpacing: '-0.02em',
    lineHeight: 1.2,
  },
  titleCta: {
    fontFamily: FONTS.display,
    fontSize: 16,
    fontWeight: 900,
    letterSpacing: '0.02em',
    lineHeight: 1.2,
  },
  labelCaps: {
    fontFamily: FONTS.body,
    fontSize: 9,
    fontWeight: 700,
    letterSpacing: '0.22em',
    textTransform: 'uppercase',
    lineHeight: 1.2,
  },
  labelMeta: {
    fontFamily: FONTS.body,
    fontSize: 12,
    fontWeight: 400,
    lineHeight: 1.4,
  },
  bodyMd: {
    fontFamily: FONTS.body,
    fontSize: 14,
    fontWeight: 400,
    lineHeight: 1.5,
  },
  bodyLg: {
    fontFamily: FONTS.body,
    fontSize: 16,
    fontWeight: 400,
    lineHeight: 1.5,
  },
  chipLabel: {
    fontFamily: FONTS.body,
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: '0.05em',
    lineHeight: 1,
  },
};
