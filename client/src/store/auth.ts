// Auth Store - Zustand
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;
  bio?: string;
  role: string;
}

interface AuthState {
  token: string | null;
  user: User | null;
  isLoading: boolean;
  rememberMe: boolean;
  setAuth: (token: string, user: User) => void;
  updateUser: (user: Partial<User>) => void;
  setLoading: (loading: boolean) => void;
  setRememberMe: (remember: boolean) => void;
  logout: () => void;
}

// Safe localStorage wrapper for environments where it may not be available
// Node.js test environments may define localStorage without full Storage API
function safeLocalStorage(): Storage | null {
  try {
    if (
      typeof localStorage !== 'undefined' &&
      typeof localStorage.getItem === 'function'
    ) {
      return localStorage;
    }
    return null;
  } catch {
    return null;
  }
}

// Check if user previously chose "remember me" (stored in localStorage)
const wasRemembered =
  safeLocalStorage()?.getItem('boxcord-remember-me') === 'true';

function getStorage() {
  return wasRemembered ? safeLocalStorage() || sessionStorage : sessionStorage;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      isLoading: false,
      rememberMe: wasRemembered,
      setAuth: (token, user) => set({ token, user }),
      updateUser: (updatedFields) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...updatedFields } : null
        })),
      setLoading: (loading) => set({ isLoading: loading }),
      setRememberMe: (remember) => {
        safeLocalStorage()?.setItem('boxcord-remember-me', String(remember));
        set({ rememberMe: remember });
      },
      logout: () => {
        // Clear Cognito tokens from both storages
        const ls = safeLocalStorage();
        const keys = ls
          ? Object.keys(ls).filter((k) =>
              k.startsWith('CognitoIdentityServiceProvider')
            )
          : [];
        keys.forEach((k) => {
          ls?.removeItem(k);
          sessionStorage.removeItem(k);
        });
        set({ token: null, user: null });
      }
    }),
    {
      name: 'boxcord-auth',
      storage: createJSONStorage(() => getStorage())
    }
  )
);
