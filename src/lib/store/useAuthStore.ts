import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '@/lib/auth';

interface AuthState {
    user: User | null;
    accessToken: string | null;
    setAuth: (user: User, accessToken: string) => void;
    clearAuth: () => void;
    isAuthenticated: () => boolean;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => ({
            user: null,
            accessToken: null,
            setAuth: (user, accessToken) => {
                localStorage.setItem('accessToken', accessToken);
                set({ user, accessToken });
            },
            clearAuth: () => {
                localStorage.removeItem('accessToken');
                localStorage.removeItem('auth-storage');
                set({ user: null, accessToken: null });
            },
            isAuthenticated: () => !!get().accessToken,
        }),
        {
            name: 'auth-storage',
            partialize: (state) => ({ user: state.user, accessToken: state.accessToken }),
        }
    )
);
