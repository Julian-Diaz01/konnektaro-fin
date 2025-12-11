'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Loader2, Clock } from 'lucide-react'
import { usePortfolio } from '@/hooks/usePortfolio'
import { HoldingsTable, SummaryCards, PortfolioChart } from './components'
import { Activity } from 'react'

interface PortfolioProps {
  showChart?: boolean
}

export function Portfolio ({ showChart = false }: PortfolioProps) {
  const { holdings, summary, isLoading, error } = usePortfolio()

  if (isLoading) {
    return <PortfolioSkeleton />
  }

  if (error) {
    return <PortfolioError message={error instanceof Error ? error.message : 'Failed to load portfolio'} />
  }

  if (!summary) {
    return <PortfolioError message="No portfolio data available" />
  }

  return (
    <div className="space-y-6">
      <DataDelayNotice />
      <SummaryCards summary={summary} />
      <Activity mode={showChart ? 'visible' : 'hidden'} >
        <PortfolioChart holdings={holdings} />
      </Activity>
      <HoldingsTable holdings={holdings} />
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

function PortfolioSkeleton () {
  return (
    <Card>
      <CardContent className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </CardContent>
    </Card>
  )
}

function PortfolioError ({ message }: { message: string }) {
  return (
    <Card>
      <CardContent className="py-12">
        <p className="text-destructive text-center">{message}</p>
      </CardContent>
    </Card>
  )
}
