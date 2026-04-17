'use client';

import AppHeader from '@/components/AppHeader';
import { useRouter } from 'next/navigation';
import { BarChart2, ClipboardList, BookOpen, User } from 'lucide-react';

const MORE_ITEMS = [
  { icon: BarChart2, label: 'Analytics', description: 'e1RM trends, volume, PRs', href: '/analytics' },
  { icon: ClipboardList, label: 'History', description: 'Past workout sessions', href: '/history' },
  { icon: BookOpen, label: 'Knowledge', description: 'Training education', href: '/knowledge' },
  { icon: User, label: 'Profile', description: 'Account and settings', href: '/profile' },
];

export default function MorePage() {
  const router = useRouter();

  return (
    <div style={{ minHeight: '100dvh', backgroundColor: '#111318', paddingBottom: '96px' }}>
      <AppHeader title="More" />
      <div style={{ maxWidth: '480px', margin: '0 auto', padding: '0 20px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {MORE_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.href}
                onClick={() => router.push(item.href)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  padding: '16px 20px',
                  backgroundColor: '#1a1c20',
                  borderTopRightRadius: '0.75rem',
                  borderBottomLeftRadius: '0px',
                  borderTopLeftRadius: '0.125rem',
                  borderBottomRightRadius: '0.125rem',
                  border: 'none',
                  cursor: 'pointer',
                  width: '100%',
                  textAlign: 'left',
                }}
              >
                <div style={{
                  width: '40px', height: '40px',
                  borderRadius: '10px',
                  backgroundColor: 'rgba(177,197,255,0.08)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <Icon size={18} color="#b1c5ff" />
                </div>
                <div>
                  <p style={{
                    fontFamily: "'Space Grotesk', sans-serif",
                    fontSize: '0.9rem', fontWeight: 600,
                    letterSpacing: '-0.02em', color: '#e2e2e8',
                    margin: 0,
                  }}>
                    {item.label}
                  </p>
                  <p style={{
                    fontFamily: 'Manrope', fontSize: '0.75rem',
                    color: '#444650', margin: '2px 0 0',
                  }}>
                    {item.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}