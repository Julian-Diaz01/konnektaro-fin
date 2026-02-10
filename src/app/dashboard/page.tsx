'use client'

import { ArrowUpRight, ArrowDownRight, Wallet } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { PageLayout } from '@/components/layout'
import { useDashboardOverview } from '@/hooks/useDashboardOverview'

function formatCurrency (value?: number | null) {
  if (value == null) return '—'
  return value.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2
  })
}

function formatPercent (value?: number | null) {
  if (value == null) return '—'
  return `${value.toFixed(2)}%`
}

export default function DashboardPage () {
  const { today, deltas, isLoading, error, refetch } = useDashboardOverview()

  const hasData = !!today

  return (
    <PageLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Welcome back!</h1>
        <p className="text-muted-foreground">
          Here&apos;s an overview of your portfolio performance.
        </p>
      </div>

      {isLoading && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-8">
          {Array.from({ length: 3 }).map((_, index) => (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-4 rounded-full" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-32 mb-2" />
                <Skeleton className="h-3 w-24" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {!isLoading && error && (
        <Card className="mb-8 border-destructive/40">
          <CardHeader>
            <CardTitle className="text-destructive">Unable to load overview</CardTitle>
            <CardDescription>
              Something went wrong while loading your dashboard overview. Please try again.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" onClick={() => refetch()}>
              Retry
            </Button>
          </CardContent>
        </Card>
      )}

      {!isLoading && !error && hasData && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-8">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total value
              </CardTitle>
              <Wallet className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(today?.totalValue)}
              </div>
              <p className="text-xs text-muted-foreground">
                Invested: {formatCurrency(today?.totalInvested)}
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                P&amp;L
              </CardTitle>
              {today?.totalPnlValue != null && (
                today.totalPnlValue >= 0 ? (
                  <ArrowUpRight className="h-4 w-4 text-green-500" />
                ) : (
                  <ArrowDownRight className="h-4 w-4 text-red-500" />
                )
              )}
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${today?.totalPnlValue != null ? (today.totalPnlValue >= 0 ? 'text-green-500' : 'text-red-500') : ''}`}>
                {formatCurrency(today?.totalPnlValue)}
              </div>
              <p className={`text-xs ${today?.totalPnlPercent != null ? (today.totalPnlPercent >= 0 ? 'text-green-500' : 'text-red-500') : 'text-muted-foreground'}`}>
                {formatPercent(today?.totalPnlPercent)}
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Change vs yesterday
              </CardTitle>
              {deltas?.deltaValue != null && (
                deltas.deltaValue >= 0 ? (
                  <ArrowUpRight className="h-4 w-4 text-green-500" />
                ) : (
                  <ArrowDownRight className="h-4 w-4 text-red-500" />
                )
              )}
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${deltas?.deltaValue != null ? (deltas.deltaValue >= 0 ? 'text-green-500' : 'text-red-500') : ''}`}>
                {formatCurrency(deltas?.deltaValue)}
              </div>
              <p className={`text-xs ${deltas?.deltaPnlValue != null ? (deltas.deltaPnlValue >= 0 ? 'text-green-500' : 'text-red-500') : 'text-muted-foreground'}`}>
                P&amp;L change: {formatCurrency(deltas?.deltaPnlValue)} ({formatPercent(deltas?.deltaPnlPercent)})
              </p>
            </CardContent>
          </Card>
        </div>
      )}
    </PageLayout>
  )
}

