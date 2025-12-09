'use client'

import { PageLayout } from '@/components/layout'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { StockComparison } from './StockComparison'
import type { StockSymbol } from '@/types/stocks'

const STOCK_SYMBOLS: StockSymbol[] = [
  { symbol: 'AAPL', name: 'Apple Inc.' },
  { symbol: 'QBTS', name: 'QBTS Inc.' }
]

export default function StocksPage () {
  return (
    <ProtectedRoute>
      <PageLayout>
        <div className="space-y-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Stocks Comparison</h1>
            <p className="text-muted-foreground">Compare stock performance over time</p>
          </div>

          <StockComparison symbols={STOCK_SYMBOLS} />
        </div>
      </PageLayout>
    </ProtectedRoute>
  )
}

