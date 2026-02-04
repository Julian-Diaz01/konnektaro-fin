'use client'

import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { Loader2, Clock, Trash2, Plus, Upload, Info } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { useUserStocks } from '@/hooks/useUserStocks'
import type { CreateUserStockInput, UserStock } from '@/types/userStocks'
import { deletePortfolioStock, addStockToPortfolio } from '@/app/api/portfolioStocksApi'
import { formatCurrency } from '@/lib/format'
import { SummaryCards, CsvImportDialog } from '@/app/holdings/components'
import type { PortfolioSummary } from '@/types/portfolio'

export function UserStocks () {
  const queryClient = useQueryClient()
  const { stocksWithStatus, isLoading, error } = useUserStocks()
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false)

  const summary = useMemo((): PortfolioSummary => {
    if (stocksWithStatus.length === 0) {
      return {
        totalValue: 0,
        totalCost: 0,
        totalGain: 0,
        totalGainPercent: 0,
        dayChange: 0,
        dayChangePercent: 0
      }
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

  const hasHoldings = stocksWithStatus.length > 0

  /* const holdings = useMemo((): PortfolioHolding[] => {
    return stocksWithStatus.map(({ stock, quote, avgCost, totalCost, marketValue, gainLoss, gainLossPercent, dayChangeValue }) => {
      const currentPrice = quote?.price ?? 0
      const dayChangePercent = quote?.changePercent ?? 0
      const avgCostValue = avgCost ?? 0
      const totalCostValue = totalCost ?? 0
      const unrealizedGain = gainLoss ?? 0
      const unrealizedGainPercent = gainLossPercent ?? 0

      // Ensure tradeDate is always a string
      const tradeDate = stock.purchaseDate || new Date().toISOString().split('T')[0]

      const position: PortfolioPosition = {
        symbol: stock.symbol,
        tradeDate: String(tradeDate),
        purchasePrice: avgCostValue,
        quantity: stock.quantity,
        commission: 0
      }

      return {
        symbol: stock.symbol,
        positions: [position],
        totalQuantity: stock.quantity,
        avgCost: avgCostValue,
        totalCost: totalCostValue,
        currentPrice,
        currentValue: marketValue,
        unrealizedGain,
        unrealizedGainPercent,
        dayChange: dayChangeValue,
        dayChangePercent
      }
    })
 }, [stocksWithStatus]) */

  return (
    <div className="space-y-6">
      <DataDelayNotice />

      {isLoading ? (
        <SummaryCardsSkeleton />
      ) : (
        <>
          {!hasHoldings && (
            <div className="flex items-center gap-3 rounded-lg border border-primary/20 bg-primary/5 px-4 py-3">
              <Info className="h-5 w-5 text-primary flex-shrink-0" />
              <p className="text-sm text-primary">
                Add stocks to see something here
              </p>
            </div>
          )}
          <SummaryCards summary={summary} />
        </>
      )}

      { /* holdings.length > 0 && <PortfolioChart holdings={holdings} /> */}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Add Stocks
              </CardTitle>
            </div>
            <Button
              variant="outline"
              onClick={() => setIsImportDialogOpen(true)}
            >
              <Upload className="h-4 w-4 mr-2" />
              Import CSV
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <UpsertStockForm
            onSubmit={async (payload) => {
              try {
                await addStockToPortfolio(payload)
                toast.success('Saved stock')
                await queryClient.invalidateQueries({ queryKey: ['portfolio-stocks'] })
                return true
              } catch (e) {
                toast.error(e instanceof Error ? e.message : 'Failed to save stock')
                return false 
              }
            }}
          />
        </CardContent>
      </Card>

      <CsvImportDialog
        open={isImportDialogOpen}
        onOpenChange={setIsImportDialogOpen}
        onImport={async (holding) => {
          // Import without invalidating queries - wait until dialog closes
          await addStockToPortfolio(holding)
        }}
        onClose={async () => {
          // Only refresh data after dialog is closed
          await queryClient.invalidateQueries({ queryKey: ['portfolio-stocks'] })
        }}
      />

      {isLoading ? (
        <HoldingsStatusTableSkeleton />
      ) : error ? (
        <Card>
          <CardHeader>
            <CardTitle>Holdings</CardTitle>
            <CardDescription>Your current stock positions</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-destructive text-center py-8">
              {error instanceof Error ? error.message : 'Failed to load user stocks'}
            </p>
          </CardContent>
        </Card>
      ) : (
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
      )}
    </div>
  )
}

function SummaryCardsSkeleton () {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {[1, 2, 3, 4].map((i) => (
        <Card key={i}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-4 rounded" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-8 w-32 mb-2" />
            <Skeleton className="h-3 w-20" />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

function HoldingsStatusTableSkeleton () {
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
              {[1, 2, 3].map((i) => (
                <tr key={i} className="border-b last:border-0">
                  <td className="py-4 px-2">
                    <Skeleton className="h-5 w-16 mb-1" />
                    <Skeleton className="h-3 w-20" />
                  </td>
                  <td className="text-right py-4 px-2">
                    <Skeleton className="h-5 w-20 ml-auto" />
                  </td>
                  <td className="text-right py-4 px-2">
                    <Skeleton className="h-5 w-24 ml-auto" />
                  </td>
                  <td className="text-right py-4 px-2">
                    <Skeleton className="h-5 w-24 ml-auto" />
                  </td>
                  <td className="text-right py-4 px-2">
                    <Skeleton className="h-5 w-24 ml-auto" />
                  </td>
                  <td className="text-right py-4 px-2">
                    <Skeleton className="h-5 w-20 ml-auto mb-1" />
                    <Skeleton className="h-3 w-16 ml-auto" />
                  </td>
                  <td className="text-right py-4 px-2">
                    <Skeleton className="h-5 w-20 ml-auto mb-1" />
                    <Skeleton className="h-3 w-16 ml-auto" />
                  </td>
                  <td className="text-right py-4 px-2">
                    <Skeleton className="h-8 w-8 ml-auto rounded" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
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
  onSubmit: (payload: CreateUserStockInput) => Promise<boolean>
}) {
  const [symbol, setSymbol] = useState('')
  const [quantity, setQuantity] = useState('')
  const [purchasePrice, setPurchasePrice] = useState('')
  const [purchaseDate, setPurchaseDate] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const clearForm = () => {
    setSymbol('')
    setQuantity('')
    setPurchasePrice('')
    setPurchaseDate('')
  }

  async function handleSubmit (e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    
    const symbolTrimmed = symbol.trim().toUpperCase()
    const quantityRaw = quantity.trim()
    const purchasePriceRaw = purchasePrice.trim()
    const purchaseDateRaw = purchaseDate.trim()

    const quantityNum = Number(quantityRaw)
    const purchasePriceNum = purchasePriceRaw ? Number(purchasePriceRaw) : null
    const purchaseDateValue = purchaseDateRaw ? purchaseDateRaw : null

    if (!symbolTrimmed) {
      toast.error('Symbol is required')
      return
    }
    if (!Number.isFinite(quantityNum) || quantityNum < 0) {
      toast.error('Quantity must be a number >= 0')
      return
    }
    if (purchasePriceRaw && (!Number.isFinite(purchasePriceNum as number) || (purchasePriceNum as number) < 0)) {
      toast.error('Purchase price must be a number >= 0')
      return
    }

    setIsSubmitting(true)
    try {
      const success = await onSubmit({ 
        symbol: symbolTrimmed, 
        quantity: quantityNum, 
        purchasePrice: purchasePriceNum, 
        purchaseDate: purchaseDateValue 
      })
      
      if (success) {
        clearForm()
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="grid gap-4 md:grid-cols-4"
    >
          <div className="grid gap-2">
            <Label htmlFor="symbol">Symbol</Label>
            <Input 
              id="symbol" 
              name="symbol" 
              placeholder="AAPL" 
              value={symbol}
              onChange={(e) => setSymbol(e.target.value)}
              disabled={isSubmitting}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="quantity">Quantity</Label>
            <Input 
              id="quantity" 
              name="quantity" 
              type="number" 
              step="1" 
              min="0" 
              placeholder="10" 
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              disabled={isSubmitting}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="purchasePrice">Purchase price (optional)</Label>
            <Input 
              id="purchasePrice" 
              name="purchasePrice" 
              type="number" 
              step="0.01" 
              min="0" 
              placeholder="123.45" 
              value={purchasePrice}
              onChange={(e) => setPurchasePrice(e.target.value)}
              disabled={isSubmitting}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="purchaseDate">Purchase date (optional)</Label>
            <Input 
              id="purchaseDate" 
              name="purchaseDate" 
              type="date" 
              value={purchaseDate}
              onChange={(e) => setPurchaseDate(e.target.value)}
              disabled={isSubmitting}
            />
          </div>

          <div className="md:col-span-4 flex justify-end">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save'
              )}
            </Button>
          </div>
        </form>
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
