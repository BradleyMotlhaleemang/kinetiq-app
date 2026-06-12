'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import { adminApi } from '@/lib/api/admin';
import { ApiError } from '@/lib/api/client';

const ON_SURFACE = '#e2e2e8';
const OUTLINE = '#8e909c';
const SURFACE_HIGH = '#282a30';
const PRIMARY = '#b1c5ff';

type KnowledgeEntry = {
  id: string;
  slug: string;
  category: string;
  title: string;
  summary: string;
  body: string;
  targetAudience: string;
};

export default function AdminKnowledgePage() {
  const router = useRouter();
  const role = useAuthStore((s) => s.role);
  const [entries, setEntries] = useState<KnowledgeEntry[]>([]);
  const [announcement, setAnnouncement] = useState({ message: '', enabled: false });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [draft, setDraft] = useState({ slug: '', category: 'general', title: '', summary: '', body: '' });

  useEffect(() => {
    if (role && role !== 'ADMIN') router.replace('/more');
  }, [role, router]);

  useEffect(() => {
    void load();
  }, []);

  async function load() {
    setLoading(true);
    try {
      const [kRes, aRes] = await Promise.all([
        adminApi.listKnowledge(),
        adminApi.getAnnouncement(),
      ]);
      setEntries((kRes.data ?? []) as KnowledgeEntry[]);
      setAnnouncement((aRes.data ?? { message: '', enabled: false }) as typeof announcement);
    } catch (err) {
      if (err instanceof ApiError && err.status === 403) router.push('/more');
    } finally {
      setLoading(false);
    }
  }

  async function createEntry() {
    setSaving(true);
    try {
      await adminApi.createKnowledge(draft);
      setShowCreate(false);
      setDraft({ slug: '', category: 'general', title: '', summary: '', body: '' });
      await load();
    } finally {
      setSaving(false);
    }
  }

  async function saveAnnouncement() {
    setSaving(true);
    try {
      await adminApi.updateAnnouncement(announcement);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ maxWidth: 900, display: 'flex', flexDirection: 'column', gap: 28 }}>
      <div>
        <h1 style={{ margin: '0 0 6px', fontFamily: 'Space Grotesk, sans-serif', fontWeight: 900, fontSize: 28, color: ON_SURFACE }}>
          Knowledge & Announcements
        </h1>
        <p style={{ margin: 0, fontSize: 14, color: OUTLINE }}>Content management and platform banner</p>
      </div>

      <div style={{ backgroundColor: SURFACE_HIGH, borderRadius: 14, padding: 20 }}>
        <h3 style={{ margin: '0 0 12px', color: PRIMARY, fontSize: 14 }}>Announcement banner</h3>
        <textarea
          value={announcement.message}
          onChange={(e) => setAnnouncement((a) => ({ ...a, message: e.target.value }))}
          rows={3}
          style={{ width: '100%', padding: 12, borderRadius: 8, background: '#1e2026', color: ON_SURFACE, border: 'none', marginBottom: 12 }}
        />
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, color: OUTLINE, fontSize: 13, marginBottom: 12 }}>
          <input
            type="checkbox"
            checked={announcement.enabled}
            onChange={(e) => setAnnouncement((a) => ({ ...a, enabled: e.target.checked }))}
          />
          Enabled
        </label>
        <button
          type="button"
          disabled={saving}
          onClick={() => void saveAnnouncement()}
          style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: PRIMARY, color: '#05080f', fontWeight: 700, cursor: 'pointer' }}
        >
          Save announcement
        </button>
      </div>

      <button
        type="button"
        onClick={() => setShowCreate(true)}
        style={{ alignSelf: 'flex-start', padding: '8px 16px', borderRadius: 8, border: 'none', background: PRIMARY, color: '#05080f', fontWeight: 700, cursor: 'pointer' }}
      >
        + New article
      </button>

      {showCreate && (
        <div style={{ backgroundColor: SURFACE_HIGH, borderRadius: 14, padding: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <input placeholder="Slug" value={draft.slug} onChange={(e) => setDraft({ ...draft, slug: e.target.value })} style={inputStyle} />
          <input placeholder="Title" value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} style={inputStyle} />
          <input placeholder="Summary" value={draft.summary} onChange={(e) => setDraft({ ...draft, summary: e.target.value })} style={inputStyle} />
          <textarea placeholder="Body" value={draft.body} onChange={(e) => setDraft({ ...draft, body: e.target.value })} rows={6} style={inputStyle} />
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="button" disabled={saving} onClick={() => void createEntry()} style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: PRIMARY, color: '#05080f', fontWeight: 700, cursor: 'pointer' }}>Create</button>
            <button type="button" onClick={() => setShowCreate(false)} style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid #3a3c44', background: 'transparent', color: OUTLINE, cursor: 'pointer' }}>Cancel</button>
          </div>
        </div>
      )}

      {loading ? (
        <p style={{ color: OUTLINE }}>Loading…</p>
      ) : (
        <div style={{ backgroundColor: SURFACE_HIGH, borderRadius: 14, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #3a3c44', textAlign: 'left' }}>
                <th style={{ padding: '12px 16px', color: OUTLINE }}>Title</th>
                <th style={{ padding: '12px 16px', color: OUTLINE }}>Category</th>
                <th style={{ padding: '12px 16px', color: OUTLINE }}>Slug</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => (
                <tr key={entry.id} style={{ borderBottom: '1px solid #33353a' }}>
                  <td style={{ padding: '12px 16px', color: ON_SURFACE }}>{entry.title}</td>
                  <td style={{ padding: '12px 16px', color: OUTLINE }}>{entry.category}</td>
                  <td style={{ padding: '12px 16px', color: OUTLINE }}>{entry.slug}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: 10,
  borderRadius: 8,
  background: '#1e2026',
  color: '#e2e2e8',
  border: 'none',
  fontSize: 13,
};
