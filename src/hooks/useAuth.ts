'use client'

import { useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { toast } from 'sonner'
import {
  signInWithEmail,
  signUpWithEmail,
  signInWithGoogle,
  signOut
} from '@/lib/firebase'
import { useAuthStore } from '@/stores/authStore'
import { removeAuthCookie } from '@/lib/cookies'

export function useAuth () {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, isLoading, isAuthenticated, logout: clearAuth } = useAuthStore()

  const getRedirectUrl = useCallback(() => {
    const callbackUrl = searchParams.get('callbackUrl')
    return callbackUrl && callbackUrl.startsWith('/') ? callbackUrl : '/dashboard'
  }, [searchParams])

  const login = useCallback(async (email: string, password: string) => {
    try {
      await signInWithEmail(email, password)
      toast.success('Welcome back!')
      router.push(getRedirectUrl())
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to sign in'
      toast.error(message)
      throw error
    }
  }, [router, getRedirectUrl])

  const register = useCallback(async (email: string, password: string) => {
    try {
      await signUpWithEmail(email, password)
      toast.success('Account created successfully!')
      router.push(getRedirectUrl())
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create account'
      toast.error(message)
      throw error
    }
  }, [router, getRedirectUrl])

  const loginWithGoogle = useCallback(async () => {
    try {
      await signInWithGoogle()
      toast.success('Welcome!')
      router.push(getRedirectUrl())
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to sign in with Google'
      toast.error(message)
      throw error
    }
  }, [router, getRedirectUrl])

  const logout = useCallback(async () => {
    try {
      await signOut()
      removeAuthCookie()
      clearAuth()
      toast.success('Signed out successfully')
      router.push('/')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to sign out'
      toast.error(message)
      throw error
    }
  }, [router, clearAuth])

  return {
    user,
    isLoading,
    isAuthenticated,
    login,
    register,
    loginWithGoogle,
    logout
  }
}
