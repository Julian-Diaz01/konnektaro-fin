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

export function useAuth () {
  const router = useRouter()
  const { user, isLoading, isAuthenticated, logout: clearAuth } = useAuthStore()

  const login = useCallback(async (email: string, password: string) => {
    try {
      await signInWithEmail(email, password)
      toast.success('Welcome back!')
      router.push('/dashboard')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to sign in'
      toast.error(message)
      throw error
    }
  }, [router])

  const register = useCallback(async (email: string, password: string) => {
    try {
      await signUpWithEmail(email, password)
      toast.success('Account created successfully!')
      router.push('/dashboard')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create account'
      toast.error(message)
      throw error
    }
  }, [router])

  const loginWithGoogle = useCallback(async () => {
    try {
      await signInWithGoogle()
      toast.success('Welcome!')
      router.push('/dashboard')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to sign in with Google'
      toast.error(message)
      throw error
    }
  }, [router])

  const logout = useCallback(async () => {
    try {
      await signOut()
      clearAuth()
      toast.success('Signed out successfully')
      router.push('/login')
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


