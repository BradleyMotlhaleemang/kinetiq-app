'use client';

import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Dumbbell,
  Layers,
  LogOut,
  Plus,
  Users,
  ScrollText,
  BarChart3,
  BookOpen,
  Shuffle,
} from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import api from '@/lib/api/client';
import AdminDesktopGate from './AdminDesktopGate';

const PRIMARY = '#b1c5ff';
const SURFACE = '#111318';
const SURFACE_CONTAINER = '#1a1c22';
const SURFACE_HIGH = '#282a30';
const ON_SURFACE = '#e2e2e8';
const OUTLINE = '#8e909c';

const NAV = [
  { label: 'Dashboard', href: '/admin', icon: LayoutDashboard, exact: true },
  { label: 'Templates', href: '/admin/templates', icon: Layers, exact: false },
  { label: 'Exercises', href: '/admin/exercises', icon: Dumbbell, exact: false },
  { label: 'Pools', href: '/admin/pools', icon: Shuffle, exact: false },
  { label: 'Users', href: '/admin/users', icon: Users, exact: false },
  { label: 'Audit Log', href: '/admin/audit', icon: ScrollText, exact: false },
  { label: 'Analytics', href: '/admin/analytics', icon: BarChart3, exact: false },
  { label: 'Knowledge', href: '/admin/knowledge', icon: BookOpen, exact: false },
];

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const logout = useAuthStore((s) => s.logout);

  async function handleLogout() {
    try {
      await api.post('/api/v1/auth/logout');
    } catch {
      // proceed with client logout
    }
    logout();
    router.push('/auth/login');
  }

  function isActive(item: (typeof NAV)[0]) {
    if (item.exact) return pathname === item.href;
    return pathname.startsWith(item.href);
  }

  return (
    <AdminDesktopGate>
      <div style={{ display: 'flex', minHeight: '100dvh', backgroundColor: SURFACE }}>
        <aside
          style={{
            width: 240,
            flexShrink: 0,
            backgroundColor: SURFACE_CONTAINER,
            borderRight: `1px solid ${SURFACE_HIGH}`,
            display: 'flex',
            flexDirection: 'column',
            padding: '20px 0',
          }}
        >
          <div style={{ padding: '0 20px 24px' }}>
            <p
              style={{
                margin: 0,
                fontFamily: 'Space Grotesk, sans-serif',
                fontWeight: 900,
                fontSize: 18,
                color: ON_SURFACE,
                letterSpacing: '-0.03em',
              }}
            >
              Kinetiq Admin
            </p>
            <p style={{ margin: '4px 0 0', fontSize: 11, color: OUTLINE }}>Operator portal</p>
          </div>

          <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4, padding: '0 12px', overflowY: 'auto' }}>
            {NAV.map((item) => {
              const Icon = item.icon;
              const active = isActive(item);
              return (
                <button
                  key={item.href}
                  type="button"
                  onClick={() => router.push(item.href)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '10px 12px',
                    borderRadius: 10,
                    border: 'none',
                    cursor: 'pointer',
                    textAlign: 'left',
                    backgroundColor: active ? 'rgba(177,197,255,0.12)' : 'transparent',
                    color: active ? PRIMARY : ON_SURFACE,
                    fontFamily: 'Manrope, sans-serif',
                    fontSize: 14,
                    fontWeight: active ? 700 : 500,
                  }}
                >
                  <Icon size={18} />
                  {item.label}
                </button>
              );
            })}
          </nav>

          <div style={{ padding: '12px 20px', display: 'flex', flexDirection: 'column', gap: 8 }}>
            <button
              type="button"
              onClick={() => router.push('/admin/templates?new=1')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                padding: '10px 14px',
                borderRadius: 10,
                border: 'none',
                cursor: 'pointer',
                background: `linear-gradient(135deg, ${PRIMARY}, #3a5cbf)`,
                color: '#05080f',
                fontFamily: 'Space Grotesk, sans-serif',
                fontWeight: 800,
                fontSize: 13,
              }}
            >
              <Plus size={16} />
              New template
            </button>
            <button
              type="button"
              onClick={() => void handleLogout()}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '8px 12px',
                borderRadius: 8,
                border: 'none',
                cursor: 'pointer',
                background: 'transparent',
                color: OUTLINE,
                fontFamily: 'Manrope, sans-serif',
                fontSize: 13,
              }}
            >
              <LogOut size={16} />
              Logout
            </button>
          </div>
        </aside>

        <main style={{ flex: 1, overflow: 'auto', padding: 32 }}>{children}</main>
      </div>
    </AdminDesktopGate>
  );
}
