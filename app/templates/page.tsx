'use client';

// ============================================================
// STATIC CONTENT BLOCK
// ============================================================

/** @static Page micro-label */
const STATIC_MICRO_LABEL = 'Programme Selection';

/** @static Page heading */
const STATIC_PAGE_TITLE = 'Training Templates';

/** @static Page subtitle */
const STATIC_PAGE_SUBTITLE = 'Proven split architectures — each one seeds a full mesocycle with auto-generated volume targets, progression logic and a deload week baked in.';

/** @static Filter chip labels */
const STATIC_FILTERS = ['All Goals', 'Hypertrophy', 'Strength', 'Powerbuilding', 'Full Body'];

/** @static Matrix quick-filter labels + default display values */
const STATIC_MATRIX = [
  { label: 'Experience', value: 'Any' },
  { label: 'Duration',   value: '6–8w' },
  { label: 'Days/Week',  value: '3–5' },
  { label: 'Equipment',  value: 'Full Gym' },
];

/** @static Modal phase breakdown — TODO: drive from template.phases API field */
const STATIC_MODAL_PHASES = [
  { label: 'Phase 01 [W1–3]', title: 'Volume Accumulation', accent: false },
  { label: 'Phase 02 [W4–6]', title: 'Intensification',    accent: false },
  { label: 'Phase 03 [W7–8]', title: 'Deload & Retest',   accent: true  },
];

// ============================================================

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import { templatesApi, type TemplateListItem } from '@/lib/api/templates';

// ── Brand tokens ─────────────────────────────────────────────
const C = {
  primary:          '#b1c5ff',
  primaryContainer: '#002560',
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

const ACCENT: Record<string, string> = {
  primary:   C.primary,
  secondary: C.secondary,
  tertiary:  C.tertiary,
};

function rgb(hex: string) {
  const r = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return r ? `${parseInt(r[1],16)},${parseInt(r[2],16)},${parseInt(r[3],16)}` : '177,197,255';
}

const DAY_COLORS = [C.primary, C.tertiary, C.secondary, '#a2e7ff'];

type Template = {
  id: string;
  name: string;
  tag: string;
  badge: string | null;
  goal: string;
  experience: string;
  durationWeeks: number;
  frequencyPerWeek: number;
  splitType: string;
  accentKey: 'primary' | 'secondary' | 'tertiary';
  description: string;
  days: string[];
  stats: Array<{ label: string; value: string }>;
  featured: boolean;
};

function mapApiTemplate(template: TemplateListItem): Template {
  const accentKey =
    template.goal.toLowerCase().includes('strength')
      ? 'secondary'
      : template.goal.toLowerCase().includes('power')
        ? 'tertiary'
        : 'primary';

  return {
    id: template.id,
    name: template.name,
    tag: template.primaryFocus,
    badge: template.badge,
    goal: template.goal,
    experience: template.level,
    durationWeeks: parseInt(template.durationWeeks.split('–')[0] ?? template.durationWeeks, 10) || 8,
    frequencyPerWeek: template.daysPerWeek,
    splitType: template.splitStyle,
    accentKey,
    description:
      template.difficultyWarning
        ? `${template.progressionType}. ${template.difficultyWarning}`
        : `${template.progressionType} template.`,
    days: template.days,
    stats: template.stats,
    featured: template.featured,
  };
}

// ── Main Page ─────────────────────────────────────────────────
export default function TemplatesPage() {
  const router = useRouter();
  const { isAuthenticated, hydrated } = useAuthStore();

  const [activeFilter, setActiveFilter] = useState('All Goals');
  const [modalTemplate, setModalTemplate] = useState<Template | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!hydrated) return;
    if (!isAuthenticated()) router.push('/auth/login');
  }, [hydrated, isAuthenticated, router]);

  useEffect(() => {
    if (!hydrated || !isAuthenticated()) return;
    let cancelled = false;
    setLoading(true);
    templatesApi
      .all()
      .then((res) => {
        if (cancelled) return;
        const list = Array.isArray(res.data) ? res.data : [];
        setTemplates(list.map(mapApiTemplate));
      })
      .catch(() => {
        if (cancelled) return;
        setTemplates([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [hydrated, isAuthenticated]);

  const closeModal = useCallback(() => setModalTemplate(null), []);

  if (!hydrated) {
    return (
      <div style={{ minHeight:'100vh', background:C.surface, display:'flex', alignItems:'center', justifyContent:'center' }}>
        <span style={{ color:C.outline, fontFamily:'Manrope,sans-serif', fontSize:13 }}>Loading…</span>
      </div>
    );
  }

  const filtered = templates
    .filter((template) =>
      activeFilter === 'All Goals'
        ? true
        : template.goal.toLowerCase().includes(activeFilter.toLowerCase()),
    )
    .filter((template) =>
      search.trim().length === 0
        ? true
        : `${template.name} ${template.tag} ${template.goal}`.toLowerCase().includes(search.toLowerCase()),
    );

  const featured = filtered.find(t => t.featured);
  const rest     = filtered.filter(t => !t.featured);

  return (
    <div style={{ minHeight:'100vh', background:C.surface, color:C.onSurface, fontFamily:'Manrope,sans-serif', paddingBottom:110, overflowX:'hidden' }}>

      {/* ── Sticky Glass Header ──────────────────────────────── */}
      <header style={{
        position:'sticky', top:0, zIndex:40,
        display:'flex', alignItems:'center', justifyContent:'space-between',
        padding:'0 20px', height:58,
        background:C.glass, backdropFilter:'blur(24px)', WebkitBackdropFilter:'blur(24px)',
        borderBottom:`1px solid ${C.outlineVariant}`,
      }}>
        <span style={{ fontFamily:'Space Grotesk,sans-serif', fontWeight:900, fontSize:20, letterSpacing:'-0.04em', background:`linear-gradient(90deg,${C.primary},${C.secondary})`, WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>
          Kinetiq
        </span>
        <button style={{ background:'none', border:'none', cursor:'pointer', padding:6 }}>
          <SearchIcon size={20} color={C.outline} />
        </button>
      </header>

      <div style={{ maxWidth:600, margin:'0 auto', padding:'26px 16px 0' }}>

        {/* ── Heading ─────────────────────────────────────────── */}
        <p style={{ margin:'0 0 6px', color:C.outline, fontSize:'0.57rem', letterSpacing:'0.24em', textTransform:'uppercase', fontWeight:700 }}>
          {/** @static */STATIC_MICRO_LABEL}
        </p>
        <h1 style={{ fontFamily:'Space Grotesk,sans-serif', fontWeight:900, fontSize:'clamp(1.85rem,6vw,2.4rem)', letterSpacing:'-0.045em', lineHeight:1.05, color:C.onSurface, margin:'0 0 10px' }}>
          {/** @static */STATIC_PAGE_TITLE}
        </h1>
        <p style={{ color:C.onSurfaceVariant, fontSize:13, lineHeight:1.6, fontWeight:500, margin:'0 0 22px' }}>
          {/** @static */STATIC_PAGE_SUBTITLE}
        </p>

        {/* ── Engine info banner ───────────────────────────────── */}
        <div style={{
          display:'flex', gap:10, padding:'11px 14px',
          background:`rgba(${rgb(C.primary)},0.06)`,
          border:`1px solid rgba(${rgb(C.primary)},0.16)`,
          borderRadius:10, marginBottom:22,
        }}>
          <span style={{ width:8, height:8, borderRadius:'50%', background:C.primary, flexShrink:0, marginTop:3, boxShadow:`0 0 8px 2px rgba(${rgb(C.primary)},0.5)` }} />
          <p style={{ margin:0, fontSize:12, color:C.onSurfaceVariant, lineHeight:1.55, fontWeight:500 }}>
            Each template creates a{' '}
            <span style={{ color:C.secondary, fontWeight:700 }}>Mesocycle block</span> and auto-schedules{' '}
            <span style={{ color:C.tertiary, fontWeight:700 }}>Workouts</span> with engine-generated prescriptions.
          </p>
        </div>

        {/* ── Search bar ───────────────────────────────────────── */}
        <div style={{ position:'relative', marginBottom:14 }}>
          <span style={{ position:'absolute', left:14, top:'50%', transform:'translateY(-50%)' }}>
            <SearchIcon size={16} color={C.outline} />
          </span>
          <input
            placeholder="Search templates…"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            style={{
              width:'100%', boxSizing:'border-box',
              background:C.surfaceLow, border:`1px solid ${C.outlineVariant}`,
              borderRadius:12, padding:'12px 14px 12px 40px',
              color:C.onSurface, fontFamily:'Manrope,sans-serif', fontSize:14, outline:'none',
            }}
          />
        </div>

        {/* ── Filter chips ─────────────────────────────────────── */}
        <div style={{ display:'flex', gap:8, overflowX:'auto', paddingBottom:4, marginBottom:12, msOverflowStyle:'none' }}>
          {STATIC_FILTERS.map(label => {
            const active = label === activeFilter;
            return (
              <button key={label} onClick={() => setActiveFilter(label)} style={{
                flexShrink:0, padding:'7px 16px', borderRadius:100,
                border: active ? 'none' : `1px solid ${C.outlineVariant}`,
                background: active ? C.primary : 'transparent',
                color: active ? '#05080f' : C.onSurfaceVariant,
                fontSize:'0.72rem', fontFamily:'Manrope,sans-serif', fontWeight:700,
                letterSpacing:'0.05em', cursor:'pointer', whiteSpace:'nowrap',
                transition:'all 0.18s ease',
              }}>
                {label}
              </button>
            );
          })}
        </div>

        {/* ── Matrix filter row ────────────────────────────────── */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:8, marginBottom:28 }}>
          {STATIC_MATRIX.map(m => (
            <div key={m.label} style={{
              background:C.surfaceLow, borderRadius:8, padding:'8px 10px',
              display:'flex', flexDirection:'column', gap:3,
              cursor:'pointer', border:`1px solid ${C.outlineVariant}`,
            }}>
              <span style={{ fontSize:'0.52rem', letterSpacing:'0.18em', textTransform:'uppercase', color:C.outline, fontWeight:700 }}>{m.label}</span>
              <span style={{ fontSize:11, fontWeight:800, color:C.tertiary }}>{m.value}</span>
            </div>
          ))}
        </div>

        {/* ── Library heading ──────────────────────────────────── */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
          <h2 style={{ fontFamily:'Space Grotesk,sans-serif', fontWeight:800, fontSize:18, letterSpacing:'-0.03em', margin:0, color:C.onSurface }}>
            Library
          </h2>
          <div style={{ display:'flex', alignItems:'center', gap:6 }}>
            <span style={{ width:7, height:7, borderRadius:'50%', background:C.tertiary, boxShadow:`0 0 10px 2px rgba(${rgb(C.tertiary)},0.6)`, display:'inline-block' }} />
            <span style={{ fontSize:'0.57rem', letterSpacing:'0.18em', textTransform:'uppercase', color:C.outline, fontWeight:700 }}>Kinetiq Engine</span>
          </div>
        </div>

        {loading && (
          <div style={{ textAlign: 'center', padding: '20px 0', color: C.outline, fontSize: 13 }}>
            Loading templates...
          </div>
        )}

        {/* ── Featured card ────────────────────────────────────── */}
        {featured && (
          <FeaturedCard
            template={featured}
            onInfo={() => setModalTemplate(featured)}
            onUse={() => router.push(`/mesocycles/new?templateId=${featured.id}`)}
          />
        )}

        {/* ── Standard cards ───────────────────────────────────── */}
        <div style={{ display:'flex', flexDirection:'column', gap:12, marginTop:12 }}>
          {rest.map(t => (
            <StandardCard
              key={t.id}
              template={t}
              expanded={expandedId === t.id}
              onToggle={() => setExpandedId(expandedId === t.id ? null : t.id)}
              onInfo={() => setModalTemplate(t)}
              onUse={() => router.push(`/mesocycles/new?templateId=${t.id}`)}
            />
          ))}
        </div>

        {filtered.length === 0 && (
          <div style={{ textAlign:'center', padding:'60px 0', color:C.outline, fontSize:13 }}>
            No templates match this filter.
          </div>
        )}
      </div>

      {/* ── Detail bottom sheet modal ────────────────────────── */}
      {modalTemplate && (
        <DetailModal
          template={modalTemplate}
          onClose={closeModal}
          onUse={() => { closeModal(); router.push(`/mesocycles/new?templateId=${modalTemplate.id}`); }}
        />
      )}
    </div>
  );
}

// ── Featured (hero) card ──────────────────────────────────────
function FeaturedCard({ template, onInfo, onUse }: { template:Template; onInfo:()=>void; onUse:()=>void }) {
  const ac = ACCENT[template.accentKey];
  return (
    <div style={{
      background:C.surfaceContainer, border:`1px solid ${C.outlineVariant}`,
      borderLeft:`3px solid ${ac}`, borderRadius:16, overflow:'hidden',
      boxShadow:`0 0 50px -14px rgba(${rgb(ac)},0.30)`,
    }}>
      {/* Image strip */}
      <div style={{ position:'relative', height:148, background:C.surfaceHighest, overflow:'hidden' }}>
        {/* gradient overlay */}
        <div style={{ position:'absolute', inset:0, background:`linear-gradient(to bottom, rgba(17,19,24,0) 30%, ${C.surfaceContainer} 100%)`, zIndex:2 }} />
        {/* faint grid texture */}
        <div style={{ position:'absolute', inset:0, opacity:0.12, backgroundImage:'repeating-linear-gradient(0deg,transparent,transparent 19px,rgba(177,197,255,0.15) 20px),repeating-linear-gradient(90deg,transparent,transparent 19px,rgba(177,197,255,0.15) 20px)' }} />
        {/* badge */}
        <div style={{ position:'absolute', top:12, left:14, zIndex:3, background:ac, color:'#05080f', fontSize:'0.57rem', letterSpacing:'0.2em', fontWeight:800, padding:'4px 11px', borderRadius:100, textTransform:'uppercase' }}>
          {template.badge ?? 'Featured'}
        </div>
        {/* info button */}
        <button onClick={onInfo} style={{ position:'absolute', top:10, right:12, zIndex:3, background:'rgba(0,0,0,0.5)', border:'none', borderRadius:8, width:32, height:32, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer' }}>
          <InfoIcon color={C.onSurfaceVariant} />
        </button>
        {/* large ghost type label in image area */}
        <div style={{ position:'absolute', bottom:18, left:18, zIndex:2 }}>
          <span style={{ fontFamily:'Space Grotesk,sans-serif', fontWeight:900, fontSize:'clamp(1.4rem,5vw,1.9rem)', letterSpacing:'-0.04em', color:C.onSurface, lineHeight:1 }}>
            {template.name}
          </span>
        </div>
      </div>

      <div style={{ padding:'16px 18px 18px' }}>
        {/* Tag row */}
        <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:10 }}>
          <span style={{ fontSize:'0.57rem', letterSpacing:'0.2em', textTransform:'uppercase', color:ac, fontWeight:700 }}>{template.tag}</span>
          <span style={{ width:3, height:3, borderRadius:'50%', background:C.outlineVariant, display:'inline-block' }} />
          <span style={{ fontSize:'0.57rem', letterSpacing:'0.15em', textTransform:'uppercase', color:C.outline, fontWeight:600 }}>{template.experience}</span>
        </div>

        <p style={{ color:C.onSurfaceVariant, fontSize:13, lineHeight:1.6, fontWeight:500, margin:'0 0 14px' }}>
          {template.description}
        </p>

        {/* Stat grid */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:8, marginBottom:14 }}>
          {template.stats.map(s => (
            <div key={s.label} style={{ background:C.surfaceHigh, borderRadius:8, padding:'7px 8px' }}>
              <span style={{ display:'block', fontSize:'0.5rem', letterSpacing:'0.16em', textTransform:'uppercase', color:C.outline, fontWeight:700 }}>{s.label}</span>
              <span style={{ display:'block', fontSize:11, fontWeight:800, color:C.onSurface, marginTop:3 }}>{s.value}</span>
            </div>
          ))}
        </div>

        {/* Day pills */}
        <div style={{ display:'flex', gap:5, flexWrap:'wrap', marginBottom:14 }}>
          {template.days.map((d,i) => { const c=DAY_COLORS[i%DAY_COLORS.length]; return (
            <span key={i} style={{ fontSize:10, fontWeight:700, color:c, background:`rgba(${rgb(c)},0.1)`, borderRadius:5, padding:'3px 9px' }}>{d}</span>
          ); })}
        </div>

        {/* Mesocycle/Workout callout */}
        <EngineCallout />

        {/* CTA row */}
        <div style={{ display:'flex', gap:10, marginTop:16 }}>
          <button onClick={onUse} style={{
            flex:1, padding:'13px 0', borderRadius:12, border:'none',
            background:`linear-gradient(135deg,${C.primary} 0%,#3a5cbf 100%)`,
            color:'#05080f', fontFamily:'Space Grotesk,sans-serif', fontWeight:900, fontSize:13, cursor:'pointer',
          }}>
            Use Template →
          </button>
          <button onClick={onInfo} style={{
            flex:1, padding:'13px 0', borderRadius:12,
            border:`1px solid ${C.outlineVariant}`, background:'transparent',
            color:C.onSurfaceVariant, fontFamily:'Manrope,sans-serif', fontWeight:700, fontSize:13, cursor:'pointer',
          }}>
            Preview
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Standard card ─────────────────────────────────────────────
function StandardCard({ template, expanded, onToggle, onInfo, onUse }: {
  template:Template; expanded:boolean;
  onToggle:()=>void; onInfo:()=>void; onUse:()=>void;
}) {
  const ac = ACCENT[template.accentKey];
  return (
    <div style={{
      background:C.surfaceContainer, border:`1px solid ${C.outlineVariant}`,
      borderLeft:`3px solid ${ac}`, borderRadius:16,
      boxShadow: expanded ? `0 0 30px -10px rgba(${rgb(ac)},0.22)` : 'none',
      transition:'box-shadow 0.3s ease',
    }}>
      {/* Always-visible header */}
      <div style={{ padding:'16px 16px 14px', cursor:'pointer' }} onClick={onToggle}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
          <div style={{ flex:1 }}>
            <div style={{ display:'flex', alignItems:'center', gap:7, marginBottom:5, flexWrap:'wrap' }}>
              <span style={{ fontSize:'0.57rem', letterSpacing:'0.2em', textTransform:'uppercase', color:ac, fontWeight:700 }}>{template.tag}</span>
              {template.badge && (
                <span style={{ fontSize:'0.5rem', letterSpacing:'0.15em', textTransform:'uppercase', color:C.onSurface, background:C.surfaceHigh, padding:'2px 7px', borderRadius:100, fontWeight:700 }}>
                  {template.badge}
                </span>
              )}
              <span style={{ width:3, height:3, borderRadius:'50%', background:C.outlineVariant, display:'inline-block' }} />
              <span style={{ fontSize:'0.57rem', letterSpacing:'0.14em', textTransform:'uppercase', color:C.outline, fontWeight:600 }}>{template.experience}</span>
            </div>
            <h3 style={{ fontFamily:'Space Grotesk,sans-serif', fontWeight:800, fontSize:'clamp(1.1rem,4vw,1.3rem)', letterSpacing:'-0.035em', color:C.onSurface, margin:0, lineHeight:1.15 }}>
              {template.name}
            </h3>
          </div>
          {/* Chevron */}
          <div style={{ width:30, height:30, borderRadius:8, background: expanded?`rgba(${rgb(ac)},0.15)`:C.surfaceHigh, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, marginLeft:10, transition:'background 0.2s' }}>
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none" style={{ transform: expanded?'rotate(180deg)':'none', transition:'transform 0.25s ease' }}>
              <path d="M2 4.5L6.5 9L11 4.5" stroke={expanded ? ac : C.outline} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </div>

        {/* Stat pills */}
        <div style={{ display:'flex', gap:7, marginTop:12, flexWrap:'wrap' }}>
          {template.stats.map(s => (
            <div key={s.label} style={{ background:C.surfaceHigh, borderRadius:7, padding:'5px 9px' }}>
              <span style={{ display:'block', fontSize:'0.5rem', letterSpacing:'0.16em', textTransform:'uppercase', color:C.outline, fontWeight:700 }}>{s.label}</span>
              <span style={{ display:'block', fontSize:11, fontWeight:800, color:C.onSurfaceVariant, marginTop:2 }}>{s.value}</span>
            </div>
          ))}
        </div>

        {/* Day strips */}
        <div style={{ display:'flex', gap:5, marginTop:10, flexWrap:'wrap' }}>
          {template.days.map((d,i) => { const c=DAY_COLORS[i%DAY_COLORS.length]; return (
            <span key={i} style={{ fontSize:10, fontWeight:700, color:c, background:`rgba(${rgb(c)},0.1)`, borderRadius:5, padding:'3px 8px' }}>{d}</span>
          ); })}
        </div>
      </div>

      {/* Expandable details */}
      {expanded && (
        <div style={{ padding:'0 16px 16px', borderTop:`1px solid ${C.outlineVariant}`, paddingTop:14 }}>
          <p style={{ color:C.onSurfaceVariant, fontSize:13, lineHeight:1.6, fontWeight:500, margin:'0 0 12px' }}>
            {template.description}
          </p>
          <EngineCallout />
          <div style={{ display:'flex', gap:10, marginTop:14 }}>
            <button onClick={e => { e.stopPropagation(); onUse(); }} style={{
              flex:1, padding:'12px 0', borderRadius:12, border:'none',
              background:`linear-gradient(135deg,${C.primary} 0%,#3a5cbf 100%)`,
              color:'#05080f', fontFamily:'Space Grotesk,sans-serif', fontWeight:900, fontSize:13, cursor:'pointer',
            }}>
              Use Template →
            </button>
            <button onClick={e => { e.stopPropagation(); onInfo(); }} style={{
              flex:1, padding:'12px 0', borderRadius:12,
              border:`1px solid ${C.outlineVariant}`, background:'transparent',
              color:C.onSurfaceVariant, fontFamily:'Manrope,sans-serif', fontWeight:700, fontSize:13, cursor:'pointer',
            }}>
              Preview
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Engine callout component — mesocycle + workout relationship ─
function EngineCallout() {
  return (
    <div style={{
      display:'grid', gridTemplateColumns:'1fr 1fr', gap:0,
      background:C.surfaceLow, border:`1px solid ${C.outlineVariant}`,
      borderRadius:10, overflow:'hidden',
    }}>
      <div style={{ padding:'10px 12px' }}>
        <span style={{ display:'block', fontSize:'0.52rem', letterSpacing:'0.2em', textTransform:'uppercase', color:C.secondary, fontWeight:700, marginBottom:3 }}>Creates Mesocycle</span>
        <span style={{ fontSize:11, color:C.onSurfaceVariant, fontWeight:500, lineHeight:1.4 }}>Auto-configured block · MEV→MRV volume ramp</span>
      </div>
      <div style={{ borderLeft:`1px solid ${C.outlineVariant}`, padding:'10px 12px' }}>
        <span style={{ display:'block', fontSize:'0.52rem', letterSpacing:'0.2em', textTransform:'uppercase', color:C.tertiary, fontWeight:700, marginBottom:3 }}>Generates Workouts</span>
        <span style={{ fontSize:11, color:C.onSurfaceVariant, fontWeight:500, lineHeight:1.4 }}>Engine-prescribed sets each session</span>
      </div>
    </div>
  );
}

// ── Detail modal (bottom sheet) ───────────────────────────────
function DetailModal({ template, onClose, onUse }: { template:Template; onClose:()=>void; onUse:()=>void }) {
  const ac = ACCENT[template.accentKey];
  return (
    <div
      style={{ position:'fixed', inset:0, zIndex:60, display:'flex', alignItems:'flex-end', justifyContent:'center' }}
      onClick={onClose}
    >
      {/* Backdrop */}
      <div style={{ position:'absolute', inset:0, background:'rgba(8,10,16,0.85)', backdropFilter:'blur(14px)', WebkitBackdropFilter:'blur(14px)' }} />

      {/* Sheet */}
      <div
        onClick={e => e.stopPropagation()}
        style={{
          position:'relative', width:'100%', maxWidth:600,
          background:C.surfaceContainer, borderRadius:'20px 20px 0 0',
          maxHeight:'88vh', overflowY:'auto',
          border:`1px solid ${C.outlineVariant}`, borderBottom:'none',
        }}
      >
        {/* Drag handle */}
        <div style={{ display:'flex', justifyContent:'center', padding:'12px 0 0' }}>
          <div style={{ width:40, height:4, borderRadius:2, background:C.outlineVariant }} />
        </div>

        {/* Sheet header */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 20px 14px', background:C.surfaceLow, borderBottom:`1px solid ${C.outlineVariant}` }}>
          <div>
            <p style={{ margin:'0 0 2px', fontSize:'0.57rem', letterSpacing:'0.2em', textTransform:'uppercase', color:ac, fontWeight:700 }}>{template.tag}</p>
            <h4 style={{ margin:0, fontFamily:'Space Grotesk,sans-serif', fontWeight:900, fontSize:20, letterSpacing:'-0.04em', color:C.onSurface }}>{template.name}</h4>
          </div>
          <button onClick={onClose} style={{ background:C.surfaceHigh, border:'none', borderRadius:8, width:32, height:32, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer' }}>
            <CloseIcon />
          </button>
        </div>

        <div style={{ padding:20 }}>
          <p style={{ color:C.onSurfaceVariant, fontSize:13, lineHeight:1.6, fontWeight:500, margin:'0 0 20px' }}>
            {template.description}
          </p>

          {/* Phase architecture */}
          <SectionLabel text="Block Architecture" />
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8, marginBottom:20 }}>
            {STATIC_MODAL_PHASES.map((ph,i) => (
              <div key={i} style={{ background:C.surfaceLow, borderRadius:10, padding:'10px 12px', borderLeft: ph.accent?`3px solid ${C.tertiary}`:`3px solid ${C.outlineVariant}` }}>
                <span style={{ display:'block', fontSize:'0.5rem', letterSpacing:'0.15em', textTransform:'uppercase', color: ph.accent?C.tertiary:C.outline, fontWeight:700, marginBottom:4 }}>{ph.label}</span>
                <span style={{ fontSize:11, fontWeight:700, color:C.onSurface }}>{ph.title}</span>
              </div>
            ))}
          </div>

          {/* What gets created */}
          <SectionLabel text="What Gets Created" />
          <div style={{ display:'flex', flexDirection:'column', gap:8, marginBottom:20 }}>
            <CreatesRow color={C.secondary} symbol="◈" label="1 Mesocycle block" sub={`${template.durationWeeks} weeks · ${template.frequencyPerWeek} sessions/week · MEV→MRV volume progression`} />
            <CreatesRow color={C.tertiary}  symbol="⊞" label={`${template.days.length} Workout templates`} sub="Engine delivers prescription per session — load, reps, RPE, tempo" />
            <CreatesRow color={C.primary}   symbol="◉" label="Fatigue tracking"   sub="SFL accumulates per-session · deload auto-fires at threshold" />
          </div>

          {/* Stats */}
          <SectionLabel text="At a Glance" />
          <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:8, marginBottom:20 }}>
            {template.stats.map(s => (
              <div key={s.label} style={{ background:C.surfaceLow, borderRadius:10, padding:'10px 14px' }}>
                <span style={{ display:'block', fontSize:'0.52rem', letterSpacing:'0.18em', textTransform:'uppercase', color:C.outline, fontWeight:700 }}>{s.label}</span>
                <span style={{ display:'block', fontSize:17, fontWeight:900, color:C.onSurface, fontFamily:'Space Grotesk,sans-serif', letterSpacing:'-0.025em', marginTop:4 }}>{s.value}</span>
              </div>
            ))}
          </div>

          {/* Weekly matrix */}
          <SectionLabel text="Weekly Matrix" />
          <div style={{ display:'flex', flexDirection:'column', gap:7, marginBottom:24 }}>
            {template.days.map((d,i) => {
              const c = DAY_COLORS[i % DAY_COLORS.length];
              return (
                <div key={i} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', background:C.surfaceLow, borderRadius:10, padding:'11px 14px', borderLeft:`3px solid ${c}` }}>
                  <span style={{ fontSize:13, fontWeight:600, color:C.onSurface }}>Day {i+1}: {d}</span>
                  <span style={{ fontSize:11, color:c, fontWeight:800 }}>→</span>
                </div>
              );
            })}
          </div>

          <button onClick={onUse} style={{
            width:'100%', padding:'15px 0', borderRadius:14, border:'none',
            background:`linear-gradient(135deg,${C.primary} 0%,#3a5cbf 100%)`,
            color:'#05080f', fontFamily:'Space Grotesk,sans-serif', fontWeight:900,
            fontSize:15, letterSpacing:'0.01em', cursor:'pointer',
          }}>
            Initialise Protocol →
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Small shared pieces ───────────────────────────────────────
function SectionLabel({ text }: { text: string }) {
  return <p style={{ margin:'0 0 10px', fontSize:'0.57rem', letterSpacing:'0.22em', textTransform:'uppercase', color:C.outline, fontWeight:700 }}>{text}</p>;
}

function CreatesRow({ color, symbol, label, sub }: { color:string; symbol:string; label:string; sub:string }) {
  return (
    <div style={{ display:'flex', gap:12, alignItems:'flex-start', background:C.surfaceLow, borderRadius:10, padding:'10px 12px' }}>
      <span style={{ fontSize:16, color, flexShrink:0, marginTop:1 }}>{symbol}</span>
      <div>
        <span style={{ display:'block', fontSize:12, fontWeight:700, color:C.onSurface }}>{label}</span>
        <span style={{ display:'block', fontSize:11, fontWeight:500, color:C.onSurfaceVariant, marginTop:2, lineHeight:1.45 }}>{sub}</span>
      </div>
    </div>
  );
}

function SearchIcon({ size=20, color=C.outline }: { size?:number; color?:string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <circle cx="9" cy="9" r="5.5" stroke={color} strokeWidth="1.6"/>
      <path d="M13.5 13.5L17 17" stroke={color} strokeWidth="1.6" strokeLinecap="round"/>
    </svg>
  );
}

function InfoIcon({ color=C.outline }: { color?:string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="6.5" stroke={color} strokeWidth="1.4"/>
      <path d="M8 7v4" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
      <circle cx="8" cy="5.5" r="0.75" fill={color}/>
    </svg>
  );
}

function CloseIcon({ color=C.outline }: { color?:string }) {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path d="M2 2L12 12M12 2L2 12" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
    </svg>
  );
}