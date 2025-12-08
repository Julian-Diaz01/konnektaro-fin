'use client'

import { useEffect, type ReactNode } from 'react'
import { subscribeToAuthChanges } from '@/lib/firebase'
import { useAuthStore } from '@/stores/authStore'
import { setAuthCookie, removeAuthCookie } from '@/lib/cookies'

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider ({ children }: AuthProviderProps) {
  const { setUser } = useAuthStore()

  useEffect(() => {
    const unsubscribe = subscribeToAuthChanges(async (user) => {
      if (user) {
        try {
          const token = await user.getIdToken()
          setAuthCookie(token)
        } catch (error) {
          console.error('Failed to get auth token:', error)
        }
      } else {
        removeAuthCookie()
      }

      setUser(user)
    })

    return () => unsubscribe()
  }, [setUser])

  return <>{children}</>
}
