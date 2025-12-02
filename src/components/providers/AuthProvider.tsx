'use client'

import { useEffect, type ReactNode } from 'react'
import { subscribeToAuthChanges } from '@/lib/firebase'
import { useAuthStore } from '@/stores/authStore'

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider ({ children }: AuthProviderProps) {
  const { setUser, setLoading } = useAuthStore()

  useEffect(() => {
    setLoading(true)

    const unsubscribe = subscribeToAuthChanges((user) => {
      setUser(user)
    })

    return () => unsubscribe()
  }, [setUser, setLoading])

  return <>{children}</>
}


