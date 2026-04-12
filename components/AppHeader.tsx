'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Bell } from 'lucide-react';
import { notificationsApi } from '@/lib/api/notifications';
import { useNotificationsStore } from '@/store/notifications.store';

export default function AppHeader({ title }: { title: string }) {
  const router = useRouter();
  const unreadCount = useNotificationsStore((s) => s.unreadCount);
  const setUnreadCount = useNotificationsStore((s) => s.setUnreadCount);

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
      // silent fail
    }
  }

  return (
    <div className="flex items-center justify-between px-4 pt-12 pb-4">
      <h1 className="text-xl font-bold text-white">{title}</h1>
      <button
        onClick={() => router.push('/notifications')}
        className="relative p-2"
      >
        <Bell size={22} className="text-zinc-300" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 rounded-full text-white text-xs flex items-center justify-center font-medium">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>
    </div>
  );
}
