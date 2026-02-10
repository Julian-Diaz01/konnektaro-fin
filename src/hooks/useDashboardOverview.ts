'use client'

import { useQuery } from '@tanstack/react-query'
import { fetchDashboardOverview } from '@/app/api/dashboardApi'
import { useAuthStore } from '@/stores/authStore'

export function useDashboardOverview () {
  const { isAuthenticated, isAuthLoading } = useAuthStore()

  const query = useQuery({
    queryKey: ['dashboard-overview'],
    queryFn: fetchDashboardOverview,
    enabled: isAuthenticated && !isAuthLoading,
    staleTime: 60 * 1000,
    gcTime: 10 * 60 * 1000
  })

  return {
    today: query.data?.today ?? null,
    yesterday: query.data?.yesterday ?? null,
    deltas: query.data?.deltas ?? null,
    isLoading: query.isLoading || isAuthLoading,
    error: query.error,
    refetch: query.refetch
  }
}

