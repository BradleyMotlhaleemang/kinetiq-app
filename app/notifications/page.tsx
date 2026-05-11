'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AppHeader from '@/components/AppHeader';
import { Bell, Check, ChevronRight } from 'lucide-react';
import { notificationsApi } from '@/lib/api/notifications';
import { ApiError } from '@/lib/api/client';
import { useNotificationsStore } from '@/store/notifications.store';

interface NotificationItem {
  id: string;
  type: string;
  isRead: boolean;
  createdAt: string;
  redirectRoute?: string;
}

const TYPE_LABELS: Record<string, string> = {
  BIOFEEDBACK_PROMPT: 'Log your recovery',
  RECOVERY_WARNING: 'Recovery warning',
  PAIN_REVIEW_PROMPT: 'Joint pain check-in',
  WORKOUT_REMINDER: 'Time to train',
  WEEKLY_FEEDBACK_PROMPT: 'Weekly check-in ready',
  MEAL_REMINDER: 'Log your nutrition',
  WEIGHT_LOG_REMINDER: 'Log your weight',
};

const TYPE_DESCRIPTIONS: Record<string, string> = {
  BIOFEEDBACK_PROMPT: 'How did your body feel after your last session?',
  RECOVERY_WARNING: 'Your fatigue load is elevated. Consider a deload.',
  PAIN_REVIEW_PROMPT: 'Review your joint pain status and substitutions.',
  WORKOUT_REMINDER: 'Your next session is scheduled for today.',
  WEEKLY_FEEDBACK_PROMPT: 'Reflect on your training week.',
  MEAL_REMINDER: 'Track your nutrition to improve readiness accuracy.',
  WEIGHT_LOG_REMINDER: 'Log your weight to keep your profile accurate.',
};

const TYPE_COLORS: Record<string, string> = {
  RECOVERY_WARNING: 'border-red-800 bg-red-950',
  PAIN_REVIEW_PROMPT: 'border-amber-800 bg-amber-950',
  BIOFEEDBACK_PROMPT: 'border-blue-800 bg-blue-950',
  WEEKLY_FEEDBACK_PROMPT: 'border-purple-800 bg-purple-950',
  WORKOUT_REMINDER: 'border-green-800 bg-green-950',
  MEAL_REMINDER: 'border-zinc-700 bg-zinc-900',
  WEIGHT_LOG_REMINDER: 'border-zinc-700 bg-zinc-900',
};

export default function NotificationsPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const setUnreadCount = useNotificationsStore((s) => s.setUnreadCount);
  const decrementUnreadCount = useNotificationsStore((s) => s.decrementUnreadCount);
  const clearUnreadCount = useNotificationsStore((s) => s.clearUnreadCount);

  useEffect(() => {
    void loadNotifications();
  }, []);

  async function loadNotifications() {
    try {
      const res = await notificationsApi.getFeed();
      const feed = (res.data.data ?? []) as NotificationItem[];
      setNotifications(feed);
      setUnreadCount(feed.filter((notification) => !notification.isRead).length);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setNotifications([]);
        setUnreadCount(0);
        return;
      }
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleTap(notification: NotificationItem) {
    try {
      if (!notification.isRead) {
        await notificationsApi.markRead(notification.id);
        setNotifications((prev) =>
          prev.map((item) =>
            item.id === notification.id ? { ...item, isRead: true } : item,
          ),
        );
        decrementUnreadCount();
      }

      router.push(notification.redirectRoute ?? '/dashboard');
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        return;
      }
      console.error(err);
    }
  }

  async function markAllRead() {
    try {
      await notificationsApi.markAllRead();
      setNotifications((prev) =>
        prev.map((notification) => ({ ...notification, isRead: true })),
      );
      clearUnreadCount();
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        return;
      }
      console.error(err);
    }
  }

  const unreadCount = notifications.filter((notification) => !notification.isRead).length;

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <p className="text-zinc-400 text-sm">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black px-4 pt-12 pb-24">
      <div className="max-w-sm mx-auto space-y-6">
        <AppHeader title="Notifications" showBack backHref="/dashboard" />
        {unreadCount > 0 && (
          <div className="flex items-center justify-between">
            <p className="text-zinc-400 text-sm">{unreadCount} unread</p>
            <button
              onClick={markAllRead}
              className="flex items-center gap-1 text-zinc-400 text-xs border border-zinc-700 rounded-lg px-3 py-2 hover:bg-zinc-900 transition"
            >
              <Check size={12} />
              Mark all read
            </button>
          </div>
        )}

        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <div className="w-16 h-16 rounded-full bg-zinc-900 flex items-center justify-center">
              <Bell size={28} className="text-zinc-600" />
            </div>
            <p className="text-zinc-400 text-sm">No notifications yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((notification) => (
              <button
                key={notification.id}
                onClick={() => handleTap(notification)}
                className={`w-full text-left rounded-xl p-4 border transition hover:opacity-90 ${
                  TYPE_COLORS[notification.type] ?? 'border-zinc-700 bg-zinc-900'
                } ${notification.isRead ? 'opacity-60' : 'opacity-100'}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      {!notification.isRead && (
                        <span className="w-2 h-2 rounded-full bg-white flex-shrink-0" />
                      )}
                      <p className="text-white text-sm font-medium">
                        {TYPE_LABELS[notification.type] ?? notification.type}
                      </p>
                    </div>
                    <p className="text-zinc-300 text-xs leading-relaxed">
                      {TYPE_DESCRIPTIONS[notification.type] ?? 'Tap to view'}
                    </p>
                    <p className="text-zinc-500 text-xs mt-2">
                      {new Date(notification.createdAt).toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                  <ChevronRight
                    size={16}
                    className="text-zinc-400 flex-shrink-0 mt-0.5"
                  />
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
