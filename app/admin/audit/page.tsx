'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import { adminApi, type AdminActivity } from '@/lib/api/admin';
import { ApiError } from '@/lib/api/client';

const ON_SURFACE = '#e2e2e8';
const OUTLINE = '#8e909c';
const SURFACE_HIGH = '#282a30';
const TERTIARY = '#59d8de';

export default function AdminAuditPage() {
  const router = useRouter();
  const role = useAuthStore((s) => s.role);
  const [items, setItems] = useState<AdminActivity[]>([]);
  const [total, setTotal] = useState(0);
  const [entityType, setEntityType] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (role && role !== 'ADMIN') router.replace('/more');
  }, [role, router]);

  useEffect(() => {
    void load();
  }, [entityType]);

  async function load() {
    setLoading(true);
    try {
      const params: Record<string, string> = { limit: '50' };
      if (entityType) params.entityType = entityType;
      const res = await adminApi.listAudit(params);
      const data = res.data as { items: AdminActivity[]; total: number };
      setItems(data.items ?? []);
      setTotal(data.total ?? 0);
    } catch (err) {
      if (err instanceof ApiError && err.status === 403) router.push('/more');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 1100, display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div>
        <h1 style={{ margin: '0 0 6px', fontFamily: 'Space Grotesk, sans-serif', fontWeight: 900, fontSize: 28, color: ON_SURFACE }}>
          Audit Log
        </h1>
        <p style={{ margin: 0, fontSize: 14, color: OUTLINE }}>{total} total entries</p>
      </div>

      <select
        value={entityType}
        onChange={(e) => setEntityType(e.target.value)}
        style={{ maxWidth: 220, padding: '8px 12px', borderRadius: 8, background: SURFACE_HIGH, color: ON_SURFACE, border: 'none' }}
      >
        <option value="">All entity types</option>
        <option value="Exercise">Exercise</option>
        <option value="MesocycleTemplate">MesocycleTemplate</option>
        <option value="SplitTemplate">SplitTemplate</option>
        <option value="User">User</option>
        <option value="SubstitutionPool">SubstitutionPool</option>
        <option value="KnowledgeEntry">KnowledgeEntry</option>
      </select>

      {loading ? (
        <p style={{ color: OUTLINE }}>Loading…</p>
      ) : (
        <div style={{ backgroundColor: SURFACE_HIGH, borderRadius: 14, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #3a3c44', textAlign: 'left' }}>
                <th style={{ padding: '12px 16px', color: OUTLINE }}>Admin</th>
                <th style={{ padding: '12px 16px', color: OUTLINE }}>Action</th>
                <th style={{ padding: '12px 16px', color: OUTLINE }}>Entity</th>
                <th style={{ padding: '12px 16px', color: OUTLINE }}>When</th>
              </tr>
            </thead>
            <tbody>
              {items.map((row) => (
                <tr key={row.id} style={{ borderBottom: '1px solid #33353a' }}>
                  <td style={{ padding: '12px 16px', color: ON_SURFACE }}>
                    {row.actor?.displayName ?? row.actorId.slice(0, 8)}
                  </td>
                  <td style={{ padding: '12px 16px', color: TERTIARY }}>{row.action}</td>
                  <td style={{ padding: '12px 16px', color: ON_SURFACE }}>
                    <div>{row.summary ?? row.entityId}</div>
                    <div style={{ fontSize: 11, color: OUTLINE }}>{row.entityType}</div>
                  </td>
                  <td style={{ padding: '12px 16px', color: OUTLINE }}>
                    {new Date(row.createdAt).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
