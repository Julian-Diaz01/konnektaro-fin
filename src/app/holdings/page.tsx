'use client'

import { PageLayout } from '@/components/layout'
import { UserStocks } from './UserStocks'

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
