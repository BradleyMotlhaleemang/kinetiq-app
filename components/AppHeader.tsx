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
}

export default function AppHeader({ title, showBack, backHref }: AppHeaderProps) {
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

  function handleBack() {
    if (backHref) router.push(backHref);
    else router.back();
  }

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '48px 20px 16px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {showBack ? (
          <button
            onClick={handleBack}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              backgroundColor: '#1a1c20',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            <ChevronLeft size={16} color="#c5c6d2" />
          </button>
        ) : (
          <KinetiqLogo size="sm" />
        )}
        {title && (
          <h1 style={{
            fontFamily: "'Space Grotesk'",
            fontSize: '1rem',
            fontWeight: 600,
            letterSpacing: '-0.02em',
            color: '#e2e2e8',
          }}>
            {title}
          </h1>
        )}
      </div>

      <button
        onClick={() => router.push('/notifications')}
        style={{ position: 'relative', padding: '8px', background: 'none', border: 'none', cursor: 'pointer' }}
      >
        <Bell size={20} color="#8e909c" />
        {unreadCount > 0 && (
          <span style={{
            position: 'absolute',
            top: '4px',
            right: '4px',
            width: '16px',
            height: '16px',
            borderRadius: '50%',
            backgroundColor: '#ffb4ab',
            color: '#690005',
            fontSize: '9px',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: 'Manrope',
          }}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>
    </div>
  );
}