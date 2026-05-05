import { create } from 'zustand';
import { DEV_BYPASS_TOKEN } from '@/lib/auth/devBypass';

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  userId: string | null;
  email: string | null;
  hydrated: boolean;
  setTokens: (accessToken: string, refreshToken: string) => void;
  enableDevBypass: () => void;
  setUser: (userId: string, email: string) => void;
  logout: () => void;
  isAuthenticated: () => boolean;
  hydrate: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  accessToken: null,
  refreshToken: null,
  userId: null,
  email: null,
  hydrated: false,

  hydrate: () => {
    const accessToken = sessionStorage.getItem('accessToken');
    const refreshToken = sessionStorage.getItem('refreshToken');
    set({ accessToken, refreshToken, hydrated: true });
  },

  setTokens: (accessToken, refreshToken) => {
    sessionStorage.setItem('accessToken', accessToken);
    sessionStorage.setItem('refreshToken', refreshToken);
    set({ accessToken, refreshToken });
  },

  enableDevBypass: () => {
    sessionStorage.setItem('accessToken', DEV_BYPASS_TOKEN);
    sessionStorage.removeItem('refreshToken');
    set({
      accessToken: DEV_BYPASS_TOKEN,
      refreshToken: null,
      userId: 'dev-user',
      email: 'dev@local',
    });
  },

  setUser: (userId, email) => set({ userId, email }),

  logout: () => {
    sessionStorage.removeItem('accessToken');
    sessionStorage.removeItem('refreshToken');
    set({ accessToken: null, refreshToken: null, userId: null, email: null });
  },

  isAuthenticated: () => !!get().accessToken,
}));
