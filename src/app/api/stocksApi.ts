import { PeriodConfig, TimePeriod, TwelveDataQuote, TwelveDataTimeSeries } from "@/types/stocks"

const TWELVE_DATA_BASE_URL = 'https://api.twelvedata.com'

function getPeriodConfig (period: TimePeriod): PeriodConfig {
  const now = new Date()
  const startOfYear = new Date(now.getFullYear(), 0, 1)
  const daysSinceYearStart = Math.ceil((now.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24))

  switch (period) {
    case '1D':
      return { interval: '5min', outputsize: 78 }
    case '5D':
      return { interval: '1h', outputsize: 35 }
    case '1M':
      return { interval: '1day', outputsize: 22 }
    case '6M':
      return { interval: '1day', outputsize: 130 }
    case 'YTD':
      return { interval: '1day', outputsize: daysSinceYearStart }
    case '1Y':
      return { interval: '1day', outputsize: 365 }
    default:
      return { interval: '1day', outputsize: 30 }
  }
}

function getApiKey (): string {
  const apiKey = process.env.NEXT_PUBLIC_TWELVE_DATA_API_KEY
  if (!apiKey) {
    throw new Error('NEXT_PUBLIC_TWELVE_DATA_API_KEY is not configured')
  }
  return apiKey
}

async function fetchQuote (symbol: string, apiKey: string): Promise<TwelveDataQuote> {
  const response = await fetch(
    `${TWELVE_DATA_BASE_URL}/quote?symbol=${encodeURIComponent(symbol)}&apikey=${apiKey}`
  )

  if (!response.ok) {
    throw new Error(`Failed to fetch quote for ${symbol}`)
  }

  const data = await response.json()

  if (data.status === 'error') {
    throw new Error(data.message || `Failed to fetch quote for ${symbol}`)
  }

  return data
}

async function fetchTimeSeries (
  symbol: string,
  apiKey: string,
  interval: string,
  outputsize: number
): Promise<TwelveDataTimeSeries> {
  const response = await fetch(
    `${TWELVE_DATA_BASE_URL}/time_series?symbol=${encodeURIComponent(symbol)}&interval=${interval}&outputsize=${outputsize}&apikey=${apiKey}`
  )

  if (!response.ok) {
    throw new Error(`Failed to fetch time series for ${symbol}`)
  }

  const data = await response.json()

  if (data.status === 'error') {
    throw new Error(data.message || `Failed to fetch time series for ${symbol}`)
  }

  return data
}

export { getPeriodConfig, getApiKey, fetchQuote, fetchTimeSeries }