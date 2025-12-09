'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import type { PortfolioHolding } from '@/types/portfolio'
import { formatCurrency } from './utils'

interface HoldingsTableProps {
  holdings: PortfolioHolding[]
  showCard?: boolean
}

export function HoldingsTable ({ holdings, showCard = true }: HoldingsTableProps) {
  const table = (
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
          </tr>
        </thead>
        <tbody>
          {holdings.map((holding) => (
            <HoldingRow key={holding.symbol} holding={holding} />
          ))}
        </tbody>
      </table>
    </div>
  )

  if (!showCard) {
    return table
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Holdings</CardTitle>
        <CardDescription>Your current stock positions</CardDescription>
      </CardHeader>
      <CardContent>
        {table}
      </CardContent>
    </Card>
  )
}

function HoldingRow ({ holding }: { holding: PortfolioHolding }) {
  const isGainPositive = holding.unrealizedGain >= 0
  const isDayPositive = holding.dayChange >= 0

  return (
    <tr className="border-b last:border-0 hover:bg-muted/50 transition-colors">
      <td className="py-4 px-2">
        <div className="font-medium">{holding.symbol}</div>
        <div className="text-xs text-muted-foreground">
          {holding.positions.length} position{holding.positions.length > 1 ? 's' : ''}
        </div>
      </td>
      <td className="text-right py-4 px-2 font-mono">{holding.totalQuantity.toFixed(2)}</td>
      <td className="text-right py-4 px-2 font-mono">{formatCurrency(holding.avgCost)}</td>
      <td className="text-right py-4 px-2 font-mono">{formatCurrency(holding.currentPrice)}</td>
      <td className="text-right py-4 px-2 font-mono font-medium">{formatCurrency(holding.currentValue)}</td>
      <td className={`text-right py-4 px-2 font-mono ${isGainPositive ? 'text-success' : 'text-destructive'}`}>
        <div>{isGainPositive ? '+' : ''}{formatCurrency(holding.unrealizedGain)}</div>
        <div className="text-xs">{isGainPositive ? '+' : ''}{holding.unrealizedGainPercent.toFixed(2)}%</div>
      </td>
      <td className={`text-right py-4 px-2 font-mono ${isDayPositive ? 'text-success' : 'text-destructive'}`}>
        <div>{isDayPositive ? '+' : ''}{formatCurrency(holding.dayChange)}</div>
        <div className="text-xs">{isDayPositive ? '+' : ''}{holding.dayChangePercent.toFixed(2)}%</div>
      </td>
    </tr>
  )
}

