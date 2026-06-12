'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import { adminApi, type AdminUser } from '@/lib/api/admin';
import { ApiError } from '@/lib/api/client';

const PRIMARY = '#b1c5ff';
const SURFACE_HIGH = '#282a30';
const ON_SURFACE = '#e2e2e8';
const OUTLINE = '#8e909c';
const TERTIARY = '#59d8de';

function statusLabel(user: AdminUser) {
  if (user.accountStatus === 'SUSPENDED') return 'Suspended';
  if (user.lockedUntil && new Date(user.lockedUntil) > new Date()) return 'Locked';
  if (!user.emailVerified) return 'Unverified';
  return 'Active';
}

export default function AdminUsersPage() {
  const router = useRouter();
  const role = useAuthStore((s) => s.role);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [selected, setSelected] = useState<Record<string, unknown> | null>(null);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (role && role !== 'ADMIN') router.replace('/more');
  }, [role, router]);

  useEffect(() => {
    void loadUsers();
  }, []);

  async function loadUsers(q?: string) {
    setLoading(true);
    try {
      const res = await adminApi.listUsers(q);
      setUsers(res.data?.items ?? []);
    } catch (err) {
      if (err instanceof ApiError && err.status === 403) router.push('/more');
    } finally {
      setLoading(false);
    }
  }

  async function openUser(id: string) {
    const res = await adminApi.getUser(id);
    setSelected(res.data as Record<string, unknown>);
  }

  async function handleAction(action: 'unlock' | 'verify' | 'suspend' | 'activate') {
    if (!selected?.id) return;
    setSaving(true);
    try {
      const body: Record<string, unknown> = {};
      if (action === 'unlock') body.unlock = true;
      if (action === 'verify') body.forceVerifyEmail = true;
      if (action === 'suspend') body.accountStatus = 'SUSPENDED';
      if (action === 'activate') body.accountStatus = 'ACTIVE';
      await adminApi.updateUser(selected.id as string, body);
      await openUser(selected.id as string);
      await loadUsers(search || undefined);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ maxWidth: 1100, display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div>
        <h1 style={{ margin: '0 0 6px', fontFamily: 'Space Grotesk, sans-serif', fontWeight: 900, fontSize: 28, color: ON_SURFACE }}>
          Users
        </h1>
        <p style={{ margin: 0, fontSize: 14, color: OUTLINE }}>Registered accounts and support actions</p>
      </div>

      <input
        type="search"
        placeholder="Search by email or name…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && void loadUsers(search || undefined)}
        style={{
          maxWidth: 360,
          padding: '10px 14px',
          borderRadius: 10,
          border: `1px solid ${SURFACE_HIGH}`,
          backgroundColor: SURFACE_HIGH,
          color: ON_SURFACE,
          fontSize: 14,
        }}
      />

      {loading ? (
        <p style={{ color: OUTLINE }}>Loading…</p>
      ) : (
        <div style={{ backgroundColor: SURFACE_HIGH, borderRadius: 14, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #3a3c44', textAlign: 'left' }}>
                <th style={{ padding: '12px 16px', color: OUTLINE }}>Name</th>
                <th style={{ padding: '12px 16px', color: OUTLINE }}>Email</th>
                <th style={{ padding: '12px 16px', color: OUTLINE }}>Status</th>
                <th style={{ padding: '12px 16px', color: OUTLINE }}>Last active</th>
                <th style={{ padding: '12px 16px', color: OUTLINE }}>Workouts (30d)</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr
                  key={user.id}
                  onClick={() => void openUser(user.id)}
                  style={{ borderBottom: '1px solid #33353a', cursor: 'pointer' }}
                >
                  <td style={{ padding: '12px 16px', color: ON_SURFACE }}>{user.displayName}</td>
                  <td style={{ padding: '12px 16px', color: OUTLINE }}>{user.email}</td>
                  <td style={{ padding: '12px 16px', color: TERTIARY }}>{statusLabel(user)}</td>
                  <td style={{ padding: '12px 16px', color: OUTLINE }}>
                    {user.lastActiveAt ? new Date(user.lastActiveAt).toLocaleDateString() : '—'}
                  </td>
                  <td style={{ padding: '12px 16px', color: ON_SURFACE }}>{user.workouts30d}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selected && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            right: 0,
            width: 420,
            height: '100%',
            backgroundColor: '#1e2026',
            borderLeft: `1px solid ${SURFACE_HIGH}`,
            padding: 24,
            overflowY: 'auto',
            zIndex: 50,
          }}
        >
          <button type="button" onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', color: OUTLINE, cursor: 'pointer', marginBottom: 16 }}>
            Close
          </button>
          <h2 style={{ margin: '0 0 8px', color: ON_SURFACE, fontFamily: 'Space Grotesk, sans-serif' }}>
            {String(selected.displayName)}
          </h2>
          <p style={{ margin: '0 0 16px', color: OUTLINE, fontSize: 13 }}>{String(selected.email)}</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
            <button type="button" disabled={saving} onClick={() => void handleAction('unlock')} style={actionBtnStyle}>Unlock</button>
            <button type="button" disabled={saving} onClick={() => void handleAction('verify')} style={actionBtnStyle}>Verify email</button>
            <button type="button" disabled={saving} onClick={() => void handleAction('suspend')} style={actionBtnStyle}>Suspend</button>
            <button type="button" disabled={saving} onClick={() => void handleAction('activate')} style={actionBtnStyle}>Activate</button>
          </div>
          <p style={{ fontSize: 12, color: OUTLINE }}>
            Joined: {selected.createdAt ? new Date(String(selected.createdAt)).toLocaleString() : '—'}
          </p>
          <p style={{ fontSize: 12, color: OUTLINE }}>
            Last login: {selected.lastLoginAt ? new Date(String(selected.lastLoginAt)).toLocaleString() : '—'}
          </p>
        </div>
      )}
    </div>
  );
}

const actionBtnStyle: React.CSSProperties = {
  padding: '6px 12px',
  borderRadius: 8,
  border: `1px solid ${SURFACE_HIGH}`,
  background: 'transparent',
  color: PRIMARY,
  cursor: 'pointer',
  fontSize: 12,
};
