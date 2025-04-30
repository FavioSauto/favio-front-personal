import { StateCreator } from 'zustand';

export interface ErrorSlice {
  error: string | null;
  isErrorModalOpen: boolean;
  errorActions: {
    setError: (message: string) => void;
    clearError: () => void;
  };
}

export const createErrorSlice: StateCreator<
  ErrorSlice,
  [], // No special middlewares assumed for this basic slice
  [],
  ErrorSlice
> = (set) => ({
  error: null,
  isErrorModalOpen: false,
  errorActions: {
    setError: (message: string) => set({ error: message, isErrorModalOpen: true }),
    clearError: () => set({ error: null, isErrorModalOpen: false }),
  },
});
