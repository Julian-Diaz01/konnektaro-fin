'use client'

import { useEffect, type ReactNode } from 'react'
import { subscribeToAuthChanges } from '@/lib/firebase'
import { useAuthStore } from '@/stores/authStore'
import { useUserStore } from '@/stores/userStore'
import { setAuthCookie, removeAuthCookie } from '@/lib/cookies'
import { syncUserProfile } from '@/lib/userManagemenent'

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider ({ children }: AuthProviderProps) {
  const { setFirebaseUser } = useAuthStore()
  const { setUser: clearUserProfile } = useUserStore()

  useEffect(() => {
    const unsubscribe = subscribeToAuthChanges(async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const token = await firebaseUser.getIdToken()
          setAuthCookie(token)

          await syncUserProfile()
        } catch (error) {
          console.error('Failed to get auth token or user profile:', error)
        }
      } else {
        removeAuthCookie()
        clearUserProfile(null)
      }

      setFirebaseUser(firebaseUser)
    })

    return () => unsubscribe()
  }, [setFirebaseUser, clearUserProfile])

  return <>{children}</>
}
