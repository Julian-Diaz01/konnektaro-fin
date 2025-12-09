'use client'

import { PageLayout } from '@/components/layout'
import { Portfolio } from './Portfolio'

export default function PortfolioPage () {
  return (
    <PageLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Portfolio</h1>
          <p className="text-muted-foreground">Track your investments and performance</p>
        </div>

        <Portfolio />
      </div>
    </PageLayout>
  )
}
