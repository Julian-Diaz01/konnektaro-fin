'use client'

import { useQuery } from '@tanstack/react-query'
import { fetchPortfolioData } from '@/lib/portfolio'
import { useAuthStore } from '@/stores/authStore'

export function usePortfolio () {
  const { isAuthenticated, isAuthLoading } = useAuthStore()

  const query = useQuery({
    queryKey: ['portfolio'],
    queryFn: fetchPortfolioData,
    enabled: isAuthenticated && !isAuthLoading,
    staleTime: 60 * 60 * 1000,
    gcTime: 2 * 60 * 60 * 1000
  })

  return {
    holdings: query.data?.holdings ?? [],
    positions: query.data?.positions ?? [],
    summary: query.data?.summary ?? null,
    isLoading: query.isLoading || isAuthLoading,
    error: query.error,
    refetch: query.refetch
  }
}
