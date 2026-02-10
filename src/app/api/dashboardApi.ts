import { api } from '@/lib/apiClient'
import type { DashboardOverviewResponse } from '@/types/dashboard'

export async function fetchDashboardOverview (): Promise<DashboardOverviewResponse> {
  const response = await api.get('/api/dashboard/overview')
  const data = response.data as DashboardOverviewResponse & { error?: string }

  if (data?.error) {
    throw new Error(data.error)
  }

  return {
    today: data.today,
    yesterday: data.yesterday ?? null,
    deltas: data.deltas ?? null
  }
}

