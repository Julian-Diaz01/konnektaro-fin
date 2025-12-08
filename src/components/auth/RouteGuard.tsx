'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuthStore } from '@/stores/authStore'
import { getAuthCookie } from '@/lib/cookies'

const protectedRoutes = ['/dashboard']
const authRoutes = ['/login', '/register']

interface RouteGuardProps {
  children: React.ReactNode
}

export function RouteGuard ({ children }: RouteGuardProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { isAuthenticated, isLoading } = useAuthStore()

  useEffect(() => {
    if (isLoading) return

    const authToken = getAuthCookie()
    const hasAuth = isAuthenticated || !!authToken

    const isProtectedRoute = protectedRoutes.some(route =>
      pathname.startsWith(route)
    )

    const isAuthRoute = authRoutes.some(route =>
      pathname.startsWith(route)
    )

    if (isProtectedRoute && !hasAuth) {
      const loginUrl = `/login?callbackUrl=${encodeURIComponent(pathname)}`
      router.push(loginUrl)
      return
    }

    if (isAuthRoute && hasAuth) {
      router.push('/dashboard')
      return
    }
  }, [pathname, isAuthenticated, isLoading, router])

  return <>{children}</>
}
