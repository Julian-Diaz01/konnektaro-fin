'use client'

import { useMemo } from 'react'
import { toast } from 'sonner'
import { Loader2, Clock, Trash2, Plus } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useUserStocks } from '@/hooks/useUserStocks'
import type { CreateUserStockInput, UserStock } from '@/types/userStocks'
import { deletePortfolioStock, addStockToPortfolio } from '@/app/api/portfolioStocksApi'
import { formatCurrency } from '@/lib/format'
import type { PortfolioSummary } from '@/types/portfolio'
import { SummaryCards } from '../portfolio/components'

export function UserStocks () {
  const queryClient = useQueryClient()
  const { stocksWithStatus, isLoading, error } = useUserStocks()

  const summary = useMemo((): PortfolioSummary | null => {
    if (stocksWithStatus.length === 0) {
      return null
    }

    const totalValue = stocksWithStatus.reduce((sum, s) => sum + s.marketValue, 0)
    const totalCost = stocksWithStatus.reduce((sum, s) => sum + (s.totalCost ?? 0), 0)
    const totalGain = totalValue - totalCost
    const totalGainPercent = totalCost !== 0 ? (totalGain / totalCost) * 100 : 0
    const dayChange = stocksWithStatus.reduce((sum, s) => sum + s.dayChangeValue, 0)
    
    // Calculate weighted day change percent based on market values
    const dayChangePercent = totalValue !== 0 
      ? stocksWithStatus.reduce((sum, s) => {
          const weight = s.marketValue / totalValue
          const stockDayChangePercent = s.quote?.changePercent ?? 0
          return sum + (weight * stockDayChangePercent)
        }, 0)
      : 0

    return {
      totalValue,
      totalCost,
      totalGain,
      totalGainPercent,
      dayChange,
      dayChangePercent
    }
  }, [stocksWithStatus])

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-12">
          <p className="text-destructive text-center">
            {error instanceof Error ? error.message : 'Failed to load user stocks'}
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <DataDelayNotice />

      {summary && <SummaryCards summary={summary} />}

      <UpsertStockForm
        onSubmit={async (payload) => {
          try {
            await addStockToPortfolio(payload)
            toast.success('Saved stock')
            await queryClient.invalidateQueries({ queryKey: ['portfolio-stocks'] })
          } catch (e) {
            toast.error(e instanceof Error ? e.message : 'Failed to save stock')
          }
        }}
      />

      <HoldingsStatusTable
        rows={stocksWithStatus}
        onDelete={async (stock) => {
          try {
            await deletePortfolioStock(stock.id)
            toast.success('Deleted stock')
            await queryClient.invalidateQueries({ queryKey: ['portfolio-stocks'] })
          } catch (e) {
            toast.error(e instanceof Error ? e.message : 'Failed to delete stock')
          }
        }}
      />
    </div>
  )
}

function DataDelayNotice () {
  return (
    <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 rounded-md px-3 py-2">
      <Clock className="h-3 w-3" />
      <span>Market data is delayed by up to 15 minutes. Not real-time.</span>
    </div>
  )
}

function UpsertStockForm ({
  onSubmit
}: {
  onSubmit: (payload: CreateUserStockInput) => Promise<void>
}) {
  async function handleSubmit (formData: FormData) {
    const symbol = String(formData.get('symbol') ?? '').trim().toUpperCase()
    const quantityRaw = String(formData.get('quantity') ?? '').trim()
    const purchasePriceRaw = String(formData.get('purchasePrice') ?? '').trim()
    const purchaseDateRaw = String(formData.get('purchaseDate') ?? '').trim()

    const quantity = Number(quantityRaw)
    const purchasePrice = purchasePriceRaw ? Number(purchasePriceRaw) : null
    const purchaseDate = purchaseDateRaw ? purchaseDateRaw : null

    if (!symbol) {
      toast.error('Symbol is required')
      return
    }
    if (!Number.isFinite(quantity) || quantity < 0) {
      toast.error('Quantity must be a number >= 0')
      return
    }
    if (purchasePriceRaw && (!Number.isFinite(purchasePrice as number) || (purchasePrice as number) < 0)) {
      toast.error('Purchase price must be a number >= 0')
      return
    }

    await onSubmit({ symbol, quantity, purchasePrice, purchaseDate })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add / Update Stock
        </CardTitle>
        <CardDescription>
          This uses <span className="font-mono">POST /api/portfolio/stocks</span> (upsert by symbol).
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          action={handleSubmit}
          className="grid gap-4 md:grid-cols-4"
        >
          <div className="grid gap-2">
            <Label htmlFor="symbol">Symbol</Label>
            <Input id="symbol" name="symbol" placeholder="AAPL" />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="quantity">Quantity</Label>
            <Input id="quantity" name="quantity" type="number" step="1" min="0" placeholder="10" />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="purchasePrice">Purchase price (optional)</Label>
            <Input id="purchasePrice" name="purchasePrice" type="number" step="0.01" min="0" placeholder="123.45" />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="purchaseDate">Purchase date (optional)</Label>
            <Input id="purchaseDate" name="purchaseDate" type="date" />
          </div>

          <div className="md:col-span-4 flex justify-end">
            <Button type="submit">Save</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

function HoldingsStatusTable ({
  rows,
  onDelete
}: {
  rows: Array<{
    stock: UserStock
    quote: { price: number; change: number; changePercent: number } | null
    avgCost: number | null
    totalCost: number | null
    marketValue: number
    gainLoss: number | null
    gainLossPercent: number | null
    dayChangeValue: number
  }>
  onDelete: (stock: UserStock) => Promise<void>
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Holdings</CardTitle>
        <CardDescription>Your current stock positions</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-2 font-medium text-muted-foreground">Symbol</th>
                <th className="text-right py-3 px-2 font-medium text-muted-foreground">Quantity</th>
                <th className="text-right py-3 px-2 font-medium text-muted-foreground">Avg Cost</th>
                <th className="text-right py-3 px-2 font-medium text-muted-foreground">Current Price</th>
                <th className="text-right py-3 px-2 font-medium text-muted-foreground">Market Value</th>
                <th className="text-right py-3 px-2 font-medium text-muted-foreground">Gain/Loss</th>
                <th className="text-right py-3 px-2 font-medium text-muted-foreground">Day Change</th>
                <th className="text-right py-3 px-2 font-medium text-muted-foreground"></th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ stock, quote, avgCost, marketValue, gainLoss, gainLossPercent, dayChangeValue }) => {
                const isDayPositive = dayChangeValue >= 0
                const isGainPositive = (gainLoss ?? 0) >= 0
                const dayChangePercent = quote?.changePercent ?? 0
                return (
                  <tr key={stock.id} className="border-b last:border-0 hover:bg-muted/50 transition-colors">
                    <td className="py-4 px-2">
                      <div className="font-medium">{stock.symbol}</div>
                      <div className="text-xs text-muted-foreground">
                        1 position
                      </div>
                    </td>
                    <td className="text-right py-4 px-2 font-mono">{stock.quantity.toFixed(2)}</td>
                    <td className="text-right py-4 px-2 font-mono">
                      {avgCost !== null ? formatCurrency(avgCost) : formatCurrency(0)}
                    </td>
                    <td className="text-right py-4 px-2 font-mono">
                      {quote ? formatCurrency(quote.price) : formatCurrency(0)}
                    </td>
                    <td className="text-right py-4 px-2 font-mono font-medium">{formatCurrency(marketValue)}</td>
                    <td className={`text-right py-4 px-2 font-mono ${isGainPositive ? 'text-success' : 'text-destructive'}`}>
                      <div>{isGainPositive ? '+' : ''}{formatCurrency(gainLoss ?? 0)}</div>
                      <div className="text-xs">{isGainPositive ? '+' : ''}{(gainLossPercent ?? 0).toFixed(2)}%</div>
                    </td>
                    <td className={`text-right py-4 px-2 font-mono ${isDayPositive ? 'text-success' : 'text-destructive'}`}>
                      <div>{isDayPositive ? '+' : ''}{formatCurrency(dayChangeValue)}</div>
                      <div className="text-xs">{isDayPositive ? '+' : ''}{dayChangePercent.toFixed(2)}%</div>
                    </td>
                    <td className="text-right py-4 px-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => { void onDelete(stock) }}
                        aria-label={`Delete ${stock.symbol}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}
