// Notification Store - Global toast notification management
import { create } from 'zustand';
import type { ToastVariant } from '../components/notification/Toast';

export interface ToastItem {
  id: string;
  message: string;
  variant: ToastVariant;
  duration: number;
}

interface NotificationState {
  toasts: ToastItem[];
  addToast: (
    message: string,
    variant?: ToastVariant,
    duration?: number
  ) => void;
  removeToast: (id: string) => void;
  clearAll: () => void;
  // Convenience methods
  success: (message: string, duration?: number) => void;
  error: (message: string, duration?: number) => void;
  info: (message: string, duration?: number) => void;
  warning: (message: string, duration?: number) => void;
}

let toastId = 0;

export const useNotificationStore = create<NotificationState>((set) => ({
  toasts: [],

  addToast: (message, variant = 'info', duration = 5000) => {
    const id = `toast-${++toastId}`;
    set((state) => ({
      toasts: [...state.toasts.slice(-4), { id, message, variant, duration }]
    }));
  },

  removeToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id)
    }));
  },

  clearAll: () => set({ toasts: [] }),

  success: (message, duration = 5000) => {
    const id = `toast-${++toastId}`;
    set((state) => ({
      toasts: [
        ...state.toasts.slice(-4),
        { id, message, variant: 'success', duration }
      ]
    }));
  },

  error: (message, duration = 5000) => {
    const id = `toast-${++toastId}`;
    set((state) => ({
      toasts: [
        ...state.toasts.slice(-4),
        { id, message, variant: 'error', duration }
      ]
    }));
  },

  info: (message, duration = 5000) => {
    const id = `toast-${++toastId}`;
    set((state) => ({
      toasts: [
        ...state.toasts.slice(-4),
        { id, message, variant: 'info', duration }
      ]
    }));
  },

  warning: (message, duration = 5000) => {
    const id = `toast-${++toastId}`;
    set((state) => ({
      toasts: [
        ...state.toasts.slice(-4),
        { id, message, variant: 'warning', duration }
      ]
    }));
  }
}));

// Convenience function for use outside React components
export const toast = {
  success: (message: string, duration?: number) =>
    useNotificationStore.getState().success(message, duration),
  error: (message: string, duration?: number) =>
    useNotificationStore.getState().error(message, duration),
  info: (message: string, duration?: number) =>
    useNotificationStore.getState().info(message, duration),
  warning: (message: string, duration?: number) =>
    useNotificationStore.getState().warning(message, duration)
};
