export interface ResumeOverviewItem {
  date: string
  totalInvested: number
  totalValue: number
  totalPnlPercent: number
  totalPnlValue: number
}

export interface DashboardOverviewDeltas {
  deltaPnlPercent: number
  deltaPnlValue: number
  deltaValue: number
}

export interface DashboardOverviewResponse {
  deltas: DashboardOverviewDeltas | null
  today: ResumeOverviewItem
  yesterday: ResumeOverviewItem | null
}

