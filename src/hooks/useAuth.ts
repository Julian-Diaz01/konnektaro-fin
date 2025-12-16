'use client'

import { useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  signInWithEmail,
  signUpWithEmail,
  signInWithGoogle,
  signOut
} from '@/lib/firebase'
import { useAuthStore } from '@/stores/authStore'
import { removeAuthCookie } from '@/lib/cookies'
import { useUserStore } from '@/stores/userStore'

function getCallbackUrl (): string {
  if (typeof window === 'undefined') return '/dashboard'
  const params = new URLSearchParams(window.location.search)
  const callbackUrl = params.get('callbackUrl')
  return callbackUrl && callbackUrl.startsWith('/') ? callbackUrl : '/dashboard'
}

export function useAuth () {
  const router = useRouter()
  const { firebaseUser, isAuthLoading, isAuthenticated, logout: clearAuth } = useAuthStore()

  const getRedirectUrl = useCallback(() => {
    return getCallbackUrl()
  }, [])

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
      const { setUser: clearUserProfile } = useUserStore.getState()
      clearUserProfile(null)
      toast.success('Signed out successfully')
      router.push('/')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to sign out'
      toast.error(message)
      throw error
    }
  }, [router, clearAuth])

  return {
    firebaseUser,
    isAuthLoading,
    isAuthenticated,
    login,
    register,
    loginWithGoogle,
    logout
  }
}
