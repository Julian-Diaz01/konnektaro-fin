import { PeriodConfig, TimePeriod } from '@/types/stocks'

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
  const response = await fetch(`/api/stocks/quotes?symbols=${encodeURIComponent(symbolsParam)}`)

  if (!response.ok) {
    throw new Error(`Failed to fetch quotes: ${response.status}`)
  }

  const data = await response.json()

  if (data.error) {
    throw new Error(data.error)
  }

  return data.quotes || []
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
  const response = await fetch(
    `/api/stocks/chart?symbol=${encodeURIComponent(symbol)}&interval=${interval}&range=${range}`
  )

  if (!response.ok) {
    throw new Error(`Failed to fetch chart: ${response.status}`)
  }

  const data = await response.json()

  if (data.error) {
    throw new Error(data.error)
  }

  return {
    timestamp: data.timestamp || [],
    closes: data.closes || []
  }
}

export { getPeriodConfig, fetchQuotes, fetchChart }
