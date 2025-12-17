import { api } from '@/lib/apiClient'
import type { CreateUserStockInput, UserStock } from '@/types/userStocks'

export async function getPortfolioStocks (): Promise<UserStock[]> {
  const response = await api.get('/api/portfolio/stocks')
  const data = response.data as { stocks?: UserStock[]; error?: string }

  if (data?.error) {
    throw new Error(data.error)
  }

  return data?.stocks ?? []
}

export async function addStockToPortfolio (payload: CreateUserStockInput): Promise<UserStock> {
  const response = await api.post('/api/portfolio/stocks', payload)
  const data = response.data as { stock?: UserStock; error?: string }

  if (data?.error) {
    throw new Error(data.error)
  }

  if (!data?.stock) {
    throw new Error('No stock returned from server')
  }

  return data.stock
}

export async function deletePortfolioStock (id: string): Promise<void> {
  await api.delete(`/api/portfolio/stocks/${id}`)
}
