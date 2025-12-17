import type { UserStock } from '@/types/userStocks'
import type { StockQuote } from '@/types/stocks'
import { getPortfolioStocks } from '@/app/api/portfolioStocksApi'
import { fetchStockQuotes } from '@/lib/stocks'

export interface UserStockWithStatus {
  stock: UserStock
  quote: StockQuote | null
  avgCost: number | null
  totalCost: number | null
  marketValue: number
  gainLoss: number | null
  gainLossPercent: number | null
  dayChangeValue: number
}

export async function fetchUserStocksData (): Promise<{
  stocks: UserStock[]
  stocksWithStatus: UserStockWithStatus[]
}> {
  const stocks = await getPortfolioStocks()
  const symbols = Array.from(new Set(stocks.map(s => s.symbol))).filter(Boolean)

  const quotes = await fetchStockQuotes(symbols)
  const quotesMap = new Map(quotes.map(q => [q.symbol, q]))

  const stocksWithStatus: UserStockWithStatus[] = stocks.map((stock) => {
    const quote = quotesMap.get(stock.symbol) ?? null
    const price = quote?.price ?? 0
    const change = quote?.change ?? 0

    const avgCost = stock.purchasePrice ?? null
    const totalCost = avgCost !== null ? stock.quantity * avgCost : null
    const marketValue = stock.quantity * price

    const gainLoss = totalCost !== null ? marketValue - totalCost : null
    const gainLossPercent = totalCost && totalCost !== 0 ? (gainLoss! / totalCost) * 100 : (totalCost === 0 ? 0 : null)
    const dayChangeValue = stock.quantity * change

    return {
      stock,
      quote,
      avgCost,
      totalCost,
      marketValue,
      gainLoss,
      gainLossPercent,
      dayChangeValue
    }
  })

  return { stocks, stocksWithStatus }
}


