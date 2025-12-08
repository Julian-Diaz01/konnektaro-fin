'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/authStore'
import { getAuthCookie } from '@/lib/cookies'

interface ProtectedRouteProps {
  children: React.ReactNode
}

export function ProtectedRoute ({ children }: ProtectedRouteProps) {
  const router = useRouter()
  const { isAuthenticated, isLoading } = useAuthStore()

  useEffect(() => {
    if (isLoading) return

    const authToken = getAuthCookie()
    const hasAuth = isAuthenticated || !!authToken

    if (!hasAuth) {
      router.push('/login')
    }
  }, [isAuthenticated, isLoading, router])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  const authToken = getAuthCookie()
  const hasAuth = isAuthenticated || !!authToken

  if (!hasAuth) {
    return null
  }

  return <>{children}</>
}
