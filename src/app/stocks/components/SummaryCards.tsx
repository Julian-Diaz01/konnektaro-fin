'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TrendingUp, TrendingDown, Wallet, Calendar } from 'lucide-react'
import type { PortfolioSummary } from '@/types/portfolio'
import { formatCurrency } from './utils'

interface SummaryCardsProps {
  summary: PortfolioSummary
}

export function SummaryCards ({ summary }: SummaryCardsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <SummaryCard
        title="Total Value"
        value={formatCurrency(summary.totalValue)}
        icon={Wallet}
      />
      <SummaryCard
        title="Total Gain/Loss"
        value={formatCurrency(summary.totalGain)}
        subtitle={`${summary.totalGainPercent >= 0 ? '+' : ''}${summary.totalGainPercent.toFixed(2)}%`}
        trend={summary.totalGain >= 0 ? 'up' : 'down'}
        icon={summary.totalGain >= 0 ? TrendingUp : TrendingDown}
      />
      <SummaryCard
        title="Day Change"
        value={formatCurrency(summary.dayChange)}
        subtitle={`${summary.dayChangePercent >= 0 ? '+' : ''}${summary.dayChangePercent.toFixed(2)}%`}
        trend={summary.dayChange >= 0 ? 'up' : 'down'}
        icon={summary.dayChange >= 0 ? TrendingUp : TrendingDown}
      />
      <SummaryCard
        title="Total Invested"
        value={formatCurrency(summary.totalCost)}
        icon={Calendar}
      />
    </div>
  )
}

function SummaryCard ({
  title,
  value,
  subtitle,
  trend,
  icon: Icon
}: {
  title: string
  value: string
  subtitle?: string
  trend?: 'up' | 'down'
  icon: React.ComponentType<{ className?: string }>
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {subtitle && (
          <p className={`text-xs ${trend === 'up' ? 'text-success' : trend === 'down' ? 'text-destructive' : 'text-muted-foreground'}`}>
            {subtitle}
          </p>
        )}
      </CardContent>
    </Card>
  )
}



