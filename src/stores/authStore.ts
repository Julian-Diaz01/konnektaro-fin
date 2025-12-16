import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User as FirebaseUser } from '@/lib/firebase'

interface AuthState {
  firebaseUser: FirebaseUser | null
  isAuthLoading: boolean
  isAuthenticated: boolean
  setFirebaseUser: (user: FirebaseUser | null) => void
  setLoading: (loading: boolean) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      firebaseUser: null,
      isAuthLoading: true,
      isAuthenticated: false,
      setFirebaseUser: (firebaseUser) => set({
        firebaseUser: firebaseUser,
        isAuthenticated: !!firebaseUser,
        isAuthLoading: false
      }),
      setLoading: (isAuthLoading) => set({ isAuthLoading }),
      logout: () => set({
        firebaseUser: null,
        isAuthenticated: false,
        isAuthLoading: false
      })
    }),
    {
      name: 'konnektaro-fin-auth',
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated
      })
    }
  )
)
