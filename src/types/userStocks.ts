export interface UserStock {
  id: string
  uid: string
  symbol: string
  quantity: number
  purchasePrice: number | null
  purchaseDate: string | null
  createdAt: string
  updatedAt: string
}

export interface CreateUserStockInput {
  symbol: string
  quantity: number
  purchasePrice?: number | null
  purchaseDate?: string | null
}
