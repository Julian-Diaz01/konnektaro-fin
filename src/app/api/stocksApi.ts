import { PeriodConfig, TimePeriod } from '@/types/stocks'
import { api } from '@/lib/apiClient'

function getPeriodConfig (period: TimePeriod): PeriodConfig {
  switch (period) {
    case '1D':
      return { interval: '5m', range: '1d' }
    case '5D':
      return { interval: '1h', range: '5d' }
    case '1M':
      return { interval: '1d', range: '1mo' }
    case '6M':
      return { interval: '1d', range: '6mo' }
    case 'YTD':
      return { interval: '1d', range: 'ytd' }
    case '1Y':
      return { interval: '1d', range: '1y' }
    default:
      return { interval: '1d', range: '1mo' }
  }
}

interface QuoteResult {
  symbol: string
  regularMarketPrice?: number
  regularMarketChange?: number
  regularMarketChangePercent?: number
}

async function fetchQuotes (symbols: string[]): Promise<QuoteResult[]> {
  const symbolsParam = symbols.join(',')
  const response = await api.get('/api/market-data/stocks/quotes', {
    params: { symbols: symbolsParam }
  })

  const data = response.data as { quotes?: QuoteResult[]; error?: string }

  if (data?.error) {
    throw new Error(data.error)
  }

  return data?.quotes ?? []
}

interface ChartResult {
  timestamp: number[]
  closes: (number | null)[]
}

async function fetchChart (
  symbol: string,
  interval: string,
  range: string
): Promise<ChartResult> {
  const response = await api.get('/api/market-data/stocks/chart', {
    params: { symbol, interval, range }
  })

  const data = response.data as { timestamp?: number[]; closes?: (number | null)[]; error?: string }

  if (data?.error) {
    throw new Error(data.error)
  }

  return {
    timestamp: data?.timestamp ?? [],
    closes: data?.closes ?? []
  }
}

export { getPeriodConfig, fetchQuotes, fetchChart }
