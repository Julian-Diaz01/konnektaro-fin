'use client'

import { Wallet, TrendingUp, TrendingDown, Target } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { PageLayout } from '@/components/layout'

// Placeholder data for UI demonstration
const stats = [
  {
    title: 'Total Balance',
    value: '$24,350.00',
    change: '+12.5%',
    trend: 'up',
    icon: Wallet
  },
  {
    title: 'Income (This Month)',
    value: '$8,420.00',
    change: '+8.2%',
    trend: 'up',
    icon: TrendingUp
  },
  {
    title: 'Expenses (This Month)',
    value: '$3,180.00',
    change: '-2.4%',
    trend: 'down',
    icon: TrendingDown
  },
  {
    title: 'Savings Goal',
    value: '68%',
    change: '+5%',
    trend: 'up',
    icon: Target
  }
]

const recentTransactions = [
  { id: 1, description: 'Grocery Shopping', category: 'Food', amount: -156.32, date: 'Today' },
  { id: 2, description: 'Salary Deposit', category: 'Income', amount: 4200.00, date: 'Yesterday' },
  { id: 3, description: 'Netflix Subscription', category: 'Entertainment', amount: -15.99, date: 'Dec 1' },
  { id: 4, description: 'Gas Station', category: 'Transport', amount: -45.00, date: 'Nov 30' },
  { id: 5, description: 'Electric Bill', category: 'Utilities', amount: -128.50, date: 'Nov 29' }
]

export default function DashboardPage () {
  return (
    <PageLayout>
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Welcome back! 👋</h1>
          <p className="text-muted-foreground">Here&apos;s an overview of your finances.</p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
          {stats.map((stat) => (
            <Card key={stat.title} className="hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <stat.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                {stat.change && (
                  <p className={`text-xs ${stat.trend === 'up' ? 'text-success' : 'text-destructive'}`}>
                    {stat.change} from last month
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Recent Transactions */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Transactions</CardTitle>
            <CardDescription>Your latest financial activity</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentTransactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between py-3 border-b last:border-0"
                >
                  <div className="flex flex-col">
                    <span className="font-medium">{transaction.description}</span>
                    <span className="text-sm text-muted-foreground">{transaction.category}</span>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className={`font-semibold ${transaction.amount > 0 ? 'text-success' : 'text-foreground'}`}>
                      {transaction.amount > 0 ? '+' : ''}
                      ${Math.abs(transaction.amount).toFixed(2)}
                    </span>
                    <span className="text-sm text-muted-foreground">{transaction.date}</span>
                  </div>
                </div>
              ))}
            </div>
            <Button variant="outline" className="w-full mt-4">
              View All Transactions
            </Button>
          </CardContent>
        </Card>
      </PageLayout>
  )
}
