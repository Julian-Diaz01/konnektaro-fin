'use client'

import { useQuery } from '@tanstack/react-query'
import { fetchUserStocksData } from '@/lib/userStocks'
import { useAuthStore } from '@/stores/authStore'

export function useUserStocks () {
  const { isAuthenticated, isAuthLoading } = useAuthStore()

  const query = useQuery({
    queryKey: ['portfolio-stocks'],
    queryFn: fetchUserStocksData,
    enabled: isAuthenticated && !isAuthLoading,
    staleTime: 60 * 1000,
    gcTime: 10 * 60 * 1000
  })

  return {
    stocks: query.data?.stocks ?? [],
    stocksWithStatus: query.data?.stocksWithStatus ?? [],
    isLoading: query.isLoading || isAuthLoading,
    error: query.error,
    refetch: query.refetch
  }
}
