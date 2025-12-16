import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { UserProfile } from '@/models/user'

interface UserStore {
  user: UserProfile | null
  setUser: (user: UserProfile | null) => void
  isLoading: boolean
  setLoading: (isLoading: boolean) => void
}

export const useUserStore = create<UserStore>()(
  persist(
    (set) => ({
      user: null,
      setUser: (user) => set({ user }),
      isLoading: false,
      setLoading: (isLoading) => set({ isLoading })
    }),
    {
      name: 'konnektaro-fin-user',
      partialize: (state) => ({ user: state.user })
    }
  )
)
