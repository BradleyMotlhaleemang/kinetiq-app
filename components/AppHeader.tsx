'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, ChevronLeft } from 'lucide-react';
import { useNotificationsStore } from '@/store/notifications.store';
import { notificationsApi } from '@/lib/api/notifications';
import KinetiqLogo from '@/components/KinetiqLogo';

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
    <header style={{
      position: 'sticky',
      top: 0,
      zIndex: 40,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 20px',
      height: 58,
      background: 'rgba(22,24,32,0.80)',
      backdropFilter: 'blur(24px)',
      WebkitBackdropFilter: 'blur(24px)',
      borderBottom: '1px solid #3a3c44',
    }}>
      {/* Left */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        {showBack && (
          <button
            onClick={() => backHref ? router.push(backHref) : router.back()}
            style={{
              width: '32px', height: '32px', borderRadius: '50%',
              backgroundColor: '#282a30', border: '1px solid #3a3c44', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <ChevronLeft size={16} color="#c5c6d2" />
          </button>
        )}
        <KinetiqLogo />
        {title && (
          <h1 style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: '20px', fontWeight: 900,
            letterSpacing: '-0.04em', color: '#e2e2e8', margin: 0,
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
          style={{ position: 'relative', padding: 6, background: 'none', border: 'none', cursor: 'pointer' }}
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
    </header>
  );
}