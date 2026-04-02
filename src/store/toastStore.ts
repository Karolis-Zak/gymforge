import { create } from 'zustand'

export interface ToastMessage {
  id: string
  message: string
  type: 'error' | 'success' | 'info'
}

interface ToastState {
  toasts: ToastMessage[]
  addToast: (message: string, type: 'error' | 'success' | 'info') => void
  removeToast: (id: string) => void
}

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  addToast: (message, type) =>
    set((state) => ({
      toasts: [...state.toasts, { id: `${Date.now()}-${Math.random()}`, message, type }],
    })),
  removeToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),
}))

export function useToast() {
  const addToast = useToastStore((state) => state.addToast)

  return {
    error: (message: string) => addToast(message, 'error'),
    success: (message: string) => addToast(message, 'success'),
    info: (message: string) => addToast(message, 'info'),
  }
}
