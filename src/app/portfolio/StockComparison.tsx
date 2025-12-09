'use client'

import { useEffect, useRef, useCallback, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import * as d3 from 'd3'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'
import { fetchStockQuotes, fetchStockHistorical } from '@/lib/stocks'
import type {
  StockSymbol,
  StockQuote,
  HistoricalDataPoint,
  TimePeriod
} from '@/types/stocks'

interface StockComparisonProps {
  symbols: StockSymbol[]
}

interface ChartDataPoint {
  date: Date
  price: number
}

interface ProcessedStockData {
  symbol: string
  name: string
  quote: StockQuote
  historical: ChartDataPoint[]
}

const TIME_PERIODS: { value: TimePeriod; label: string }[] = [
  { value: '1D', label: '1D' },
  { value: '5D', label: '5D' },
  { value: '1M', label: '1M' },
  { value: '6M', label: '6M' },
  { value: 'YTD', label: 'YTD' },
  { value: '1Y', label: '1Y' }
]

export function StockComparison ({ symbols }: StockComparisonProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>('1M')
  const chartRef = useRef<HTMLDivElement>(null)
  const symbolList = symbols.map(s => s.symbol)

  const quotesQuery = useQuery({
    queryKey: ['stockQuotes', symbolList],
    queryFn: () => fetchStockQuotes(symbolList),
    staleTime: 5 * 60 * 1000 // 5 minutes for quotes
  })

  const historicalQuery = useQuery({
    queryKey: ['stockHistorical', symbolList, selectedPeriod],
    queryFn: () => fetchStockHistorical(symbolList, selectedPeriod),
    staleTime: 15 * 60 * 1000 // 15 minutes for historical
  })

  const isLoading = quotesQuery.isLoading || historicalQuery.isLoading
  const error = quotesQuery.error || historicalQuery.error

  const stockData: ProcessedStockData[] = symbols.map((sym, index) => {
    const quote = quotesQuery.data?.[index] ?? {
      symbol: sym.symbol,
      price: 0,
      change: 0,
      changePercent: 0
    }

    const rawHistorical = historicalQuery.data?.[sym.symbol] ?? []
    const historical: ChartDataPoint[] = rawHistorical.map((h: HistoricalDataPoint) => ({
      date: new Date(h.date),
      price: h.price
    }))

    return {
      symbol: sym.symbol,
      name: sym.name,
      quote,
      historical
    }
  })

  const renderChart = useCallback(() => {
    if (!chartRef.current || stockData.length === 0) return

    const hasData = stockData.some(d => d.historical.length > 0)
    if (!hasData) return

    const container = chartRef.current
    const margin = { top: 20, right: 30, bottom: 40, left: 70 }
    const width = container.clientWidth - margin.left - margin.right
    const height = 400 - margin.top - margin.bottom

    d3.select(container).selectAll('*').remove()

    const svg = d3
      .select(container)
      .append('svg')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)

    const g = svg
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`)

    const allDates = stockData.flatMap(d => d.historical.map(h => h.date))
    const dateExtent = d3.extent(allDates) as [Date, Date]

    const allPrices = stockData.flatMap(d => d.historical.map(h => h.price))
    const priceExtent = d3.extent(allPrices) as [number, number]

    if (!dateExtent[0] || !priceExtent[0]) return

    const xScale = d3.scaleTime().domain(dateExtent).range([0, width])
    const yScale = d3.scaleLinear().domain(priceExtent).nice().range([height, 0])

    const line = d3
      .line<ChartDataPoint>()
      .x(d => xScale(d.date))
      .y(d => yScale(d.price))
      .curve(d3.curveCatmullRom.alpha(0.5))

    const colors = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))']

    stockData.forEach((data, index) => {
      if (data.historical.length === 0) return

      const strokeColor = colors[index % colors.length] ?? 'hsl(var(--chart-1))'

      const path = g
        .append('path')
        .datum(data.historical)
        .attr('fill', 'none')
        .attr('stroke', strokeColor)
        .attr('stroke-width', 2)
        .attr('d', line)

      const totalLength = path.node()?.getTotalLength() ?? 0
      path
        .attr('stroke-dasharray', `${totalLength} ${totalLength}`)
        .attr('stroke-dashoffset', totalLength)
        .transition()
        .duration(800)
        .ease(d3.easeLinear)
        .attr('stroke-dashoffset', 0)
    })

    const formatDate = getDateFormat(selectedPeriod)
    const xAxis = d3.axisBottom(xScale).ticks(5).tickFormat(d => formatDate(d as Date))
    const yAxis = d3.axisLeft(yScale).ticks(5).tickFormat(d => `$${d}`)

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

    const legend = g
      .append('g')
      .attr('transform', `translate(${width - 120}, 10)`)

    stockData.forEach((data, index) => {
      const legendColor = colors[index % colors.length] ?? 'hsl(var(--chart-1))'
      const legendRow = legend
        .append('g')
        .attr('transform', `translate(0, ${index * 25})`)

      legendRow
        .append('line')
        .attr('x1', 0)
        .attr('x2', 20)
        .attr('y1', 0)
        .attr('y2', 0)
        .attr('stroke', legendColor)
        .attr('stroke-width', 2)

      legendRow
        .append('text')
        .attr('x', 28)
        .attr('y', 0)
        .attr('dy', '0.35em')
        .text(data.name)
        .style('fill', 'hsl(var(--foreground))')
        .style('font-size', '12px')
    })
  }, [stockData, selectedPeriod])

  useEffect(() => {
    if (isLoading || historicalQuery.isFetching) return

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
  }, [stockData, isLoading, historicalQuery.isFetching, renderChart])

  if (isLoading && !quotesQuery.data) {
    return <StockComparisonSkeleton />
  }

  if (error) {
    return <StockComparisonError message={error instanceof Error ? error.message : 'Failed to fetch stock data'} />
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        {stockData.map((stock) => (
          <StockCard key={stock.symbol} stock={stock} />
        ))}
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle>Price Comparison</CardTitle>
              <CardDescription>Historical price trends</CardDescription>
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
            <div className="flex items-center justify-center min-h-[400px]">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div ref={chartRef} className="w-full min-h-[400px]" />
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function getDateFormat (period: TimePeriod): (date: Date) => string {
  switch (period) {
    case '1D':
      return d3.timeFormat('%H:%M')
    case '5D':
      return d3.timeFormat('%a %H:%M')
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

function StockCard ({ stock }: { stock: ProcessedStockData }) {
  const isPositive = stock.quote.change >= 0

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <CardTitle className="text-lg">{stock.name}</CardTitle>
        <CardDescription>{stock.symbol}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="text-2xl font-bold">${stock.quote.price.toFixed(2)}</div>
          <div className={`text-sm font-medium ${isPositive ? 'text-success' : 'text-destructive'}`}>
            {isPositive ? '+' : ''}{stock.quote.change.toFixed(2)} ({isPositive ? '+' : ''}{stock.quote.changePercent.toFixed(2)}%)
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function StockComparisonSkeleton () {
  return (
    <Card>
      <CardContent className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </CardContent>
    </Card>
  )
}

function StockComparisonError ({ message }: { message: string }) {
  return (
    <Card>
      <CardContent className="py-12">
        <p className="text-destructive text-center">{message}</p>
      </CardContent>
    </Card>
  )
}
