export interface PortfolioPosition {
  symbol: string
  tradeDate: string
  purchasePrice: number
  quantity: number
  commission: number
  comment?: string
  fallbackPrice?: number
}

export interface PortfolioHolding {
  symbol: string
  positions: PortfolioPosition[]
  totalQuantity: number
  avgCost: number
  totalCost: number
  currentPrice: number
  currentValue: number
  unrealizedGain: number
  unrealizedGainPercent: number
  dayChange: number
  dayChangePercent: number
  initialDate: string
}

export interface PortfolioSummary {
  totalValue: number
  totalCost: number
  totalGain: number
  totalGainPercent: number
  dayChange: number
  dayChangePercent: number
}

export interface PortfolioHistoryPoint {
  date: string
  value: number
}
