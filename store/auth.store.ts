import { create } from 'zustand';
import { DEV_BYPASS_TOKEN } from '@/lib/auth/devBypass';

const SESSION_COOKIE = 'kinetiq_session=1; path=/; max-age=604800; SameSite=Lax';

interface AuthState {
  accessToken: string | null;
  userId: string | null;
  email: string | null;
  hydrated: boolean;
  setAccessToken: (accessToken: string) => void;
  enableDevBypass: () => void;
  setUser: (userId: string, email: string) => void;
  logout: () => void;
  isAuthenticated: () => boolean;
  hydrate: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  accessToken: null,
  userId: null,
  email: null,
  hydrated: false,

  hydrate: () => {
    const accessToken = sessionStorage.getItem('accessToken');
    set({ accessToken, hydrated: true });
  },

  setAccessToken: (accessToken) => {
    sessionStorage.setItem('accessToken', accessToken);
    document.cookie = SESSION_COOKIE;
    set({ accessToken });
  },

  enableDevBypass: () => {
    sessionStorage.setItem('accessToken', DEV_BYPASS_TOKEN);
    document.cookie = SESSION_COOKIE;
    set({
      accessToken: DEV_BYPASS_TOKEN,
      userId: 'dev-user',
      email: 'dev@local',
    });
  },

  setUser: (userId, email) => set({ userId, email }),

  logout: () => {
    sessionStorage.removeItem('accessToken');
    document.cookie = 'kinetiq_session=; path=/; max-age=0';
    set({ accessToken: null, userId: null, email: null });
  },

  isAuthenticated: () => !!get().accessToken,
}));
