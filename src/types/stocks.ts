export type TimePeriod = '1D' | '5D' | '1M' | '6M' | 'YTD' | '1Y'

export interface StockSymbol {
  symbol: string
  name: string
}

export interface StockQuote {
  symbol: string
  price: number
  change: number
  changePercent: number
}

export interface HistoricalDataPoint {
  date: string
  price: number
}

export interface StockData {
  symbol: string
  quote: StockQuote
  historical: HistoricalDataPoint[]
}

// Yahoo Finance API response types
export interface YahooQuoteResult {
  symbol: string
  shortName?: string
  longName?: string
  regularMarketPrice: number
  regularMarketChange: number
  regularMarketChangePercent: number
  regularMarketPreviousClose: number
}

export interface YahooQuoteResponse {
  quoteResponse: {
    result: YahooQuoteResult[]
    error: string | null
  }
}

export interface YahooChartMeta {
  symbol: string
  regularMarketPrice: number
  previousClose: number
}

export interface YahooChartIndicators {
  quote: Array<{
    close: (number | null)[]
    open: (number | null)[]
    high: (number | null)[]
    low: (number | null)[]
    volume: (number | null)[]
  }>
}

export interface YahooChartResult {
  meta: YahooChartMeta
  timestamp: number[]
  indicators: YahooChartIndicators
}

export interface YahooChartResponse {
  chart: {
    result: YahooChartResult[] | null
    error: { code: string; description: string } | null
  }
}

export interface PeriodConfig {
  interval: string
  range: string
}
