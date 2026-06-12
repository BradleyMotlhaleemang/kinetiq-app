'use client';

import { useEffect, useState, type CSSProperties } from 'react';

const C = {
  surfaceContainer: '#1e2026',
  outlineVariant: '#3a3c44',
  onSurface: '#e2e2e8',
  onSurfaceVariant: '#c5c6d2',
  destructive: '#ff6b6b',
  destructiveBg: 'rgba(255,107,107,0.15)',
};

type Props = {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  destructive?: boolean;
  requireTypedName?: boolean;
  expectedName?: string;
  loading?: boolean;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
};

export default function AdminConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  destructive = false,
  requireTypedName = false,
  expectedName = '',
  loading = false,
  onConfirm,
  onCancel,
}: Props) {
  const [typedName, setTypedName] = useState('');

  useEffect(() => {
    if (!open) setTypedName('');
  }, [open]);

  if (!open) return null;

  const nameMatches =
    !requireTypedName ||
    typedName.trim().toLowerCase() === expectedName.trim().toLowerCase();

  const canConfirm = nameMatches && !loading;

  return (
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
        role="presentation"
        onClick={loading ? undefined : onCancel}
        style={{ position: 'absolute', inset: 0, background: 'rgba(8,10,16,0.85)' }}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-confirm-title"
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: 480,
          background: C.surfaceContainer,
          borderRadius: '20px 20px 0 0',
          border: `1px solid ${C.outlineVariant}`,
          padding: '20px 20px 24px',
        }}
      >
        <p
          id="admin-confirm-title"
          style={{
            margin: '0 0 10px',
            fontFamily: 'Space Grotesk, sans-serif',
            fontWeight: 900,
            fontSize: 18,
            color: destructive ? C.destructive : C.onSurface,
          }}
        >
          {title}
        </p>
        <p
          style={{
            margin: '0 0 16px',
            fontSize: 13,
            lineHeight: 1.6,
            color: C.onSurfaceVariant,
            whiteSpace: 'pre-line',
          }}
        >
          {message}
        </p>
        {requireTypedName && (
          <label style={{ display: 'block', marginBottom: 16 }}>
            <span
              style={{
                display: 'block',
                fontSize: 11,
                color: C.onSurfaceVariant,
                marginBottom: 6,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
              }}
            >
              Type &quot;{expectedName}&quot; to confirm
            </span>
            <input
              value={typedName}
              onChange={(e) => setTypedName(e.target.value)}
              disabled={loading}
              autoFocus
              style={{
                width: '100%',
                boxSizing: 'border-box',
                padding: '10px 12px',
                borderRadius: 8,
                border: `1px solid ${C.outlineVariant}`,
                background: '#282a30',
                color: C.onSurface,
                fontSize: 13,
              }}
            />
          </label>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <button
            type="button"
            disabled={!canConfirm}
            onClick={() => void onConfirm()}
            style={confirmBtnStyle(destructive, canConfirm)}
          >
            {loading ? 'Working…' : confirmLabel}
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={onCancel}
            style={cancelBtnStyle}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

function confirmBtnStyle(destructive: boolean, enabled: boolean): CSSProperties {
  if (destructive) {
    return {
      width: '100%',
      padding: '13px 0',
      borderRadius: 12,
      border: `1px solid ${enabled ? C.destructive : C.outlineVariant}`,
      background: enabled ? C.destructiveBg : 'transparent',
      color: enabled ? C.destructive : C.onSurfaceVariant,
      fontFamily: 'Manrope, sans-serif',
      fontWeight: 700,
      fontSize: 13,
      cursor: enabled ? 'pointer' : 'not-allowed',
      opacity: enabled ? 1 : 0.6,
    };
  }
  return {
    width: '100%',
    padding: '13px 0',
    borderRadius: 12,
    border: 'none',
    background: enabled ? 'linear-gradient(135deg, #b1c5ff 0%, #3a5cbf 100%)' : '#3a3c44',
    color: enabled ? '#05080f' : C.onSurfaceVariant,
    fontFamily: 'Manrope, sans-serif',
    fontWeight: 700,
    fontSize: 13,
    cursor: enabled ? 'pointer' : 'not-allowed',
    opacity: enabled ? 1 : 0.6,
  };
}

const cancelBtnStyle: CSSProperties = {
  width: '100%',
  padding: '13px 0',
  borderRadius: 12,
  border: `1px solid ${C.outlineVariant}`,
  background: 'transparent',
  color: C.onSurfaceVariant,
  fontFamily: 'Manrope, sans-serif',
  fontWeight: 700,
  fontSize: 13,
  cursor: 'pointer',
};
