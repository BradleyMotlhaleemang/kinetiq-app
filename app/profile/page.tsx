'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import api from '@/lib/api/client';
import { LogOut, ChevronRight, User, Target, Activity } from 'lucide-react';

const C = {
  primary:          '#b1c5ff',
  secondary:        '#d4bbff',
  tertiary:         '#59d8de',
  surface:          '#111318',
  surfaceLow:       '#161820',
  surfaceContainer: '#1e2026',
  surfaceHigh:      '#282a30',
  surfaceHighest:   '#32343c',
  outline:          '#8e909c',
  outlineVariant:   '#3a3c44',
  onSurface:        '#e2e2e8',
  onSurfaceVariant: '#c5c6d2',
  glass:            'rgba(22,24,32,0.80)',
};

function KinetiqLogoWithTealQ() {
  return (
    <span style={{
      fontFamily: 'Space Grotesk, sans-serif',
      fontWeight: 900,
      fontSize: 20,
      letterSpacing: '-0.04em',
    }}>
      <span style={{
        background: 'linear-gradient(90deg, #b1c5ff, #d4bbff)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
      }}>
        Kineti
      </span>
      <span style={{ color: '#59d8de' }}>q</span>
    </span>
  );
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '13px 16px',
      borderBottom: `1px solid ${C.outlineVariant}`,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {icon}
        <span style={{
          fontFamily: 'Manrope, sans-serif',
          fontSize: 13,
          fontWeight: 500,
          color: C.onSurface,
        }}>
          {label}
        </span>
      </div>
      <span style={{
        fontFamily: 'Manrope, sans-serif',
        fontSize: 13,
        fontWeight: 700,
        color: C.onSurfaceVariant,
      }}>
        {value}
      </span>
    </div>
  );
}

function ActionRow({
  label,
  labelColor = C.onSurface,
  icon,
  onClick,
}: {
  label: string;
  labelColor?: string;
  icon: React.ReactNode;
  onClick: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '13px 16px',
        borderBottom: `1px solid ${C.outlineVariant}`,
        background: hovered ? C.surfaceHigh : 'transparent',
        border: 'none',
        borderBottom: `1px solid ${C.outlineVariant}`,
        cursor: 'pointer',
        transition: 'background 0.15s ease',
        textAlign: 'left',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {icon}
        <span style={{
          fontFamily: 'Manrope, sans-serif',
          fontSize: 13,
          fontWeight: 700,
          color: labelColor,
        }}>
          {label}
        </span>
      </div>
      <ChevronRight size={15} color={C.outline} />
    </button>
  );
}

function SignOutButton({ onClick }: { onClick: () => void }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '13px 16px',
        background: hovered ? 'rgba(255,107,107,0.06)' : 'transparent',
        border: 'none',
        cursor: 'pointer',
        transition: 'background 0.15s ease',
        textAlign: 'left',
      }}
    >
      <LogOut size={15} color="#ff6b6b" />
      <span style={{
        fontFamily: 'Manrope, sans-serif',
        fontSize: 13,
        fontWeight: 700,
        color: '#ff6b6b',
      }}>
        Sign Out
      </span>
    </button>
  );
}

export default function ProfilePage() {
  const router = useRouter();
  const { logout } = useAuthStore();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUser();
  }, []);

  async function loadUser() {
    try {
      const res = await api.get('/api/v1/users/me');
      setUser(res.data);
    } catch {
      router.push('/auth/login');
    } finally {
      setLoading(false);
    }
  }

  function handleLogout() {
    logout();
    router.push('/auth/login');
  }

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: C.surface,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <p style={{
          fontFamily: 'Manrope, sans-serif',
          fontSize: 13,
          color: C.outline,
        }}>
          Loading...
        </p>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: C.surface,
      color: C.onSurface,
      fontFamily: 'Manrope, sans-serif',
      paddingBottom: 110,
      overflowX: 'hidden',
    }}>

      {/* ── STICKY GLASS HEADER ── */}
      <header style={{
        position: 'sticky',
        top: 0,
        zIndex: 40,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 20px',
        height: 58,
        background: C.glass,
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        borderBottom: `1px solid ${C.outlineVariant}`,
      }}>
        <KinetiqLogoWithTealQ />
        {/* Right slot — empty on profile */}
        <div style={{ width: 32 }} />
      </header>

      {/* ── PAGE CONTENT ── */}
      <div style={{
        maxWidth: 600,
        margin: '0 auto',
        padding: '26px 16px 0',
      }}>

        {/* Micro label */}
        <p style={{
          margin: '0 0 6px',
          fontSize: '0.57rem',
          letterSpacing: '0.24em',
          textTransform: 'uppercase',
          color: C.outline,
          fontWeight: 700,
        }}>
          Account
        </p>

        {/* Page title */}
        <h1 style={{
          fontFamily: 'Space Grotesk, sans-serif',
          fontWeight: 900,
          fontSize: 'clamp(1.85rem,6vw,2.4rem)',
          letterSpacing: '-0.045em',
          lineHeight: 1.05,
          color: C.onSurface,
          margin: '0 0 22px',
        }}>
          Profile
        </h1>

        {/* ── AVATAR CARD ── */}
        <div style={{
          background: C.surfaceContainer,
          border: `1px solid ${C.outlineVariant}`,
          borderLeft: `3px solid ${C.primary}`,
          borderRadius: 16,
          padding: '18px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          marginBottom: 12,
        }}>
          {/* Avatar circle */}
          <div style={{
            width: 52,
            height: 52,
            borderRadius: '50%',
            background: C.surfaceHigh,
            border: `1px solid ${C.outlineVariant}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}>
            <User size={22} color={C.outline} />
          </div>

          <div>
            <p style={{
              fontFamily: 'Space Grotesk, sans-serif',
              fontWeight: 800,
              fontSize: 16,
              color: C.onSurface,
              margin: 0,
              letterSpacing: '-0.02em',
            }}>
              {user?.displayName ?? 'Athlete'}
            </p>
            <p style={{
              fontFamily: 'Manrope, sans-serif',
              fontSize: 12,
              fontWeight: 500,
              color: C.outline,
              margin: '2px 0 0',
            }}>
              {user?.email}
            </p>
          </div>

          {/* Onboarding complete badge */}
          {user?.onboardingCompletedAt && (
            <div style={{ marginLeft: 'auto' }}>
              <div style={{
                background: 'rgba(89,216,222,0.1)',
                border: `1px solid rgba(89,216,222,0.25)`,
                borderRadius: 100,
                padding: '4px 10px',
              }}>
                <span style={{
                  fontSize: '0.57rem',
                  fontWeight: 700,
                  letterSpacing: '0.18em',
                  textTransform: 'uppercase',
                  color: C.tertiary,
                }}>
                  Active
                </span>
              </div>
            </div>
          )}
        </div>

        {/* ── TRAINING PROFILE CARD ── */}
        <div style={{
          background: C.surfaceContainer,
          border: `1px solid ${C.outlineVariant}`,
          borderLeft: `3px solid ${C.secondary}`,
          borderRadius: 16,
          overflow: 'hidden',
          marginBottom: 12,
        }}>
          {/* Section header */}
          <div style={{
            padding: '11px 16px',
            borderBottom: `1px solid ${C.outlineVariant}`,
            background: C.surfaceHigh,
          }}>
            <p style={{
              margin: 0,
              fontSize: '0.57rem',
              letterSpacing: '0.22em',
              textTransform: 'uppercase',
              color: C.outline,
              fontWeight: 700,
            }}>
              Training Profile
            </p>
          </div>

          <InfoRow
            icon={<Target size={15} color={C.outline} />}
            label="Goal"
            value={user?.goalModeLabel ?? user?.goalMode ?? 'Not set'}
          />
          <InfoRow
            icon={<Activity size={15} color={C.outline} />}
            label="Experience"
            value={user?.experienceLevelLabel ?? user?.experienceLevel ?? 'Not set'}
          />

          {/* Last row — no bottom border */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '13px 16px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Activity size={15} color={C.outline} />
              <span style={{
                fontFamily: 'Manrope, sans-serif',
                fontSize: 13,
                fontWeight: 500,
                color: C.onSurface,
              }}>
                Bodyweight
              </span>
            </div>
            <span style={{
              fontFamily: 'Manrope, sans-serif',
              fontSize: 13,
              fontWeight: 700,
              color: C.onSurfaceVariant,
            }}>
              {user?.bodyweightKg ? `${user.bodyweightKg} kg` : 'Not set'}
            </span>
          </div>
        </div>

        {/* ── ACCOUNT ACTIONS CARD ── */}
        <div style={{
          background: C.surfaceContainer,
          border: `1px solid ${C.outlineVariant}`,
          borderLeft: `3px solid ${C.tertiary}`,
          borderRadius: 16,
          overflow: 'hidden',
          marginBottom: 12,
        }}>
          {/* Section header */}
          <div style={{
            padding: '11px 16px',
            borderBottom: `1px solid ${C.outlineVariant}`,
            background: C.surfaceHigh,
          }}>
            <p style={{
              margin: 0,
              fontSize: '0.57rem',
              letterSpacing: '0.22em',
              textTransform: 'uppercase',
              color: C.outline,
              fontWeight: 700,
            }}>
              Account
            </p>
          </div>

          <ActionRow
            label="Edit Profile"
            icon={<User size={15} color={C.outline} />}
            onClick={() => router.push('/onboarding')}
          />

          <ActionRow
            label="Weekly Check-in"
            icon={<Activity size={15} color={C.outline} />}
            onClick={() => router.push('/weekly-feedback')}
          />

          {/* Sign out — last row, no bottom border, red accent */}
          <SignOutButton onClick={handleLogout} />
        </div>

        {/* ── INCOMPLETE ONBOARDING BANNER ── */}
        {!user?.onboardingCompletedAt && (
          <div
            onClick={() => router.push('/onboarding')}
            style={{
              background: 'rgba(255,179,71,0.07)',
              border: '1px solid rgba(255,179,71,0.25)',
              borderLeft: '3px solid #ffb347',
              borderRadius: 16,
              padding: '14px 16px',
              cursor: 'pointer',
              marginBottom: 12,
            }}
          >
            <p style={{
              fontFamily: 'Space Grotesk, sans-serif',
              fontWeight: 800,
              fontSize: 13,
              color: '#ffb347',
              margin: '0 0 3px',
            }}>
              Complete your profile
            </p>
            <p style={{
              fontFamily: 'Manrope, sans-serif',
              fontWeight: 500,
              fontSize: 12,
              color: 'rgba(255,179,71,0.7)',
              margin: 0,
            }}>
              Set your goal and experience level to get accurate prescriptions
            </p>
          </div>
        )}

      </div>
    </div>
  );
}