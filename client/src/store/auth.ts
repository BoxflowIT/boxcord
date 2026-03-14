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

// Check if user previously chose "remember me" (stored in localStorage)
const wasRemembered = localStorage.getItem('boxcord-remember-me') === 'true';

function getStorage() {
  return wasRemembered ? localStorage : sessionStorage;
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
        localStorage.setItem('boxcord-remember-me', String(remember));
        set({ rememberMe: remember });
      },
      logout: () => {
        // Clear Cognito tokens from both storages
        const keys = Object.keys(localStorage).filter((k) =>
          k.startsWith('CognitoIdentityServiceProvider')
        );
        keys.forEach((k) => {
          localStorage.removeItem(k);
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
