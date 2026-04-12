import { create } from 'zustand';

interface NotificationsState {
  unreadCount: number;
  setUnreadCount: (count: number) => void;
  decrementUnreadCount: () => void;
  clearUnreadCount: () => void;
}

export const useNotificationsStore = create<NotificationsState>((set) => ({
  unreadCount: 0,
  setUnreadCount: (count) => set({ unreadCount: Math.max(0, count) }),
  decrementUnreadCount: () =>
    set((state) => ({ unreadCount: Math.max(0, state.unreadCount - 1) })),
  clearUnreadCount: () => set({ unreadCount: 0 }),
}));
