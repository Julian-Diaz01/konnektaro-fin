'use client'

import { useMemo } from 'react'
import { PageLayout } from '@/components/layout'
import { HoldingsTable, PortfolioChart } from '@/app/portfolio/components'
import { useUserStocks } from '@/hooks/useUserStocks'
import { Loader2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import type { PortfolioHolding } from '@/types/portfolio'

export default function UserStocksPage () {
  const { stocksWithStatus, isLoading, error } = useUserStocks()

  const holdings = useMemo((): PortfolioHolding[] => {
    return stocksWithStatus.map(({ stock, quote, avgCost, totalCost, marketValue, gainLoss, gainLossPercent, dayChangeValue }) => {
      const currentPrice = quote?.price ?? 0
      const dayChangePercent = quote?.changePercent ?? 0
      const avgCostValue = avgCost ?? 0
      const totalCostValue = totalCost ?? 0
      const unrealizedGain = gainLoss ?? 0
      const unrealizedGainPercent = gainLossPercent ?? 0

      // Ensure tradeDate is always a string (ISO format YYYY-MM-DD)
      const todayISO = new Date().toISOString().split('T')[0] as string
      const tradeDate = stock.purchaseDate ?? todayISO
      // initialDate is the purchase date (already in YYYY-MM-DD format)
      const initialDate = stock.purchaseDate ?? todayISO

      return {
        symbol: stock.symbol,
        positions: [{
          symbol: stock.symbol,
          tradeDate: String(tradeDate),
          purchasePrice: avgCostValue,
          quantity: stock.quantity,
          commission: 0
        }],
        totalQuantity: stock.quantity,
        avgCost: avgCostValue,
        totalCost: totalCostValue,
        currentPrice,
        currentValue: marketValue,
        unrealizedGain,
        unrealizedGainPercent,
        dayChange: dayChangeValue,
        dayChangePercent,
        initialDate
      }
    })
  }, [stocksWithStatus])

  if (isLoading) {
    return (
      <PageLayout>
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </CardContent>
        </Card>
      </PageLayout>
    )
  }

  if (error) {
    return (
      <PageLayout>
        <Card>
          <CardContent className="py-12">
            <p className="text-destructive text-center">
              {error instanceof Error ? error.message : 'Failed to load user stocks'}
            </p>
          </CardContent>
        </Card>
      </PageLayout>
    )
  }

  return (
    <PageLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">User Stocks</h1>
          <p className="text-muted-foreground">View your stock holdings and portfolio performance</p>
        </div>

        {holdings.length > 0 && (
          <>
            <PortfolioChart holdings={holdings} />
            <HoldingsTable holdings={holdings} />
          </>
        )}

        {holdings.length === 0 && (
          <Card>
            <CardContent className="py-12">
              <p className="text-center text-muted-foreground">No stocks found. Add stocks to your portfolio to see them here.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </PageLayout>
  )
}
