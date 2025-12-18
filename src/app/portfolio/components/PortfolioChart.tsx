'use client'

import { useEffect, useRef, useCallback, useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import * as d3 from 'd3'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'
import { fetchStockHistorical } from '@/lib/stocks'
import type { PortfolioHolding } from '@/types/portfolio'
import type { TimePeriod } from '@/types/stocks'
import { formatCurrency } from './utils'
import { useAuthStore } from '@/stores/authStore'

const TIME_PERIODS: { value: TimePeriod; label: string }[] = [
  { value: '1M', label: '1M' },
  { value: '6M', label: '6M' },
  { value: 'YTD', label: 'YTD' },
  { value: '1Y', label: '1Y' }
]

interface PortfolioChartProps {
  holdings: PortfolioHolding[]
}

export function PortfolioChart ({ holdings }: PortfolioChartProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>('1M')
  const chartRef = useRef<HTMLDivElement>(null)
  const { isAuthenticated, isAuthLoading } = useAuthStore()

  const symbols = useMemo(() => holdings.map(h => h.symbol), [holdings])
  const holdingsMap = useMemo(() => new Map(holdings.map(h => [h.symbol, h])), [holdings])

  const historicalQuery = useQuery({
    queryKey: ['portfolioHistorical', symbols, selectedPeriod],
    queryFn: () => fetchStockHistorical(symbols, selectedPeriod),
    enabled: symbols.length > 0 && isAuthenticated && !isAuthLoading,
    staleTime: 60 * 60 * 1000,
    gcTime: 2 * 60 * 60 * 1000
  })

  const renderChart = useCallback(() => {
    if (!chartRef.current || !historicalQuery.data) return

    const container = chartRef.current
    const margin = { top: 20, right: 30, bottom: 40, left: 80 }
    const width = container.clientWidth - margin.left - margin.right
    const height = 300 - margin.top - margin.bottom

    d3.select(container).selectAll('*').remove()

    const allDates = new Set<string>()
    for (const symbol of symbols) {
      const data = historicalQuery.data[symbol] ?? []
      data.forEach(d => allDates.add(d.date))
    }

    const sortedDates = Array.from(allDates).sort()
    const portfolioHistory: { date: Date; value: number }[] = []

    for (const dateStr of sortedDates) {
      let totalValue = 0
      for (const symbol of symbols) {
        const holding = holdingsMap.get(symbol)
        const data = historicalQuery.data[symbol] ?? []
        const pricePoint = data.find(d => d.date === dateStr)
        if (pricePoint && holding) {
          totalValue += pricePoint.price * holding.totalQuantity
        }
      }
      if (totalValue > 0) {
        portfolioHistory.push({ date: new Date(dateStr), value: totalValue })
      }
    }

    if (portfolioHistory.length < 2) return

    const svg = d3
      .select(container)
      .append('svg')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)

    const g = svg
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`)

    const dateExtent = d3.extent(portfolioHistory, d => d.date) as [Date, Date]
    const valueExtent = d3.extent(portfolioHistory, d => d.value) as [number, number]

    const xScale = d3.scaleTime().domain(dateExtent).range([0, width])
    const yScale = d3.scaleLinear().domain(valueExtent).nice().range([height, 0])

    const gradient = svg.append('defs')
      .append('linearGradient')
      .attr('id', 'areaGradient')
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '0%')
      .attr('y2', '100%')

    const startValue = portfolioHistory[0]?.value ?? 0
    const endValue = portfolioHistory[portfolioHistory.length - 1]?.value ?? 0
    const isPositive = endValue >= startValue
    const gradientColor = isPositive ? 'hsl(var(--success))' : 'hsl(var(--destructive))'

    gradient.append('stop')
      .attr('offset', '0%')
      .attr('stop-color', gradientColor)
      .attr('stop-opacity', 0.3)

    gradient.append('stop')
      .attr('offset', '100%')
      .attr('stop-color', gradientColor)
      .attr('stop-opacity', 0)

    const area = d3
      .area<{ date: Date; value: number }>()
      .x(d => xScale(d.date))
      .y0(height)
      .y1(d => yScale(d.value))
      .curve(d3.curveCatmullRom.alpha(0.5))

    g.append('path')
      .datum(portfolioHistory)
      .attr('fill', 'url(#areaGradient)')
      .attr('d', area)

    const line = d3
      .line<{ date: Date; value: number }>()
      .x(d => xScale(d.date))
      .y(d => yScale(d.value))
      .curve(d3.curveCatmullRom.alpha(0.5))

    const path = g
      .append('path')
      .datum(portfolioHistory)
      .attr('fill', 'none')
      .attr('stroke', gradientColor)
      .attr('stroke-width', 2.5)
      .attr('d', line)

    const totalLength = path.node()?.getTotalLength() ?? 0
    path
      .attr('stroke-dasharray', `${totalLength} ${totalLength}`)
      .attr('stroke-dashoffset', totalLength)
      .transition()
      .duration(1000)
      .ease(d3.easeLinear)
      .attr('stroke-dashoffset', 0)

    const formatDate = getDateFormat(selectedPeriod)
    const xAxis = d3.axisBottom(xScale).ticks(5).tickFormat(d => formatDate(d as Date))
    const yAxis = d3.axisLeft(yScale).ticks(5).tickFormat(d => formatCurrency(d as number))

    g.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(xAxis)
      .selectAll('text')
      .style('fill', 'hsl(var(--muted-foreground))')
      .style('font-size', '12px')

    g.append('g')
      .call(yAxis)
      .selectAll('text')
      .style('fill', 'hsl(var(--muted-foreground))')
      .style('font-size', '12px')

    g.selectAll('.domain, .tick line')
      .style('stroke', 'hsl(var(--border))')
  }, [historicalQuery.data, symbols, holdingsMap, selectedPeriod])

  useEffect(() => {
    if (historicalQuery.isLoading || historicalQuery.isFetching) return

    renderChart()

    const resizeObserver = new ResizeObserver(() => {
      renderChart()
    })

    if (chartRef.current) {
      resizeObserver.observe(chartRef.current)
    }

    return () => {
      resizeObserver.disconnect()
    }
  }, [historicalQuery.isLoading, historicalQuery.isFetching, renderChart])

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle>Portfolio Value</CardTitle>
            <CardDescription>Track your portfolio performance over time</CardDescription>
          </div>
          <TimePeriodTabs
            selected={selectedPeriod}
            onSelect={setSelectedPeriod}
            isLoading={historicalQuery.isFetching}
          />
        </div>
      </CardHeader>
      <CardContent>
        {historicalQuery.isFetching ? (
          <div className="flex items-center justify-center min-h-[300px]">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div ref={chartRef} className="w-full min-h-[300px]" />
        )}
      </CardContent>
    </Card>
  )
}

function getDateFormat (period: TimePeriod): (date: Date) => string {
  switch (period) {
    case '1M':
    case '6M':
      return d3.timeFormat('%b %d')
    case 'YTD':
    case '1Y':
      return d3.timeFormat('%b %Y')
    default:
      return d3.timeFormat('%b %d')
  }
}

function TimePeriodTabs ({
  selected,
  onSelect,
  isLoading
}: {
  selected: TimePeriod
  onSelect: (period: TimePeriod) => void
  isLoading: boolean
}) {
  return (
    <div className="flex gap-1 bg-muted p-1 rounded-lg">
      {TIME_PERIODS.map(({ value, label }) => (
        <Button
          key={value}
          variant={selected === value ? 'default' : 'ghost'}
          size="sm"
          onClick={() => onSelect(value)}
          disabled={isLoading}
          className="px-3 py-1 h-8"
        >
          {label}
        </Button>
      ))}
    </div>
  )
}
