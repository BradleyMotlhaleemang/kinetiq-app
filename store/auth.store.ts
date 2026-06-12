import { create } from 'zustand';
import { DEV_BYPASS_TOKEN } from '@/lib/auth/devBypass';

const SESSION_COOKIE = 'kinetiq_session=1; path=/; max-age=604800; SameSite=Lax';

function setRoleCookie(role: UserRole | null) {
  if (typeof document === 'undefined') return;
  if (role) {
    document.cookie = `kinetiq_role=${role}; path=/; max-age=604800; SameSite=Lax`;
  } else {
    document.cookie = 'kinetiq_role=; path=/; max-age=0';
  }
}

export type UserRole = 'USER' | 'ADMIN';

interface AuthState {
  accessToken: string | null;
  userId: string | null;
  email: string | null;
  displayName: string | null;
  role: UserRole | null;
  hydrated: boolean;
  setAccessToken: (accessToken: string) => void;
  enableDevBypass: () => void;
  setUser: (
    userId: string,
    email: string,
    displayName?: string | null,
    role?: UserRole | null,
  ) => void;
  setRole: (role: UserRole | null) => void;
  setDisplayName: (displayName: string | null) => void;
  logout: () => void;
  isAuthenticated: () => boolean;
  isAdmin: () => boolean;
  hydrate: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  accessToken: null,
  userId: null,
  email: null,
  displayName: null,
  role: null,
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

  setUser: (userId, email, displayName, role) => {
    if (role !== undefined) setRoleCookie(role);
    set({
      userId,
      email,
      ...(displayName !== undefined ? { displayName } : {}),
      ...(role !== undefined ? { role } : {}),
    });
  },

  setRole: (role) => {
    setRoleCookie(role);
    set({ role });
  },

  setDisplayName: (displayName) => set({ displayName }),

  logout: () => {
    sessionStorage.removeItem('accessToken');
    document.cookie = 'kinetiq_session=; path=/; max-age=0';
    setRoleCookie(null);
    set({
      accessToken: null,
      userId: null,
      email: null,
      displayName: null,
      role: null,
    });
  },

  isAuthenticated: () => !!get().accessToken,

  isAdmin: () => get().role === 'ADMIN',
}));
