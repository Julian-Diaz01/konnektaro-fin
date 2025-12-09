import { NextResponse } from 'next/server'
import YahooFinance from 'yahoo-finance2'

const yahooFinance = new YahooFinance()

export async function GET (request: Request) {
  const { searchParams } = new URL(request.url)
  const symbol = searchParams.get('symbol')
  const interval = searchParams.get('interval') || '1d'
  const range = searchParams.get('range') || '1mo'

  if (!symbol) {
    return NextResponse.json(
      { error: 'Symbol parameter is required' },
      { status: 400 }
    )
  }

  try {
    const startDate = getStartDate(range)
    const result = await yahooFinance.chart(symbol, {
      interval: interval as '1d' | '5m' | '1h' | '15m' | '30m' | '60m' | '1wk' | '1mo',
      period1: startDate,
      period2: new Date()
    })

    const data = {
      timestamp: result.quotes.map(q => Math.floor(q.date.getTime() / 1000)),
      closes: result.quotes.map(q => q.close ?? null)
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error(`Error fetching chart for ${symbol}:`, error)
    return NextResponse.json(
      { error: 'Failed to fetch chart data' },
      { status: 500 }
    )
  }
}

function getStartDate (range: string): Date {
  const now = new Date()
  switch (range) {
    case '1d':
      return new Date(now.getTime() - 24 * 60 * 60 * 1000)
    case '5d':
      return new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000)
    case '1mo':
      return new Date(now.getFullYear(), now.getMonth() - 1, now.getDate())
    case '6mo':
      return new Date(now.getFullYear(), now.getMonth() - 6, now.getDate())
    case 'ytd':
      return new Date(now.getFullYear(), 0, 1)
    case '1y':
      return new Date(now.getFullYear() - 1, now.getMonth(), now.getDate())
    default:
      return new Date(now.getFullYear(), now.getMonth() - 1, now.getDate())
  }
}
