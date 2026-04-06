import { create } from 'zustand';

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  userId: string | null;
  email: string | null;
  setTokens: (accessToken: string, refreshToken: string) => void;
  setUser: (userId: string, email: string) => void;
  logout: () => void;
  isAuthenticated: () => boolean;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  accessToken: typeof window !== 'undefined'
    ? sessionStorage.getItem('accessToken')
    : null,
  refreshToken: typeof window !== 'undefined'
    ? sessionStorage.getItem('refreshToken')
    : null,
  userId: null,
  email: null,

  setTokens: (accessToken, refreshToken) => {
    sessionStorage.setItem('accessToken', accessToken);
    sessionStorage.setItem('refreshToken', refreshToken);
    set({ accessToken, refreshToken });
  },

  setUser: (userId, email) => set({ userId, email }),

  logout: () => {
    sessionStorage.removeItem('accessToken');
    sessionStorage.removeItem('refreshToken');
    set({ accessToken: null, refreshToken: null, userId: null, email: null });
  },

  isAuthenticated: () => !!get().accessToken,
}));