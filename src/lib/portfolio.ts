import type { PortfolioPosition, PortfolioHolding, PortfolioSummary } from '@/types/portfolio'
import type { StockQuote } from '@/types/stocks'
import { fetchStockQuotes } from './stocks'

export async function parsePortfolioCSV (): Promise<PortfolioPosition[]> {
  const response = await fetch('/portfolio.csv')
  const text = await response.text()
  const lines = text.trim().split('\n')

  // Skip header
  const positions: PortfolioPosition[] = []

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i]
    if (!line || !line.trim()) continue

    const cols = line.split(',')
    const symbol = cols[0] || ''
    const csvCurrentPrice = parseFloat(cols[1] ?? '0') || 0
    const openPrice = parseFloat(cols[5] ?? '0') || 0
    const tradeDateRaw = cols[9] || '' // Trade Date in YYYYMMDD
    const purchasePrice = parseFloat(cols[10] ?? '0') || 0
    const quantity = parseFloat(cols[11] ?? '0') || 0
    const commission = parseFloat(cols[12] ?? '0') || 0
    const comment = cols[15] || ''

    // Use CSV current price, fall back to open price
    const fallbackPrice = csvCurrentPrice || openPrice

    // Skip if no purchase data
    if (!tradeDateRaw || !purchasePrice || !quantity) continue

    // Parse date from YYYYMMDD to DD/MM/YYYY
    const tradeDate = `${tradeDateRaw.slice(6, 8)}/${tradeDateRaw.slice(4, 6)}/${tradeDateRaw.slice(0, 4)}`

    positions.push({
      symbol,
      tradeDate,
      purchasePrice,
      quantity,
      commission,
      comment: comment || undefined,
      fallbackPrice: fallbackPrice || undefined
    })
  }

  return positions
}

export function groupPositionsBySymbol (positions: PortfolioPosition[]): Map<string, PortfolioPosition[]> {
  const grouped = new Map<string, PortfolioPosition[]>()

  for (const position of positions) {
    const existing = grouped.get(position.symbol) || []
    existing.push(position)
    grouped.set(position.symbol, existing)
  }

  return grouped
}

export function calculateHoldings (
  groupedPositions: Map<string, PortfolioPosition[]>,
  quotes: StockQuote[]
): PortfolioHolding[] {
  const quotesMap = new Map(quotes.map(q => [q.symbol, q]))

  const holdings: PortfolioHolding[] = []

  for (const [symbol, positions] of groupedPositions) {
    const quote = quotesMap.get(symbol)
    // Use API price, fall back to CSV price if not available
    const fallbackPrice = positions[0]?.fallbackPrice || 0
    const currentPrice = quote?.price || fallbackPrice
    const dayChange = quote?.change || 0
    const dayChangePercent = quote?.changePercent || 0

    const totalQuantity = positions.reduce((sum, p) => sum + p.quantity, 0)
    const totalCost = positions.reduce((sum, p) => sum + (p.purchasePrice * p.quantity) + p.commission, 0)
    const avgCost = totalQuantity > 0 ? totalCost / totalQuantity : 0
    const currentValue = totalQuantity * currentPrice
    const unrealizedGain = currentValue - totalCost
    const unrealizedGainPercent = totalCost > 0 ? (unrealizedGain / totalCost) * 100 : 0

    holdings.push({
      symbol,
      positions,
      totalQuantity,
      avgCost,
      totalCost,
      currentPrice,
      currentValue,
      unrealizedGain,
      unrealizedGainPercent,
      dayChange: dayChange * totalQuantity,
      dayChangePercent
    })
  }

  return holdings.sort((a, b) => b.currentValue - a.currentValue)
}

export function calculateSummary (holdings: PortfolioHolding[]): PortfolioSummary {
  const totalValue = holdings.reduce((sum, h) => sum + h.currentValue, 0)
  const totalCost = holdings.reduce((sum, h) => sum + h.totalCost, 0)
  const totalGain = totalValue - totalCost
  const totalGainPercent = totalCost > 0 ? (totalGain / totalCost) * 100 : 0
  const dayChange = holdings.reduce((sum, h) => sum + h.dayChange, 0)
  const dayChangePercent = totalValue > 0 ? (dayChange / (totalValue - dayChange)) * 100 : 0

  return {
    totalValue,
    totalCost,
    totalGain,
    totalGainPercent,
    dayChange,
    dayChangePercent
  }
}

export async function fetchPortfolioData (): Promise<{
  positions: PortfolioPosition[]
  holdings: PortfolioHolding[]
  summary: PortfolioSummary
}> {
  const positions = await parsePortfolioCSV()
  const grouped = groupPositionsBySymbol(positions)
  const symbols = Array.from(grouped.keys())

  const quotes = await fetchStockQuotes(symbols)
  const holdings = calculateHoldings(grouped, quotes)
  const summary = calculateSummary(holdings)

  return { positions, holdings, summary }
}
