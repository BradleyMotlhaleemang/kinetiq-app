'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, ChevronLeft } from 'lucide-react';
import { useNotificationsStore } from '@/store/notifications.store';
import { notificationsApi } from '@/lib/api/notifications';
import KinetiqLogo from './KinetiqLogo';

interface AppHeaderProps {
  title?: string;
  showBack?: boolean;
  backHref?: string;
  rightAction?: React.ReactNode;
}

export default function AppHeader({
  title,
  showBack,
  backHref,
  rightAction,
}: AppHeaderProps) {
  const router = useRouter();
  const { unreadCount, setUnreadCount } = useNotificationsStore();

  useEffect(() => {
    loadUnreadCount();
    const interval = setInterval(loadUnreadCount, 30000);
    return () => clearInterval(interval);
  }, []);

  async function loadUnreadCount() {
    try {
      const res = await notificationsApi.getUnreadCount();
      setUnreadCount(res.data.count);
    } catch {
      // silent
    }
  }

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '48px 20px 16px',
      position: 'sticky',
      top: 0,
      zIndex: 40,
      backgroundColor: 'rgba(17,19,24,0.85)',
      backdropFilter: 'blur(24px)',
      WebkitBackdropFilter: 'blur(24px)',
    }}>
      {/* Left */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        {showBack && (
          <button
            onClick={() => backHref ? router.push(backHref) : router.back()}
            style={{
              width: '32px', height: '32px', borderRadius: '50%',
              backgroundColor: '#1a1c20', border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <ChevronLeft size={16} color="#c5c6d2" />
          </button>
        )}
        {!showBack && <KinetiqLogo size="sm" />}
        {title && (
          <h1 style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: '1rem', fontWeight: 600,
            letterSpacing: '-0.02em', color: '#e2e2e8', margin: 0,
          }}>
            {title}
          </h1>
        )}
      </div>

      {/* Right */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {rightAction}
        <button
          onClick={() => router.push('/notifications')}
          style={{ position: 'relative', padding: '8px', background: 'none', border: 'none', cursor: 'pointer' }}
        >
          <Bell size={20} color="#8e909c" />
          {unreadCount > 0 && (
            <span style={{
              position: 'absolute', top: '4px', right: '4px',
              width: '16px', height: '16px', borderRadius: '50%',
              backgroundColor: '#ffb4ab', color: '#690005',
              fontSize: '9px', fontWeight: 700,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'Manrope',
            }}>
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
      </div>
    </div>
  );
}