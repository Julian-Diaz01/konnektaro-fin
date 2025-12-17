'use client'

import { useQuery } from '@tanstack/react-query'
import { fetchUserStocksData } from '@/lib/userStocks'

export function useUserStocks () {
  const query = useQuery({
    queryKey: ['portfolio-stocks'],
    queryFn: fetchUserStocksData,
    staleTime: 60 * 1000,
    gcTime: 10 * 60 * 1000
  })

  return {
    stocks: query.data?.stocks ?? [],
    stocksWithStatus: query.data?.stocksWithStatus ?? [],
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch
  }
}


