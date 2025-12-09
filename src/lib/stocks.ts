import type {
  TimePeriod,
  StockQuote,
  HistoricalDataPoint
} from '@/types/stocks'
import { fetchQuotes, getPeriodConfig, fetchChart } from '@/app/api/stocksApi'

export async function fetchStockQuotes (symbols: string[]): Promise<StockQuote[]> {
  // Filter out empty or invalid symbols
  const validSymbols = symbols.filter(s => s && s.trim().length > 0)

  if (validSymbols.length === 0) {
    return []
  }

  try {
    const results = await fetchQuotes(validSymbols)

    return validSymbols.map(symbol => {
      const quote = results.find(r => r.symbol === symbol)
      if (quote) {
        return {
          symbol,
          price: quote.regularMarketPrice || 0,
          change: quote.regularMarketChange || 0,
          changePercent: quote.regularMarketChangePercent || 0
        }
      }
      // Return fallback for symbols not found
      return {
        symbol,
        price: 0,
        change: 0,
        changePercent: 0
      }
    })
  } catch (error) {
    console.error('Error fetching quotes:', error)
    // Return empty quotes on error
    return validSymbols.map(symbol => ({
      symbol,
      price: 0,
      change: 0,
      changePercent: 0
    }))
  }
}

export async function fetchStockHistorical (
  symbols: string[],
  period: TimePeriod
): Promise<Record<string, HistoricalDataPoint[]>> {
  const config = getPeriodConfig(period)
  const results: Record<string, HistoricalDataPoint[]> = {}

  await Promise.all(
    symbols.map(async (symbol) => {
      try {
        const chartData = await fetchChart(symbol, config.interval, config.range)

        if (!chartData.timestamp || chartData.timestamp.length === 0) {
          results[symbol] = []
          return
        }

        const historical: HistoricalDataPoint[] = chartData.timestamp
          .map((ts, idx) => {
            const closePrice = chartData.closes[idx]
            if (closePrice === null || closePrice === undefined) return null

            const date = new Date(ts * 1000)
            const dateStr = date.toISOString().split('T')[0]

            return {
              date: dateStr,
              price: closePrice
            }
          })
          .filter((h): h is HistoricalDataPoint => h !== null)

        results[symbol] = historical
      } catch (error) {
        console.error(`Error fetching historical for ${symbol}:`, error)
        results[symbol] = []
      }
    })
  )

  return results
}
