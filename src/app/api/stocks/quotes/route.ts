import { NextResponse } from 'next/server'
import YahooFinance from 'yahoo-finance2'

const yahooFinance = new YahooFinance()

export async function GET (request: Request) {
  const { searchParams } = new URL(request.url)
  const symbolsParam = searchParams.get('symbols')

  if (!symbolsParam) {
    return NextResponse.json(
      { error: 'Symbols parameter is required' },
      { status: 400 }
    )
  }

  const symbols = symbolsParam.split(',').filter(s => s.trim())

  try {
    const results = await yahooFinance.quote(symbols)
    const quotes = Array.isArray(results) ? results : [results]

    const data = quotes.map(q => ({
      symbol: q.symbol,
      regularMarketPrice: q.regularMarketPrice,
      regularMarketChange: q.regularMarketChange,
      regularMarketChangePercent: q.regularMarketChangePercent
    }))

    return NextResponse.json({ quotes: data })
  } catch (error) {
    console.error('Error fetching quotes:', error)
    return NextResponse.json(
      { error: 'Failed to fetch quotes' },
      { status: 500 }
    )
  }
}
