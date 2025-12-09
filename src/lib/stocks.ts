import type {
  TimePeriod,
  StockQuote,
  HistoricalDataPoint,
} from '@/types/stocks'
import { getApiKey, fetchQuote, getPeriodConfig, fetchTimeSeries } from '@/app/api/stocksApi'


export async function fetchStockQuotes (symbols: string[]): Promise<StockQuote[]> {
  const apiKey = getApiKey()

  const results = await Promise.all(
    symbols.map(async (symbol) => {
      try {
        const quoteData = await fetchQuote(symbol, apiKey)
        return {
          symbol,
          price: parseFloat(quoteData.close) || 0,
          change: parseFloat(quoteData.change) || 0,
          changePercent: parseFloat(quoteData.percent_change) || 0
        }
      } catch (error) {
        console.error(`Error fetching quote for ${symbol}:`, error)
        return {
          symbol,
          price: 0,
          change: 0,
          changePercent: 0
        }
      }
    })
  )

  return results
}

export async function fetchStockHistorical (
  symbols: string[],
  period: TimePeriod
): Promise<Record<string, HistoricalDataPoint[]>> {
  const apiKey = getApiKey()
  const config = getPeriodConfig(period)

  const results: Record<string, HistoricalDataPoint[]> = {}

  await Promise.all(
    symbols.map(async (symbol) => {
      try {
        const timeSeriesData = await fetchTimeSeries(
          symbol,
          apiKey,
          config.interval,
          config.outputsize
        )

        const historical: HistoricalDataPoint[] = (timeSeriesData.values ?? [])
          .map(v => ({
            date: v.datetime,
            price: parseFloat(v.close)
          }))
          .filter(h => !isNaN(h.price))
          .reverse()

        results[symbol] = historical
      } catch (error) {
        console.error(`Error fetching historical for ${symbol}:`, error)
        results[symbol] = []
      }
    })
  )

  return results
}
