'use client'

import { useQuery } from '@tanstack/react-query'
import { fetchPortfolioData } from '@/lib/portfolio'

export function usePortfolio () {
  const query = useQuery({
    queryKey: ['portfolio'],
    queryFn: fetchPortfolioData,
    staleTime: 60 * 60 * 1000,
    gcTime: 2 * 60 * 60 * 1000
  })

  return {
    holdings: query.data?.holdings ?? [],
    positions: query.data?.positions ?? [],
    summary: query.data?.summary ?? null,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch
  }
}

