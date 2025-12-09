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

// Twelve Data API response types
export interface TwelveDataQuote {
  symbol: string
  name: string
  close: string
  previous_close: string
  change: string
  percent_change: string
}

export interface TwelveDataTimeSeriesValue {
  datetime: string
  open: string
  high: string
  low: string
  close: string
  volume: string
}

export interface TwelveDataTimeSeries {
  meta: {
    symbol: string
  }
  values: TwelveDataTimeSeriesValue[]
  status?: string
  message?: string
}

export interface PeriodConfig {
  interval: string
  outputsize: number
}

