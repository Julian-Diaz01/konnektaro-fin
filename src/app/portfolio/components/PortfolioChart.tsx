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
import { formatDate as formatDateDisplay } from '@/lib/utils'
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

    // Flatten all positions from all holdings to handle multiple positions per symbol separately
    const allPositions = holdings.flatMap(holding =>
      holding.positions.map(position => ({
        symbol: position.symbol,
        quantity: position.quantity,
        initialDate: new Date(position.tradeDate)
      }))
    )

    const portfolioHistory: { date: Date; value: number }[] = []

    // Track last known price for each symbol to handle missing data
    const lastKnownPrices = new Map<string, number>()

    for (const dateStr of sortedDates) {
      const currentDate = new Date(dateStr)

      let totalValue = 0
      // Calculate value contribution from each individual position
      for (const position of allPositions) {
        // If date is before this position's initial date, value is 0 (ignore API data)
        if (currentDate < position.initialDate) {
          // Value is 0 for this position before initial date
          continue
        }

        // After initial date, use API data
        const data = historicalQuery.data[position.symbol] ?? []
        const pricePoint = data.find(d => d.date === dateStr)
        
        let price = 0
        if (pricePoint) {
          // Update last known price when we find data
          price = pricePoint.price
          lastKnownPrices.set(position.symbol, price)
        } else {
          // Use last known price if no data for this date
          price = lastKnownPrices.get(position.symbol) ?? 0
        }

        if (price > 0) {
          // Add this position's contribution to total value
          totalValue += price * position.quantity
        }
      }
      
      // Include all dates, even if value is 0 (before any positions were purchased)
      portfolioHistory.push({ date: currentDate, value: totalValue })
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

    g.append('path')
      .datum(portfolioHistory)
      .attr('fill', 'url(#areaGradient)')
      .attr('d', area)

    const line = d3
      .line<{ date: Date; value: number }>()
      .x(d => xScale(d.date))
      .y(d => yScale(d.value))

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

    // Calculate entry points for each individual position (not aggregated by symbol)
    const entryPoints = allPositions.map(position => {
      const initialDate = position.initialDate
      // Find the portfolio value at the initial date (or closest date after)
      const entryPoint = portfolioHistory.find(p => {
        const pDate = p.date
        return pDate >= initialDate
      }) || portfolioHistory[portfolioHistory.length - 1]

      return {
        symbol: position.symbol,
        date: initialDate,
        value: entryPoint?.value ?? 0,
        quantity: position.quantity,
        x: xScale(initialDate),
        y: yScale(entryPoint?.value ?? 0)
      }
    }).filter(ep => !isNaN(ep.x) && !isNaN(ep.y))

    // Entry point tooltip
    const entryTooltip = d3.select(container)
      .append('div')
      .attr('class', 'portfolio-entry-tooltip')
      .style('position', 'absolute')
      .style('opacity', 0)
      .style('pointer-events', 'none')
      .style('background', 'hsl(var(--card))')
      .style('border', '1px solid hsl(var(--border))')
      .style('border-radius', '0.5rem')
      .style('padding', '0.5rem 0.75rem')
      .style('box-shadow', '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)')
      .style('font-size', '0.875rem')
      .style('z-index', 1001)

    const entryTooltipSymbol = entryTooltip.append('div')
      .style('color', 'hsl(var(--foreground))')
      .style('font-weight', '600')
      .style('font-size', '0.875rem')
      .style('margin-bottom', '0.25rem')

    const entryTooltipDate = entryTooltip.append('div')
      .style('color', 'hsl(var(--muted-foreground))')
      .style('font-size', '0.75rem')
      .style('margin-bottom', '0.125rem')

    const entryTooltipValue = entryTooltip.append('div')
      .style('color', 'hsl(var(--foreground))')
      .style('font-weight', '600')
      .style('font-size', '0.875rem')

    // Add entry point dots
    g.selectAll('.entry-point')
      .data(entryPoints)
      .enter()
      .append('circle')
      .attr('class', 'entry-point')
      .attr('cx', d => d.x)
      .attr('cy', d => d.y)
      .attr('r', 6)
      .attr('fill', 'hsl(var(--primary))')
      .attr('stroke', 'hsl(var(--card))')
      .attr('stroke-width', 2.5)
      .style('cursor', 'pointer')
      .on('mouseover', function (_event, d) {
        entryTooltip.style('opacity', 1)
        entryTooltipSymbol.text(`${d.symbol} Entry Point (${d.quantity} shares)`)
        entryTooltipDate.text(formatDateDisplay(d.date))
        entryTooltipValue.text(formatCurrency(d.value))

        const tooltipWidth = (entryTooltip.node() as HTMLElement)?.offsetWidth ?? 0
        const containerRect = container.getBoundingClientRect()

        let tooltipX = containerRect.left + margin.left + d.x - tooltipWidth / 2
        const tooltipY = containerRect.top + margin.top + d.y - 40

        // Keep tooltip horizontally within bounds
        if (tooltipX < containerRect.left) {
          tooltipX = containerRect.left + 10
        }
        if (tooltipX + tooltipWidth > containerRect.right) {
          tooltipX = containerRect.right - tooltipWidth - 10
        }

        entryTooltip
          .style('left', `${tooltipX - containerRect.left}px`)
          .style('top', `${tooltipY - containerRect.top}px`)

        d3.select(this)
          .attr('r', 8)
          .style('opacity', 1)
      })
      .on('mouseout', function () {
        entryTooltip.style('opacity', 0)
        d3.select(this)
          .attr('r', 6)
          .style('opacity', 1)
      })

    // Tooltip setup
    const tooltip = d3.select(container)
      .append('div')
      .attr('class', 'portfolio-chart-tooltip')
      .style('position', 'absolute')
      .style('opacity', 0)
      .style('pointer-events', 'none')
      .style('background', 'hsl(var(--card))')
      .style('border', '1px solid hsl(var(--border))')
      .style('border-radius', '0.5rem')
      .style('padding', '0.5rem 0.75rem')
      .style('box-shadow', '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)')
      .style('font-size', '0.875rem')
      .style('z-index', 1000)

    const tooltipDate = tooltip.append('div')
      .style('color', 'hsl(var(--muted-foreground))')
      .style('font-size', '0.75rem')
      .style('margin-bottom', '0.25rem')

    const tooltipValue = tooltip.append('div')
      .style('color', 'hsl(var(--foreground))')
      .style('font-weight', '600')
      .style('font-size', '0.875rem')

    // Vertical line and dot for hover indicator
    const hoverLine = g.append('line')
      .attr('stroke', gradientColor)
      .attr('stroke-width', 1.5)
      .attr('stroke-dasharray', '4,4')
      .attr('opacity', 0)
      .attr('y1', 0)
      .attr('y2', height)

    const hoverDot = g.append('circle')
      .attr('r', 4)
      .attr('fill', gradientColor)
      .attr('stroke', 'hsl(var(--card))')
      .attr('stroke-width', 2)
      .attr('opacity', 0)

    // Create invisible overlay for mouse tracking
    const overlay = g.append('rect')
      .attr('width', width)
      .attr('height', height)
      .attr('fill', 'transparent')
      .attr('pointer-events', 'all')

    // Use bisector to find closest data point
    const bisectDate = d3.bisector((d: { date: Date; value: number }) => d.date).left

    overlay
      .on('mouseover', function () {
        tooltip.style('opacity', 1)
        hoverLine.attr('opacity', 0.5)
        hoverDot.attr('opacity', 1)
      })
      .on('mouseout', function () {
        tooltip.style('opacity', 0)
        hoverLine.attr('opacity', 0)
        hoverDot.attr('opacity', 0)
      })
      .on('mousemove', function (event) {
        const mouseX = d3.pointer(event)[0]
        const invertedDate = xScale.invert(mouseX)
        const index = bisectDate(portfolioHistory, invertedDate, 1)
        const a = portfolioHistory[index - 1]
        const b = portfolioHistory[index]

        if (!a && !b) return

        const point = (() => {
          if (!b) return a
          if (!a) return b
          return invertedDate.getTime() - a.date.getTime() > b.date.getTime() - invertedDate.getTime() ? b : a
        })()

        if (!point) return

        const xPos = xScale(point.date)
        const yPos = yScale(point.value)

        // Update tooltip content
        tooltipDate.text(formatDate(point.date))
        tooltipValue.text(formatCurrency(point.value))

        // Position tooltip 100px above the dot
        const tooltipWidth = (tooltip.node() as HTMLElement)?.offsetWidth ?? 0
        const containerRect = container.getBoundingClientRect()

        let tooltipX = containerRect.left + margin.left + xPos - tooltipWidth / 2
        const tooltipY = containerRect.top + margin.top + yPos +200

        // Keep tooltip horizontally within bounds
        if (tooltipX < containerRect.left) {
          tooltipX = containerRect.left + 10
        }
        if (tooltipX + tooltipWidth > containerRect.right) {
          tooltipX = containerRect.right - tooltipWidth - 10
        }

        tooltip
          .style('left', `${tooltipX - containerRect.left}px`)
          .style('top', `${tooltipY - containerRect.top}px`)

        // Update hover indicator
        hoverLine
          .attr('x1', xPos)
          .attr('x2', xPos)

        hoverDot
          .attr('cx', xPos)
          .attr('cy', yPos)
      })
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
