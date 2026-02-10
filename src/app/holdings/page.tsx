'use client'

import dynamic from 'next/dynamic'
import { Loader2 } from 'lucide-react'
import { PageLayout } from '@/components/layout'
import { Card, CardContent } from '@/components/ui/card'

const UserStocks = dynamic(
  () => import('./UserStocks').then(mod => ({ default: mod.UserStocks })),
  {
    ssr: false,
    loading: () => (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    )
  }
)

export default function PortfolioPage () {
  return (
    <PageLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Holdings</h1>
          <p className="text-muted-foreground">Manage your holdings and view current market status</p>
        </div>

        <UserStocks />
      </div>
    </PageLayout>
  )
}

